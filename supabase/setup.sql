create table if not exists public.dictionary (
  id text primary key,
  sort_order integer not null,
  tunisian text not null,
  german text not null,
  notes text not null default ''
);

alter table public.dictionary enable row level security;
grant all on table public.dictionary to service_role;
