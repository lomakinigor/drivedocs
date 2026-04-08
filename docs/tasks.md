# Tasks

Task registry. Each task is traceable to features, user stories, and the implementation plan.

**Типы:** `spec` | `plan` | `impl` | `test` | `refactor` | `ops`
**Status:** `todo` | `in-progress` | `in-review` | `done`
**Owner:** `human` | `AI` | `shared`

---

## Phase 0 — Project foundation

### T-001 — Initialize TypeScript project
**Type:** ops | **Status:** done | **Owner:** AI
Vite 8 + React 19 + TypeScript strict mode. Path aliases (`@/`). ESLint.
**Files/Areas:** `vite.config.ts`, `tsconfig.json`, `package.json`
**Links:** PRD (foundation)

### T-002 — Configure TailwindCSS v4
**Type:** ops | **Status:** done | **Owner:** AI
`@import "tailwindcss"` в `index.css`. Без `tailwind.config.js`.
**Files/Areas:** `src/index.css`
**Links:** PRD (foundation)

### T-003 — Configure React Router v7
**Type:** impl | **Status:** done | **Owner:** AI
Workspace-scoped routing: `/w/:workspaceId/*`. Protected route guard. NotFoundPage.
**Files/Areas:** `src/app/App.tsx`
**Links:** PRD (foundation), F-001

### T-004 — Configure Zustand store with persist
**Type:** impl | **Status:** done | **Owner:** AI
Zustand 5 + `persist` middleware. `partialize` для выборочного сохранения. Mock data seed.
**Files/Areas:** `src/app/store/workspaceStore.ts`
**Links:** PRD (foundation), F-001, F-003, F-006, F-008

### T-005 — Mobile shell with BottomNav + MobileHeader
**Type:** impl | **Status:** done | **Owner:** AI
`MobileLayout`: header + `<Outlet>` + bottom navigation. Nav items: Сегодня, Поездки, Документы, События, Настройки.
**Files/Areas:** `src/shared/ui/layouts/MobileLayout.tsx`, `src/shared/ui/navigation/BottomNav.tsx`, `src/shared/ui/navigation/MobileHeader.tsx`
**Links:** PRD (UX/mobile-first), F-001, F-014

---

## Phase 1 — Workspace model + onboarding

### T-010 — Workspace model and mock data
**Type:** impl | **Status:** done | **Owner:** AI
Domain types: `Workspace`, `OrganizationProfile`, `EntityType`, `TaxMode`, `VehicleUsageModel`. Mock workspaces.
**Files/Areas:** `src/entities/types/domain.ts`, `src/entities/mocks/workspaces.ts`
**Features:** F-001

### T-011 — Onboarding wizard
**Type:** impl | **Status:** done | **Owner:** AI
7-шаговый wizard: EntityType → TaxMode → VehicleUsageModel → WorkspaceName → INN → VehicleModel → Summary. Режим перенастройки через `?ws=<id>` URL param.
**Files/Areas:** `src/features/onboarding/OnboardingWizard.tsx`, `src/features/onboarding/steps/*.tsx`
**Features:** F-002 | **User Stories:** US-001, US-002

### T-012 — Workspace switcher sheet
**Type:** impl | **Status:** done | **Owner:** AI
`WorkspaceSwitcher`: список workspace с active-check, переключение, добавить новый. Открывается из MobileHeader.
**Files/Areas:** `src/features/workspace/WorkspaceSwitcher.tsx`
**Features:** F-015 | **User Stories:** US-003

### T-013 — SettingsPage
**Type:** impl | **Status:** done | **Owner:** AI
Карточка текущего workspace, переименование (inline RenameSheet), список workspace, добавить новый, danger zone (reset config с подтверждением), блок аккаунта.
**Files/Areas:** `src/pages/SettingsPage.tsx`
**Features:** F-013 | **User Stories:** US-011

---

## Phase 2 — Trip flows

