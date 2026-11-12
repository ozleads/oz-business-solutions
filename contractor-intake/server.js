'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const store = require('./store');

const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
const PORT = Number(process.env.PORT) || 4173;
const ROOT = __dirname;
const FORM_FILE = path.join(ROOT, 'public', 'index.html');
const MAX_FILE = 15 * 1024 * 1024;
const MAX_FILES = 14;
const MAX_SUBMISSION_BYTES = 48 * 1024 * 1024;
const MAX_BODY = MAX_SUBMISSION_BYTES + (1024 * 1024);
const MAX_STORE_BYTES = 200 * 1024 * 1024;
const MAX_SUBMISSIONS = 40;
const PER_IP_SUBMISSIONS = 3;
const PER_IP_BYTES = MAX_SUBMISSION_BYTES;
const MAX_TEXT = 20000;
const MAX_TEXT_TOTAL = 64 * 1024;
const MAX_PARTS = 100;
const MAX_INFLIGHT = 1;
const SUBMIT_WINDOW_MS = 60 * 60 * 1000;
const SUBMIT_MAX_ATTEMPTS = 8;
const SUBMIT_GAP_MS = 10 * 1000;
const KEY_WINDOW_MS = 15 * 60 * 1000;
const KEY_MAX_FAILS = 8;
const KEY_FAIL_DELAY_MS = 400;
const MAP_MAX = 500;
const SESSION_MS = 12 * 60 * 60 * 1000;
const LOGIN_BODY_MAX = 4096;
const LIMITS = {
  maxSubmissions: MAX_SUBMISSIONS,
  perIp: PER_IP_SUBMISSIONS,
  perIpBytes: PER_IP_BYTES,
  maxBytes: MAX_STORE_BYTES
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function hashIp(ip) {
  return crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 20);
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function textBlock(value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  return esc(trimmed).replace(/\n/g, '<br>');
}

function asList(value) {
  if (value == null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function sniff(buf) {
  if (!buf || buf.length < 12) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return '.png';
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return '.jpg';
  const head = buf.toString('ascii', 0, 6);
  if (head === 'GIF87a' || head === 'GIF89a') return '.gif';
  if (buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') return '.webp';
  return null;
}

function splitMultipart(body, boundary) {
  const delim = Buffer.from('--' + boundary);
  const fields = {};
  const files = [];
  let textTotal = 0;
  let fileTotal = 0;
  let start = body.indexOf(delim);
  if (start < 0) throw new HttpError(400, 'The upload could not be read.');
  start += delim.length;
  let parts = 0;

  while (start < body.length) {
    if (parts >= MAX_PARTS) throw new HttpError(400, 'The form has too many fields.');
    if (body[start] === 45 && body[start + 1] === 45) break;
    if (body[start] === 13 && body[start + 1] === 10) start += 2;
    const headerEnd = body.indexOf(Buffer.from('\r\n\r\n'), start);
    if (headerEnd < 0) break;
    const headerText = body.slice(start, headerEnd).toString('utf8');
    const contentStart = headerEnd + 4;
    const next = body.indexOf(Buffer.from('\r\n--' + boundary), contentStart);
    if (next < 0) break;
    const content = body.slice(contentStart, next);
    const disp = (headerText.split(/\r\n/).find((line) => /^content-disposition:/i.test(line)) || '');
    const name = (/name="([^"]*)"/i.exec(disp) || /name=([^;\s]+)/i.exec(disp) || [])[1];
    const filename = (/filename="([^"]*)"/i.exec(disp) || [])[1];
    if (name) {
      if (filename != null) {
        if (content.length > MAX_FILE) throw new HttpError(400, 'Each photo must be 15 MB or smaller.');
        if (filename && content.length) {
          fileTotal += content.length;
          if (files.length >= MAX_FILES) throw new HttpError(400, 'Too many photos.');
          if (fileTotal > MAX_SUBMISSION_BYTES) throw new HttpError(400, 'The photos are too large together.');
          files.push({ field: name, filename, buffer: content });
        }
      } else if (content.length > MAX_TEXT) {
        throw new HttpError(400, 'One of the text fields is too long.');
      } else {
        textTotal += content.length;
        if (textTotal > MAX_TEXT_TOTAL) throw new HttpError(400, 'The form is too long.');
        const val = content.toString('utf8');
        if (fields[name] === undefined) fields[name] = val;
        else if (Array.isArray(fields[name])) fields[name].push(val);
        else fields[name] = [fields[name], val];
      }
    }
    parts += 1;
    start = next + 2 + delim.length;
  }

  return { fields, files };
}

function readChunks(req, limit) {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'] || 0);
    if (declared > limit) {
      reject(new HttpError(400, 'The upload is too large.'));
      req.destroy();
      return;
    }
    const chunks = [];
    let size = 0;
    let failed = false;

    function fail(err) {
      if (failed) return;
      failed = true;
      reject(err instanceof HttpError ? err : new HttpError(400, 'The upload could not be read.'));
      req.destroy();
    }

    req.on('data', (chunk) => {
      if (failed) return;
      size += chunk.length;
      if (size > limit) {
        fail(new HttpError(400, 'The upload is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', fail);
    req.on('end', () => {
      if (failed) return;
      resolve(Buffer.concat(chunks));
    });
  });
}

function parseMultipart(req) {
  const header = req.headers['content-type'] || '';
  const match = header.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!match) return Promise.reject(new HttpError(400, 'Submit the form from the brief page.'));
  const boundary = (match[1] || match[2] || '').trim();
  return readChunks(req, MAX_BODY).then((body) => splitMultipart(body, boundary));
}

function field(fields, key) {
  const value = fields[key];
  if (Array.isArray(value)) return String(value[0] ?? '').trim();
  return String(value ?? '').trim();
}

function takeImage(fileMap, key, label) {
  const file = fileMap.get(key);
  if (!file) return null;
  const ext = sniff(file.buffer);
  if (!ext) throw new HttpError(400, label + ' must be a JPG, PNG, WEBP, or GIF.');
  return { buffer: file.buffer, ext, originalName: path.basename(file.filename).slice(0, 180) };
}

function rememberImage(image, files, extra) {
  if (!image) return null;
  const storedName = crypto.randomBytes(8).toString('hex') + image.ext;
  files.push({ storedName, bytes: image.buffer });
  return Object.assign({ storedName, originalName: image.originalName }, extra || {});
}

function roomError(reason) {
  if (reason === 'ip') throw new HttpError(429, 'Please wait before sending another brief.');
  if (reason === 'ip-bytes') throw new HttpError(429, 'Please wait before sending more photos.');
  throw new HttpError(429, 'We can\'t take more briefs right now. Please try again later.');
}

async function buildSubmission(parsed, ip) {
  const { fields, files: uploads } = parsed;
  const businessName = field(fields, 'businessName');
  const phone = field(fields, 'phone');
  const city = field(fields, 'city');
  if (!businessName || !phone || !city) {
    throw new HttpError(400, 'Business name, phone, and city are required.');
  }

  const fileMap = new Map();
  for (const file of uploads) fileMap.set(file.field, file);

  const logo = takeImage(fileMap, 'logo', 'The logo');
  const team = takeImage(fileMap, 'teamPhoto', 'The team photo');
  const projects = [];
  for (let i = 0; i < 12; i += 1) {
    const image = takeImage(fileMap, 'project_' + i, 'A project photo');
    if (!image) continue;
    projects.push({ image, caption: field(fields, 'caption_' + i) });
  }

  const names = asList(fields.serviceName);
  const sentences = asList(fields.serviceSentence);
  const services = [];
  const count = Math.max(names.length, sentences.length);
  for (let i = 0; i < count; i += 1) {
    const name = String(names[i] ?? '').trim();
    const sentence = String(sentences[i] ?? '').trim();
    if (name || sentence) services.push({ name, sentence });
  }

  const reviews = [];
  for (let i = 1; i <= 3; i += 1) {
    const name = field(fields, 'reviewName' + i);
    const quote = field(fields, 'reviewQuote' + i);
    if (name || quote) reviews.push({ name, quote });
  }

  const storedFiles = [];
  const submission = {
    id: Date.now().toString(36) + crypto.randomBytes(4).toString('hex'),
    createdAt: new Date().toISOString(),
    sample: false,
    ipHash: hashIp(ip || ''),
    businessName,
    phone,
    city,
    email: field(fields, 'email'),
    street: field(fields, 'street'),
    hours: field(fields, 'hours'),
    serviceArea: field(fields, 'serviceArea'),
    tagline: field(fields, 'tagline'),
    about: field(fields, 'about'),
    years: field(fields, 'years'),
    license: field(fields, 'license'),
    insured: field(fields, 'insured'),
    services,
    reviews,
    social: {
      instagram: field(fields, 'instagram'),
      facebook: field(fields, 'facebook'),
      google: field(fields, 'google'),
      website: field(fields, 'website'),
      yelp: field(fields, 'yelp'),
      other: field(fields, 'otherSocial')
    },
    mainButton: field(fields, 'mainButton'),
    notes: field(fields, 'notes'),
    logo: rememberImage(logo, storedFiles),
    teamPhoto: rememberImage(team, storedFiles),
    projects: projects.map((project) => rememberImage(project.image, storedFiles, { caption: project.caption }))
  };

  const saved = await store.saveSubmission(submission, storedFiles, LIMITS);
  if (!saved.ok) roomError(saved.reason);
  return submission;
}

function layout(title, body, robots) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${robots ? '<meta name="robots" content="noindex">' : ''}
  <title>${esc(title)}</title>
  <style>
    :root { --paper:#f3eee6; --ink:#1c1916; --muted:#6d645b; --line:#e0d6c8; --brass:#8a7049; --field:#fffdf9; }
    * { box-sizing: border-box; }
    body { margin:0; background:var(--paper); color:var(--ink); font:17px/1.5 Georgia, Palatino, serif; }
    .wrap { max-width: 46rem; margin:0 auto; padding:2.25rem 1.2rem 4rem; }
    a { color: inherit; }
    .kicker { margin:0; font:600 11px/1 system-ui,sans-serif; letter-spacing:.2em; text-transform:uppercase; color:var(--brass); }
    h1 { font-weight:500; font-size:2.4rem; line-height:1.05; margin:.5rem 0 .4rem; }
    h2 { font-weight:500; font-size:1.45rem; margin:0; }
    h3 { font-weight:500; font-size:1.05rem; margin:1.1rem 0 .2rem; }
    .muted, .meta { color:var(--muted); font:14px/1.45 system-ui,sans-serif; }
    .warn { color:#8a3a2a; }
    article { border-top:1px solid var(--line); padding:1.2rem 0 1.4rem; }
    .badge { display:inline-block; margin-left:.5rem; padding:.15rem .4rem; border:1px solid var(--brass); color:var(--brass); font:600 10px/1.4 system-ui,sans-serif; letter-spacing:.12em; text-transform:uppercase; vertical-align:middle; }
    dl { display:grid; grid-template-columns:8.5rem 1fr; gap:.35rem .8rem; margin:1rem 0; }
    dt { color:var(--muted); font:12px/1.4 system-ui,sans-serif; letter-spacing:.04em; text-transform:uppercase; }
    dd { margin:0; overflow-wrap:anywhere; }
    ul { margin:.4rem 0 0; padding-left:1.1rem; }
    blockquote { margin:.7rem 0; padding-left:.8rem; border-left:2px solid var(--brass); }
    img.logo { width:88px; height:88px; object-fit:cover; background:var(--field); border:1px solid var(--line); }
    .shots { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:.6rem; }
    figure { margin:0; max-width:220px; }
    figure img { width:220px; height:150px; object-fit:cover; background:var(--field); border:1px solid var(--line); }
    figcaption { color:var(--muted); font:13px/1.35 system-ui,sans-serif; margin-top:.3rem; }
    .empty { color:var(--muted); }
    label { display:block; margin:.9rem 0 0; font:13px/1.3 system-ui,sans-serif; }
    input { display:block; width:100%; max-width:22rem; margin-top:.35rem; padding:.7rem .75rem; border:1px solid var(--line); background:var(--field); color:var(--ink); font:16px/1.4 system-ui,sans-serif; }
    button { margin-top:1rem; border:0; background:var(--ink); color:var(--paper); padding:.8rem 1.1rem; font:13px/1 system-ui,sans-serif; letter-spacing:.08em; text-transform:uppercase; cursor:pointer; }
    form.out { margin:1rem 0 0; }
    form.out button { background:transparent; color:var(--ink); border:1px solid var(--line); }
  </style>
</head>
<body>
  <main class="wrap">${body}</main>
</body>
</html>`;
}

function row(label, value) {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return '';
  return `<dt>${esc(label)}</dt><dd>${textBlock(trimmed)}</dd>`;
}

function linkOrText(value) {
  const trimmed = String(value ?? '').trim();
  if (/^https?:\/\/[^\s<>"]+$/i.test(trimmed)) {
    return `<a href="${esc(trimmed)}" rel="noopener noreferrer">${esc(trimmed)}</a>`;
  }
  return esc(trimmed);
}

function fileKnown(sub, name) {
  const names = [];
  if (sub.logo) names.push(sub.logo.storedName);
  if (sub.teamPhoto) names.push(sub.teamPhoto.storedName);
  for (const project of sub.projects || []) names.push(project.storedName);
  return names.includes(name);
}

function renderSubmission(sub) {
  const stamp = stampOf(sub.createdAt);
  const sample = sub.sample ? '<span class="badge">Sample</span>' : '';
  const services = (sub.services || [])
    .map((service) => {
      const sentence = String(service.sentence || '').trim();
      const name = esc(service.name || 'Service');
      return `<li><strong>${name}</strong>${sentence ? ' — ' + esc(sentence) : ''}</li>`;
    })
    .join('');
  const reviews = (sub.reviews || [])
    .map((review) => `<blockquote><p>${textBlock(review.quote)}</p><p class="muted">${esc(review.name)}</p></blockquote>`)
    .join('');
  const social = Object.entries(sub.social || {})
    .filter(([, value]) => String(value || '').trim())
    .map(([key, value]) => `<li>${esc(key)}: ${linkOrText(value)}</li>`)
    .join('');
  const logo = sub.logo
    ? `<p><img class="logo" src="/media/${esc(sub.id)}/${esc(sub.logo.storedName)}" alt="Logo" loading="lazy"></p>`
    : '';
  const team = sub.teamPhoto
    ? `<figure><img src="/media/${esc(sub.id)}/${esc(sub.teamPhoto.storedName)}" alt="Team photo" loading="lazy"><figcaption>Team</figcaption></figure>`
    : '';
  const projects = (sub.projects || [])
    .map((project) => `<figure><a href="/media/${esc(sub.id)}/${esc(project.storedName)}"><img src="/media/${esc(sub.id)}/${esc(project.storedName)}" alt="${esc(project.caption || 'Project photo')}" loading="lazy"></a><figcaption>${esc(project.caption || project.originalName || 'Project photo')}</figcaption></figure>`)
    .join('');
  const facts = [
    row('Phone', sub.phone),
    row('City', sub.city),
    row('Email', sub.email),
    row('Street', sub.street),
    row('Hours', sub.hours),
    row('Area', sub.serviceArea),
    row('Tagline', sub.tagline),
    row('About', sub.about),
    row('Years', sub.years),
    row('License', sub.license),
    row('Insured', sub.insured),
    row('Main button', sub.mainButton),
    row('Notes', sub.notes)
  ].join('');

  return `<article id="${esc(sub.id)}">
    <p class="meta">${esc(stamp)}</p>
    <h2>${esc(sub.businessName)}${sample}</h2>
    ${logo}
    <dl>${facts}</dl>
    ${services ? `<h3>Services</h3><ul>${services}</ul>` : ''}
    ${reviews ? `<h3>Reviews</h3>${reviews}` : ''}
    ${social ? `<h3>Links</h3><ul>${social}</ul>` : ''}
    ${(team || projects) ? `<h3>Photos</h3><div class="shots">${team}${projects}</div>` : '<p class="empty">No photos on this brief.</p>'}
    <p class="meta"><a href="/submissions/${esc(sub.id)}">Open this brief</a></p>
  </article>`;
}

function stampOf(iso) {
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/New_York'
  }).format(when) + ' ET';
}

function passwordPage(message) {
  const note = message ? `<p class="warn">${esc(message)}</p>` : '';
  return layout('Inbox · OZ Leads', `
    <p class="kicker">Private</p>
    <h1>Inbox</h1>
    <p class="muted">Briefs and photos from the website form show up here. This page is not linked from the public form.</p>
    ${note}
    <form method="post" action="/inbox" autocomplete="off">
      <label>Password
        <input type="password" name="password" autocomplete="current-password" required maxlength="200">
      </label>
      <button type="submit">Open inbox</button>
    </form>
  `, true);
}

function closedPage() {
  return layout('Inbox · OZ Leads', `
    <p class="kicker">Private</p>
    <h1>Inbox</h1>
    <p>This inbox is not open yet. The password has not been saved.</p>
  `, true);
}

const keyFails = new Map();
const submitAttempts = new Map();
let inflight = 0;
let storeQueue = Promise.resolve();

function remember(map, key, value) {
  if (!map.has(key) && map.size >= MAP_MAX) map.delete(map.keys().next().value);
  map.set(key, value);
}

function keysEqual(given, expected) {
  const ha = crypto.createHash('sha256').update(String(given), 'utf8').digest();
  const hb = crypto.createHash('sha256').update(String(expected), 'utf8').digest();
  return crypto.timingSafeEqual(ha, hb);
}

function keyLocked(ip) {
  const row = keyFails.get(ip);
  if (!row) return false;
  if (Date.now() - row.start > KEY_WINDOW_MS) {
    keyFails.delete(ip);
    return false;
  }
  return row.count >= KEY_MAX_FAILS;
}

function noteKeyFail(ip) {
  const now = Date.now();
  const row = keyFails.get(ip);
  if (!row || now - row.start > KEY_WINDOW_MS) {
    remember(keyFails, ip, { count: 1, start: now });
    return;
  }
  if (row.count < KEY_MAX_FAILS) row.count += 1;
}

function readCookieValue(req, name) {
  const header = req.headers.cookie || '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() !== name) continue;
    return part.slice(eq + 1).trim();
  }
  return '';
}

function listKey() {
  return String(process.env.INTAKE_LIST_KEY || '');
}

function issueSession(secret) {
  const exp = String(Date.now() + SESSION_MS);
  const mac = crypto.createHmac('sha256', secret).update('oz-leads-inbox-v1:' + exp).digest('base64url');
  return exp + '.' + mac;
}

function sessionValid(secret, token) {
  if (!secret || !token || token.length > 200) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const expText = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  if (!/^\d{10,16}$/.test(expText)) return false;
  const exp = Number(expText);
  const now = Date.now();
  if (!Number.isFinite(exp) || exp < now || exp > now + SESSION_MS + 60000) return false;
  return keysEqual(mac, crypto.createHmac('sha256', secret).update('oz-leads-inbox-v1:' + expText).digest('base64url'));
}

function authorize(req) {
  const expected = listKey();
  if (!expected) return { ok: false, reason: 'unset' };
  if (keyLocked(clientIp(req))) return { ok: false, reason: 'locked' };
  if (!sessionValid(expected, readCookieValue(req, 'intake_session'))) return { ok: false, reason: 'missing' };
  return { ok: true };
}

function cookieParts(req, value, maxAge) {
  const host = String(req.headers.host || '');
  const local = host.startsWith('127.0.0.1') || host.startsWith('localhost') || host.startsWith('[::1]');
  const secure = req.headers['x-forwarded-proto'] === 'https' || !local;
  const parts = ['intake_session=' + value, 'HttpOnly', 'SameSite=Lax', 'Path=/', 'Max-Age=' + maxAge];
  if (secure) parts.push('Secure');
  return parts.join('; ');
}

function sessionCookie(req, secret) {
  return cookieParts(req, issueSession(secret), Math.floor(SESSION_MS / 1000));
}

function clearCookie(req) {
  return cookieParts(req, '', 0);
}

function clientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    const hop = forwarded.split(',')[0].trim();
    if (hop) return hop.slice(0, 80);
  }
  return (req.socket && req.socket.remoteAddress) || 'unknown';
}

function allowSubmitAttempt(ip) {
  const now = Date.now();
  const row = submitAttempts.get(ip);
  if (!row || now - row.start > SUBMIT_WINDOW_MS) {
    remember(submitAttempts, ip, { count: 1, start: now, last: now });
    return true;
  }
  if (now - row.last < SUBMIT_GAP_MS) return false;
  if (row.count >= SUBMIT_MAX_ATTEMPTS) return false;
  row.count += 1;
  row.last = now;
  return true;
}

function enqueueStore(fn) {
  const run = storeQueue.then(() => fn());
  storeQueue = run.then(() => undefined, () => undefined);
  return run;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isStoredFileUrl(pathname) {
  const candidates = [pathname];
  try {
    candidates.push(decodeURIComponent(pathname));
  } catch (err) {
    /* keep the raw path */
  }
  return candidates.some((value) => {
    const p = String(value).toLowerCase();
    return p === '/data' || p.startsWith('/data/')
      || p === '/uploads' || p.startsWith('/uploads/')
      || p.endsWith('/submissions.json');
  });
}

function send(res, status, body, type, extra) {
  const payload = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, Object.assign({
    'Content-Type': type || 'text/html; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY'
  }, extra || {}));
  res.end(payload);
}

function contentType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  return '';
}

function redirect(res, location, cookie) {
  const headers = { Location: location, 'Cache-Control': 'no-store', 'Referrer-Policy': 'no-referrer' };
  if (cookie) headers['Set-Cookie'] = cookie;
  res.writeHead(303, headers);
  res.end();
}

async function showInbox(res) {
  const items = await store.listSubmissions();
  const cards = items.map(renderSubmission).join('');
  send(res, 200, layout('Inbox · OZ Leads', `
    <p class="kicker">Private</p>
    <h1>Inbox</h1>
    <p class="muted">${items.length} saved. Photos stay on this page.</p>
    <form class="out" method="post" action="/inbox/logout"><button type="submit">Sign out</button></form>
    ${cards || '<p class="empty">No briefs yet. They show up here after someone sends the form.</p>'}
  `, true));
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const pathname = url.pathname;

    if (pathname === '/favicon.ico') {
      res.writeHead(204, { 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    if (isStoredFileUrl(pathname)) {
      send(res, 404, layout('Not found', '<h1>That page is not here.</h1><p><a href="/">Back to the brief</a></p>'));
      return;
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      send(res, 200, fs.readFileSync(FORM_FILE));
      return;
    }

    if (req.method === 'POST' && pathname === '/submit') {
      const ip = clientIp(req);
      if (inflight >= MAX_INFLIGHT) {
        send(res, 429, layout('Please wait', '<p class="kicker">OZ Leads</p><h1>Please wait a moment and try again.</h1><p><a href="/">Back to the brief</a></p>', true));
        return;
      }
      if (!allowSubmitAttempt(ip)) {
        send(res, 429, layout('Please wait', '<p class="kicker">OZ Leads</p><h1>Please wait before sending another brief.</h1><p><a href="/">Back to the brief</a></p>', true));
        return;
      }
      inflight += 1;
      try {
        const parsed = await parseMultipart(req);
        await enqueueStore(() => buildSubmission(parsed, ip));
      } finally {
        inflight -= 1;
      }
      redirect(res, '/thanks');
      return;
    }

    if (req.method === 'GET' && pathname === '/thanks') {
      send(res, 200, layout('Brief received · OZ Leads', `
        <p class="kicker">OZ Leads</p>
        <h1>The brief is in.</h1>
        <p>You can close this page. We will build the preview from what you sent.</p>
      `, true));
      return;
    }

    if (req.method === 'POST' && pathname === '/inbox') {
      const expected = listKey();
      const ip = clientIp(req);
      if (!expected) {
        send(res, 200, closedPage());
        return;
      }
      if (keyLocked(ip)) {
        await wait(KEY_FAIL_DELAY_MS);
        send(res, 429, layout('Inbox · OZ Leads', `
          <p class="kicker">Private</p>
          <h1>Inbox</h1>
          <p class="warn">Too many tries. Wait 15 minutes, then try again.</p>
        `, true));
        return;
      }
      const type = String(req.headers['content-type'] || '');
      if (!type.includes('application/x-www-form-urlencoded')) {
        throw new HttpError(400, 'Use the password form on this page.');
      }
      const body = await readChunks(req, LOGIN_BODY_MAX);
      const given = new URLSearchParams(body.toString('utf8')).get('password') || '';
      if (!given || given.length > 200 || !keysEqual(given, expected)) {
        noteKeyFail(ip);
        await wait(KEY_FAIL_DELAY_MS);
        const locked = keyLocked(ip);
        send(res, locked ? 429 : 200, locked
          ? layout('Inbox · OZ Leads', '<p class="kicker">Private</p><h1>Inbox</h1><p class="warn">Too many tries. Wait 15 minutes, then try again.</p>', true)
          : passwordPage('That password is wrong.'));
        return;
      }
      keyFails.delete(ip);
      redirect(res, '/inbox', sessionCookie(req, expected));
      return;
    }

    if (req.method === 'POST' && pathname === '/inbox/logout') {
      if (!authorize(req).ok) {
        redirect(res, '/inbox');
        return;
      }
      redirect(res, '/inbox', clearCookie(req));
      return;
    }

    if (req.method === 'GET' && pathname === '/inbox') {
      const auth = authorize(req);
      if (!auth.ok) {
        if (auth.reason === 'unset') send(res, 200, closedPage());
        else if (auth.reason === 'locked') {
          send(res, 429, layout('Inbox · OZ Leads', `
            <p class="kicker">Private</p>
            <h1>Inbox</h1>
            <p class="warn">Too many tries. Wait 15 minutes, then try again.</p>
          `, true));
        } else send(res, 200, passwordPage(''));
        return;
      }
      await showInbox(res);
      return;
    }

    if (req.method === 'GET' && pathname === '/submissions') {
      redirect(res, '/inbox');
      return;
    }

    const detail = pathname.match(/^\/submissions\/([a-z0-9]+)$/i);
    if (req.method === 'GET' && detail) {
      if (!authorize(req).ok) {
        redirect(res, '/inbox');
        return;
      }
      const sub = await store.getSubmission(detail[1]);
      if (!sub) {
        send(res, 404, layout('Not found', '<p class="kicker">Private</p><h1>No brief with that id.</h1><p><a href="/inbox">Back to the inbox</a></p>', true));
        return;
      }
      send(res, 200, layout(sub.businessName + ' · OZ Leads', `
        <p class="kicker">Private</p>
        <p class="muted"><a href="/inbox">All briefs</a></p>
        ${renderSubmission(sub)}
      `, true));
      return;
    }

    const media = pathname.match(/^\/media\/([a-z0-9]+)\/([a-z0-9]+\.(?:png|jpg|jpeg|webp|gif))$/i);
    if (req.method === 'GET' && media) {
      if (!authorize(req).ok) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      const sub = await store.getSubmission(media[1]);
      const storedName = media[2];
      if (!sub || !fileKnown(sub, storedName)) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      const bytes = await store.readFile(sub.id, storedName);
      const type = contentType(storedName);
      if (!bytes || !type) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      send(res, 200, bytes, type, { 'Cache-Control': 'private, no-store' });
      return;
    }

    send(res, 404, layout('Not found', '<h1>That page is not here.</h1><p><a href="/">Back to the brief</a></p>'));
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Something went wrong while saving the brief.' : err.message;
    if (status === 500) console.error('Intake request failed');
    if (!res.headersSent) {
      send(res, status, layout('Could not save', `<p class="kicker">OZ Leads</p><h1>${esc(message)}</h1><p><a href="/">Back to the brief</a></p>`, true));
    } else {
      res.end();
    }
  }
});

async function runSelfTest() {
  const boundary = '----testbound';
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  const chunks = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="businessName"\r\n\r\nAcme Roofing\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="phone"\r\n\r\n555-0100\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="city"\r\n\r\nAustin\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="serviceName"\r\n\r\nRoofing\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="serviceName"\r\n\r\nSiding\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="logo"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n`),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ];
  const parsed = splitMultipart(Buffer.concat(chunks), boundary);
  if (parsed.fields.businessName !== 'Acme Roofing') throw new Error('field parse failed');
  if (!Array.isArray(parsed.fields.serviceName) || parsed.fields.serviceName.join('|') !== 'Roofing|Siding') {
    throw new Error('multi field parse failed');
  }
  if (parsed.files.length !== 1 || !parsed.files[0].buffer.equals(png)) throw new Error('file parse failed');
  if (sniff(png) !== '.png') throw new Error('png sniff failed');
  if (!keysEqual('same-key', 'same-key') || keysEqual('short', 'much-longer-key')) {
    throw new Error('constant-time compare failed');
  }
  const lockIp = '203.0.113.50';
  for (let i = 0; i < KEY_MAX_FAILS - 1; i += 1) noteKeyFail(lockIp);
  if (keyLocked(lockIp)) throw new Error('locked too early');
  noteKeyFail(lockIp);
  if (!keyLocked(lockIp)) throw new Error('failed-key lockout missing');
  const token = issueSession('correct horse');
  if (token.includes('correct') || token.includes('horse')) throw new Error('session kept the password');
  if (!sessionValid('correct horse', token) || sessionValid('other secret', token)) {
    throw new Error('session check failed');
  }
  if (isStoredFileUrl('/submissions') || isStoredFileUrl('/') || isStoredFileUrl('/inbox')) {
    throw new Error('public urls were blocked');
  }
  if (!isStoredFileUrl('/data/submissions.json') || !isStoredFileUrl('/uploads/abc/photo.png')) {
    throw new Error('stored file urls are not blocked');
  }
  const many = [Buffer.from(`--${boundary}\r\n`)];
  for (let i = 0; i < MAX_FILES + 1; i += 1) {
    many.push(Buffer.from(`Content-Disposition: form-data; name="project_${i}"; filename="p.png"\r\nContent-Type: image/png\r\n\r\n`));
    many.push(png);
    many.push(Buffer.from(`\r\n--${boundary}\r\n`));
  }
  many.push(Buffer.from(`--\r\n`));
  let rejected = false;
  try {
    splitMultipart(Buffer.concat(many), boundary);
  } catch (err) {
    rejected = err instanceof HttpError && err.status === 400 && err.message === 'Too many photos.';
  }
  if (!rejected) throw new Error('extra photos were accepted');

  await store.initStore({ local: true });
  const saved = await buildSubmission(parsed, '198.51.100.20');
  const listed = await store.listSubmissions();
  if (!listed.length || listed[0].id !== saved.id || listed[0].businessName !== 'Acme Roofing') {
    throw new Error('saved brief did not list');
  }
  const photo = await store.readFile(saved.id, saved.logo.storedName);
  if (!photo || !photo.equals(png)) throw new Error('saved photo did not match');
  const blocked = await store.saveSubmission(
    { id: 'secondbrief0001', createdAt: new Date().toISOString(), ipHash: 'x', businessName: 'B' },
    [],
    { maxSubmissions: 1, perIp: 3, perIpBytes: 10, maxBytes: 10 }
  );
  if (blocked.ok || blocked.reason !== 'full') throw new Error('submission cap failed');
  const page = renderSubmission(saved);
  if (page.includes('<script') || !page.includes('Acme Roofing') || !page.includes('/media/')) {
    throw new Error('inbox render failed');
  }
}

if (process.argv[2] === '--self-test') {
  runSelfTest().then(() => {
    console.log('self-test ok');
    process.exit(0);
  }).catch((err) => {
    console.error(err && err.message ? err.message : 'self-test failed');
    process.exit(1);
  });
} else {
  store.initStore().then(() => {
    server.listen(PORT, HOST, () => {
      console.log(`Intake listening on http://${HOST}:${PORT}`);
    });
  }).catch(() => {
    console.error('Intake store failed to open');
    process.exit(1);
  });
}
