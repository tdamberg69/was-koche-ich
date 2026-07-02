-- Im Supabase Dashboard unter "SQL Editor" ausführen.

create table if not exists recipes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  tags text[] not null default '{}',
  last_cooked date,
  created_at timestamptz not null default now()
);

-- Row Level Security aktivieren, aber mit offener Policy,
-- da die App keinen Login hat (rein privat über die URL genutzt).
alter table recipes enable row level security;

create policy "Öffentlicher Zugriff (privates Setup)"
  on recipes
  for all
  using (true)
  with check (true);
