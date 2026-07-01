-- drivedocs migration 002 — Multi-driver architecture (B1.1 · drivedocs-p9d)
-- =====================================================================
-- Одна компания = один workspace, до 5 машин + до 10 водителей.
-- Owner (ИП/ООО) + Driver (наёмный водитель). ИП сам себе = owner+driver.
--
-- APPLY:
--   Skopipasti целиком в Supabase → SQL Editor → Run.
--
-- ROLLBACK:
--   См. секцию «-- ROLLBACK» в конце файла (закомментировано).

begin;

-- ─── 1. workspace_members: центральная таблица ролей ──────────────────────────
-- Каждый юзер, имеющий доступ к workspace, представлен строкой.
-- Owner создаётся автоматически при создании workspace (через триггер ниже).
-- Driver добавляется когда consume'ит invite-код.

create table if not exists workspace_members (
  id                       uuid        primary key default gen_random_uuid(),
  workspace_id             text        not null references workspaces(id) on delete cascade,
  user_id                  text        not null,     -- auth.uid()::text
  role                     text        not null check (role in ('owner', 'driver')),
  is_active_driver         boolean     not null default true,
  -- Данные водителя (заполняет сам через join-flow)
  driver_full_name         text,
  driver_license_number    text,
  driver_license_issued_at date,
  driver_birth_date        date,
  driver_phone             text,
  default_vehicle_id       uuid,       -- FK добавим ниже после ре-структуры vehicle_profiles
  joined_at                timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create index if not exists workspace_members_user_id on workspace_members(user_id);
create index if not exists workspace_members_workspace on workspace_members(workspace_id);

-- ─── 2. Реструктура vehicle_profiles: PK → id, добавить workspace_id как FK ───
-- Было: workspace_id — primary key (одна машина на workspace).
-- Стало: id — primary key, workspace_id — обычный FK (до 5 машин на workspace).

-- Проверяем, была ли уже миграция (idempotency)
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'vehicle_profiles' and column_name = 'id'
  ) then
    -- Добавляем id колонку
    alter table vehicle_profiles add column id uuid default gen_random_uuid();
    update vehicle_profiles set id = gen_random_uuid() where id is null;
    alter table vehicle_profiles alter column id set not null;

    -- Дропаем старый PK и делаем id новым PK
    alter table vehicle_profiles drop constraint vehicle_profiles_pkey;
    alter table vehicle_profiles add primary key (id);

    -- workspace_id теперь просто FK, разрешаем несколько машин на workspace
    alter table vehicle_profiles add column added_by_user_id text;

    -- Индекс для быстрого поиска машин workspace'а
    create index vehicle_profiles_workspace on vehicle_profiles(workspace_id);
  end if;
end $$;

-- Теперь FK default_vehicle_id → vehicle_profiles.id
do $$
begin
  if not exists (
    select 1 from information_schema.table_constraints
    where constraint_name = 'workspace_members_default_vehicle_fk'
  ) then
    alter table workspace_members
      add constraint workspace_members_default_vehicle_fk
      foreign key (default_vehicle_id) references vehicle_profiles(id) on delete set null;
  end if;
end $$;

-- ─── 3. trips: добавляем vehicle_id и driver_user_id ──────────────────────────

alter table trips add column if not exists vehicle_id uuid references vehicle_profiles(id) on delete set null;
alter table trips add column if not exists driver_user_id text;

create index if not exists trips_driver on trips(driver_user_id, date desc);
create index if not exists trips_vehicle on trips(vehicle_id, date desc);

-- ─── 4. receipts: driver_user_id (кто занёс расход) ───────────────────────────

alter table receipts add column if not exists driver_user_id text;
create index if not exists receipts_driver on receipts(driver_user_id, date desc);

-- ─── 5. workspace_invites: invite-коды ────────────────────────────────────────

create table if not exists workspace_invites (
  id            uuid        primary key default gen_random_uuid(),
  workspace_id  text        not null references workspaces(id) on delete cascade,
  code          text        not null unique,
  role          text        not null default 'driver' check (role in ('driver', 'owner')),
  expires_at    timestamptz not null,
  used_by       text,       -- auth.uid() того, кто использовал
  used_at       timestamptz,
  created_by    text        not null,
  created_at    timestamptz not null default now()
);

create index if not exists workspace_invites_code on workspace_invites(code);
create index if not exists workspace_invites_workspace on workspace_invites(workspace_id);

-- ─── 6. Триггеры-ограничения: 5 машин / 10 водителей на workspace ─────────────

create or replace function check_vehicle_limit()
returns trigger as $$
begin
  if (select count(*) from vehicle_profiles where workspace_id = new.workspace_id) >= 5 then
    raise exception 'Максимум 5 машин на компанию (workspace %). Удалите старую перед добавлением новой.', new.workspace_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_vehicle_limit on vehicle_profiles;
