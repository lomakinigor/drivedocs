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

## D-QR06 — Period selector как локальный state компонента (не URL, не store)

- **Date:** 2026-04-08
- **Context:** ReceiptsPage показывает чеки за N дней. Нужно хранить выбранный период: 7/30/90. Варианты: URL query param, Zustand store, local state компонента.
- **Options:**
  1. URL query param `?days=30` — позволяет deep-link на конкретный период
  2. Zustand store — персистирует выбор между сессиями
  3. Local `useState` в ReceiptsPage — сбрасывается при навигации
- **Decision:** Вариант 3. Local state. Период — это UI-предпочтение в рамках одного визита на страницу, не бизнес-данные. URL-чистота важнее deep-link на период для MVP. Если потребуется — легко мигрировать на URL-param.
- **Consequences:**
  - При навигации назад/вперёд период сбрасывается на 30 дней.
  - Нет лишней нагрузки на store и URL.
  - Тип: `7 | 30 | 90` — строгий union, расширяется добавлением в массив `PERIODS`.
- **Links:** F-QR03, T-093, US-QR06

---

## D-AT02 — Расширение buildAttentionItems третьим параметром для receipts

- **Date:** 2026-04-08
- **Context:** Нужно добавить правило "непривязанные чеки" в AttentionSection. `buildAttentionItems(docs, events)` — двух параметров недостаточно. Как расширить без нарушения существующих вызовов?
- **Options:**
  1. Новая отдельная функция `buildReceiptAttentionItems(receipts)` — вызывается рядом
  2. Расширить `buildAttentionItems` третьим опциональным параметром `unattachedReceipts: Receipt[] = []`
  3. Переделать в объект-параметр `buildAttentionItems({ docs, events, receipts? })`
- **Decision:** Вариант 2. Опциональный третий параметр с default `[]`. Обратная совместимость сохраняется — все существующие вызовы без третьего аргумента работают без изменений. Логика правила остаётся в одном месте. При добавлении четвёртого типа (например, подписка) можно перейти к варианту 3.
- **Consequences:**
  - Единая точка правил в `attentionRules.ts` — принцип D-AT01 сохранён.
  - `useHomeData` передаёт `unattachedReceipts`, фильтруя `!r.tripId` из `useReceiptsForPeriod(7 дней)`.
  - Окно 7 дней хардкожено в `useHomeData` (константа `UNATTACHED_RECEIPT_WINDOW_DAYS`).
- **Links:** F-AT02, T-094, T-095, US-AT02, D-AT01

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

---

## D-008 — Формат текстового отчёта и стратегия clipboard fallback

- **Date:** 2026-04-08
- **Context:** MonthlyReportSheet копирует текст в clipboard через `navigator.clipboard.writeText()`. Вопросы: (1) какой формат plain-text читаем и удобен для бухгалтерии без markdown-таблиц; (2) что делать если clipboard API недоступен (не-HTTPS, старый браузер).
- **Options (формат):**
  1. Markdown-таблица (pipe-формат) — удобна для Telegram, плохо читается как письмо
  2. Нумерованный список с разделителями ` — ` — читаем в любом мессенджере и email
  3. CSV — машиночитаем, плохо для человека
- **Options (fallback):**
  1. Ничего не делать — копирование молча не работает
  2. Показать `prompt()` с текстом для ручного копирования — морально устарело
  3. Показать inline `<textarea readOnly>` с автоматическим `select()` при фокусе
- **Decision:** Вариант 2 для формата (`1. ДД.ММ — Откуда → Куда — N км — цель`). Вариант 3 для fallback (inline textarea). Textarea появляется только при catch ошибки clipboard API — не в обычном потоке.
- **Consequences:**
  - Отчёт читаем без специального ПО, подходит для copy-paste в email/мессенджер.
  - Fallback безопасен для iOS Safari в нестандартных контекстах.
  - Нет зависимости от backend или PDF-генерации.
- **Links:** F-016, T-097, T-098, US-016

---

## D-009 — Хранение фото чека: object URL вместо base64

