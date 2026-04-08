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
