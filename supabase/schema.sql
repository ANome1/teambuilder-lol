
create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  roles text[] not null default '{}',         
  champions jsonb not null default '{}'::jsonb, 
  created_at timestamptz not null default now()
);

create table if not exists comps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  picks jsonb not null default '{}'::jsonb,     
  notes text not null default '',
  created_at timestamptz not null default now()
);

alter table players enable row level security;
alter table comps enable row level security;

create policy "public access" on players for all using (true) with check (true);
create policy "public access" on comps for all using (true) with check (true);

alter publication supabase_realtime add table players, comps;