- **Date:** 2026-04-14
- **Context:** F-017 добавляет photo capture в QuickReceiptSheet. Поле `imageUrl?: string` в `Receipt` уже существует. Нужно решить, как хранить изображение в store без backend.
- **Options:**
  1. `URL.createObjectURL(file)` — blob URL, живёт только в текущей сессии браузера; не раздувает localStorage
  2. `FileReader.readAsDataURL(file)` — base64 data URI, персистентный, но мобильные фото (3–10 МБ) → 4–13 МБ base64 → риск переполнения localStorage (квота ~5 МБ)
  3. IndexedDB — персистентный, без квоты base64, но усложняет архитектуру вне scope MVP
- **Decision:** Вариант 1 (object URL). Для MVP приоритет — простота. `imageUrl` хранит blob URL. При перезагрузке страницы blob URL становится мёртвым — UI скрывает раздел через `onError` на `<img>`. Backend upload (будущий Phase 8+) заменит object URL на реальный сетевой URL.
- **Consequences:**
  - Нет риска переполнения localStorage.
  - Фото не переживает перезагрузку страницы (known limitation).
  - ReceiptDetailSheet должен обрабатывать `onError` на `<img>` и скрывать раздел.
  - Достаточно для демонстрации UX flow до backend интеграции.
- **Links:** F-017, T-061, T-100, US-017

---

## D-010 — Client-only PDF для F-018 (без backend)

- **Date:** 2026-04-20
- **Context:** F-018 требует генерации путевого листа в PDF. Вопрос: клиентская генерация или серверный рендеринг?
- **Options:**
  1. Server-side: API endpoint принимает данные, возвращает PDF (puppeteer/wkhtmltopdf)
  2. Client-side: JS-библиотека в браузере (`@react-pdf/renderer`, `jspdf`)
- **Decision:** Client-only. MVP не имеет backend (Phase 8 ещё не реализована). Клиентская генерация: нет latency, нет серверных расходов, нет зависимости от auth. Библиотека выбирается в T-104 отдельным решением.
- **Consequences:**
  - Нет серверных зависимостей для PDF.
  - Размер бандла увеличится (~100–200 KB) при добавлении PDF-библиотеки.
  - При подключении backend (Phase 8) можно опционально вынести генерацию на сервер для качества/контроля шаблона — без изменения `buildMonthlyWaybillData` (derivation layer остаётся тем же).
- **Links:** F-018, T-104, US-018

---

## D-013 — jsPDF + jspdf-autotable для client-only PDF export (F-018)

- **Date:** 2026-04-21
- **Context:** T-104 требует client-side PDF генерации из `MonthlyWaybillData`. Два кандидата: `@react-pdf/renderer` и `jsPDF`.
- **Options:**
  1. `@react-pdf/renderer` — JSX-компонент как PDF-шаблон, React-based rendering, хорош для rich layout
  2. `jsPDF` + `jspdf-autotable` — императивный API, чистая TS-функция, без React context в export layer
- **Decision:** `jsPDF` + `jspdf-autotable`. Причины: (1) export layer уже изолирован от React (D-011), императивный API лучше подходит для чистой TS-функции без JSX; (2) `jspdf-autotable` даёт готовую таблицу с заголовком, чередованием строк, column widths без доп. layout кода; (3) меньше абстракций — функция принимает `MonthlyWaybillData` и вызывает `doc.save()`; (4) совместимость с Vite/ESM без дополнительных плагинов. Шрифт Roboto-Regular.ttf в `public/fonts/` — один fetch при первом экспорте, затем кеш в памяти.
- **Consequences:**
  - Bundle size: `jsPDF` ~280 KB + `jspdf-autotable` ~80 KB (lazy-loaded только при вызове экспорта в будущем).
  - Русский текст требует явного embedding Cyrillic TTF — стандартный паттерн для jsPDF.
  - При смене шаблона меняется только `exportWaybillPdf.ts` — derivation layer (D-011) не затронут.
  - `@react-pdf/renderer` остаётся вариантом для будущих rich PDF форматов.
- **Links:** F-018, T-104, D-010, D-011

---

## D-012 — WaybillPreviewSheet открывается из TripsPage (не из MonthlyReportSheet)

- **Date:** 2026-04-20
- **Context:** WaybillPreviewSheet нужно открывать с TripsPage. Два варианта точки входа: (A) кнопка прямо в TripsPage рядом с кнопкой "Отчёт", (B) кнопка внутри MonthlyReportSheet — sheet из sheet.
- **Options:**
  1. Вариант A: кнопка "Путевой лист" в header TripsPage, рядом с "Отчёт"
  2. Вариант B: кнопка внутри MonthlyReportSheet — вложенный вызов sheet из sheet
