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

## Phase 5.6 — Receipt list + trip linking

### T-085 — Receipt selectors + store actions for linking
**Type:** impl | **Status:** done | **Owner:** AI
Добавить в store: `attachReceiptToTrip(receiptId, tripId)`, `detachReceiptFromTrip(receiptId)`. Добавить селекторы: `useWorkspaceReceipts`, `useTodayReceipts`, `useReceiptsByTrip`. Добавить `RECEIPT_CATEGORY_LABELS` в labels.ts.
**Files/Areas:** `src/app/store/workspaceStore.ts`, `src/entities/constants/labels.ts`
**Links:** F-QR02, US-QR02, US-QR03
**Acceptance:** `attachReceiptToTrip` обновляет `tripId` в store; `detachReceiptFromTrip` удаляет его. Селекторы возвращают корректно отфильтрованные receipts.

### T-086 — ReceiptDetailSheet component
**Type:** impl | **Status:** done | **Owner:** AI
Self-contained bottom sheet. Показывает: сумму, категорию, дату, комментарий. Секция привязки: если есть `tripId` — показывает маршрут поездки + "Отвязать". Если нет — "Не привязан" + кнопка "Привязать к поездке". По нажатию разворачивается inline список поездок workspace для выбора.
**Files/Areas:** `src/features/receipts/ReceiptDetailSheet.tsx` (новый)
**Links:** F-QR02, US-QR03
**Acceptance:** Tap "Привязать" → список поездок виден. Tap на поездку → `attachReceiptToTrip`, список схлопывается, показывается привязанная поездка. Tap "Отвязать" → `detachReceiptFromTrip`, возвращается "Не привязан".

### T-087 — Today's receipts section in TodayPage
**Type:** impl | **Status:** done | **Owner:** AI
Добавить секцию "Чеки сегодня" на TodayPage — только при наличии чеков за сегодня. Каждая карточка: сумма, категория, статус привязки. Tap → ReceiptDetailSheet.
**Files/Areas:** `src/pages/TodayPage.tsx`
**Links:** F-QR02, US-QR02
**Acceptance:** Секция появляется только если есть receipts за сегодня. Tap → ReceiptDetailSheet открывается. Нет чеков сегодня → секция не рендерится.

### T-088 — Linked receipts count in TripDetailSheet
**Type:** impl | **Status:** done | **Owner:** AI
Добавить в TripDetailSheet MetaRow с числом привязанных чеков через `useReceiptsByTrip(trip.id)`. Показывать только если count > 0.
**Files/Areas:** `src/features/trips/TripDetailSheet.tsx`
**Links:** F-QR02, US-QR03
**Acceptance:** TripDetailSheet с привязанными чеками показывает "Чеки: N". TripDetailSheet без чеков — строку не показывает.

---

## Phase 5.7 — Receipt history + spending analytics

### T-089 — useReceiptsForPeriod selector + buildReceiptAnalytics pure function
**Type:** impl | **Status:** done | **Owner:** AI
Добавить в `workspaceStore.ts` селектор `useReceiptsForPeriod(workspaceId, fromDate, toDate)` — фильтрует receipts по workspaceId и диапазону дат, сортирует новые сверху. Создать `src/features/receipts/receiptAnalytics.ts`: тип `ReceiptAnalytics { total: number, byCategory: Record<ReceiptCategory, number> }` и чистую функцию `buildReceiptAnalytics(receipts)` — считает итог и суммы по каждой категории.
**Files/Areas:** `src/app/store/workspaceStore.ts`, `src/features/receipts/receiptAnalytics.ts` (новый)
**Links:** F-QR03, US-QR04, US-QR05
**Acceptance:** `buildReceiptAnalytics([{amount:100, category:'fuel'}, {amount:50, category:'fuel'}])` → `{ total: 150, byCategory: { fuel: 150, ... } }`. `useReceiptsForPeriod` возвращает только записи в диапазоне дат, сортировка по убыванию даты.

### T-090 — ReceiptsPage component
**Type:** impl | **Status:** done | **Owner:** AI
Создать `src/pages/ReceiptsPage.tsx`. Страница (не sheet) с: заголовком "История чеков", подзаголовком "Последние 30 дней", аналитическим блоком (итого + по категориям), списком чеков (новые сверху), пустым состоянием. Tap на чек → `ReceiptDetailSheet`. Кнопка "Назад" через `navigate(-1)`.
**Files/Areas:** `src/pages/ReceiptsPage.tsx` (новый)
**Links:** F-QR03, US-QR04, US-QR05
**Acceptance:** Страница рендерится. При наличии чеков — виден блок аналитики + список. Empty state — когда чеков нет. Tap на чек → ReceiptDetailSheet работает.

