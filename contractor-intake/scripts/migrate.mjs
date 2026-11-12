import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = process.env.DATABASE_URL?.trim() ?? '';
const files = (await readdir(path.join(root, 'migrations')).catch(() => []))
  .filter((name) => name.endsWith('.sql'))
  .sort();

if (url === '' || files.length === 0) {
  console.log('migrate: nothing to do');
  process.exit(0);
}

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL_UNPOOLED?.trim() || url
});

try {
  await client.connect();
  await client.query("set lock_timeout = '60s'");
  await client.query('select pg_advisory_lock(7272741)');
  await client.query(
    'create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())'
  );
  const done = new Set((await client.query('select name from schema_migrations')).rows.map((row) => row.name));
  for (const file of files.filter((name) => !done.has(name))) {
    await client.query('begin');
    try {
      const sql = await readFile(path.join(root, 'migrations', file), 'utf8');
      for (const statement of sql.split(';').map((part) => part.trim()).filter(Boolean)) {
        await client.query(statement);
      }
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log(`migrate: applied ${file}`);
    } catch (error) {
      try {
        await client.query('rollback');
      } catch (ignore) {
        /* the connection is already failing */
      }
      throw error;
    }
  }
} catch (error) {
  const message = String(error && error.message ? error.message : error);
  if (/postgres(ql)?:\/\//i.test(message) || /password/i.test(message)) {
    console.error('migrate: failed');
  } else {
    console.error('migrate: failed', message);
  }
  process.exit(1);
} finally {
  try {
    await client.end();
  } catch (ignore) {
    /* nothing left to close */
  }
}
