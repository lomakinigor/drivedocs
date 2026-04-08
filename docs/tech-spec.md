# Tech Spec — drivedocs

**Версия:** 3.0
**Дата:** 7 апреля 2026 г.

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

---

## Architecture and components

```
src/
├── app/
│   ├── App.tsx              # router root, protected route guard
│   └── store/
│       └── workspaceStore.ts  # global Zustand store + selectors
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

## Constraints and trade-offs

- **No backend yet:** all data is in-memory + localStorage via Zustand persist. Mock data is seeded on first load.
- **No auth:** `isAuthenticated: true` is hardcoded. Protected route guard exists but is mock-only.
- **No file uploads:** document status is user-managed (mark done/in-progress). No actual file attachment.
- **TailwindCSS v4:** no `tailwind.config.js`. All customization via CSS variables and `@theme` blocks.
- **React 19 + Vite 8:** using latest, some ecosystem libraries may lag.

---

## Risks and open questions

| Risk | Mitigation |
|------|-----------|
| Backend integration will require significant store refactoring | Keep store actions as the single mutation interface — easier to swap implementation later |
| Document template config (`documentHelp.ts`) is static | Acceptable for MVP; plan is to move to server-side config post-MVP |
| No offline support | Zustand persist gives basic resilience; full offline needs service worker |
| Subscription enforcement not implemented | Placeholder model; billing flow is F-020 (draft) |

---

## Related features

F-001, F-002, F-003, F-004, F-005, F-006, F-007, F-008, F-009, F-010, F-011, F-012, F-013, F-014, F-015