### T-091 — Route + navigation entry point
**Type:** impl | **Status:** done | **Owner:** AI
Добавить маршрут `/w/:workspaceId/receipts` в `App.tsx`. Добавить ссылку "Все чеки →" на TodayPage — всегда видимая под быстрыми действиями. Когда секция "Чеки сегодня" показана — добавить "Все →" в заголовке секции.
**Files/Areas:** `src/app/App.tsx`, `src/pages/TodayPage.tsx`
**Links:** F-QR03, US-QR04, D-QR04
**Acceptance:** Переход на ReceiptsPage работает из TodayPage. Ссылка видна всегда (не только при наличии чеков сегодня). Маршрут корректно получает `workspaceId`.

### T-092 — Docs sync + decisions
**Type:** spec | **Status:** done | **Owner:** AI
Обновить docs: F-QR03 в features.md, US-QR04/US-QR05 в user-stories.md, T-089..T-092 в tasks.md, Phase 5.7 в plan.md, D-QR04/D-QR05 в decisions.md. Зафиксировать решение о размещении истории чеков (отдельная страница vs BottomNav) и о чистой аналитической функции.
**Files/Areas:** `docs/features.md`, `docs/user-stories.md`, `docs/tasks.md`, `docs/plan.md`, `docs/decisions.md`
**Links:** F-QR03, D-QR04, D-QR05
**Acceptance:** Все ID корректно прилинкованы. decisions.md содержит D-QR04 и D-QR05.

---

## Phase 5.8 — Period selector + unattached receipts attention

### T-093 — Period selector chips on ReceiptsPage
**Type:** impl | **Status:** done | **Owner:** AI
Заменить хардкоженный `PERIOD_DAYS = 30` на `useState<7 | 30 | 90>(30)`. Добавить segmented control (3 chips: «7 дней», «30 дней», «90 дней») под заголовком. Активный chip визуально выделен. Подзаголовок хедера и аналитический блок реагируют на выбор. Выбор — только local state, не сохраняется.
**Files/Areas:** `src/pages/ReceiptsPage.tsx`
**Links:** F-QR03, US-QR06
**Acceptance:** Переключение chips меняет список и аналитику без перезагрузки. Empty state корректен при 0 чеков за период. `tsc --noEmit` — 0 ошибок.

### T-094 — Extend attentionRules.ts: 'receipt' kind + unattached rule
**Type:** impl | **Status:** done | **Owner:** AI
Добавить `'receipt'` в `AttentionItemKind`. Расширить `buildAttentionItems(docs, events, unattachedReceipts: Receipt[] = [])` третьим параметром. Правило: если `unattachedReceipts.length > 0`, создать `AttentionItem` с `kind: 'receipt'`, `severity: 'warning'`, `title: 'Есть чеки без поездки'`, `subtitle: 'N чек(а/ов) за последние 7 дней'`.
**Files/Areas:** `src/features/home/attentionRules.ts`
**Links:** F-AT02, US-AT02
**Acceptance:** `buildAttentionItems([], [], [{tripId: undefined}])` → массив из 1 warning-элемента с kind='receipt'. `buildAttentionItems([], [], [])` → пустой массив. Существующие тесты на docs+events не ломаются.

### T-095 — Wire unattached receipts into useHomeData + HomePage
**Type:** impl | **Status:** done | **Owner:** AI
В `useHomeData`: добавить `useReceiptsForPeriod(workspaceId, 7 дней назад, сегодня)`, отфильтровать `!r.tripId`, передать в `buildAttentionItems`. В `HomePage.handleAttentionItemTap`: добавить ветку `kind === 'receipt'` → `navigate(/w/${id}/receipts)`. В `AttentionSection` (file-private в HomePage): добавить иконку Receipt для kind='receipt'.
**Files/Areas:** `src/features/home/useHomeData.ts`, `src/pages/HomePage.tsx`
**Links:** F-AT02, US-AT02
**Acceptance:** Если в store есть чек без tripId за последние 7 дней — AttentionSection на HomePage показывает warning. Tap → переходим на /receipts. Если чеков нет или все привязаны — карточка не появляется.

### T-096 — Docs sync + decisions
**Type:** spec | **Status:** done | **Owner:** AI
Обновить docs: F-QR03 (расширен period selector), F-AT02 (новый), US-QR06, US-AT02, T-093..T-096, Phase 5.8 в plan.md. Добавить D-QR06, D-AT02 в decisions.md.
**Files/Areas:** `docs/features.md`, `docs/user-stories.md`, `docs/tasks.md`, `docs/plan.md`, `docs/decisions.md`
**Links:** F-QR03, F-AT02, D-QR06, D-AT02
**Acceptance:** Все ID прилинкованы. Decisions содержат context/options/decision/consequences.

