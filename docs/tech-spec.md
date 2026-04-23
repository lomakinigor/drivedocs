# Tech Spec — drivedocs

**Версия:** 4.0
**Дата:** 23 апреля 2026 г.

**Правило:** любое архитектурное изменение сначала фиксируется в этом документе или в `docs/decisions.md`, затем реализуется в коде. Молчаливые архитектурные изменения не допускаются.

---

## Overview

drivedocs — mobile-first subscription web app для ИП и ООО, которые используют личный автомобиль в служебных целях.

Текущий статус MVP: client-only, mock data, Zustand persist. Backend/API не подключён.

---

## Stack

| Layer | Technology |
|-------|-----------|
| Build | Vite 8 |
| UI framework | React 19 |
| Language | TypeScript (strict mode) |
| Styling | TailwindCSS v4 (`@import "tailwindcss"`, no config file) |
| Routing | React Router v7 (Data API) |
| State | Zustand 5 with `persist` middleware |
| Icons | Lucide React |
| Backend | Supabase (PostgreSQL + `@supabase/supabase-js`) — Phase 8 |
| Data fetching | `@tanstack/react-query` (in dependencies, used alongside Zustand) |
| Validation | Zod |

---

## Architecture and components

```
src/
├── app/
│   ├── App.tsx              # router root + backend hydration on mount
│   └── store/
│       └── workspaceStore.ts  # global Zustand store + selectors + backend sync
├── lib/
│   ├── supabase.ts          # Supabase client singleton (null if env vars absent)
│   └── db/
│       ├── repository.ts    # typed data access layer (Workspace, Trip, Receipt, …)
│       └── schema.sql       # Supabase SQL migration
├── entities/
│   ├── types/
│   │   └── domain.ts        # all domain types (Workspace, Trip, etc.)
│   ├── constants/
│   │   └── labels.ts        # human-readable labels for enums
│   ├── config/
│   │   └── documentHelp.ts  # plain-language document help by templateKey
│   └── mocks/               # mock data for all entities
├── features/
│   ├── onboarding/          # OnboardingWizard + step components
│   ├── trips/               # AddTripSheet, TripCard, TripDetailSheet, QuickTripContext
│   ├── documents/           # DocumentDetailSheet
│   ├── events/              # EventDetailSheet, NotificationsSheet
│   ├── workspace/           # WorkspaceSwitcher
│   └── home/                # useHomeData hook
├── pages/                   # page-level components (routed)
│   ├── HomePage.tsx
│   ├── TodayPage.tsx
│   ├── TripsPage.tsx
│   ├── DocumentsPage.tsx
│   ├── EventsPage.tsx
│   └── SettingsPage.tsx
└── shared/
    ├── ui/
    │   ├── layouts/
    │   │   └── MobileLayout.tsx   # shell: header + outlet + bottom nav
    │   ├── navigation/
    │   │   ├── MobileHeader.tsx
    │   │   └── BottomNav.tsx
    │   └── components/
    │       ├── Card.tsx
    │       ├── Badge.tsx
    │       ├── EmptyState.tsx
    │       └── BottomSheet.tsx
    └── hooks/               # (shared hooks, if any)
```

---

## Routing

```
/onboarding                    → OnboardingWizard (public)
/w/:workspaceId/               → MobileLayout (protected shell)
  home                         → HomePage
  today                        → TodayPage
  trips                        → TripsPage
  documents                    → DocumentsPage
  events                       → EventsPage
  settings                     → SettingsPage
*                              → NotFoundPage
```

Workspace scoping is always explicit in route params (`workspaceId`). No implicit "current workspace" in the URL — store has `currentWorkspaceId` for the switcher default.

---

## Main flows

### 1. Onboarding / workspace config

1. User arrives at `/onboarding` (new or via SettingsPage → reset config `?ws=<id>`).
2. `OnboardingWizard` walks through 7 steps, builds `Workspace` + `OrganizationProfile`.
3. On complete: create new workspace OR `updateWorkspace(targetWsId, ...)` + `addOrgProfile(...)`.
4. Redirect to `/w/:workspaceId/home`.
5. `HomePage` checks `isConfigured` — shows guard or full dashboard.

### 2. Quick trip entry

1. Any screen → `useOpenQuickTrip()` (React Context, provided by `MobileLayout`) → `AddTripSheet` opens.
2. User fills: откуда / куда / км / цель / дата (today default).
3. On save: `addTrip(trip)` → `addEvent(trip_logged event)` → sheet closes.
4. `TodayPage` detects `todayTrips.length` increase via `useEffect` → shows success banner.

### 3. Document status management

1. `useWorkspaceDocuments(workspaceId)` → reactive list from store.
2. `DocumentsPage` or `HomePage AttentionSection` → tap → `DocumentDetailSheet`.
3. Actions call `updateDocumentStatus(id, status)`.
4. Store updates → both DocumentsPage and HomePage rerender reactively.

### 4. Event feed + notifications

1. Events created: via `addEvent()` after trip log, or from mock data.
2. `EventsPage` shows all events; `useUnreadEventsCount()` drives BottomNav badge.
3. `NotificationsSheet` shows unread events; tap → `markEventRead()` + `EventDetailSheet`.
4. `EventDetailSheet` auto-marks read via `useEffect` on mount.

### 5. Multi-workspace

