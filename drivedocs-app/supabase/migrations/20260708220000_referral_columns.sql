-- drivedocs migration 004 — Referral columns safety net (drivedocs-671, базовое отслеживание)
-- =====================================================================
-- schema.sql (Phase 8 baseline) уже резервирует referral_code/referred_by_code
-- в workspaces, но нет гарантии, что эта версия схемы реально накатана на
-- прод-проект — миграция идемпотентна и безопасна в любом случае.
--
-- referral_code — свой код workspace (генерируется на клиенте при создании
-- или лениво доначисляется существующим — см. src/lib/referral.ts).
-- referred_by_code — код, с которым пришёл этот workspace (?ref=XXXX), null — органика.
--
-- Пока без экрана «Пригласить друга» и без бонус-механики — только атрибуция,
-- чтобы видеть в админке кто кого привёл (важно перед запуском платных тарифов).
--
-- APPLY:
--   Скопировать целиком в Supabase → SQL Editor → Run.

begin;

alter table workspaces add column if not exists referral_code text;
alter table workspaces add column if not exists referred_by_code text;

-- Partial unique index — допускает много NULL (ещё не доначисленные старые
-- workspace'ы), но гарантирует, что ?ref=XXXX резолвится однозначно.
create unique index if not exists workspaces_referral_code_idx
  on workspaces(referral_code) where referral_code is not null;

commit;

-- ─── ROLLBACK (не выполнять при обычной миграции) ─────────────────────────────
-- begin;
-- drop index if exists workspaces_referral_code_idx;
-- alter table workspaces drop column if exists referral_code;
-- alter table workspaces drop column if exists referred_by_code;
-- commit;