- **Decision:** Вариант A. TripsPage уже управляет состоянием `reportOpen` и `selectedTrip`; добавление `waybillOpen` — минимальное изменение по existing pattern. Вложенный sheet из sheet (вариант B) создаёт z-index-конфликты и ломает backdrop-логику без shared portal/sheet-manager.
- **Consequences:**
  - Два secondary actions в шапке TripsPage ("Отчёт" и "Путевой лист") — возможна компактизация header при большом количестве кнопок в будущем.
  - MonthlyReportSheet остаётся без изменений — clipboard export flow сохранён.
  - Период для WaybillPreviewSheet = текущий месяц (вычисляется один раз при рендере, не реактивно).
- **Links:** F-018, T-103, D-007

---

## D-011 — Pure derivation layer отделён от UI и PDF export

- **Date:** 2026-04-20
- **Context:** F-018 включает три независимых слоя: (1) подготовка данных, (2) preview UI, (3) PDF generation. Можно смешать всё в одном компоненте или разделить.
- **Options:**
  1. Вся логика в WaybillPreviewSheet — derivation inline в компоненте
  2. Отдельная чистая функция `buildMonthlyWaybillData` → sheet использует её результат → PDF-генератор тоже использует тот же результат
- **Decision:** Вариант 2. `buildMonthlyWaybillData` в `waybillData.ts` — чистая функция без React, по паттерну D-AT01 / D-QR05 / D-008. Preview sheet и PDF-генератор оба работают с `MonthlyWaybillData`. Изменение шаблона документа затрагивает только derivation layer.
- **Consequences:**
  - `MonthlyWaybillData` — единый typed contract между derivation, UI и export.
  - Функция тестируема без браузера/React.
  - При смене PDF-библиотеки (T-104) derivation layer не меняется.
  - Паттерн консистентен с `buildAttentionItems`, `buildReceiptAnalytics`, `buildMonthlyTripReport`.
- **Links:** F-018, T-102, T-103, T-104, D-AT01, D-QR05, D-008

---

## D-014 — Supabase как backend foundation (Phase 8)

- **Date:** 2026-04-21
- **Context:** Phase 8 заменяет mock-only persistence реальным backend. Два главных кандидата: Supabase (PostgreSQL + JS SDK) и PocketBase (Go single binary).
- **Options:**
  1. **Supabase** — Postgres-based, отличный TypeScript SDK, встроенный auth (JWT + RLS), `@tanstack/react-query` уже в проекте, `supabase gen types` → типизированный клиент, бесплатный cloud tier
  2. **PocketBase** — Go single binary, простой self-hosting, хорошая DX для малых проектов, слабее на RLS и auth extensibility
- **Decision:** Supabase.
  - `@tanstack/react-query` и `zod` уже в package.json → логичные партнёры.
  - Phase 9 (реальный auth) — JWT + RLS = стандартный Supabase паттерн; upgrade path минимален.
  - PostgreSQL schema хорошо отображает workspace-scoped multi-tenant данные.
  - `user_id = 'user-1'` (hardcoded Phase 8) → `auth.uid()` (Phase 9) без изменения схемы.
  - PocketBase не имеет эквивалента RLS; при росте пользователей нужен ручной фильтр на бэке.
