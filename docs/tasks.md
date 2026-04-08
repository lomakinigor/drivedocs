# Tasks

Task registry. Each task is traceable to features, user stories, and the implementation plan.

**Типы:** `spec` | `plan` | `impl` | `test` | `refactor` | `ops`
**Статус:** `todo` | `in-progress` | `in-review` | `done`
**Владелец:** `human` | `AI` | `shared`

---

## Phase 0 — Project foundation

### T-001 — Initialize TypeScript project
**Тип:** ops | **Статус:** done | **Владелец:** AI
Vite 8 + React 19 + TypeScript strict mode. Path aliases (`@/`). ESLint.
**Файлы:** `vite.config.ts`, `tsconfig.json`, `package.json`

### T-002 — Configure TailwindCSS v4
**Тип:** ops | **Статус:** done | **Владелец:** AI
`@import "tailwindcss"` в `index.css`. Без `tailwind.config.js`.
**Файлы:** `src/index.css`

### T-003 — Configure React Router v7
**Тип:** impl | **Статус:** done | **Владелец:** AI
Workspace-scoped routing: `/w/:workspaceId/*`. Protected route guard. NotFoundPage.
**Файлы:** `src/app/App.tsx`

### T-004 — Configure Zustand store with persist
**Тип:** impl | **Статус:** done | **Владелец:** AI
Zustand 5 + `persist` middleware. `partialize` для выборочного сохранения. Mock data seed.
**Файлы:** `src/app/store/workspaceStore.ts`

### T-005 — Mobile shell with BottomNav + MobileHeader
**Тип:** impl | **Статус:** done | **Владелец:** AI
`MobileLayout`: header + `<Outlet>` + bottom navigation. Nav items: Сегодня, Поездки, Документы, События, Настройки.
**Файлы:** `src/shared/ui/layouts/MobileLayout.tsx`, `src/shared/ui/navigation/BottomNav.tsx`, `src/shared/ui/navigation/MobileHeader.tsx`

---

## Phase 1 — Workspace model + onboarding

### T-010 — Workspace model and mock data
**Тип:** impl | **Статус:** done | **Владелец:** AI
Domain types: `Workspace`, `OrganizationProfile`, `EntityType`, `TaxMode`, `VehicleUsageModel`. Mock workspaces.
**Файлы:** `src/entities/types/domain.ts`, `src/entities/mocks/workspaces.ts`
**Features:** F-001

### T-011 — Onboarding wizard
**Тип:** impl | **Статус:** done | **Владелец:** AI
7-шаговый wizard: EntityType → TaxMode → VehicleUsageModel → WorkspaceName → INN → VehicleModel → Summary. Режим перенастройки через `?ws=<id>` URL param.
**Файлы:** `src/features/onboarding/OnboardingWizard.tsx`, `src/features/onboarding/steps/*.tsx`
**Features:** F-002 | **User stories:** US-001, US-002

### T-012 — Workspace switcher sheet
**Тип:** impl | **Статус:** done | **Владелец:** AI
`WorkspaceSwitcher`: список workspace с active-check, переключение, добавить новый. Открывается из MobileHeader.
**Файлы:** `src/features/workspace/WorkspaceSwitcher.tsx`
**Features:** F-015 | **User stories:** US-003

### T-013 — SettingsPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
Карточка текущего workspace, переименование (inline RenameSheet), список workspace, добавить новый, danger zone (reset config с подтверждением), блок аккаунта.
**Файлы:** `src/pages/SettingsPage.tsx`
**Features:** F-013 | **User stories:** US-011

---

## Phase 2 — Trip flows

### T-020 — AddTripSheet
**Тип:** impl | **Статус:** done | **Владелец:** AI
Bottom sheet с формой: откуда, куда, км, цель, дата. Валидация. Вызов `addTrip()`.
**Файлы:** `src/features/trips/AddTripSheet.tsx`
**Features:** F-003 | **User stories:** US-004
**Acceptance:** поездка появляется в store после сохранения; дата по умолчанию — сегодня.

### T-021 — TripCard component
**Тип:** impl | **Статус:** done | **Владелец:** AI
Полиморфный компонент: `button` если `onClick` передан, `div` если нет. Показывает маршрут (первое слово), км, цель, опционально дату.
**Файлы:** `src/features/trips/TripCard.tsx`
**Features:** F-004, F-005

### T-022 — TripsPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
Список поездок workspace, сортировка по дате. Счётчик + сумма км. Кнопка "Добавить". Пустое состояние.
**Файлы:** `src/pages/TripsPage.tsx`
**Features:** F-004 | **User stories:** US-005

### T-023 — TodayPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
Журнал за сегодня: быстрые действия (Поездка + Чек-заглушка), список поездок за день, success banner. Reactive `justAdded` через `useEffect` + `useRef`.
**Файлы:** `src/pages/TodayPage.tsx`
**Features:** F-011 | **User stories:** US-012

### T-024 — Global QuickTripContext
**Тип:** impl | **Статус:** done | **Владелец:** AI
`QuickTripContext` через `<Outlet>` boundary. `QuickTripProvider` в MobileLayout. `AddTripSheet` — один экземпляр на весь shell.
**Файлы:** `src/features/trips/QuickTripContext.tsx`, `src/shared/ui/layouts/MobileLayout.tsx`
**Features:** F-003 | **Decisions:** D-003

---

## Phase 3 — Documents

### T-030 — Document model and mock data
**Тип:** impl | **Статус:** done | **Владелец:** AI
`WorkspaceDocument`, `DocumentStatus`. Mock documents с разными статусами и templateKey.
**Файлы:** `src/entities/types/domain.ts`, `src/entities/mocks/events.ts`
**Features:** F-006, F-007

