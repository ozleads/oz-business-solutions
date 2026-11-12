create table if not exists inbox_sessions (
  id text primary key,
  key_tag text not null,
  expires_at timestamptz not null
);

create index if not exists inbox_sessions_expires_idx on inbox_sessions (expires_at);
