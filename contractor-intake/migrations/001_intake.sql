create table if not exists submissions (
  id text primary key,
  created_at timestamptz not null,
  ip_hash text not null,
  payload jsonb not null
);

create table if not exists submission_files (
  submission_id text not null references submissions (id),
  stored_name text not null,
  bytes bytea not null,
  primary key (submission_id, stored_name)
);

create index if not exists submissions_ip_hash_idx on submissions (ip_hash);