### T-020 — AddTripSheet
**Type:** impl | **Status:** done | **Owner:** AI
Bottom sheet с формой: откуда, куда, км, цель, дата. Валидация. Вызов `addTrip()`.
**Files/Areas:** `src/features/trips/AddTripSheet.tsx`
**Features:** F-003 | **User Stories:** US-004
**Acceptance:** поездка появляется в store после сохранения; дата по умолчанию — сегодня.

### T-021 — TripCard component
**Type:** impl | **Status:** done | **Owner:** AI
Полиморфный компонент: `button` если `onClick` передан, `div` если нет. Показывает маршрут (первое слово), км, цель, опционально дату.
**Files/Areas:** `src/features/trips/TripCard.tsx`
**Features:** F-004, F-005

### T-022 — TripsPage
**Type:** impl | **Status:** done | **Owner:** AI
Список поездок workspace, сортировка по дате. Счётчик + сумма км. Кнопка "Добавить". Пустое состояние.
**Files/Areas:** `src/pages/TripsPage.tsx`
**Features:** F-004 | **User Stories:** US-005

### T-023 — TodayPage
**Type:** impl | **Status:** done | **Owner:** AI
Журнал за сегодня: быстрые действия (Поездка + Чек-заглушка), список поездок за день, success banner. Reactive `justAdded` через `useEffect` + `useRef`.
**Files/Areas:** `src/pages/TodayPage.tsx`
**Features:** F-011 | **User Stories:** US-012

### T-024 — Global QuickTripContext
**Type:** impl | **Status:** done | **Owner:** AI
`QuickTripContext` через `<Outlet>` boundary. `QuickTripProvider` в MobileLayout. `AddTripSheet` — один экземпляр на весь shell.
**Files/Areas:** `src/features/trips/QuickTripContext.tsx`, `src/shared/ui/layouts/MobileLayout.tsx`
**Features:** F-003 | **Decisions:** D-003

---

## Phase 3 — Documents

### T-030 — Document model and mock data
**Type:** impl | **Status:** done | **Owner:** AI
`WorkspaceDocument`, `DocumentStatus`. Mock documents с разными статусами и templateKey.
**Files/Areas:** `src/entities/types/domain.ts`, `src/entities/mocks/events.ts`
**Features:** F-006, F-007

### T-031 — DocumentsPage
**Type:** impl | **Status:** done | **Owner:** AI
Группировка по статусу, прогресс-бар, DocCard с quick-mark-done, пустое состояние.
**Files/Areas:** `src/pages/DocumentsPage.tsx`
**Features:** F-006 | **User Stories:** US-007

### T-032 — DocumentDetailSheet
**Type:** impl | **Status:** done | **Owner:** AI
Bottom sheet: статус badge, дедлайн/готовность, help блоки, sticky footer с action buttons.
**Files/Areas:** `src/features/documents/DocumentDetailSheet.tsx`
**Features:** F-007 | **User Stories:** US-008

### T-033 — Document help config
**Type:** impl | **Status:** done | **Owner:** shared
`getDocumentHelp(templateKey)` — plain-language "Зачем нужен" / "Как подготовить" / tip для каждого шаблона документа.
**Files/Areas:** `src/entities/config/documentHelp.ts`
**Features:** F-007 | **Decisions:** D-006

---

## Phase 4 — Events + notifications

### T-040 — Event model and mock data
**Type:** impl | **Status:** done | **Owner:** AI
`WorkspaceEvent`, `EventType`, `severity`. Mock events с разными типами.
**Files/Areas:** `src/entities/types/domain.ts`, `src/entities/mocks/events.ts`
**Features:** F-008, F-009

### T-041 — EventsPage
**Type:** impl | **Status:** done | **Owner:** AI
Лента событий + штрафы (filter). EventDetailSheet при tapе. Context-aware empty state.
**Files/Areas:** `src/pages/EventsPage.tsx`
**Features:** F-008 | **User Stories:** US-009

