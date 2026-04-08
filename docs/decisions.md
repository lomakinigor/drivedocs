# Decisions — drivedocs

Decision log / ADR-lite. Фиксирует реально принятые архитектурные и продуктовые решения.

**Правило:** любое изменение архитектуры или значимого UX-паттерна фиксируется здесь до кода.

Format:
- **Context:** почему встал вопрос
- **Options:** что рассматривалось
- **Decision:** что выбрали
- **Consequences:** что из этого следует
- **Links:** связанные docs/features/tasks

---

## D-001 — Mobile-first как основной UX-принцип

- **Date:** 2026-03-01
- **Context:** Целевой пользователь — ИП или руководитель ООО, который работает с телефона в короткие сессии: стоя у машины, между встречами. Desktop — вторичная платформа, если вообще нужна.
- **Options:**
  1. Desktop-first, адаптивный для мобильного
  2. Mobile-first web app
  3. Native iOS/Android
- **Decision:** Mobile-first web app (PWA-compatible, но без Service Worker в MVP). Все экраны проектируются под экран телефона: `max-w-md`, bottom navigation, bottom sheets, крупные touch-targets.
- **Consequences:**
  - Нет сложных таблиц и боковых панелей.
  - Все detail-views — через bottom sheet, а не новый экран (→ D-005).
  - BottomNav с 5 разделами — основная навигация.
  - Native app (iOS/Android) — Non-goal для MVP (см. PRD Non-goals).
- **Links:** PRD (Goals, Non-goals), F-001..F-015

---

## D-002 — Multi-workspace model: один аккаунт, несколько предприятий

- **Date:** 2026-03-01
- **Context:** Пользователь может иметь ИП и ООО одновременно, или несколько ООО. Каждое предприятие требует отдельной конфигурации (тип, налоговый режим, документы).
- **Options:**
  1. Один workspace на аккаунт
  2. Несколько workspace, данные изолированы
- **Decision:** Multi-workspace модель. Каждый workspace независим: своя конфигурация (`entityType`, `taxMode`, `vehicleUsageModel`), свои поездки, документы, события. Все роуты и store-селекторы явно принимают `workspaceId`.
- **Consequences:**
  - URL: `/w/:workspaceId/*` — workspaceId всегда в пути.
  - Все store-селекторы фильтруют по `workspaceId`.
  - `WorkspaceSwitcher` — обязательный UI-элемент.
  - Нет "глобальных" поездок или документов вне workspace.
- **Links:** F-001, F-013, F-015, T-003, T-010

---

## D-003 — Глобальный AddTripSheet через QuickTripContext в MobileLayout

- **Date:** 2026-03-15
- **Context:** Запись поездки — самое частое действие. Пользователь должен иметь возможность добавить поездку с любого экрана без переходов.
- **Options:**
  1. Отдельная страница `/w/:id/add-trip`
  2. Кнопка на каждой странице открывает локальный sheet
  3. Один sheet-экземпляр в MobileLayout, доступный через Context
- **Decision:** Вариант 3. `QuickTripContext` провайдится в `MobileLayout`. `AddTripSheet` существует в одном экземпляре на всю shell. Любой компонент вызывает `useOpenQuickTrip()` для открытия.
- **Consequences:**
  - Sheet не дублируется между страницами.
  - Пользователь остаётся на текущем экране после добавления.
  - `TodayPage` отслеживает добавление через `useEffect` на длину списка поездок — shows success banner.
- **Links:** F-003, T-024, US-004

---

## D-004 — Store actions как интерфейс для будущей API-интеграции

- **Date:** 2026-04-07
- **Context:** MVP работает на mock-данных в Zustand + localStorage. Когда появится backend, нужно подключить API без переписывания компонентов.
- **Options:**
  1. Компоненты напрямую делают fetch, рефакторинг при подключении API
  2. Store actions (`addTrip`, `updateDocumentStatus`, `markEventRead`) — единственная точка мутации; реализация меняется, интерфейс остаётся
- **Decision:** Вариант 2. Все компоненты вызывают только store actions. При backend-интеграции (T-070) только реализация actions меняется (mock mutation → API call + optimistic update или refetch). Компоненты не трогаем.
- **Consequences:**
  - Компоненты изолированы от транспорта.
  - Store — единственная точка правды о состоянии данных.
  - Оптимистичные обновления будут реализованы на уровне store, не компонентов.
- **Links:** T-070, tech-spec (State management section)

---

## D-005 — Bottom sheets для detail-view вместо отдельных страниц

- **Date:** 2026-03-15
- **Context:** Просмотр деталей поездки, документа, события — стандартный mobile UX. Два подхода: push новой страницы в роутере, или overlay sheet поверх текущего экрана.
- **Options:**
  1. Роутинг: `/w/:id/trips/:tripId`, `/w/:id/documents/:docId` и т.д.
  2. Bottom sheet поверх текущего экрана (без навигации)
