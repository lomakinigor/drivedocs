# Features

Feature registry. Each entry is traceable to user stories and tasks.
Status: `draft` | `planned` | `in-dev` | `done`

---

## F-001 — Multi-workspace model

**Description:** Один аккаунт может содержать несколько независимых рабочих пространств (предприятий). Каждый workspace имеет собственную конфигурацию (тип, налоговый режим, правовая модель) и изолированные данные (поездки, документы, события).

**Screens/Flows:** SettingsPage, workspace routing (`/w/:workspaceId/*`), WorkspaceSwitcher
**User Stories:** US-001, US-002, US-003, US-011
**Tasks:** T-010, T-012, T-013
**Status:** done

---

## F-002 — Onboarding wizard

**Description:** Многошаговый wizard при создании или перенастройке workspace. Шаги: тип предприятия (ИП/ООО) → налоговый режим → модель использования автомобиля → название workspace → ИНН → модель автомобиля → итог. Поддерживает два режима: создание нового workspace и перенастройка существующего (через `?ws=<id>`).

**Screens/Flows:** OnboardingWizard (7 шагов), `/onboarding`
**User Stories:** US-001, US-002
**Tasks:** T-011
**Status:** done

---

## F-003 — Quick trip entry (global)

**Description:** AddTripSheet доступен с любого экрана через MobileLayout. Открывается через React Context (`QuickTripContext`). После сохранения поездки создаётся событие `trip_logged` в ленте событий. Пользователь остаётся на текущем экране.

**Screens/Flows:** AddTripSheet (bottom sheet), MobileHeader (кнопка +), TodayPage CTA, TripsPage кнопка, HomePage CTA
**User Stories:** US-004
**Tasks:** T-020, T-024, T-045
**Status:** done

---

## F-004 — Trip list & history

**Description:** Список всех поездок для workspace, сортировка по дате (новые сверху). Показывает маршрут, расстояние, дату, цель. Пустое состояние с CTA.

**Screens/Flows:** TripsPage
**User Stories:** US-004, US-005
**Tasks:** T-022
**Status:** done

---

## F-005 — Trip detail + delete

**Description:** Tap на TripCard открывает TripDetailSheet с деталями: полный маршрут, км, цель, дата. Удаление с подтверждением (inline confirm block). После удаления sheet закрывается, список обновляется реактивно.

**Screens/Flows:** TripDetailSheet (bottom sheet), TodayPage, TripsPage, HomePage RecentTripsSection
**User Stories:** US-005, US-006
**Tasks:** T-051, T-053
**Status:** done

---

## F-006 — Document center

**Description:** Список документов для workspace, сгруппированных по статусу (Нужны / В работе / Готовы). Прогресс-бар. Быстрая кнопка "Готово" прямо из списка. Пустое состояние если документов нет.

**Screens/Flows:** DocumentsPage
**User Stories:** US-007
**Tasks:** T-031
**Status:** done

---

## F-007 — Document detail + status actions

**Description:** Tap на документ открывает DocumentDetailSheet с: статус-badge, дата дедлайна/готовности, "Зачем нужен" (plain-language), "Как подготовить", tip. Действия: "Отметить как готовый", "Пометить В работе", "Отменить готовность". Все изменения через store → реактивно обновляют DocumentsPage и HomePage.

**Screens/Flows:** DocumentDetailSheet (bottom sheet), DocumentsPage, HomePage AttentionSection
**User Stories:** US-007, US-008
**Tasks:** T-032, T-033, T-052
**Status:** done

---

## F-008 — Event feed

**Description:** Лента событий для workspace: все события (trip_logged, штрафы, напоминания и т.п.) в обратном хронологическом порядке. Фильтр штрафов. Пустые состояния с учётом контекста (есть штрафы / нет вообще ничего).

**Screens/Flows:** EventsPage
**User Stories:** US-009
**Tasks:** T-041
**Status:** done

---

## F-009 — Event detail + mark read

