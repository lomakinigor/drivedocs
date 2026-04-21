-- drivedocs Phase 8 — initial schema
-- Run against your Supabase project via the SQL editor or supabase db push.
-- Phase 9 will add RLS policies once auth is wired (auth.uid() replaces user_id = 'user-1').

-- ─── workspaces ───────────────────────────────────────────────────────────────

create table if not exists workspaces (
  id                  text        primary key,
  user_id             text        not null,
  name                text        not null,
  entity_type         text        not null check (entity_type in ('IP', 'OOO')),
  tax_mode            text        not null,
  vehicle_usage_model text        not null,
  is_configured       boolean     not null default false,
  created_at          timestamptz not null default now()
);

-- ─── org_profiles ─────────────────────────────────────────────────────────────

create table if not exists org_profiles (
  workspace_id      text primary key references workspaces(id) on delete cascade,
  entity_type       text not null,
  inn               text,
  ogrn              text,
  organization_name text,
  owner_full_name   text
);

-- ─── vehicle_profiles ─────────────────────────────────────────────────────────

create table if not exists vehicle_profiles (
  workspace_id    text    primary key references workspaces(id) on delete cascade,
  make            text    not null,
  model           text    not null,
  year            integer not null,
  license_plate   text    not null,
  engine_volume   integer,
  fuel_type       text,
  owner_full_name text
);

-- ─── trips ────────────────────────────────────────────────────────────────────

create table if not exists trips (
  id             text         primary key,
  workspace_id   text         not null references workspaces(id) on delete cascade,
  date           date         not null,
  start_location text         not null,
  end_location   text         not null,
  distance_km    numeric(10,2) not null,
  purpose        text         not null,
  notes          text,
  created_at     timestamptz  not null default now()
);

create index if not exists trips_workspace_date on trips(workspace_id, date desc);

-- ─── receipts ─────────────────────────────────────────────────────────────────
-- Note: image_url is intentionally absent — object URLs are ephemeral (see D-009).
-- Backend file storage is out of scope for Phase 8.

create table if not exists receipts (
  id           text          primary key,
  workspace_id text          not null references workspaces(id) on delete cascade,
  trip_id      text          references trips(id) on delete set null,
  date         date          not null,
  amount       numeric(12,2) not null,
  category     text          not null,
  description  text,
  created_at   timestamptz   not null default now()
);

create index if not exists receipts_workspace_date on receipts(workspace_id, date desc);

-- ─── Phase 9 note ─────────────────────────────────────────────────────────────
-- Add RLS policies here when auth is ready:
--   alter table workspaces enable row level security;
--   create policy "users see own workspaces"
--     on workspaces for all using (auth.uid()::text = user_id);
-- (repeat for all tables via workspace_id FK)