create trigger trg_vehicle_limit
  before insert on vehicle_profiles
  for each row
  execute function check_vehicle_limit();

create or replace function check_driver_limit()
returns trigger as $$
begin
  if (select count(*) from workspace_members
      where workspace_id = new.workspace_id
        and role = 'driver'
        and is_active_driver = true
     ) >= 10 then
    raise exception 'Максимум 10 активных водителей на компанию (workspace %).', new.workspace_id;
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_driver_limit on workspace_members;
create trigger trg_driver_limit
  before insert on workspace_members
  for each row
  when (new.role = 'driver' and new.is_active_driver = true)
  execute function check_driver_limit();

-- ─── 7. Data migration: заполняем workspace_members из существующих workspaces ─
-- Каждый существующий workspace получает одну запись owner+driver с данными
-- из vehicle_profiles.owner_full_name / org_profiles.owner_full_name.

insert into workspace_members (workspace_id, user_id, role, is_active_driver, driver_full_name, default_vehicle_id)
select
  w.id,
  w.user_id,
  'owner',
  true,
  coalesce(op.owner_full_name, vp.owner_full_name),
  vp.id                                       -- default_vehicle_id = существующая машина
from workspaces w
left join org_profiles op on op.workspace_id = w.id
left join vehicle_profiles vp on vp.workspace_id = w.id
on conflict (workspace_id, user_id) do nothing;

-- Заполняем driver_user_id в существующих trips и receipts значением owner'а
update trips t
set driver_user_id = w.user_id
from workspaces w
where t.workspace_id = w.id and t.driver_user_id is null;

update trips t
set vehicle_id = vp.id
from vehicle_profiles vp
where t.workspace_id = vp.workspace_id and t.vehicle_id is null;

update receipts r
set driver_user_id = w.user_id
from workspaces w
where r.workspace_id = w.id and r.driver_user_id is null;

-- Заполняем added_by_user_id в существующих vehicle_profiles
update vehicle_profiles vp
set added_by_user_id = w.user_id
from workspaces w
where vp.workspace_id = w.id and vp.added_by_user_id is null;

-- ─── 8. RLS policies: обновляем на "member-based" ─────────────────────────────
-- Раньше RLS проверял workspaces.user_id = auth.uid(). Теперь — членство в
-- workspace_members. Owner может всё, driver может редактировать только свои
-- trips/receipts.

-- Хелпер: возвращает true если auth.uid() — член workspace'а
create or replace function is_workspace_member(w_id text)
returns boolean as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = w_id and user_id = auth.uid()::text
  );
$$ language sql stable security definer;

-- Хелпер: возвращает true если auth.uid() — owner workspace'а
create or replace function is_workspace_owner(w_id text)
returns boolean as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = w_id and user_id = auth.uid()::text and role = 'owner'
  );
$$ language sql stable security definer;

-- workspaces
drop policy if exists workspaces_select on workspaces;
drop policy if exists workspaces_insert on workspaces;
drop policy if exists workspaces_update on workspaces;
drop policy if exists workspaces_delete on workspaces;

create policy workspaces_select on workspaces for select
  using (is_workspace_member(id));
create policy workspaces_insert on workspaces for insert
  with check (user_id = auth.uid()::text);        -- owner создаёт себя
create policy workspaces_update on workspaces for update
  using (is_workspace_owner(id));
create policy workspaces_delete on workspaces for delete
  using (is_workspace_owner(id));

-- workspace_members: сам себя видит + owner видит всех, owner добавляет/удаляет
alter table workspace_members enable row level security;
drop policy if exists members_select on workspace_members;
drop policy if exists members_insert on workspace_members;
drop policy if exists members_update on workspace_members;
drop policy if exists members_delete on workspace_members;

create policy members_select on workspace_members for select
  using (is_workspace_member(workspace_id));
create policy members_insert on workspace_members for insert
  with check (
    -- Owner добавляет других + сам себя (при создании workspace)
    is_workspace_owner(workspace_id) or user_id = auth.uid()::text
  );
create policy members_update on workspace_members for update
  using (
    -- Owner редактирует всех, driver — только свои поля
    is_workspace_owner(workspace_id) or user_id = auth.uid()::text
  );
create policy members_delete on workspace_members for delete
  using (is_workspace_owner(workspace_id));

-- vehicle_profiles: все члены видят, owner+driver добавляют
drop policy if exists vehicles_select on vehicle_profiles;
drop policy if exists vehicles_insert on vehicle_profiles;
drop policy if exists vehicles_update on vehicle_profiles;
drop policy if exists vehicles_delete on vehicle_profiles;

create policy vehicles_select on vehicle_profiles for select
  using (is_workspace_member(workspace_id));
create policy vehicles_insert on vehicle_profiles for insert
  with check (is_workspace_member(workspace_id));
create policy vehicles_update on vehicle_profiles for update
  using (is_workspace_member(workspace_id));