---

## Upcoming

### T-060 — Monthly trip report + clipboard export (Phase 6 parent)
**Type:** impl | **Status:** done | **Owner:** AI
MonthlyReportSheet на TripsPage: сводка за текущий месяц (поездки, км, список маршрутов). Кнопка "Скопировать отчёт" — в clipboard для отправки в бухгалтерию. Sub-tasks: T-097..T-099.
**Features:** F-016
**Links:** US-016, D-008

### T-097 — buildMonthlyTripReport pure function
**Type:** impl | **Status:** done | **Owner:** AI
Чистая функция `buildMonthlyTripReport(trips, monthLabel, workspaceName): string` в `tripReport.ts`. Форматирует список поездок в читаемый plain-text для clipboard export. Без хуков и side effects.
**Files/Areas:** `src/features/trips/tripReport.ts` (новый)
**Links:** F-016, US-016, D-008

### T-098 — MonthlyReportSheet component
**Type:** impl | **Status:** done | **Owner:** AI
Self-contained bottom sheet (паттерн D-007): drag handle, заголовок, скролируемый список поездок за месяц, sticky footer с кнопкой "Скопировать". Success state (2 сек). Clipboard fallback: textarea. Empty state при 0 поездок.
**Files/Areas:** `src/features/trips/MonthlyReportSheet.tsx` (новый)
**Links:** F-016, US-016, D-007, D-008

### T-099 — TripsPage — кнопка "Отчёт" + docs sync
**Type:** impl | **Status:** done | **Owner:** AI
Добавить кнопку "Отчёт" в header TripsPage (рядом с "Добавить"). Открывает MonthlyReportSheet через useState. Обновить docs: F-016 done, US-016, plan.md Phase 6, decisions.md D-008.
**Files/Areas:** `src/pages/TripsPage.tsx`, `docs/*`
**Links:** F-016, US-016

### T-061 — Receipt photo capture in QuickReceiptSheet
**Type:** impl | **Status:** done | **Owner:** AI
Добавить секцию фото в QuickReceiptSheet: `<input type="file" accept="image/*" capture="environment">`, предпросмотр, "Переснять"/"Удалить". `imageUrl` (object URL) сохраняется в receipt.
**Files/Areas:** `src/features/receipts/QuickReceiptSheet.tsx`
**Links:** F-017, US-017, D-009

### T-100 — ReceiptDetailSheet: отображение фото
**Type:** impl | **Status:** done | **Owner:** AI
Показать `receipt.imageUrl` в ReceiptDetailSheet с graceful fallback при onError. Раздел "Фото чека" скрывается при мёртвой ссылке (ephemeral object URL после перезагрузки).
**Files/Areas:** `src/features/receipts/ReceiptDetailSheet.tsx`
**Links:** F-017, US-017, D-009

### T-101 — Docs sync + decisions (Phase 7)
**Type:** spec | **Status:** done | **Owner:** AI
Обновить docs: F-017 done, US-017, T-061..T-101, Phase 7, D-009.
**Files/Areas:** `docs/*`
**Links:** F-017, D-009

### T-102 — buildMonthlyWaybillData pure function
**Type:** impl | **Status:** done | **Owner:** AI
Чистая функция `buildMonthlyWaybillData(input): MonthlyWaybillData` в `src/features/trips/waybillData.ts`. Принимает workspace, orgProfile, vehicleProfile, pre-filtered trips, fromDate, toDate. Возвращает типизированную структуру для будущего PDF/preview. Включает warnings и isExportReady. Без хуков, React, side effects.
**Files/Areas:** `src/features/trips/waybillData.ts` (новый)
**Links:** F-018, US-018, US-019, D-010, D-011
**Acceptance:** `tsc --noEmit` — 0 ошибок. `buildMonthlyWaybillData` возвращает корректный `MonthlyWaybillData` для всех граничных случаев: 0 поездок, нет vehicleProfile, нет orgProfile.

### T-103 — WaybillPreviewSheet
**Type:** impl | **Status:** done | **Owner:** AI
Bottom sheet с предпросмотром данных путевого листа: заголовок с periodLabel, summary card (org/vehicle/driver/INN), блок warnings (amber card), список строк-маршрутов, блок итогов, footer с disabled "Скачать PDF" если !isExportReady. VehicleProfile подключён в store (vehicleProfiles + useVehicleProfile selector). Кнопка "Путевой лист" добавлена в TripsPage рядом с "Отчёт". Placeholder feedback при нажатии на PDF-кнопку когда isExportReady=true (PDF не генерируется — T-104).
**Files/Areas:** `src/features/trips/WaybillPreviewSheet.tsx` (новый), `src/app/store/workspaceStore.ts`, `src/pages/TripsPage.tsx`
**Links:** F-018, US-018, US-019, T-102, D-007, D-010, D-011, D-012