- **Consequences:**
  - `src/lib/supabase.ts` — singleton клиент (null если env vars отсутствуют → localStorage-only mode).
  - `src/lib/db/repository.ts` — typed data access layer между store и Supabase.
  - `src/lib/db/schema.sql` — SQL migration (применить через Supabase SQL editor или `supabase db push`).
  - Env vars: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`; если отсутствуют — приложение работает как прежде.
  - Когда env vars есть, приложение гидрируется из backend на старте; write actions сразу делают optimistic local update + async backend call.
- **Links:** T-070, D-004, tech-spec

---

## D-015 — Optimistic update + fire-and-forget sync (Phase 8 persistence strategy)

- **Date:** 2026-04-21
- **Context:** При backend-wired store actions нужно решить, как управлять состоянием: synchronous optimistic или async-await в компоненте.
- **Options:**
  1. Компонент await'ит store action → показывает loading state → применяет результат
  2. Store action: синхронный local update (Zustand `set`) + async backend call; ошибка видна через `syncError` state
- **Decision:** Вариант 2. Optimistic local update + fire-and-forget.
  - Local state обновляется мгновенно (пользователь не ждёт сети).
  - Async backend call происходит после. При ошибке — `syncError` выставляется в store; нет silent data loss.
  - Rollback не реализован в MVP (слишком сложно для данного scope). Пользователь может refresh → данные подтянутся с backend.
  - Компоненты не меняются: call sites остаются `action(args)` без await (D-004 сохранён).
  - Действия storeactions промотированы до `async (): Promise<void>` — backward-совместимо, так как компоненты не await'ят возврат.
- **Consequences:**
  - `isSyncing: boolean` + `syncError: string | null` — новые поля в store для visibility.
  - Новые selectors: `useSyncError()`, `useIsSyncing()`.
  - Нет скрытых зависаний: при backend unavailable app continues working с local data.
- **Links:** T-070, D-004, tech-spec

---

## D-016 — Documents и Events остаются local в Phase 8

- **Date:** 2026-04-21
- **Context:** Phase 8 переводит на backend: workspaces, org_profiles, vehicle_profiles, trips, receipts. Но documents и events имеют особый характер.
- **Options:**
  1. Включить documents и events в Phase 8 backend scope
  2. Оставить documents и events local (Zustand persist) в Phase 8; backend-бэкинг в следующей фазе
- **Decision:** Вариант 2.
  - **Documents** частично генерируются из workspace config (`documentHelp.ts`, rule engine) и не имеют standalone create flow в текущем MVP. Backend-backing без auth (D-014 Phase 9) означало бы хранение системных документов без user isolation — неправильно.
  - **Events** — преимущественно system-generated (trip_logged, штрафы, напоминания) и ephemeral. Backend-backing events имеет смысл вместе с push-уведомлениями (F-019, draft), не отдельно.
  - Оба entity продолжают жить в Zustand persist + localStorage. При Phase 9 (auth) они будут добавлены в schema вместе с RLS.
- **Consequences:**
  - `updateDocumentStatus` и `markEventRead` остаются synchronous (без backend call).
  - После refresh documents и events берутся из localStorage (текущее поведение сохранено).
  - Документация явно фиксирует это как known intentional limitation.
- **Links:** T-070, D-004

---

## D-017 — Supabase email/password auth, no social login in Phase 9

- **Date:** 2026-04-21
- **Context:** Phase 9 заменяет хардкод `isAuthenticated: true` реальным auth. Нужно выбрать flow: email/password, magic link, social OAuth.
- **Options:**
  1. Email/password — простая форма, нет зависимости от третьих сервисов
  2. Magic link — беспарольный UX, зависит от email delivery
  3. Google/Apple OAuth — быстрый onboarding, но требует OAuth app registration
- **Decision:** Email/password (Supabase `signInWithPassword` / `signUp`). Минимальное количество внешних зависимостей для MVP. Social login — не Non-goal, но Phase 10+.
- **Consequences:**
  - Auth UX — две вкладки: "Войти" / "Создать аккаунт". Без confirm-password.
  - Supabase может отправить confirmation email при регистрации (зависит от project settings).
  - Russian-mapped error messages через `mapAuthErrorMessage()`.
  - Пароль ≥ 6 символов (Supabase default).
- **Links:** T-071, T-109, T-110, T-111

---

## D-018 — `authChecked` flag для предотвращения flash неавторизованного контента

- **Date:** 2026-04-21
- **Context:** `supabase.auth.onAuthStateChange` — асинхронный. До первого события store не знает, авторизован ли пользователь. ProtectedRoute должен отличать "ещё не знаем" от "точно не авторизован".
- **Options:**
  1. Начинать с `isAuthenticated: true` → flash защищённого контента если не авторизован
  2. Начинать с `isAuthenticated: false` → flash redirect на /auth если авторизован
  3. Флаг `authChecked: boolean` → показывать spinner пока не придёт первое событие
- **Decision:** Вариант 3. `authChecked: boolean`. Начальные значения зависят от режима: в localStorage-only mode — `authChecked: true, isAuthenticated: true` (всегда аутентифицирован, без ожидания). В backend mode — `authChecked: false` до первого `onAuthStateChange` события.
- **Consequences:**
  - ProtectedRoute показывает spinner `border-t-transparent animate-spin` пока `!authChecked`.
  - В localStorage mode spinner не показывается — `authChecked` сразу `true`.
  - `authChecked` не персистируется — всегда вычисляется из auth state при загрузке.
- **Links:** T-071, T-110

---

## D-019 — `EMPTY_WORKSPACE_STATE` при signOut для предотвращения межпользовательской утечки данных

- **Date:** 2026-04-21
- **Context:** При signOut нужно очистить все workspace данные из store. Если не очистить — данные предыдущего пользователя видны следующему (особенно в shared device scenarios).
- **Options:**
  1. Reload страницы при signOut — очищает всё, но грубо
  2. Явный сброс всех полей через константу `EMPTY_WORKSPACE_STATE`
  3. Полная инициализация store до initial state
- **Decision:** Вариант 2. `EMPTY_WORKSPACE_STATE` — константа с пустыми массивами для workspaces, orgProfiles, vehicleProfiles, trips, receipts, documents, events и `currentWorkspaceId: null`. Spread при вызове `signOut()`.
- **Consequences:**
  - Данные предыдущего пользователя не просачиваются при смене аккаунта на том же устройстве.
  - Zustand persist (localStorage) при следующем входе перезаписывается hydration из backend.
  - Mock данные не возвращаются при signOut — store чист.
- **Links:** T-071, T-111

---

## D-020 — Stripe как единственный billing-провайдер

- **Date:** 2026-04-23
- **Context:** Нужно выбрать провайдера биллинга для реализации подписки на drivedocs.
- **Options:**
  1. Stripe — зрелый SaaS-биллинг, стандартный path Supabase + Stripe (официальная интеграция)
  2. ЮKassa / CloudPayments — российские провайдеры, лучше для рублёвых транзакций
  3. Абстракция под несколько провайдеров
- **Decision:** Stripe в качестве единственного провайдера для MVP. Причины:
  - Supabase + Stripe — хорошо задокументированный, популярный path.
  - Stripe Checkout снимает ответственность за PCI DSS с приложения.
  - Stripe secret key **никогда не попадает на клиент** — только на сервере (Supabase Edge Function).
  - Абстракция под нескольких провайдеров не нужна в MVP; при необходимости добавляется позже.
  - Российские провайдеры — отдельная итерация (при локализации платежей).
- **Consequences:**
  - Server-side код для Stripe живёт в Supabase Edge Function `create-checkout-session`.
  - Вебхуки Stripe обрабатываются отдельной Edge Function `stripe-webhook`.
  - На фронтенде — только вызов Edge Function (получить URL Checkout Session) и редирект.
  - `STRIPE_SECRET_KEY` и `STRIPE_WEBHOOK_SECRET` хранятся только как Supabase secrets (через `supabase secrets set`), никогда в `.env` клиентского приложения.
- **Links:** F-020, T-072, T-114..T-121

---

## D-021 — Подписка привязана к workspace (workspace-scoped)

- **Date:** 2026-04-23
- **Context:** Нужно решить: подписка на уровне user-аккаунта или на уровне workspace.
- **Options:**
  1. User-level: один аккаунт → один тариф для всех workspace
  2. Workspace-level: каждый workspace имеет собственную подписку
- **Decision:** Workspace-scoped (вариант 2). Обоснование:
  - workspace = юридический контур (ИП или ООО). Разные предприятия могут требовать разного уровня сервиса.
  - Пользователь может вести бесплатное ИП и платное ООО в одном аккаунте.
  - Экономическая единица биллинга = предприятие, а не аккаунт физлица.
  - Stripe Customer ID и Subscription ID хранятся на уровне workspace в таблице `subscriptions`.
- **Consequences:**
  - Таблица `subscriptions` (schema.sql): `workspace_id` — уникальный FK, не `user_id`.
  - Логика доступа к Pro-фичам: `isProWorkspace(workspaceId)`, не `isProUser()`.
  - При создании Checkout Session передаётся `workspaceId` → Edge Function создаёт или находит Stripe Customer для workspace.
  - User entity сохраняет поле `subscriptionStatus` для обратной совместимости, но основная истина — в `subscriptions` таблице.
- **Links:** F-020, T-072, T-114..T-121

---

## D-022 — Help layer как info-card → bottom sheet, без модальных окон и без новых шагов wizard'а

- **Date:** 2026-05-11
- **Status:** Accepted
- **Context:** Накоплен справочный контент о требованиях к документам (медосмотр, техосмотр, путевой лист, хранение, маршрут). Его нужно показывать ровно в момент первичного заполнения workspace, не блокируя пользователя и не перегружая wizard новыми шагами.
- **Options considered:**
  1. Добавить отдельный обязательный шаг «Справка» в wizard. — Удлиняет flow, противоречит идее минимум шагов до первой ценности.
  2. Tooltip-вспышки (coach marks) поверх элементов. — Конфликтуют с уже работающим OnboardingTour, дают шум.
  3. Inline-accordion внутри шага. — Раздувает высоту шага, мешает CTA «Далее».
  4. Info-card снизу шага → bottom sheet со структурированным контентом. — Не блокирует, переиспользует существующий `BottomSheet` и стилистику `VehicleModelStep.HelpSheet`. **Выбран.**
- **Decision:**
  - Контент централизован в `src/entities/config/onboardingHelp.ts` со структурой `HelpContent { title, lead, sections[{heading, body?, list?, tone?}], footnote }`.
  - Рендер через переиспользуемый `HelpInfoSheet` (поверх `BottomSheet`).
  - В шагах wizard'а — info-card нижним блоком (синий или нейтральный фон) с заголовком + подзаголовком + «Подробнее →».
  - В `SettingsPage` — отдельная секция «Справка по документам» перед «Опасной зоной».
  - Help опционален, не блокирует переход.
- **Consequences / follow-up:**
  - При добавлении новых help-тем (например, F-ЭПЛ с сентября 2026) — расширяется только `onboardingHelp.ts`, компоненты не трогаются.
  - В будущем разделы можно вынести в отдельную страницу «Справочник» в нижней навигации, если контента станет много — `HelpContent` уже отчуждаем от bottom sheet.
- **Links:** F-021, T-126

---

## D-023 — Bottom navigation сокращена до 4 вкладок

- **Date:** 2026-05-11
- **Status:** Accepted
- **Context:** Текущая нижняя навигация — 6 пунктов (Главная, Сегодня, Документы, Поездки, Аналитика, Настройки), что нарушает Hick's Law и размывает фокус на ежедневном сценарии. ТЗ «9 экранов» предлагает 4 вкладки на основе матрицы «частота × критичность».
- **Options considered:**
  1. Оставить 6 вкладок. — Перегруз, плохо для one-thumb mobile UX.
  2. 5 вкладок (с «Документы» отдельно). — Документы редкие действия, не дотягивают до бар-уровня.
  3. **4 вкладки: Сегодня · Поездки · Отчёты · Настройки.** — Выбран. Покрывает ежедневное; разовое прячется на уровень глубже.
- **Decision:**
  - Документы предприятия (одноразовые приказы) → Настройки.
  - Документы поездки (путевой/маршрутный) → TripDetailSheet.
  - Чеки → режим внутри TripsPage.
  - События/уведомления → Центр уведомлений за иконкой 🔔 в шапке.
- **Consequences:**
  - Старые роуты `/documents`, `/receipts`, `/today`, `/events` остаются как редиректы (минимум 30 дней).
  - HomePage становится «Сегодня» (label change), TodayPage мёрджится с HomePage.
- **Links:** F-022, T-127..T-135, `docs/spec-9screens.md`

---

## D-024 — AnalyticsPage переименовывается в Reports, фокус — закрытие месяца

- **Date:** 2026-05-11
- **Status:** Accepted
- **Context:** AnalyticsPage сейчас даёт сводку по периоду, но без явного экспорта в бухгалтерию. Реальный сценарий ежемесячный: «закрыть месяц + выгрузить файл». 
- **Options considered:**
  1. Создать отдельный экран Reports параллельно с Analytics. — Дублирование, два места правды.
  2. Построить полноценную сущность `MonthlyReport` со снапшотом данных. — Преждевременная сложность.
  3. **Переименовать Analytics → Reports, добавить кнопку экспорта.** — Выбран. Экстракт из существующих `trips` + `receipts` по периоду, без новых сущностей.
- **Decision:**
  - `/analytics` → `/reports`, label «Аналитика» → «Отчёты».
  - Главная карточка — предыдущий закрытый месяц + CTA «Выгрузить в бухгалтерию» (Excel/PDF/CSV).
  - Текущий месяц — card-tonal под главной.
- **Links:** F-023, T-136..T-139, `mockups/07-reports-warm.html`