1. `WorkspaceSwitcher` (triggered from MobileHeader) shows all workspaces.
2. `setCurrentWorkspace(id)` updates store → routing stays on current page but workspace data changes.
3. Add new → `/onboarding` (no `?ws` param) → creates new workspace.
4. Reset config → `resetWorkspaceConfig(workspaceId)` → sets `isConfigured: false`, removes orgProfile.

---

## State management

Single Zustand store (`workspaceStore`) with `persist` middleware.

**Persisted slices:** `currentWorkspaceId`, `workspaces`, `orgProfiles`, `trips`, `documents`, `events`.

**Not persisted:** `user`, `isAuthenticated`, `onboarding` (ephemeral wizard state).

**Selectors** are exported hooks (e.g. `useWorkspaceTrips`, `useTodayTrips`, `useUrgentDocuments`) — always prefer selectors over raw `useWorkspaceStore` in components.

---

## Bottom sheet pattern

Self-contained pattern: each sheet component renders its own backdrop (`fixed inset-0 z-50 bg-black/40`) and sheet div (`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl`). No shared BottomSheet wrapper (see `D-007`).

Layout: flex column, `max-h-[X]dvh`, drag handle, sticky header, scrollable content, optional sticky footer for actions.

---

## Backend persistence (Phase 8)

Architecture: `UI → workspaceStore actions/selectors → repository layer → Supabase`.

**Env vars** (copy `.env.example` → `.env.local`):
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — anon/public key

**Fallback**: when env vars are absent, `src/lib/supabase.ts` returns `null` and the app continues in localStorage-only mode (current mock behavior). No crash, a console warning in dev.

**Persistence strategy**: optimistic local update first (Zustand `set` synchronously), async backend call after. On error: `syncError` set in store, no rollback. See D-015.

**Backend-backed entities (Phase 8)**: workspaces, org_profiles, vehicle_profiles, trips, receipts.

**Local-only entities (Phase 8)**: documents, events. These stay in Zustand persist. Rationale: D-016.

**Hydration**: on `App` mount, `hydrateFromBackend()` fetches all user data and replaces store state. If backend has no records (first run), local/mock data is kept unchanged.

**user_id**: hardcoded `'user-1'` (ANON_USER_ID) in Phase 8. Phase 9 replaces with `auth.uid()`.

**Schema**: `src/lib/db/schema.sql`. Apply via Supabase SQL editor or `supabase db push`.

**RLS**: not enabled in Phase 8. Phase 9 adds `enable row level security` + `auth.uid()` policies.

---

## Billing / subscriptions (Phase 11)

Architecture: `UI → billingService → Supabase Edge Function → Stripe → webhook → subscriptions table`.

**Plan:** Free (default) / Pro (workspace-scoped). See D-020, D-021.

**Production Checkout flow:**
1. User taps «Перейти на Pro» → `billingService.createCheckoutSession(workspaceId, returnBaseUrl)`.
2. Client calls Supabase Edge Function `create-checkout-session` (POST, with user JWT).
3. Edge Function: verifies auth + workspace ownership → creates/reuses Stripe Customer → creates Stripe Checkout Session → returns `{ url }`.
4. Client redirects to Stripe Checkout.
5. After payment: Stripe redirects back to `?billing=success` (or `?billing=cancel`).
6. On success: `refreshSubscription()` refetches from `subscriptions` table → store updates → UI rerenders.

**Webhook sync flow:**
1. Stripe POSTs events to Edge Function `stripe-webhook`.
2. Function validates `stripe-signature` header against `STRIPE_WEBHOOK_SECRET`.
3. Handles: `checkout.session.completed` (upgrade to Pro), `customer.subscription.updated` (sync status/period), `customer.subscription.deleted` (downgrade to Free/canceled).
4. Upserts `subscriptions` table via service role key.

**Edge Functions:** `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/stripe-webhook/index.ts`.

**Dev/mock mode:** when `VITE_SUPABASE_URL` is absent, `billingService` returns `{ isMockMode: true }`. SettingsPage offers «Симулировать Pro» button which calls `activateDevProSubscription()` — sets Pro state locally without Stripe.

**Required Supabase secrets** (server-side only, never in `.env.local`):
```
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_...
```

**Feature gate:** `useIsProWorkspace(workspaceId)` — single selector used by all Pro-gated features. Currently: PDF export (`WaybillPreviewSheet`). See F-018, F-020.

**Local webhook testing:**
```
stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
```

---

## Constraints and trade-offs

- **Backend optional:** app runs in localStorage-only mode when Supabase env vars are absent. No crash.
- **No file uploads:** document status is user-managed. Receipt `imageUrl` is object URL (ephemeral, D-009). Backend file storage is not in scope for Phase 8.
- **No rollback on sync error:** optimistic update stays local on backend failure. User can refresh to re-sync.
- **TailwindCSS v4:** no `tailwind.config.js`. All customization via CSS variables and `@theme` blocks.
- **React 19 + Vite 8:** using latest, some ecosystem libraries may lag.

---

## Risks and open questions

| Risk | Mitigation |
|------|-----------|
| Backend integration will require significant store refactoring | Keep store actions as the single mutation interface — easier to swap implementation later |
| Document template config (`documentHelp.ts`) is static | Acceptable for MVP; plan is to move to server-side config post-MVP |
| No offline support | Zustand persist gives basic resilience; full offline needs service worker |
| Stripe in test mode only until Edge Functions deployed | Dev simulation via `activateDevProSubscription()` available |

---

## Related features

F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-009, F-010, F-011, F-012, F-013, F-014, F-015