### T-104 — Client-side PDF generator
**Type:** impl | **Status:** done | **Owner:** AI
Генерация PDF путевого листа на клиенте через `jsPDF` + `jspdf-autotable`. Функция `exportWaybillPdf(data: MonthlyWaybillData): Promise<void>` в `exportWaybillPdf.ts`. A4 portrait, русский текст через Roboto TTF из `/public/fonts/`. Шрифт кешируется в памяти. Таблица поездок + meta block + totals. Имя файла `putevoy-list-YYYY-MM.pdf`. Ошибки экспорта показываются inline в sheet, не крашат UI.
**Files/Areas:** `src/features/trips/exportWaybillPdf.ts` (новый), `public/fonts/Roboto-Regular.ttf` (новый), `src/features/trips/WaybillPreviewSheet.tsx` (обновлён)
**Links:** F-018, US-018, T-103, D-010, D-011, D-013

### T-105 — PDF template enhancement (waybill)
**Type:** impl | **Status:** done | **Owner:** AI
Доработка PDF-шаблона путевого листа до практически пригодного делового документа. Добавлено: ОГРН/ОГРНИП из `orgProfile.ogrn` (graceful omit если null), entityType-зависимые метки ("ИП"/"Организация", "ОГРНИП"/"ОГРН", "Индивидуальный предприниматель"/"Руководитель организации"), дата составления, section labels (РЕКВИЗИТЫ / СЛУЖЕБНЫЕ ПОЕЗДКИ / ПОДПИСИ), секция подписей с двумя строками + dateline + прямоугольник М.П., улучшены заголовки таблицы ("Маршрут следования", "Цель поездки", "Пробег, км"), км выровнен по правому краю. Derivation layer расширен: `organizationOgrn`, `entityType`, `fromDate` добавлены в `MonthlyWaybillData`. WaybillPreviewSheet обновлён: ОГРН/ОГРНИП показывается в summary card.
**Files/Areas:** `src/features/trips/waybillData.ts`, `src/features/trips/exportWaybillPdf.ts`, `src/features/trips/WaybillPreviewSheet.tsx`
**Links:** F-018, US-018, US-019, T-104, D-011

---

### T-070 — Backend foundation (Phase 8)
**Type:** impl | **Status:** done | **Owner:** AI
Supabase как backend foundation. Persistence layer под store; store actions сохраняют публичный интерфейс.
**Files/Areas:** `src/lib/supabase.ts`, `src/lib/db/repository.ts`, `src/lib/db/schema.sql`, `src/app/store/workspaceStore.ts`, `src/app/App.tsx`, `.env.example`
**Links:** D-004, D-014, D-015, D-016
**Acceptance:**
- App запускается без ошибок при отсутствии env vars (localStorage-only mode).
- При наличии env vars: `hydrateFromBackend()` загружает данные из Supabase на старте.
- `addTrip` / `addReceipt` / `addWorkspace` / `addOrgProfile` пишут в backend при наличии конфигурации.
- TypeScript noEmit — 0 ошибок.
- Все существующие flows (TripsPage, F-018, onboarding) работают без изменений в компонентах.

### T-106 — Supabase client + env setup
**Type:** impl | **Status:** done | **Owner:** AI
`src/lib/supabase.ts` — singleton клиент с null-fallback. `.env.example` с документацией переменных.
**Files/Areas:** `src/lib/supabase.ts`, `.env.example`
**Links:** T-070, D-014

### T-107 — DB schema + repository layer
**Type:** impl | **Status:** done | **Owner:** AI
`src/lib/db/schema.sql` — SQL migration для 5 entities. `src/lib/db/repository.ts` — typed data access с row mappers и bulk hydration.
**Files/Areas:** `src/lib/db/schema.sql`, `src/lib/db/repository.ts`
**Links:** T-070, D-014

### T-108 — Store backend integration
**Type:** impl | **Status:** done | **Owner:** AI
workspaceStore: добавлены `isSyncing`, `syncError`, `hydrateFromBackend`, `addVehicleProfile`, `updateVehicleProfile`. Write actions (workspaces, profiles, trips, receipts) делают optimistic local update + async backend call. Documents/events остаются local. App.tsx: dynamic root redirect + hydration on mount.
**Files/Areas:** `src/app/store/workspaceStore.ts`, `src/app/App.tsx`
**Links:** T-070, D-014, D-015, D-016