### T-031 — DocumentsPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
Группировка по статусу, прогресс-бар, DocCard с quick-mark-done, пустое состояние.
**Файлы:** `src/pages/DocumentsPage.tsx`
**Features:** F-006 | **User stories:** US-007

### T-032 — DocumentDetailSheet
**Тип:** impl | **Статус:** done | **Владелец:** AI
Bottom sheet: статус badge, дедлайн/готовность, help блоки, sticky footer с action buttons.
**Файлы:** `src/features/documents/DocumentDetailSheet.tsx`
**Features:** F-007 | **User stories:** US-008

### T-033 — Document help config
**Тип:** impl | **Статус:** done | **Владелец:** shared
`getDocumentHelp(templateKey)` — plain-language "Зачем нужен" / "Как подготовить" / tip для каждого шаблона документа.
**Файлы:** `src/entities/config/documentHelp.ts`
**Features:** F-007 | **Decisions:** D-006

---

## Phase 4 — Events + notifications

### T-040 — Event model and mock data
**Тип:** impl | **Статус:** done | **Владелец:** AI
`WorkspaceEvent`, `EventType`, `severity`. Mock events с разными типами.
**Файлы:** `src/entities/types/domain.ts`, `src/entities/mocks/events.ts`
**Features:** F-008, F-009

### T-041 — EventsPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
Лента событий + штрафы (filter). EventDetailSheet при tapе. Context-aware empty state.
**Файлы:** `src/pages/EventsPage.tsx`
**Features:** F-008 | **User stories:** US-009

### T-042 — EventDetailSheet
**Тип:** impl | **Статус:** done | **Владелец:** AI
Bottom sheet: тип, severity badge, описание, дата. Auto-mark-read через `useEffect`.
**Файлы:** `src/features/events/EventDetailSheet.tsx`
**Features:** F-009 | **User stories:** US-009

### T-043 — NotificationsSheet
**Тип:** impl | **Статус:** done | **Владелец:** AI
Mini-feed непрочитанных событий. Tap → markEventRead + EventDetailSheet. Ссылка "Все события →".
**Файлы:** `src/features/events/NotificationsSheet.tsx`
**Features:** F-014 | **User stories:** US-013

### T-044 — Unread badge в BottomNav
**Тип:** impl | **Статус:** done | **Владелец:** AI
Красный badge на Bell в BottomNav. `useUnreadEventsCount()`. Cap 9+.
**Файлы:** `src/shared/ui/navigation/BottomNav.tsx`
**Features:** F-014 | **User stories:** US-013

### T-045 — Emit trip_logged event
**Тип:** impl | **Статус:** done | **Владелец:** AI
После `addTrip()` в AddTripSheet вызывается `addEvent()` с типом `trip_logged`.
**Файлы:** `src/features/trips/AddTripSheet.tsx`
**Features:** F-003, F-008

---

## Phase 5 — Home dashboard + detail flows

### T-050 — HomePage с attention layer
**Тип:** impl | **Статус:** done | **Владелец:** AI
Config-strip, TodayCTA, MonthlyStats, AttentionSection (срочные docs + events), RecentTripsSection. Guard для ненастроенного workspace.
**Файлы:** `src/pages/HomePage.tsx`, `src/features/home/useHomeData.ts`
**Features:** F-010, F-012 | **User stories:** US-010

### T-051 — TripDetailSheet на TodayPage и TripsPage
**Тип:** impl | **Статус:** done | **Владелец:** AI
`selectedTrip: Trip | null` state. TripCard onClick. TripDetailSheet с delete flow.
**Файлы:** `src/pages/TodayPage.tsx`, `src/pages/TripsPage.tsx`, `src/features/trips/TripDetailSheet.tsx`
**Features:** F-005 | **User stories:** US-006

### T-052 — DocumentDetailSheet из HomePage AttentionSection
**Тип:** impl | **Статус:** done | **Владелец:** AI
`selectedDoc` state в HomePage. Tap на doc-карточку → DocumentDetailSheet без navigate.
**Файлы:** `src/pages/HomePage.tsx`
**Features:** F-007, F-012 | **User stories:** US-008, US-010

### T-053 — TripDetailSheet из HomePage RecentTripsSection
**Тип:** impl | **Статус:** done | **Владелец:** AI
`selectedTrip` state в HomePage. TripCard onClick в RecentTripsSection. TripDetailSheet без navigate.
**Файлы:** `src/pages/HomePage.tsx`
**Features:** F-005, F-010 | **User stories:** US-006

---

## Upcoming

### T-060 — Monthly trip report + clipboard export
**Тип:** impl | **Статус:** todo | **Владелец:** AI
Bottom sheet на TripsPage или HomePage: сводка за месяц (поездки, км, список маршрутов). Кнопка "Скопировать отчёт" — в clipboard для отправки в бухгалтерию.
**Features:** F-016

### T-061 — Receipt capture flow
**Тип:** impl | **Статус:** todo | **Владелец:** shared
Заменить заглушку "Чек" на TodayPage реальным flow.
**Features:** F-017

### T-070 — Backend integration
**Тип:** impl | **Статус:** todo | **Владелец:** shared
Заменить Zustand mock-данные на API. Store actions остаются интерфейсом — только реализация меняется.
**Decisions:** D-004

### T-071 — Real auth
**Тип:** impl | **Статус:** todo | **Владелец:** shared
Заменить `isAuthenticated: true` на реальный auth flow.

### T-072 — Billing / subscription
**Тип:** impl | **Статус:** todo | **Владелец:** shared
**Features:** F-020