create policy vehicles_delete on vehicle_profiles for delete
  using (is_workspace_owner(workspace_id));

-- org_profiles: только owner
drop policy if exists orgs_select on org_profiles;
drop policy if exists orgs_insert on org_profiles;
drop policy if exists orgs_update on org_profiles;
drop policy if exists orgs_delete on org_profiles;

create policy orgs_select on org_profiles for select using (is_workspace_member(workspace_id));
create policy orgs_insert on org_profiles for insert with check (is_workspace_owner(workspace_id));
create policy orgs_update on org_profiles for update using (is_workspace_owner(workspace_id));
create policy orgs_delete on org_profiles for delete using (is_workspace_owner(workspace_id));

-- trips: все видят, driver пишет свои, owner пишет любые
drop policy if exists trips_select on trips;
drop policy if exists trips_insert on trips;
drop policy if exists trips_update on trips;
drop policy if exists trips_delete on trips;

create policy trips_select on trips for select
  using (is_workspace_member(workspace_id));
create policy trips_insert on trips for insert
  with check (
    is_workspace_member(workspace_id)
    and (driver_user_id = auth.uid()::text or is_workspace_owner(workspace_id))
  );
create policy trips_update on trips for update
  using (
    is_workspace_owner(workspace_id)
    or driver_user_id = auth.uid()::text
  );
create policy trips_delete on trips for delete
  using (
    is_workspace_owner(workspace_id)
    or driver_user_id = auth.uid()::text
  );

-- receipts: аналогично trips
drop policy if exists receipts_select on receipts;
drop policy if exists receipts_insert on receipts;
drop policy if exists receipts_update on receipts;
drop policy if exists receipts_delete on receipts;

create policy receipts_select on receipts for select
  using (is_workspace_member(workspace_id));
create policy receipts_insert on receipts for insert
  with check (
    is_workspace_member(workspace_id)
    and (driver_user_id = auth.uid()::text or is_workspace_owner(workspace_id))
  );
create policy receipts_update on receipts for update
  using (
    is_workspace_owner(workspace_id)
    or driver_user_id = auth.uid()::text
  );
create policy receipts_delete on receipts for delete
  using (
    is_workspace_owner(workspace_id)
    or driver_user_id = auth.uid()::text
  );

-- workspace_invites: owner может всё, приглашённый может read+update (при consume)
alter table workspace_invites enable row level security;
drop policy if exists invites_select on workspace_invites;
drop policy if exists invites_insert on workspace_invites;
drop policy if exists invites_update on workspace_invites;
drop policy if exists invites_delete on workspace_invites;

create policy invites_select on workspace_invites for select
  using (is_workspace_owner(workspace_id));
create policy invites_insert on workspace_invites for insert
  with check (is_workspace_owner(workspace_id));
create policy invites_update on workspace_invites for update
  using (is_workspace_owner(workspace_id));
create policy invites_delete on workspace_invites for delete
  using (is_workspace_owner(workspace_id));

-- documents и events — оставляем как было (owner-only), но переводим на новую логику
drop policy if exists documents_select on documents;
drop policy if exists documents_insert on documents;
drop policy if exists documents_update on documents;
drop policy if exists documents_delete on documents;

create policy documents_select on documents for select using (is_workspace_member(workspace_id));
create policy documents_insert on documents for insert with check (is_workspace_owner(workspace_id));
create policy documents_update on documents for update using (is_workspace_owner(workspace_id));
create policy documents_delete on documents for delete using (is_workspace_owner(workspace_id));

drop policy if exists events_select on events;
drop policy if exists events_insert on events;
drop policy if exists events_update on events;
drop policy if exists events_delete on events;

create policy events_select on events for select using (is_workspace_member(workspace_id));
create policy events_insert on events for insert with check (is_workspace_member(workspace_id));
create policy events_update on events for update using (is_workspace_member(workspace_id));
create policy events_delete on events for delete using (is_workspace_member(workspace_id));

commit;

-- ─── ROLLBACK (не выполнять при обычной миграции) ─────────────────────────────
-- Раскомментировать целиком и запустить если нужно откатить:
--
-- begin;
-- drop trigger if exists trg_vehicle_limit on vehicle_profiles;
-- drop trigger if exists trg_driver_limit on workspace_members;
-- drop function if exists check_vehicle_limit();
-- drop function if exists check_driver_limit();
-- drop function if exists is_workspace_member(text);
-- drop function if exists is_workspace_owner(text);
-- drop table if exists workspace_invites;
-- drop table if exists workspace_members;
-- alter table trips drop column if exists vehicle_id;
-- alter table trips drop column if exists driver_user_id;
-- alter table receipts drop column if exists driver_user_id;
-- alter table vehicle_profiles drop column if exists id;
-- alter table vehicle_profiles drop column if exists added_by_user_id;
-- alter table vehicle_profiles add primary key (workspace_id);
-- commit;