### T-042 — EventDetailSheet
**Type:** impl | **Status:** done | **Owner:** AI
Bottom sheet: тип, severity badge, описание, дата. Auto-mark-read через `useEffect`.
**Files/Areas:** `src/features/events/EventDetailSheet.tsx`
**Features:** F-009 | **User Stories:** US-009

### T-043 — NotificationsSheet
**Type:** impl | **Status:** done | **Owner:** AI
Mini-feed непрочитанных событий. Tap → markEventRead + EventDetailSheet. Ссылка "Все события →".
**Files/Areas:** `src/features/events/NotificationsSheet.tsx`
**Features:** F-014 | **User Stories:** US-013

### T-044 — Unread badge в BottomNav
**Type:** impl | **Status:** done | **Owner:** AI
Красный badge на Bell в BottomNav. `useUnreadEventsCount()`. Cap 9+.
**Files/Areas:** `src/shared/ui/navigation/BottomNav.tsx`
**Features:** F-014 | **User Stories:** US-013

### T-045 — Emit trip_logged event
**Type:** impl | **Status:** done | **Owner:** AI
После `addTrip()` в AddTripSheet вызывается `addEvent()` с типом `trip_logged`.
**Files/Areas:** `src/features/trips/AddTripSheet.tsx`
**Features:** F-003, F-008

---

## Phase 5 — Home dashboard + detail flows

### T-050 — HomePage с attention layer
**Type:** impl | **Status:** done | **Owner:** AI
Config-strip, TodayCTA, MonthlyStats, AttentionSection (срочные docs + events), RecentTripsSection. Guard для ненастроенного workspace.
**Files/Areas:** `src/pages/HomePage.tsx`, `src/features/home/useHomeData.ts`
**Features:** F-010, F-012 | **User Stories:** US-010

### T-051 — TripDetailSheet на TodayPage и TripsPage
**Type:** impl | **Status:** done | **Owner:** AI
`selectedTrip: Trip | null` state. TripCard onClick. TripDetailSheet с delete flow.
**Files/Areas:** `src/pages/TodayPage.tsx`, `src/pages/TripsPage.tsx`, `src/features/trips/TripDetailSheet.tsx`
**Features:** F-005 | **User Stories:** US-006

### T-052 — DocumentDetailSheet из HomePage AttentionSection
**Type:** impl | **Status:** done | **Owner:** AI
`selectedDoc` state в HomePage. Tap на doc-карточку → DocumentDetailSheet без navigate.
**Files/Areas:** `src/pages/HomePage.tsx`
**Features:** F-007, F-012 | **User Stories:** US-008, US-010

### T-053 — TripDetailSheet из HomePage RecentTripsSection
**Type:** impl | **Status:** done | **Owner:** AI
`selectedTrip` state в HomePage. TripCard onClick в RecentTripsSection. TripDetailSheet без navigate.
**Files/Areas:** `src/pages/HomePage.tsx`
**Features:** F-005, F-010 | **User Stories:** US-006

---

## Phase 5.5 — QuickReceiptSheet + Attention rule engine

### T-080 — Add receipts to store
**Type:** impl | **Status:** done | **Owner:** AI
Добавить `receipts: Receipt[]` в `WorkspaceStore`. Экшн `addReceipt(receipt)`. Включить в `partialize` (persist). Инициализировать пустым массивом.
**Files/Areas:** `src/app/store/workspaceStore.ts`
**Links:** F-QR01, US-QR01
**Acceptance:** `addReceipt` сохраняет запись в store; `receipts` персистируется в localStorage.

### T-081 — QuickReceiptSheet component
**Type:** impl | **Status:** done | **Owner:** AI
Self-contained bottom sheet по паттерну AddTripSheet. Поля: сумма (required), категория (pill-select: топливо/парковка/ремонт/мойка/другое), дата (default today). Валидация: сумма > 0 обязательна. После сохранения вызывает `addReceipt()`.
**Files/Areas:** `src/features/receipts/QuickReceiptSheet.tsx` (новый)
**Links:** F-QR01, US-QR01
**Acceptance:** Sheet открывается/закрывается. Кнопка "Сохранить" неактивна без суммы. Чек попадает в store после сохранения.