**Description:** Tap на событие → EventDetailSheet. При открытии sheet событие автоматически помечается прочитанным (useEffect). Показывает тип, severity badge, описание, дату.

**Screens/Flows:** EventDetailSheet (bottom sheet), EventsPage, NotificationsSheet
**User Stories:** US-009, US-013
**Tasks:** T-042, T-043, T-044
**Status:** done

---

## F-010 — Home dashboard

**Description:** Главный экран. Конфиг-strip (tax mode, vehicle model). TodayCTA если нет поездок за сегодня. Месячная статистика (поездки + км). Секция "Требуют внимания" (срочные документы + события). Последние поездки. Guard если workspace не настроен.

**Screens/Flows:** HomePage
**User Stories:** US-010
**Tasks:** T-050, T-052, T-053
**Status:** done

---

## F-011 — Today journal

**Description:** Экран "Сегодня": дата, счётчик поездок за сегодня, success banner при добавлении. Быстрые действия: поездка, чек (заглушка). Журнал за сегодня — список TripCard или пустое состояние.

**Screens/Flows:** TodayPage
**User Stories:** US-004, US-012
**Tasks:** T-023, T-051
**Status:** done

---

## F-012 — Attention layer (home)

**Description:** На HomePage показывается секция "Требуют внимания" — до 3 элементов: сначала срочные документы (required/overdue), потом urgent/warning события. Tap на документ → DocumentDetailSheet. Tap на событие → EventsPage. Если элементов > 3 — ссылка "Все →".

**Screens/Flows:** AttentionSection в HomePage
**User Stories:** US-010
**Tasks:** T-050, T-052
**Status:** done

---

## F-013 — Workspace settings

**Description:** SettingsPage: карточка текущего workspace (имя, тип, налоговый режим, модель авто). Переименование (inline RenameSheet). Список всех workspace с переключением. Добавление нового workspace (→ OnboardingWizard). Danger zone: сброс конфигурации с inline подтверждением. Блок аккаунта.

**Screens/Flows:** SettingsPage, RenameSheet (inline)
**User Stories:** US-011
**Tasks:** T-013
**Status:** done

---

## F-014 — Notifications mini-feed

**Description:** Bell в MobileHeader → NotificationsSheet: список непрочитанных событий. Tap на событие → markEventRead, EventDetailSheet. Ссылка "Все события →" ведёт на EventsPage. Unread badge (красный кружок, 9+) на Bell-иконке в BottomNav.

**Screens/Flows:** NotificationsSheet, MobileHeader, BottomNav
**User Stories:** US-013
**Tasks:** T-043, T-044
**Status:** done

---

## F-015 — Workspace switcher

**Description:** Tap на имя workspace в MobileHeader → WorkspaceSwitcher sheet: список всех workspace с active-check, переключение, кнопка добавить новый (→ OnboardingWizard).

**Screens/Flows:** WorkspaceSwitcher (bottom sheet), MobileHeader
**User Stories:** US-003, US-011
**Tasks:** T-012
**Status:** done

---

## F-QR01 — QuickReceiptSheet

**Description:** Быстрый ввод чека прямо с TodayPage. Bottom sheet с минимальным набором полей: сумма, категория расхода, дата. Сохраняется в store (receipts[]). Расширяется до привязки к поездке и загрузки фото в будущих итерациях. Заменяет заглушку "Чек — скоро" в TodayPage.

**Screens/Flows:** TodayPage (Quick actions grid), QuickReceiptSheet (bottom sheet)
**User Stories:** US-QR01
**Tasks:** T-080, T-081, T-082
**Status:** done

---

## F-AT01 — Rule engine для AttentionSection

**Description:** Выделенная функция `buildAttentionItems(docs, events)` в `attentionRules.ts`, которая принимает все документы и события workspace и возвращает единый типизированный список `AttentionItem[]`. Заменяет двойную логику в `useHomeData` и `AttentionSection`. Расширяется добавлением новых правил (например, чек без категории, истёкшая подписка) в одном месте.