### T-071 — Real auth (Phase 9 — DONE)
**Type:** impl | **Status:** done | **Owner:** AI
Supabase email/password auth. Замена `ANON_USER_ID` хардкода на `auth.uid()`. RLS на 5 таблицах. ProtectedRoute. AuthPage. Logout в SettingsPage.
**Files/Areas:** `src/lib/supabase.ts`, `src/lib/db/repository.ts`, `src/lib/db/rls-policies.sql`, `src/app/store/workspaceStore.ts`, `src/app/App.tsx`, `src/features/auth/AuthPage.tsx`, `src/pages/SettingsPage.tsx`
**Links:** D-017, D-018, D-019, T-109, T-110, T-111
**Acceptance:**
- Без env vars: app работает в localStorage-only mode, авторизация не требуется.
- С env vars: неавторизованный пользователь → /auth. После signIn → workspace.
- signOut: очищает workspace данные, редиректит на /auth.
- TypeScript noEmit — 0 ошибок.

### T-109 — Auth store actions + error mapping
**Type:** impl | **Status:** done | **Owner:** AI
`signIn`, `signUp`, `signOut`, `setAuthUser` в workspaceStore. `mapAuthErrorMessage()` переводит Supabase errors на русский. `authUserId`, `authChecked` state. `EMPTY_WORKSPACE_STATE` при logout.
**Files/Areas:** `src/app/store/workspaceStore.ts`
**Links:** T-071, D-017, D-018, D-019

### T-110 — AuthPage + ProtectedRoute
**Type:** impl | **Status:** done | **Owner:** AI
`src/features/auth/AuthPage.tsx` — mobile-first, две вкладки (Войти / Создать аккаунт), email + password. `ProtectedRoute` в App.tsx: spinner пока `!authChecked`, redirect на /auth если `!isAuthenticated`. `subscribeToAuthChanges` в App.useEffect вместо `hydrateFromBackend`.
**Files/Areas:** `src/features/auth/AuthPage.tsx`, `src/app/App.tsx`
**Links:** T-071, D-017, D-018

### T-111 — RLS policies + logout in SettingsPage
**Type:** impl | **Status:** done | **Owner:** AI
`src/lib/db/rls-policies.sql` — owner-only RLS для workspaces (user_id = auth.uid()) и child tables via EXISTS. Кнопка "Выйти из аккаунта" в SettingsPage, только если `isBackendConfigured`.
**Files/Areas:** `src/lib/db/rls-policies.sql`, `src/pages/SettingsPage.tsx`
**Links:** T-071, D-017, D-019

### T-072 — Billing / subscription
**Type:** impl | **Status:** todo | **Owner:** shared
Реализовать биллинговый flow: тарифные планы, оплата, управление подпиской.
**Links:** F-020, PRD (Phase 9)
**Acceptance:** TBD при спецификации F-020. `subscriptionStatus` пользователя отражает реальное состояние. Истёкшая подписка блокирует доступ к данным с понятным CTA.

### T-112 — Phase 10: documents + events schema + RLS
**Type:** impl | **Status:** done | **Owner:** AI
Таблицы `documents` и `events` добавлены в `schema.sql`. RLS policies (owner via workspace join) добавлены в `rls-policies.sql`.
**Files/Areas:** `src/lib/db/schema.sql`, `src/lib/db/rls-policies.sql`
**Links:** F-006, F-007, F-008

### T-113 — Phase 10: documentRepo + eventRepo + store wiring
**Type:** impl | **Status:** done | **Owner:** AI
Добавлены `documentRepo` (listByUser, upsert, updateStatus, bulkUpsert) и `eventRepo` (listByUser, insert, markRead) в `repository.ts`. `fetchAllUserData` расширён — включает documents + events. Store: hydration, `updateDocumentStatus`, `addEvent`, `markEventRead` теперь синхронизируются с backend.
**Files/Areas:** `src/lib/db/repository.ts`, `src/app/store/workspaceStore.ts`
**Links:** F-006, F-007, F-008, T-112

### T-114 — Subscriptions table + RLS (schema)
**Type:** impl | **Status:** done | **Owner:** AI
`schema.sql`: таблица `subscriptions` (id, workspace_id FK unique, plan_code, status, stripe_customer_id, stripe_subscription_id, current_period_end, timestamps). `rls-policies.sql`: owner-only RLS via workspaces join.
**Files/Areas:** `src/lib/db/schema.sql`, `src/lib/db/rls-policies.sql`
**Links:** F-020, D-020, D-021
**Acceptance:** таблица создаётся без ошибок в Supabase. RLS запрещает доступ к чужим записям.

