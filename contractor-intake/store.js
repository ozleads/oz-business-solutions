'use strict';

const fs = require('fs');
const path = require('path');

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

function migrationSql() {
  return fs.readdirSync(MIGRATIONS)
    .filter((name) => name.endsWith('.sql'))
    .sort()
    .map((name) => fs.readFileSync(path.join(MIGRATIONS, name), 'utf8'));
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
      const found = await client.query("select to_regclass('public.submissions') as name");
      if (!found.rows[0] || !found.rows[0].name) {
        for (const sql of migrationSql()) {
          for (const statement of statements(sql)) await client.query(statement);
        }
      }
    } finally {
      client.release();
    }
    return;
  }

  const { PGlite } = require('@electric-sql/pglite');
  local = new PGlite();
  mode = 'pglite';
  const found = await local.query("select to_regclass('public.submissions') as name");
  if (!found.rows[0] || !found.rows[0].name) {
    for (const sql of migrationSql()) await local.exec(sql);
  }
}

async function room(runner, ipHash) {
  const total = await rowsOf(runner, 'select count(*)::int as n from submissions', []);
  const mine = await rowsOf(runner, 'select count(*)::int as n from submissions where ip_hash = $1', [ipHash]);
  const allBytes = await rowsOf(runner, 'select coalesce(sum(octet_length(bytes)), 0)::bigint as n from submission_files', []);
  const mineBytes = await rowsOf(
    runner,
    `select coalesce(sum(octet_length(f.bytes)), 0)::bigint as n
     from submission_files f
     join submissions s on s.id = f.submission_id
     where s.ip_hash = $1`,
    [ipHash]
  );
  return {
    total: asNumber(total[0].n),
    mine: asNumber(mine[0].n),
    bytes: asNumber(allBytes[0].n),
    mineBytes: asNumber(mineBytes[0].n)
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

async function writeSubmission(runner, submission, files, limits) {
  await runner.query('select pg_advisory_xact_lock(7272742)');
  const stats = await room(runner, submission.ipHash);
  const adding = files.reduce((sum, file) => sum + file.bytes.length, 0);
  if (stats.total >= limits.maxSubmissions) return { ok: false, reason: 'full' };
  if (stats.mine >= limits.perIp) return { ok: false, reason: 'ip' };
  if (stats.mineBytes + adding > limits.perIpBytes) return { ok: false, reason: 'ip-bytes' };
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

module.exports = {
  initStore,
  saveSubmission,
  listSubmissions,
  getSubmission,
  readFile
};
