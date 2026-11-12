'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const MIGRATIONS = path.join(__dirname, 'migrations');

let mode = '';
let pool = null;
let local = null;
let chain = Promise.resolve();

function serial(fn) {
  const run = chain.then(() => fn());
  chain = run.then(() => undefined, () => undefined);
  return run;
}

function migrationNames() {
  return fs.readdirSync(MIGRATIONS).filter((name) => name.endsWith('.sql')).sort();
}

function statements(sql) {
  return sql.split(';').map((part) => part.trim()).filter(Boolean);
}

function asNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function asPayload(value) {
  if (value && typeof value === 'object') return value;
  return JSON.parse(String(value || '{}'));
}

function asBytes(value) {
  if (!value) return Buffer.alloc(0);
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === 'string') {
    if (value.startsWith('\\x')) return Buffer.from(value.slice(2), 'hex');
    return Buffer.from(value, 'base64');
  }
  throw new Error('unreadable photo');
}

async function rowsOf(runner, text, params) {
  const result = await runner.query(text, params);
  return result.rows;
}

async function applyPending(query) {
  await query('create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())');
  const done = new Set((await query('select name from schema_migrations')).map((row) => row.name));
  for (const name of migrationNames()) {
    if (done.has(name)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS, name), 'utf8');
    for (const statement of statements(sql)) await query(statement);
    await query('insert into schema_migrations (name) values ($1)', [name]);
  }
}

async function initStore(options = {}) {
  const databaseUrl = options.local ? '' : String(process.env.DATABASE_URL || '').trim();
  if (databaseUrl) {
    const { Pool } = require('pg');
    pool = new Pool({ connectionString: databaseUrl, max: 5 });
    pool.on('error', () => {
      /* the next query surfaces the failure without the connection string */
    });
    mode = 'postgres';
    const client = await pool.connect();
    try {
      await applyPending(async (text, params) => {
        const result = await client.query(text, params);
        return result.rows;
      });
    } finally {
      client.release();
    }
    return;
  }

  const { PGlite } = require('@electric-sql/pglite');
  local = new PGlite();
  mode = 'pglite';
  await applyPending(async (text, params) => {
    const result = await local.query(text, params);
    return result.rows;
  });
}

async function totals(runner) {
  const total = await rowsOf(runner, 'select count(*)::int as n from submissions', []);
  const allBytes = await rowsOf(runner, 'select coalesce(sum(octet_length(bytes)), 0)::bigint as n from submission_files', []);
  return {
    total: asNumber(total[0].n),
    bytes: asNumber(allBytes[0].n)
  };
}

async function saveSubmission(submission, files, limits) {
  return serial(async () => {
    if (mode === 'postgres') {
      const client = await pool.connect();
      try {
        await client.query('begin');
        try {
          const result = await writeSubmission(client, submission, files, limits);
          await client.query('commit');
          return result;
        } catch (err) {
          try {
            await client.query('rollback');
          } catch (ignore) {
            /* the connection is already failing */
          }
          throw err;
        }
      } finally {
        client.release();
      }
    }
    return local.transaction((tx) => writeSubmission(tx, submission, files, limits));
  });
}

async function deleteSubmission(runner, id) {
  await runner.query('delete from submission_files where submission_id = $1', [id]);
  await runner.query('delete from submissions where id = $1', [id]);
}

async function writeSubmission(runner, submission, files, limits) {
  await runner.query('select pg_advisory_xact_lock(7272742)');
  const adding = files.reduce((sum, file) => sum + file.bytes.length, 0);
  let stats = await totals(runner);
  let removed = 0;
  while (
    removed <= limits.maxSubmissions
    && (stats.total >= limits.maxSubmissions || stats.bytes + adding > limits.maxBytes)
  ) {
    const oldest = await rowsOf(
      runner,
      'select id from submissions order by created_at asc, id asc limit 1',
      []
    );
    if (!oldest.length) break;
    await deleteSubmission(runner, oldest[0].id);
    removed += 1;
    stats = await totals(runner);
  }
  if (stats.total >= limits.maxSubmissions) return { ok: false, reason: 'full' };
  if (stats.bytes + adding > limits.maxBytes) return { ok: false, reason: 'bytes' };
  await runner.query(
    'insert into submissions (id, created_at, ip_hash, payload) values ($1, $2, $3, $4::jsonb)',
    [submission.id, submission.createdAt, submission.ipHash, JSON.stringify(submission)]
  );
  for (const file of files) {
    await runner.query(
      'insert into submission_files (submission_id, stored_name, bytes) values ($1, $2, $3)',
      [submission.id, file.storedName, file.bytes]
    );
  }
  return { ok: true };
}

async function listSubmissions() {
  return serial(async () => {
    const runner = mode === 'postgres' ? await pool.connect() : local;
    try {
      const found = await rowsOf(runner, 'select payload from submissions order by created_at desc', []);
      return found.map((row) => asPayload(row.payload));
    } finally {
      if (mode === 'postgres') runner.release();
    }
  });
}

async function getSubmission(id) {
  return serial(async () => {
    const runner = mode === 'postgres' ? await pool.connect() : local;
    try {
      const found = await rowsOf(runner, 'select payload from submissions where id = $1', [id]);
      if (!found.length) return null;
      return asPayload(found[0].payload);
    } finally {
      if (mode === 'postgres') runner.release();
    }
  });
}

async function readFile(id, storedName) {
  return serial(async () => {
    const runner = mode === 'postgres' ? await pool.connect() : local;
    try {
      const found = await rowsOf(
        runner,
        'select bytes from submission_files where submission_id = $1 and stored_name = $2',
        [id, storedName]
      );
      if (!found.length) return null;
      return asBytes(found[0].bytes);
    } finally {
      if (mode === 'postgres') runner.release();
    }
  });
}

async function withRunner(fn) {
  if (mode === 'postgres') {
    const client = await pool.connect();
    try {
      return await fn(client);
    } finally {
      client.release();
    }
  }
  return fn(local);
}

async function createSession(keyTag, expiresAt) {
  const id = crypto.randomBytes(32).toString('base64url');
  await serial(() => withRunner(async (runner) => {
    await runner.query('delete from inbox_sessions where expires_at <= now()');
    await runner.query(
      'insert into inbox_sessions (id, key_tag, expires_at) values ($1, $2, $3)',
      [id, keyTag, expiresAt]
    );
  }));
  return id;
}

async function sessionActive(id, keyTag) {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(String(id || ''))) return false;
  return serial(() => withRunner(async (runner) => {
    await runner.query('delete from inbox_sessions where expires_at <= now() or key_tag <> $1', [keyTag]);
    const found = await rowsOf(
      runner,
      'select id from inbox_sessions where id = $1 and key_tag = $2 and expires_at > now()',
      [id, keyTag]
    );
    return found.length > 0;
  }));
}

async function revokeSession(id) {
  if (!/^[A-Za-z0-9_-]{20,128}$/.test(String(id || ''))) return;
  await serial(() => withRunner(async (runner) => {
    await runner.query('delete from inbox_sessions where id = $1', [id]);
  }));
}

module.exports = {
  initStore,
  saveSubmission,
  listSubmissions,
  getSubmission,
  readFile,
  createSession,
  sessionActive,
  revokeSession
};