- **Decision:** Bottom sheet для всех detail-view. `TripDetailSheet`, `DocumentDetailSheet`, `EventDetailSheet` — это overlay-компоненты с state в родительской странице (`selectedTrip`, `selectedDoc`, `selectedEvent`).
- **Consequences:**
  - Нет навигации назад — Sheet закрывается тапом на backdrop или кнопкой.
  - Пользователь остаётся контекстно на той странице, откуда открыл.
  - `DocumentDetailSheet` открывается и с `DocumentsPage`, и с `HomePage` — без роутинга.
  - URL не меняется при открытии detail — нет deep-link на конкретную поездку/документ в MVP.
- **Links:** F-005, F-007, F-009, T-051, T-052, T-053, US-006, US-008, US-009

---

## D-006 — Статический documentHelp.ts вместо серверного конфига

- **Date:** 2026-03-20
- **Context:** `DocumentDetailSheet` должен показывать plain-language объяснения ("Зачем нужен", "Как подготовить") для каждого шаблона документа. Данные могут быть серверными или статическими.
- **Options:**
  1. API-эндпоинт для получения help-контента по templateKey
  2. Статический TS-файл `documentHelp.ts` с `getDocumentHelp(templateKey)` функцией
- **Decision:** Вариант 2 для MVP. `documentHelp.ts` — статический конфиг. Легко расширяется, не требует API, TypeScript-типизирован.
- **Consequences:**
  - Обновление help-текстов = деплой (нет hot-update).
  - Приемлемо для MVP; post-MVP можно вынести на сервер без изменения компонентов.
  - `getDocumentHelp(templateKey)` возвращает `{ why, how, tip? }` или `undefined`.
- **Links:** F-007, T-033

---

## D-QR01 — Receipt хранится в основном Zustand store (не отдельный localStorage ключ)

- **Date:** 2026-04-08
- **Context:** QuickReceiptSheet сохраняет чеки. Вопрос: куда — в основной `workspaceStore` или отдельный store / localStorage?
- **Options:**
  1. Отдельный Zustand store (`receiptStore`)
  2. В основной `workspaceStore` как `receipts: Receipt[]`
- **Decision:** Вариант 2. `receipts[]` добавлен в `workspaceStore` рядом с `trips[]`, `documents[]`, `events[]`. Персистируется через `partialize` вместе с остальными данными. `addReceipt` — стандартный action.
- **Consequences:**
  - Receipts изолированы по `workspaceId` так же, как trips и documents.
  - Единый store — проще рефакторинг при подключении backend (D-004 применимо).
  - При росте объёма данных можно перенести receipts в отдельный store без изменения компонентов.
- **Links:** F-QR01, T-080, US-QR01

---

## D-QR02 — Receipt list живёт на TodayPage, не на отдельном экране

- **Date:** 2026-04-08
- **Context:** Нужно показать список чеков. Варианты: отдельная страница в BottomNav, страница ReceiptsPage, секция на TodayPage, секция на TripsPage.
- **Options:**
  1. Отдельная страница ReceiptsPage в BottomNav
  2. Секция на TodayPage (чеки за сегодня)
  3. Секция на TripsPage (чеки без привязки)
- **Decision:** Вариант 2. Чеки за сегодня — на TodayPage рядом с поездками за сегодня. Логика: пользователь добавляет чек в контексте текущего дня — там же его видит. Отдельная страница оправдана после появления истории чеков (F-017).
- **Consequences:**
  - TodayPage = "дневник за сегодня": поездки + чеки + быстрые действия.
  - Чеки за прошлые дни не видны без отдельного экрана (это ограничение MVP, приемлемо).
  - При росте потребности — добавить ReceiptsPage без изменения TodayPage.
- **Links:** F-QR02, T-087, US-QR02

---

## D-QR03 — Привязка чека к поездке через inline list в ReceiptDetailSheet

- **Date:** 2026-04-08
- **Context:** Нужен flow для выбора поездки при привязке чека. Варианты: отдельный экран, вложенный sheet, inline список внутри ReceiptDetailSheet.
- **Options:**
  1. Отдельная страница "Выбор поездки"
  2. Вложенный bottom sheet поверх ReceiptDetailSheet
  3. Inline expand: список поездок разворачивается внутри того же sheet
- **Decision:** Вариант 3. Tap "Привязать к поездке" → `pickingTrip: true` state → показывается прокручиваемый список поездок workspace. Tap на поездку → `attachReceiptToTrip`, список схлопывается. Соответствует D-005 (detail-views через sheets) и D-001 (mobile-first, без лишних переходов).
- **Consequences:**
  - Sheet становится выше при разворачивании списка — ограничен `max-h-[85dvh]`.
  - Нет вложенных overlays — упрощает стек.
  - При большом количестве поездок список прокручивается внутри sheet.
- **Links:** F-QR02, T-086, US-QR03, D-005

---

