'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HOST = process.env.PORT ? '0.0.0.0' : '127.0.0.1';
const PORT = Number(process.env.PORT) || 4173;
const ROOT = __dirname;
const FORM_FILE = path.join(ROOT, 'public', 'index.html');
const DATA_DIR = path.join(ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'submissions.json');
const UPLOAD_ROOT = path.join(ROOT, 'uploads');
const MAX_BODY = 80 * 1024 * 1024;
const MAX_FILE = 15 * 1024 * 1024;
const MAX_TEXT = 20000;

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function ensureStore() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(UPLOAD_ROOT, { recursive: true });
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ submissions: [] }, null, 2));
  }
}

function loadDB() {
  ensureStore();
  const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  if (!Array.isArray(data.submissions)) data.submissions = [];
  return data;
}

function saveDB(data) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
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
  let start = body.indexOf(delim);
  if (start < 0) throw new HttpError(400, 'The upload could not be read.');
  start += delim.length;
  let parts = 0;

  while (start < body.length && parts < 80) {
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
          files.push({ field: name, filename, buffer: content });
        }
      } else if (content.length > MAX_TEXT) {
        throw new HttpError(400, 'One of the text fields is too long.');
      } else {
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

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const header = req.headers['content-type'] || '';
    const match = header.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
    if (!match) {
      reject(new HttpError(400, 'Submit the form from the brief page.'));
      return;
    }
    const boundary = (match[1] || match[2] || '').trim();
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
      if (size > MAX_BODY) {
        fail(new HttpError(400, 'The upload is too large.'));
        return;
      }
      chunks.push(chunk);
    });
    req.on('error', fail);
    req.on('end', () => {
      if (failed) return;
      try {
        resolve(splitMultipart(Buffer.concat(chunks), boundary));
      } catch (err) {
        reject(err instanceof HttpError ? err : new HttpError(400, 'The upload could not be read.'));
      }
    });
  });
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

function writeImage(dir, image) {
  const storedName = crypto.randomBytes(8).toString('hex') + image.ext;
  fs.writeFileSync(path.join(dir, storedName), image.buffer);
  return { storedName, originalName: image.originalName };
}

