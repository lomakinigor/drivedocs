-- drivedocs Phase 9 — Row Level Security policies
-- Run these after running schema.sql.
-- All tables are owner-only: a row is accessible only to the user who owns it.
-- Ownership for workspaces is determined by user_id = auth.uid()::text.
-- Ownership for child tables is determined via the parent workspace.

-- ─── workspaces ───────────────────────────────────────────────────────────────

alter table workspaces enable row level security;

create policy "owner access workspaces"
  on workspaces
  for all
  using      (user_id = auth.uid()::text)
  with check (user_id = auth.uid()::text);

-- ─── org_profiles ─────────────────────────────────────────────────────────────

alter table org_profiles enable row level security;

create policy "owner access org_profiles"
  on org_profiles
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── vehicle_profiles ─────────────────────────────────────────────────────────

alter table vehicle_profiles enable row level security;

create policy "owner access vehicle_profiles"
  on vehicle_profiles
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── trips ────────────────────────────────────────────────────────────────────

alter table trips enable row level security;

create policy "owner access trips"
  on trips
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── receipts ─────────────────────────────────────────────────────────────────

alter table receipts enable row level security;

create policy "owner access receipts"
  on receipts
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── documents ────────────────────────────────────────────────────────────────

alter table documents enable row level security;

create policy "owner access documents"
  on documents
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── events ───────────────────────────────────────────────────────────────────

alter table events enable row level security;

create policy "owner access events"
  on events
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );

-- ─── subscriptions ────────────────────────────────────────────────────────────

alter table subscriptions enable row level security;

create policy "owner access subscriptions"
  on subscriptions
  for all
  using (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  )
  with check (
    exists (
      select 1 from workspaces w
      where w.id = workspace_id
        and w.user_id = auth.uid()::text
    )
  );