**Screens/Flows:** HomePage (AttentionSection), useHomeData hook
**User Stories:** US-AT01
**Tasks:** T-083, T-084
**Status:** done

---

## F-QR02 — Receipt list and trip linking

**Description:** Секция чеков за сегодня на TodayPage. Tap на чек открывает ReceiptDetailSheet с деталями и возможностью привязать чек к поездке (выбор из списка trips workspace). Привязка сохраняется через `attachReceiptToTrip(receiptId, tripId)`. TripDetailSheet показывает число привязанных чеков. Отвязка — действие в ReceiptDetailSheet.

**Screens/Flows:** TodayPage (секция чеков), ReceiptDetailSheet (bottom sheet), TripDetailSheet (linked receipts block)
**User Stories:** US-QR02, US-QR03
**Tasks:** T-085, T-086, T-087, T-088
**Status:** done

---

## F-QR03 — Receipt history and spending analytics

**Description:** Отдельная страница `ReceiptsPage` со списком чеков за выбранный период (7 / 30 / 90 дней, по умолчанию 30) и компактной аналитикой расходов по категориям. Suммы по топливу, парковке, ремонту, мойке, другому + итог за период. Пользователь попадает через ссылку "История чеков →" с TodayPage. Компактный period selector (chips) — сверху над списком. В BottomNav страница не добавляется.

**Screens/Flows:** ReceiptsPage (page, не sheet), TodayPage (ссылка "История чеков →")
**User Stories:** US-QR04, US-QR05, US-QR06
**Tasks:** T-089, T-090, T-091, T-092, T-093
**Status:** done

---

## F-AT02 — Attention rule: unattached receipts

**Description:** Правило в `attentionRules.ts`: если за последние 7 дней есть чеки без привязки к поездке — в AttentionSection на HomePage показывается предупреждение. Текст простой: "Есть чеки без поездки — N чек(а/ов) за последние 7 дней". CTA тапом ведёт на ReceiptsPage. Расширяет `buildAttentionItems()` третьим параметром `unattachedReceipts`. Вид в AttentionSection: иконка Receipt, severity warning.

**Screens/Flows:** HomePage (AttentionSection)
**User Stories:** US-AT02
**Tasks:** T-094, T-095, T-096
**Status:** done

---

## F-016 — Monthly trip report + clipboard export

**Description:** MonthlyReportSheet открывается с TripsPage по кнопке "Отчёт". Показывает сводку за текущий месяц: количество поездок, суммарный пробег, компактный список маршрутов с датами. Кнопка "Скопировать отчёт" формирует читаемый plain-text и копирует в clipboard через `navigator.clipboard.writeText()`. Если clipboard недоступен — fallback: textarea с текстом для ручного выделения. Пустое состояние при 0 поездках: кнопка копирования неактивна, список заменяется сообщением. Бизнес-логика форматирования текста вынесена в чистую функцию `buildMonthlyTripReport`.

**Screens/Flows:** TripsPage (кнопка "Отчёт" в шапке), MonthlyReportSheet (bottom sheet)
**User Stories:** US-016
**Tasks:** T-060, T-097, T-098, T-099
**Status:** done

---

## F-017 — Receipt capture flow (MVP: photo attachment)

**Description:** Пользователь может прикрепить фото чека прямо при добавлении в QuickReceiptSheet. Кнопка "Прикрепить фото" открывает камеру (`<input type="file" accept="image/*" capture="environment">`). При выборе файла показывается предпросмотр внутри sheet. После сохранения `imageUrl` сохраняется в store (object URL, ephemeral). ReceiptDetailSheet показывает фото если оно есть; graceful fallback при мёртвой ссылке. OCR, загрузка на сервер, PDF — за рамками этого шага.

**Screens/Flows:** QuickReceiptSheet (photo section), ReceiptDetailSheet (photo display)
**User Stories:** US-017
**Tasks:** T-061, T-100, T-101
**Status:** done