### T-115 — WorkspaceSubscription domain type
**Type:** impl | **Status:** done | **Owner:** AI
`domain.ts`: добавлены `PlanCode` ('free' | 'pro'), `SubscriptionPaymentStatus`, `WorkspaceSubscription` interface.
**Files/Areas:** `src/entities/types/domain.ts`
**Links:** F-020, T-114

### T-116 — subscriptionRepo + fetchAllUserData extension
**Type:** impl | **Status:** done | **Owner:** AI
`repository.ts`: `SubscriptionRow`, mappers, `subscriptionRepo` (getByWorkspace, listByUser, upsert). `HydratedUserData` расширён полем `subscriptions`. `fetchAllUserData` загружает подписки параллельно.
**Files/Areas:** `src/lib/db/repository.ts`
**Links:** F-020, T-114, T-115

### T-117 — billingService.ts (Stripe Checkout facade)
**Type:** impl | **Status:** done | **Owner:** AI
`src/lib/billing/billingService.ts`: `createCheckoutSession(workspaceId, returnBaseUrl)`. В backend-режиме вызывает Supabase Edge Function `create-checkout-session`. В mock-режиме возвращает `{ isMockMode: true }`. Все ошибки маппятся в русскоязычные строки.
**Files/Areas:** `src/lib/billing/billingService.ts`
**Links:** F-020, D-020
**Acceptance:** Stripe secret key не присутствует в клиентском коде. В mock-режиме UI симулирует активацию.

### T-118 — workspaceStore: subscriptions state + billing actions + selectors
**Type:** impl | **Status:** done | **Owner:** AI
`workspaceStore.ts`: `subscriptions: WorkspaceSubscription[]` в state, EMPTY_WORKSPACE_STATE, initial state, hydration, persist. Actions: `setSubscription`, `refreshSubscription`, `activateDevProSubscription`. Selectors: `useWorkspaceSubscription`, `useIsProWorkspace`.
**Files/Areas:** `src/app/store/workspaceStore.ts`
**Links:** F-020, T-116

### T-119 — BillingSection в SettingsPage
**Type:** impl | **Status:** done | **Owner:** AI
SettingsPage: новый `BillingSection` компонент. Показывает тариф, статус, список Pro-функций (для Free), CTA «Перейти на Pro» / «Управлять подпиской». Обрабатывает `?billing=success/cancel` URL params. В dev-режиме — кнопка симуляции. Все тексты на русском.
**Files/Areas:** `src/pages/SettingsPage.tsx`
**Links:** F-020, US-B01, T-117, T-118

### T-120 — Feature gate: PDF export (WaybillPreviewSheet)
**Type:** impl | **Status:** done | **Owner:** AI
`WaybillPreviewSheet.tsx`: проверяет `useIsProWorkspace(workspaceId)`. Для Free-workspace — показывает `PdfPaywall` компонент вместо кнопки «Скачать PDF». Paywall: иконка замка, объяснение, CTA «Перейти на Pro» → navigate к SettingsPage с `?upgrade=1`.
**Files/Areas:** `src/features/trips/WaybillPreviewSheet.tsx`
**Links:** F-020, F-018, US-B02

### T-121 — Billing return URL handling + Stripe redirect flow
**Type:** impl | **Status:** done | **Owner:** AI
SettingsPage читает `?billing=success` → вызывает `refreshSubscription`, показывает success banner. `?billing=cancel` → показывает cancel notice. `?upgrade=1` → scroll к billing-section. URL params очищаются через `setSearchParams` (no history push).
**Files/Areas:** `src/pages/SettingsPage.tsx`
**Links:** F-020, US-B01, T-117

---

## Phase 12 — Edge Functions (production billing backend)

### T-122 — Edge Function: create-checkout-session
**Type:** impl | **Status:** done | **Owner:** AI
Supabase Edge Function (Deno). Принимает POST `{ workspaceId, successUrl, cancelUrl }`. Проверяет auth (JWT) и ownership workspace. Создаёт или переиспользует Stripe Customer. Создаёт Stripe Checkout Session (mode: subscription, Pro price). Пресохраняет `stripe_customer_id` в `subscriptions`. Возвращает `{ url }`. Ошибки: только безопасные формулировки наружу, детали в логах.
**Files/Areas:** `supabase/functions/create-checkout-session/index.ts`, `supabase/functions/_shared/cors.ts`
**Links:** F-020, D-020, D-021, T-117
**Acceptance:**
- Вызов с валидным JWT + workspaceId → возвращает `{ url: "https://checkout.stripe.com/..." }`.
- Вызов без JWT → 401.
- Вызов с чужим workspaceId → 403.
- Workspace уже Pro → возвращает `{ alreadyPro: true }`.
- `STRIPE_SECRET_KEY` не попадает в клиентский код.

