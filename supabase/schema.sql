-- GGT Launch KPI Portal DB Schema for Supabase / PostgreSQL
-- Currency standard: all monetary KPI values are stored in USD.

create extension if not exists pgcrypto;

create table if not exists public.games (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  title text not null,
  region text,
  country text,
  launch_date date,
  publisher text,
  developer text,
  genre text default 'MMORPG',
  platform text default 'AOS/iOS',
  ip text default 'Ragnarok',
  launch_score numeric(5,2),
  status text default 'launched',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.launch_kpi (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  period text not null check (period in ('1day','10days','15days','30days','60days')),
  dnu bigint,
  dau bigint,
  pu bigint,
  pur numeric(10,6),
  revenue_usd numeric(18,2),
  arpu_usd numeric(18,4),
  arppu_usd numeric(18,4),
  google_usd numeric(18,2),
  apple_usd numeric(18,2),
  mycard_usd numeric(18,2),
  razer_usd numeric(18,2),
  unipin_usd numeric(18,2),
  oneone_usd numeric(18,2),
  ebanx_usd numeric(18,2),
  xsolla_usd numeric(18,2),
  source_file text,
  imported_at timestamptz default now(),
  unique(game_id, period)
);

create table if not exists public.retention (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  d1 numeric(10,6),
  d2 numeric(10,6),
  d3 numeric(10,6),
  d4 numeric(10,6),
  d5 numeric(10,6),
  d6 numeric(10,6),
  d7 numeric(10,6),
  d14 numeric(10,6),
  d30 numeric(10,6),
  source_file text,
  imported_at timestamptz default now(),
  unique(game_id)
);

create table if not exists public.pre_registration (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  region text,
  period_days int,
  total bigint,
  d1_dau bigint,
  official bigint,
  google bigint,
  apple bigint,
  etc bigint,
  source_file text,
  imported_at timestamptz default now(),
  unique(game_id, region)
);

create table if not exists public.ua_performance (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  period text,
  campaign text,
  spend_usd numeric(18,2),
  install bigint,
  cpi_usd numeric(18,4),
  revenue_usd numeric(18,2),
  roas numeric(10,6),
  source_file text,
  imported_at timestamptz default now()
);

create table if not exists public.launch_timeline (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  event_date date,
  event_type text,
  title text not null,
  description text,
  impact text,
  created_at timestamptz default now()
);

create table if not exists public.lessons_learned (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id) on delete cascade,
  category text check (category in ('success','issue','risk','memo','next_action')),
  title text not null,
  content text,
  author text,
  created_at timestamptz default now()
);

create table if not exists public.source_files (
  id uuid primary key default gen_random_uuid(),
  game_id uuid references public.games(id) on delete set null,
  file_name text not null,
  file_type text,
  storage_path text,
  uploaded_by text,
  uploaded_at timestamptz default now()
);

create or replace view public.v_launch_kpi_flat as
select
  g.id as game_id,
  g.code,
  g.title,
  g.region,
  g.country,
  g.launch_date,
  g.publisher,
  g.genre,
  g.launch_score,
  k.period,
  k.dnu,
  k.dau,
  k.pu,
  k.pur,
  k.revenue_usd,
  k.arpu_usd,
  k.arppu_usd,
  r.d1 as retention_d1,
  r.d3 as retention_d3,
  r.d7 as retention_d7,
  r.d14 as retention_d14,
  r.d30 as retention_d30
from public.games g
left join public.launch_kpi k on k.game_id = g.id
left join public.retention r on r.game_id = g.id;

create index if not exists idx_launch_kpi_game_period on public.launch_kpi(game_id, period);
create index if not exists idx_games_title on public.games(title);
create index if not exists idx_games_region on public.games(region);
create index if not exists idx_pre_registration_game on public.pre_registration(game_id);
create index if not exists idx_ua_performance_game on public.ua_performance(game_id);

-- Enable RLS for future internal access control.
alter table public.games enable row level security;
alter table public.launch_kpi enable row level security;
alter table public.retention enable row level security;
alter table public.pre_registration enable row level security;
alter table public.ua_performance enable row level security;
alter table public.launch_timeline enable row level security;
alter table public.lessons_learned enable row level security;
alter table public.source_files enable row level security;

-- Initial internal-read policy. Tighten by email domain or role when GGT accounts are connected.
create policy "internal read games" on public.games for select using (true);
create policy "internal read launch_kpi" on public.launch_kpi for select using (true);
create policy "internal read retention" on public.retention for select using (true);
create policy "internal read pre_registration" on public.pre_registration for select using (true);
create policy "internal read ua_performance" on public.ua_performance for select using (true);
create policy "internal read launch_timeline" on public.launch_timeline for select using (true);
create policy "internal read lessons_learned" on public.lessons_learned for select using (true);
create policy "internal read source_files" on public.source_files for select using (true);


-- v5.1 Excel Import를 사용하기 위한 Supabase RLS 쓰기 정책입니다.
-- Supabase SQL Editor에서 한 번만 실행하세요.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='games' and policyname='internal write games') then
    create policy "internal write games" on public.games for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='launch_kpi' and policyname='internal write launch_kpi') then
    create policy "internal write launch_kpi" on public.launch_kpi for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='retention' and policyname='internal write retention') then
    create policy "internal write retention" on public.retention for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='pre_registration' and policyname='internal write pre_registration') then
    create policy "internal write pre_registration" on public.pre_registration for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ua_performance' and policyname='internal write ua_performance') then
    create policy "internal write ua_performance" on public.ua_performance for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='launch_timeline' and policyname='internal write launch_timeline') then
    create policy "internal write launch_timeline" on public.launch_timeline for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='lessons_learned' and policyname='internal write lessons_learned') then
    create policy "internal write lessons_learned" on public.lessons_learned for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='source_files' and policyname='internal write source_files') then
    create policy "internal write source_files" on public.source_files for all using (true) with check (true);
  end if;
end $$;
