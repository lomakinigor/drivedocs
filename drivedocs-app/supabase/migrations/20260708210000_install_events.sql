-- drivedocs migration 003 — Install events (счётчик установок PWA)
-- =====================================================================
-- Анонимный write-only лог: сколько раз приложение реально установили
-- (Android/десктоп — событие appinstalled) и сколько раз на iOS открыли
-- инструкцию «Добавить на экран Домой» (для iOS нет API для отслеживания
-- самой установки — Apple его не предоставляет, поэтому считаем только intent).
--
-- Никакой связи с workspace/user — событие пишется ДО логина, анонимно.
-- RLS: insert разрешён всем (anon + authenticated), select/update/delete —
-- только через service_role (используется в api/admin-stats.ts).
--
-- APPLY:
--   Скопировать целиком в Supabase → SQL Editor → Run.

begin;

create table if not exists install_events (
  id         uuid        primary key default gen_random_uuid(),
  platform   text        not null check (platform in ('android_installed', 'desktop_installed', 'ios_guide_opened')),
  created_at timestamptz not null default now()
);

create index if not exists install_events_platform_date on install_events(platform, created_at desc);

alter table install_events enable row level security;

create policy "anyone can log install event"
  on install_events
  for insert
  to anon, authenticated
  with check (true);

commit;

-- ─── ROLLBACK (не выполнять при обычной миграции) ─────────────────────────────
-- begin;
-- drop table if exists install_events;
-- commit;