### T-123 — Edge Function: stripe-webhook
**Type:** impl | **Status:** done | **Owner:** AI
Supabase Edge Function (Deno). Принимает raw webhook от Stripe. Валидирует подпись через `STRIPE_WEBHOOK_SECRET`. Обрабатывает: `checkout.session.completed` (upgrade workspace to Pro), `customer.subscription.updated` (sync status, period_end), `customer.subscription.deleted` (downgrade to Free/canceled). Пишет в `subscriptions` через service role key. При невалидной подписи → 400 (не retry). При ошибке БД → 500 (Stripe retry).
**Files/Areas:** `supabase/functions/stripe-webhook/index.ts`
**Links:** F-020, D-020, T-122
**Acceptance:**
- `checkout.session.completed` с корректным payload → `subscriptions` updated, plan_code='pro'.
- Невалидная подпись → 400, никаких изменений в БД.
- `subscription.deleted` → plan_code='free', status='canceled'.
- Локальное тестирование: `stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook`.

---

## Phase 13 — Pro Analytics Block (второй Pro gate)

### T-124 — Pro Analytics Block на ReceiptsPage
**Type:** impl | **Status:** done | **Owner:** AI
Второй Pro gate: расширенная аналитика расходов на ReceiptsPage. Pro-пользователь видит дополнительный блок: средний чек, кол-во чеков, тренд vs предыдущий период (%), прогресс-бары по категориям с % и кол-вом. Free-пользователь видит paywall с заблюренным превью и CTA «Перейти на Pro». Базовый блок (итого + список категорий) остаётся доступен для всех.
**Files/Areas:**
- `src/features/receipts/receiptAnalytics.ts` — добавлены `CategoryStat`, `EnhancedAnalytics`, `buildEnhancedAnalytics(current, previous)`
- `src/pages/ReceiptsPage.tsx` — `ProAnalyticsBlock`, `TrendBadge`, `CategoryBar`, `AnalyticsPaywall`
**Links:** F-020, F-QR03
**Acceptance:**
- Pro: блок «Аналитика Pro» виден с prогресс-барами и трендом.
- Free: paywall с заблюренным превью, кнопка → SettingsPage с `?upgrade=1`.
- Тренд: «На X% больше/меньше расходов, чем N дней назад» (null если нет данных за прошлый период).
- TypeScript noEmit — 0 ошибок.

---

## Phase 14 — Stripe Customer Portal

### T-125 — Edge Function create-portal-session + SettingsPage integration
**Type:** impl | **Status:** done | **Owner:** AI
Supabase Edge Function (Deno). Принимает POST `{ workspaceId, returnUrl }` с auth. Верифицирует JWT, проверяет ownership workspace, достаёт `stripe_customer_id` из `subscriptions`, создаёт Stripe Billing Portal session, возвращает `{ url }`. Ошибка если нет активной Pro-подписки или нет `stripe_customer_id`. `billingService.ts` — добавлена `createPortalSession()`. `SettingsPage.handleManageSubscription` — теперь вызывает портал с редиректом; в dev-режиме — fallback на `refreshSubscription`.
**Files/Areas:**
- `supabase/functions/create-portal-session/index.ts` (новый)
- `src/lib/billing/billingService.ts` — `PortalResult`, `createPortalSession()`
- `src/pages/SettingsPage.tsx` — `handleManageSubscription` обновлён
**Links:** F-020, T-118, T-119
**Acceptance:**
- Pro + backend: «Управлять подпиской» → редирект на Stripe Billing Portal.
- Dev-режим: кнопка выполняет `refreshSubscription`, ошибок нет.
- Нет `stripe_customer_id` → 404 с понятным русским сообщением.
- TypeScript noEmit — 0 ошибок.

---

## Phase 15 — Help layer

