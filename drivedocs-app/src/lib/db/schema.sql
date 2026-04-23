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

-- ─── documents ────────────────────────────────────────────────────────────────
-- Workspace-scoped required/recurring document checklist items.
-- Generated at workspace creation (see workspaceDocumentSeed.ts) and updated
-- via updateDocumentStatus. RLS in rls-policies.sql.

create table if not exists documents (
  id           text        primary key,
  workspace_id text        not null references workspaces(id) on delete cascade,
  title        text        not null,
  description  text,
  type         text        not null,   -- 'one_time' | 'recurring'
  status       text        not null,   -- 'required' | 'in_progress' | 'completed' | 'overdue'
  due_date     date,
  completed_at date,
  template_key text,
  created_at   timestamptz not null default now()
);

create index if not exists documents_workspace on documents(workspace_id);

-- ─── events ───────────────────────────────────────────────────────────────────
-- Workspace-scoped activity / notification feed items.
-- Written by store actions (addEvent, trip_logged, etc.). RLS in rls-policies.sql.

create table if not exists events (
  id           text        primary key,
  workspace_id text        not null references workspaces(id) on delete cascade,
  type         text        not null,   -- EventType union
  title        text        not null,
  description  text        not null default '',
  date         timestamptz not null,
  is_read      boolean     not null default false,
  severity     text        not null,   -- 'info' | 'warning' | 'urgent'
  link_to      text,
  created_at   timestamptz not null default now()
);

create index if not exists events_workspace_date on events(workspace_id, date desc);

-- ─── subscriptions ────────────────────────────────────────────────────────────
-- One row per workspace. Created by Stripe webhook (Edge Function) on first payment.
-- plan_code defaults to 'free' so absence of row = Free tier (handled in selectors).
-- stripe_customer_id / stripe_subscription_id written by webhook only (server-side).
-- RLS in rls-policies.sql.

create table if not exists subscriptions (
  id                     text        primary key,
  workspace_id           text        not null unique references workspaces(id) on delete cascade,
  plan_code              text        not null default 'free',    -- 'free' | 'pro'
  status                 text        not null default 'active',  -- 'active' | 'canceled' | 'past_due' | 'incomplete'
  stripe_customer_id     text,
  stripe_subscription_id text,
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index if not exists subscriptions_workspace on subscriptions(workspace_id);
