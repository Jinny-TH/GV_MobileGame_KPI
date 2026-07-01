
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