### T-126 — Help layer для onboarding и SettingsPage
**Type:** impl | **Status:** done | **Owner:** AI
Добавлен справочный контент plain-language: info-cards на шагах wizard'а (EntityType, VehicleModel, Summary) и секция «Справка по документам» на SettingsPage. Контент в `onboardingHelp.ts` (5 разделов: ENTITY_TYPE, VEHICLE_DOCS, PRE_TRIP, STORAGE, WAYBILL_VS_ROUTE), рендер через переиспользуемый `HelpInfoSheet` поверх существующего `BottomSheet`.
**Files/Areas:**
- `src/entities/config/onboardingHelp.ts` (новый) — типы `HelpContent`/`HelpSection` + 5 разделов
- `src/shared/ui/components/HelpInfoSheet.tsx` (новый) — bottom sheet с заголовком, лидом, секциями (info/warning), footnote
- `src/features/onboarding/steps/EntityTypeStep.tsx` — info-card «Чем отличаются ИП и ООО для документов?»
- `src/features/onboarding/steps/VehicleModelStep.tsx` — info-card «Какие документы нужны при каждом варианте?»
- `src/features/onboarding/steps/SummaryStep.tsx` — info-card «Как правильно оформить поездку»
- `src/pages/SettingsPage.tsx` — секция «Справка по документам» с двумя пунктами
**Features:** F-021 | **User Stories:** US-001, US-002, US-011
**Acceptance:**
- На шаге EntityType виден синий info-card с открытием bottom sheet про требования к медосмотру/техосмотру.
- На шаге VehicleModel дополнительный info-card про документы по каждой схеме (рядом с существующим «Сравнить все»).
- На шаге Summary info-card про правильное заполнение маршрута до выезда (одометр, медосмотр, техосмотр).
- В SettingsPage перед «Опасной зоной» секция «Справка по документам» с двумя пунктами.
- Все тексты на русском, без юр-жаргона. Help не блокирует wizard.
- TypeScript noEmit — 0 ошибок.

---

## Phase 16 — 9-screen IA reshape (Phase A)

### T-127 — BottomNav: 4 вкладки
**Type:** impl | **Status:** in_progress | **Owner:** AI
Сократить нижнюю навигацию с 6 пунктов до 4: Сегодня (→/home) · Поездки (→/trips) · Отчёты (→/analytics) · Настройки (→/settings).
**Files/Areas:** `src/shared/ui/navigation/BottomNav.tsx`
**Features:** F-022

### T-128 — Редиректы старых роутов
**Type:** impl | **Status:** planned | **Owner:** AI
`/documents` → `/settings`, `/receipts` → `/trips?mode=receipts`, `/today` → `/home`. Старые URL открываются без 404.
**Files/Areas:** роутер
**Features:** F-022

### T-129 — NotificationsPage (бывшая EventsPage)
**Type:** impl | **Status:** planned | **Owner:** AI
Переименование EventsPage → NotificationsPage. Доступ только через 🔔 в MobileHeader, не из нав.
**Files/Areas:** `src/pages/EventsPage.tsx`, роутер
**Features:** F-022

### T-130 — Документы предприятия в SettingsPage
**Type:** impl | **Status:** planned | **Owner:** AI
Перенести одноразовые документы предприятия (приказы, договоры) из DocumentsPage в новую секцию SettingsPage.
**Files/Areas:** `src/pages/SettingsPage.tsx`, `src/features/documents/*`
**Features:** F-022

### T-131 — Документы поездки в TripDetailSheet
**Type:** impl | **Status:** planned | **Owner:** AI
Перенести «документы конкретной поездки» (путевой/маршрутный лист) в TripDetailSheet.
**Files/Areas:** `src/features/trips/TripDetailSheet.tsx`
**Features:** F-022

### T-132 — Удаление DocumentsPage из роутов
**Type:** impl | **Status:** planned | **Owner:** AI
После T-130/T-131 убрать `/documents` роут (оставить редирект).
**Features:** F-022

### T-133 — TripsPage режим «Чеки»
**Type:** impl | **Status:** planned | **Owner:** AI
Переключатель «Поездки / Чеки» в TripsPage. В режиме «Чеки» — содержимое бывшего ReceiptsPage.
**Files/Areas:** `src/pages/TripsPage.tsx`, `src/pages/ReceiptsPage.tsx`
**Features:** F-022

### T-134 — TodayPage → HomePage объединение
**Type:** impl | **Status:** planned | **Owner:** AI
Первый таб = «Сегодня» = `/home`. TodayPage становится редиректом на /home.
**Files/Areas:** `src/pages/HomePage.tsx`, `src/pages/TodayPage.tsx`
**Features:** F-022

### T-135 — TypeScript + smoke-тест + редеплой
**Type:** verify | **Status:** planned | **Owner:** AI
TS clean. Smoke: создать поездку → закрыть → 4 таба без regression. Мёрдж в master.
**Features:** F-022
**Acceptance:**
- 4 вкладки открываются
- Старые роуты редиректят
- Документы предприятия в Настройках; документы поездки в TripDetailSheet
- TypeScript 0 ошибок