---

## F-018 — PDF путевого листа из месячного отчёта

**Description:** Генерация PDF путевого листа за выбранный месяц на основе данных workspace и списка поездок. Derivation layer (`buildMonthlyWaybillData`) подготавливает типизированную структуру для preview и PDF export. `WaybillPreviewSheet` показывает сводку: организация, ИНН, ОГРН/ОГРНИП (если заполнен), автомобиль, водитель, список поездок за период, итоговый пробег и предупреждения о неполных данных. Кнопка "Скачать PDF" активна только при `isExportReady`. PDF формируется на клиенте (jsPDF + jspdf-autotable, Roboto TTF для кириллицы) без обращения к серверу. Шаблон включает реквизиты, таблицу поездок, итоги, блок подписей с М.П.

**Screens/Flows:** TripsPage (кнопка "Путевой лист" в шапке), WaybillPreviewSheet (bottom sheet), PDF download (client-side, `putevoy-list-YYYY-MM.pdf`)
**User Stories:** US-018, US-019
**Tasks:** T-102, T-103, T-104, T-105
**Status:** done

**Known limitations:**
- ОГРНИП для ИП показывается только если `orgProfile.ogrn` заполнен; онбординг не собирает это поле в текущем MVP.
- Фото чеков в путевой лист не включаются.
- PDF сохраняется только на устройство — backend-хранение не реализовано.

---

## F-AUTH — Real auth (Phase 9)

**Description:** Supabase email/password аутентификация. Замена хардкодированного `isAuthenticated: true` реальным auth flow. AuthPage (login + signup tabs), ProtectedRoute guard, logout в SettingsPage. RLS на 5 таблицах (workspaces, org_profiles, vehicle_profiles, trips, receipts). В localStorage-only mode (без env vars) auth по-прежнему не требуется.

**Screens/Flows:** `/auth` (AuthPage), ProtectedRoute wrapper, SettingsPage (logout button)
**User Stories:** US-001 (implied)
**Tasks:** T-071, T-109, T-110, T-111
**Status:** done

**Known limitations:**
- Нет email confirmation UI (пользователь видит сообщение "Проверьте почту", дальнейший flow зависит от Supabase project settings).
- Social login (Google/Apple) — Phase 10+.
- Subscription enforcement — T-072, Phase 10.

---

---

## F-020 — Биллинг и управление подпиской

**Description:** Workspace-scoped подписка Free / Pro. Stripe Checkout для оплаты. BillingSection в SettingsPage: текущий тариф, статус, кнопка «Перейти на Pro» (→ Stripe Checkout) или «Управлять подпиской» (→ обновить данные из backend). Минимум один реальный Pro gate: экспорт PDF путевого листа. В dev/mock-режиме — симуляция активации Pro без оплаты.

**Screens/Flows:** SettingsPage (BillingSection), WaybillPreviewSheet (PDF gate + paywall), `?billing=success/cancel` return URLs
**User Stories:** US-B01, US-B02
**Tasks:** T-072, T-114, T-115, T-116, T-117, T-118, T-119, T-120, T-121
**Status:** in-dev

**Architecture (D-020, D-021):**
- Stripe secret key — только на сервере (Supabase Edge Function `create-checkout-session`)
- Клиент вызывает Edge Function → получает Checkout URL → редиректит пользователя
- Stripe webhook → Edge Function `stripe-webhook` → обновляет `subscriptions` таблицу
- Клиент читает состояние через `subscriptionRepo.listByUser()` при hydration

**Pro gates (Phase 11):**
- PDF-экспорт путевого листа (WaybillPreviewSheet)

**Planned Pro gates (следующие итерации):**
- Продвинутая аналитика расходов
- Push / email напоминания (F-019)

---

## Planned / upcoming

| ID | Название | Статус |
|----|----------|--------|
| F-019 | Push / email напоминания | draft |