### T-082 — Activate receipt button in TodayPage
**Type:** impl | **Status:** done | **Owner:** AI
Заменить пассивный div (opacity-50) на активную кнопку. Добавить `showReceiptSheet` state. Рендерить `QuickReceiptSheet` при открытии.
**Files/Areas:** `src/pages/TodayPage.tsx`
**Links:** F-QR01, US-QR01
**Acceptance:** Кнопка "Чек" кликабельна. Открывается `QuickReceiptSheet`. Убран badge "скоро".

### T-083 — Attention rule engine (attentionRules.ts)
**Type:** impl | **Status:** done | **Owner:** AI
Создать `src/features/home/attentionRules.ts`: тип `AttentionItem` с полями `id, kind, title, subtitle, severity, document?, event?`. Чистая функция `buildAttentionItems(docs, events)`. Сортировка: urgent выше warning; документы выше событий при равном severity.
**Files/Areas:** `src/features/home/attentionRules.ts` (новый)
**Links:** F-AT01, US-AT01
**Acceptance:** `buildAttentionItems([requiredDoc], [urgentEvent])` → массив из 2 элементов, doc первый. Empty docs/events → пустой массив.

### T-084 — Wire rule engine into useHomeData + HomePage
**Type:** impl | **Status:** done | **Owner:** AI
Обновить `useHomeData`: заменить `urgentDocs: WorkspaceDocument[]` и `urgentEvents: WorkspaceEvent[]` на `attentionItems: AttentionItem[]` через `buildAttentionItems()`. Обновить `HomePage/AttentionSection`: принимает `items: AttentionItem[]` + `onItemTap`. Dispatch: document → DocumentDetailSheet, event → navigate to events.
**Files/Areas:** `src/features/home/useHomeData.ts`, `src/pages/HomePage.tsx`
**Links:** F-AT01, F-012, US-AT01
**Acceptance:** HomePage рендерится без регрессий. AttentionSection показывает unified список. Tap на doc → sheet. Tap на event → EventsPage.

---

## Upcoming

### T-060 — Monthly trip report + clipboard export
**Type:** impl | **Status:** todo | **Owner:** AI
Bottom sheet на TripsPage или HomePage: сводка за месяц (поездки, км, список маршрутов). Кнопка "Скопировать отчёт" — в clipboard для отправки в бухгалтерию.
**Features:** F-016

### T-061 — Receipt capture flow
**Type:** impl | **Status:** todo | **Owner:** shared
Заменить заглушку "Чек" на TodayPage реальным flow.
**Links:** F-017
**Acceptance:** TBD при спецификации F-017. Минимум: пользователь может ввести сумму и категорию чека; запись появляется в store.

### T-070 — Backend integration
**Type:** impl | **Status:** todo | **Owner:** shared
Заменить Zustand mock-данные на API. Store actions остаются интерфейсом — только реализация меняется.
**Links:** PRD (Phase 8), D-004
**Acceptance:** Все компоненты работают без изменений после подключения API. `addTrip`, `updateDocumentStatus`, `markEventRead` выполняют реальные запросы с optimistic update или refetch.

### T-071 — Real auth
**Type:** impl | **Status:** todo | **Owner:** shared
Заменить `isAuthenticated: true` на реальный auth flow.
**Links:** PRD (Phase 9), F-001
**Acceptance:** Неавторизованный пользователь перенаправляется на login. После входа попадает в свой workspace. Session сохраняется между перезагрузками.

### T-072 — Billing / subscription
**Type:** impl | **Status:** todo | **Owner:** shared
Реализовать биллинговый flow: тарифные планы, оплата, управление подпиской.
**Links:** F-020, PRD (Phase 9)
**Acceptance:** TBD при спецификации F-020. `subscriptionStatus` пользователя отражает реальное состояние. Истёкшая подписка блокирует доступ к данным с понятным CTA.