## D-AT01 — Rule engine как чистая функция, а не hook

- **Date:** 2026-04-08
- **Context:** Логика "что показать в AttentionSection" была размазана: `useUrgentDocuments` + `useUrgentEvents` в store, объединение в `useHomeData`, рендер в `AttentionSection`. Нужно централизовать.
- **Options:**
  1. Хук `useAttentionItems(workspaceId)` — вызывает store-селекторы внутри себя
  2. Чистая функция `buildAttentionItems(docs, events)` — принимает данные, возвращает `AttentionItem[]`
- **Decision:** Вариант 2. `buildAttentionItems` в `attentionRules.ts` — чистая функция без хуков. `useHomeData` получает данные из store-селекторов и передаёт их в `buildAttentionItems`. `HomeData` возвращает `attentionItems: AttentionItem[]`.
- **Consequences:**
  - Логика правил тестируема без React-окружения (unit test — просто `buildAttentionItems([], [])`)
  - Расширение — добавить новый тип items = добавить блок в `attentionRules.ts`, без правок в `useHomeData` или `HomePage`
  - `AttentionSection` теперь принимает `items: AttentionItem[]` + `onItemTap` — не знает про документы и события по отдельности
- **Links:** F-AT01, T-083, T-084, US-AT01, tech-spec

---

## D-QR04 — ReceiptsPage как отдельная страница, не пункт BottomNav

- **Date:** 2026-04-08
- **Context:** История чеков требует отдельного экрана. BottomNav уже содержит 5 пунктов (Сегодня, Поездки, Документы, События, Настройки). Добавление 6-го нарушит mobile-first UX (слишком много элементов).
- **Options:**
  1. Добавить "Чеки" в BottomNav (6-й пункт)
  2. Отдельная страница, доступная только через ссылку из TodayPage
  3. Расширить TodayPage — показывать историю прямо там прокруткой
- **Decision:** Вариант 2. `ReceiptsPage` — полноэкранная страница на маршруте `/w/:workspaceId/receipts`. Точка входа: ссылка "Все чеки →" на TodayPage. В BottomNav не добавляется. Когда появится отдельный receipt-управляемый flow (F-017), ReceiptsPage можно "поднять" в навигацию.
- **Consequences:**
  - BottomNav остаётся 5-пунктовым.
  - `receipts` — дополнительный маршрут в App.tsx, вложенный в `/w/:workspaceId`.
  - Навигация назад через `navigate(-1)` — кнопка "←" в заголовке страницы.
  - URL: `/w/:workspaceId/receipts`.
- **Links:** F-QR03, T-091, US-QR04

---

## D-QR05 — Аналитика чеков как чистая функция (по аналогии с D-AT01)

- **Date:** 2026-04-08
- **Context:** ReceiptsPage должна показывать суммы по категориям. Можно вычислять инлайн в компоненте или вынести в отдельную функцию.
- **Options:**
  1. Вычислять агрегаты прямо в JSX/component body
  2. Чистая функция `buildReceiptAnalytics(receipts)` в `receiptAnalytics.ts`
- **Decision:** Вариант 2. `buildReceiptAnalytics(receipts): ReceiptAnalytics` — чистая функция без хуков, по аналогии с `buildAttentionItems` (D-AT01). Возвращает `{ total: number, byCategory: Record<ReceiptCategory, number> }`. Компонент вызывает функцию с уже полученными receipts.
- **Consequences:**
  - Логика агрегирования тестируема отдельно от React.
  - При добавлении новых категорий — меняется только функция и тип.
  - Нет overhead: вычисляется на небольшом массиве, без мемоизации в MVP.
- **Links:** F-QR03, T-089, US-QR05, D-AT01

---

## D-007 — Self-contained bottom sheet компоненты (без shared BottomSheet wrapper)

- **Date:** 2026-03-15
- **Context:** Несколько bottom sheets в приложении (AddTripSheet, TripDetailSheet, DocumentDetailSheet, EventDetailSheet, NotificationsSheet, WorkspaceSwitcher). Вопрос: один shared компонент-обёртка или каждый sheet самодостаточен.
- **Options:**
  1. Shared `<BottomSheet>` компонент с portal + управлением через props
  2. Каждый sheet сам управляет своим backdrop (`fixed inset-0`) и анимацией
- **Decision:** Вариант 2. Каждый sheet компонент рендерит свой `fixed inset-0 z-50 bg-black/40` backdrop и `fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl` контейнер.
- **Consequences:**
  - Больше дублирования разметки, но проще кастомизировать каждый sheet (разная высота, sticky footer и т.д.).
  - Нет prop-drilling через shared wrapper.
  - Нет portal-сложности.
  - При необходимости shared компонент `BottomSheet.tsx` существует в `shared/ui/components/` как опциональный строительный блок (не обязателен к использованию).
- **Links:** tech-spec (Bottom sheet pattern), F-005, F-007, F-009, F-014