function buildSubmission(parsed) {
  const { fields, files } = parsed;
  const businessName = field(fields, 'businessName');
  const phone = field(fields, 'phone');
  const city = field(fields, 'city');
  if (!businessName || !phone || !city) {
    throw new HttpError(400, 'Business name, phone, and city are required.');
  }

  const fileMap = new Map();
  for (const file of files) fileMap.set(file.field, file);

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

  const id = Date.now().toString(36) + crypto.randomBytes(4).toString('hex');
  const dir = path.join(UPLOAD_ROOT, id);
  fs.mkdirSync(dir, { recursive: true });

  const submission = {
    id,
    createdAt: new Date().toISOString(),
    sample: false,
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
    logo: logo ? writeImage(dir, logo) : null,
    teamPhoto: team ? writeImage(dir, team) : null,
    projects: projects.map((project) => ({
      ...writeImage(dir, project.image),
      caption: project.caption
    }))
  };

  const db = loadDB();
  db.submissions.push(submission);
  saveDB(db);
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
    .muted, .meta { color:var(--muted); font:14px/1.45 system-ui,sans-serif; }
    article { border-top:1px solid var(--line); padding:1.2rem 0 1.4rem; }
    .badge { display:inline-block; margin-left:.5rem; padding:.15rem .4rem; border:1px solid var(--brass); color:var(--brass); font:600 10px/1.4 system-ui,sans-serif; letter-spacing:.12em; text-transform:uppercase; vertical-align:middle; }
    dl { display:grid; grid-template-columns:8.5rem 1fr; gap:.35rem .8rem; margin:1rem 0; }
    dt { color:var(--muted); font:12px/1.4 system-ui,sans-serif; letter-spacing:.04em; text-transform:uppercase; }
    dd { margin:0; }
    ul { margin:.4rem 0 0; padding-left:1.1rem; }
    blockquote { margin:.7rem 0; padding-left:.8rem; border-left:2px solid var(--brass); }
    img.logo { width:88px; height:88px; object-fit:cover; background:var(--field); border:1px solid var(--line); }
    .shots { display:flex; flex-wrap:wrap; gap:.8rem; margin-top:.6rem; }
    figure { margin:0; max-width:220px; }
    figure img { width:220px; height:150px; object-fit:cover; background:var(--field); border:1px solid var(--line); }
    figcaption { color:var(--muted); font:13px/1.35 system-ui,sans-serif; margin-top:.3rem; }
    .empty { color:var(--muted); }
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

function fileKnown(sub, name) {
  const names = [];
  if (sub.logo) names.push(sub.logo.storedName);
  if (sub.teamPhoto) names.push(sub.teamPhoto.storedName);
  for (const project of sub.projects || []) names.push(project.storedName);
  return names.includes(name);
}

function renderSubmission(sub) {
  const when = new Date(sub.createdAt);
  const stamp = Number.isNaN(when.getTime())
    ? ''
    : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC' }).format(when) + ' UTC';
  const sample = sub.sample ? '<span class="badge">Sample</span>' : '';
  const services = (sub.services || [])
    .map((service) => `<li><strong>${esc(service.name || 'Service')}</strong> — ${esc(service.sentence || '')}</li>`)
    .join('');
  const reviews = (sub.reviews || [])
    .map((review) => `<blockquote><p>${textBlock(review.quote)}</p><p class="muted">${esc(review.name)}</p></blockquote>`)
    .join('');
  const social = Object.entries(sub.social || {})
    .filter(([, value]) => String(value || '').trim())
    .map(([key, value]) => `<li>${esc(key)}: ${esc(value)}</li>`)
    .join('');
  const logo = sub.logo
    ? `<img class="logo" src="/media/${esc(sub.id)}/${esc(sub.logo.storedName)}" alt="Logo">`
    : '';
  const team = sub.teamPhoto
    ? `<figure><img src="/media/${esc(sub.id)}/${esc(sub.teamPhoto.storedName)}" alt="Team photo"><figcaption>Team</figcaption></figure>`
    : '';
  const projects = (sub.projects || [])
    .map((project) => `<figure><img src="/media/${esc(sub.id)}/${esc(project.storedName)}" alt="${esc(project.caption || 'Project photo')}"><figcaption>${esc(project.caption || project.originalName || 'Project photo')}</figcaption></figure>`)
    .join('');
  const facts = [
    row('Phone', sub.phone),
    row('City', sub.city),
    row('Email', sub.email),
    row('Street', sub.street),
    row('Hours', sub.hours),
    row('Service area', sub.serviceArea),
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
    ${social ? `<h3>Social</h3><ul>${social}</ul>` : ''}
    ${(team || projects) ? `<h3>Photos</h3><div class="shots">${team}${projects}</div>` : ''}
    <p class="meta"><a href="/submissions/${esc(sub.id)}">Open this submission</a> · files in uploads/${esc(sub.id)}/</p>
  </article>`;
}

function listAllowed(url) {
  const expected = process.env.INTAKE_LIST_KEY || '';
  if (!expected) return false;
  const given = url.searchParams.get('key') || '';
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || a.length === 0) return false;
  return crypto.timingSafeEqual(a, b);
}

function send(res, status, body, type) {
  const payload = Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': type || 'text/html; charset=utf-8',
    'Content-Length': payload.length,
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff'
  });
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

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${HOST}:${PORT}`);
    const pathname = url.pathname;

    if (pathname === '/favicon.ico') {
      res.writeHead(204);
      res.end();
      return;
    }

    if (req.method === 'GET' && (pathname === '/' || pathname === '/index.html')) {
      send(res, 200, fs.readFileSync(FORM_FILE));
      return;
    }

    if (req.method === 'POST' && pathname === '/submit') {
      const parsed = await parseMultipart(req);
      buildSubmission(parsed);
      res.writeHead(303, { Location: '/thanks', 'Cache-Control': 'no-store' });
      res.end();
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

    if (req.method === 'GET' && (pathname === '/submissions' || pathname.startsWith('/submissions/') || pathname.startsWith('/media/')) && !listAllowed(url)) {
      send(res, 404, layout('Not found', '<h1>That page is not here.</h1><p><a href="/">Back to the brief</a></p>'));
      return;
    }

    if (req.method === 'GET' && pathname === '/submissions') {
      const db = loadDB();
      const items = db.submissions.slice().reverse().map(renderSubmission).join('');
      send(res, 200, layout('Submissions · OZ Leads', `
        <p class="kicker">Private</p>
        <h1>Submissions</h1>
        <p class="muted">Unlisted list for the owner. It is not linked from the public form. No login. ${db.submissions.length} saved in data/submissions.json.</p>
        ${items || '<p class="empty">No briefs yet.</p>'}
      `, true));
      return;
    }

    const detail = pathname.match(/^\/submissions\/([a-z0-9]+)$/i);
    if (req.method === 'GET' && detail) {
      const db = loadDB();
      const sub = db.submissions.find((item) => item.id === detail[1]);
      if (!sub) {
        send(res, 404, layout('Not found', '<p class="kicker">Private</p><h1>No submission with that id.</h1><p><a href="/submissions">Back to the list</a></p>', true));
        return;
      }
      send(res, 200, layout(sub.businessName + ' · OZ Leads', `
        <p class="kicker">Private</p>
        <p class="muted"><a href="/submissions">All submissions</a></p>
        ${renderSubmission(sub)}
      `, true));
      return;
    }

    const media = pathname.match(/^\/media\/([a-z0-9]+)\/([a-z0-9]+\.(?:png|jpg|jpeg|webp|gif))$/i);
    if (req.method === 'GET' && media) {
      const db = loadDB();
      const sub = db.submissions.find((item) => item.id === media[1]);
      const storedName = media[2];
      if (!sub || !fileKnown(sub, storedName)) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      const filePath = path.join(UPLOAD_ROOT, sub.id, storedName);
      if (!filePath.startsWith(UPLOAD_ROOT) || !fs.existsSync(filePath)) {
        send(res, 404, 'Not found', 'text/plain; charset=utf-8');
        return;
      }
      const bytes = fs.readFileSync(filePath);
      const type = contentType(storedName);
      res.writeHead(200, {
        'Content-Type': type,
        'Content-Length': bytes.length,
        'Cache-Control': 'private, max-age=3600',
        'X-Content-Type-Options': 'nosniff'
      });
      res.end(bytes);
      return;
    }

    send(res, 404, layout('Not found', '<h1>That page is not here.</h1><p><a href="/">Back to the brief</a></p>'));
  } catch (err) {
    const status = err.status || 500;
    const message = status === 500 ? 'Something went wrong while saving the brief.' : err.message;
    if (status === 500) console.error(err);
    send(res, status, layout('Could not save', `<p class="kicker">OZ Leads</p><h1>${esc(message)}</h1><p><a href="/">Back to the brief</a></p>`, true));
  }
});

if (process.argv[2] === '--self-test') {
  const boundary = '----testbound';
  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
    'base64'
  );
  const chunks = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="businessName"\r\n\r\nAcme Roofing\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="serviceName"\r\n\r\nRoofing\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="serviceName"\r\n\r\nSiding\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="logo"; filename="logo.png"\r\nContent-Type: image/png\r\n\r\n`),
    png,
    Buffer.from(`\r\n--${boundary}--\r\n`)
  ];
  const parsed = splitMultipart(Buffer.concat(chunks), boundary);
  if (parsed.fields.businessName !== 'Acme Roofing') throw new Error('field parse failed');
  if (!Array.isArray(parsed.fields.serviceName) || parsed.fields.serviceName.join('|') !== 'Roofing|Siding') {
    throw new Error('multi field parse failed: ' + JSON.stringify(parsed.fields));
  }
  if (parsed.files.length !== 1 || !parsed.files[0].buffer.equals(png)) throw new Error('file parse failed');
  if (sniff(png) !== '.png') throw new Error('png sniff failed');
  console.log('self-test ok');
  process.exit(0);
}

ensureStore();
server.listen(PORT, HOST, () => {
  console.log(`Intake listening on http://${HOST}:${PORT}`);
});
