# Implementation Plan — drivedocs

**Ссылки:** [PRD](PRD.md) | [Tech Spec](tech-spec.md) | [Features](features.md) | [Tasks](tasks.md)
**Дата:** 7 апреля 2026 г.

**Правило:** код не пишется, пока план не согласован с человеком для задач уровня "фича". Для мелких фиксов (1–3 файла, очевидный scope) план может быть изложен inline в ответе. Этот документ — living document, обновляется по мере прогресса.

---

## Локализация и язык интерфейса

- drivedocs — русскоязычный продукт.
- Все пользовательские тексты (UI, ошибки, empty states, документы, отчёты, экспорт, события, billing, paywall) должны быть на русском языке.
- Допускаются только общепринятые аббревиатуры (ИП, ООО, PDF, API, RLS и т.п.), технические названия (Supabase, Stripe, TypeScript и т.п.) и неизбежные коды/идентификаторы.
- Англоязычные сообщения внешних сервисов (Supabase, Stripe и т.п.) не показываются напрямую пользователю — вместо этого отображается русскоязычная формулировка; оригинал используется только для логов/отладки.
- Для каждой новой задачи и фазы это правило является частью acceptance criteria: перед закрытием задачи проверить, что ни одна новая user-facing строка не осталась на английском.

---

## High-level phases

| # | Фаза | Статус |
|---|------|--------|
| 0 | Project foundation (Vite, TS, routing, Zustand, shell) | done |
| 1 | Workspace model + onboarding wizard | done |
| 2 | Trip flows (add, list, detail, delete) | done |
| 3 | Documents (list, detail, status actions) | done |
| 4 | Events + notifications (feed, unread badge, mini-feed) | done |
| 5 | Home dashboard + detail flows from home | done |
| 6 | Monthly report + clipboard export | done |
| 7 | Receipt capture | done |
| 8 | Backend foundation (Supabase) | done |
| 9 | Real auth + subscription enforcement | done |
| 11 | Billing Phase 1 (Stripe + Pro gate) | done |
| 12 | Edge Functions: production billing backend | done |
| 13 | Pro Analytics Block (второй Pro gate) | done |
| 14 | Stripe Customer Portal | done |

---

## Phase 5.5 — QuickReceiptSheet + Attention rule engine

**Цель:** заменить заглушку "Чек" реальным QuickReceiptSheet; выделить логику формирования "Требуют внимания" в расширяемый rule engine.

**Задачи:** T-080, T-081, T-082, T-083, T-084

**Затронутые файлы:**
- `src/features/receipts/QuickReceiptSheet.tsx` (новый)
- `src/features/home/attentionRules.ts` (новый)
- `src/app/store/workspaceStore.ts` — добавить `receipts[]` + `addReceipt`
- `src/features/home/useHomeData.ts` — использовать `buildAttentionItems`
- `src/pages/HomePage.tsx` — `AttentionSection` принимает `AttentionItem[]`
- `src/pages/TodayPage.tsx` — активировать кнопку "Чек"

**Acceptance:**
- QuickReceiptSheet открывается из TodayPage; чек сохраняется в store.
- AttentionSection на HomePage использует `buildAttentionItems()`.
- Сортировка: urgent выше warning; документы выше событий при равном severity.
- Визуально на HomePage ничего не регрессировало.

---

## Phase 5.6 — Receipt list + trip linking (F-QR02)

**Цель:** показать пользователю список чеков за сегодня; дать возможность привязать чек к поездке через ReceiptDetailSheet.

**Задачи:** T-085, T-086, T-087, T-088

**Затронутые файлы:**
- `src/app/store/workspaceStore.ts` — add `attachReceiptToTrip`, `detachReceiptFromTrip`, selectors
- `src/entities/constants/labels.ts` — add `RECEIPT_CATEGORY_LABELS`
- `src/features/receipts/ReceiptDetailSheet.tsx` (новый)
- `src/pages/TodayPage.tsx` — add today's receipts section
- `src/features/trips/TripDetailSheet.tsx` — add linked receipts count

**Acceptance:**
- Чек появляется в секции TodayPage после сохранения.
- Tap → ReceiptDetailSheet → видно статус привязки.
- Можно выбрать поездку из списка → tripId сохраняется.
- TripDetailSheet показывает число привязанных чеков.

---

## Phase 5.7 — Receipt history + spending analytics (F-QR03)

**Цель:** дать пользователю доступ к истории чеков за 30 дней и простой агрегированной аналитике расходов по категориям. Новая страница ReceiptsPage доступна из TodayPage.

**Задачи:** T-089, T-090, T-091, T-092

**Затронутые файлы:**
- `src/app/store/workspaceStore.ts` — добавить `useReceiptsForPeriod` selector
- `src/features/receipts/receiptAnalytics.ts` (новый) — `buildReceiptAnalytics()` pure function
- `src/pages/ReceiptsPage.tsx` (новый) — страница истории + аналитики
- `src/app/App.tsx` — добавить маршрут `/receipts`
- `src/pages/TodayPage.tsx` — добавить ссылку "Все чеки →"

**Acceptance:**
- ReceiptsPage показывает чеки за последние 30 дней, новые сверху.
- Аналитический блок считает итого и суммы по категориям корректно.
- Если чеков нет — понятный empty state.
- Tap на чек → ReceiptDetailSheet (привязка к поездке работает и из истории).
- TodayPage всегда имеет ссылку "Все чеки →".

---

## Phase 5.8 — Receipt period selector + unattached receipts attention (F-QR03 ext, F-AT02)

**Цель:** дать пользователю выбор периода на ReceiptsPage (7/30/90 дней); добавить attention-правило для непривязанных чеков за последние 7 дней на HomePage.

**Задачи:** T-093, T-094, T-095, T-096

**Затронутые файлы:**
- `src/pages/ReceiptsPage.tsx` — period selector UI, динамический fromDate
- `src/features/home/attentionRules.ts` — extend `AttentionItemKind`, добавить правило для receipts
- `src/features/home/useHomeData.ts` — добавить `useReceiptsForPeriod` для unattached receipts за 7 дней
- `src/pages/HomePage.tsx` — обработать `kind === 'receipt'` в tap handler, иконка Receipt

**Acceptance:**
- Chips 7/30/90 на ReceiptsPage переключают список и аналитику реактивно.
- При 0 чеков за период — пустое состояние с подсказкой.
- На HomePage при наличии непривязанных чеков за 7 дней — warning в AttentionSection.
- Tap на warning → navigate к ReceiptsPage.
- TypeScript noEmit — 0 ошибок.

---

## Phase 6 — Monthly report ✓

**Цель:** пользователь получает текстовый отчёт за месяц (поездки, пробег, маршруты) прямо с телефона и может скопировать его для отправки в бухгалтерию.

**Задачи:** T-060, T-097, T-098, T-099

**Затронутые файлы:**
- `src/features/trips/tripReport.ts` (новый) — `buildMonthlyTripReport()` pure function
- `src/features/trips/MonthlyReportSheet.tsx` (новый) — bottom sheet
- `src/pages/TripsPage.tsx` — кнопка "Отчёт" в шапке

**Acceptance:**
- Sheet открывается с TripsPage.
- Показывает: месяц, количество поездок, суммарный км, список маршрутов с датами.
- Кнопка "Скопировать" копирует форматированный текст в clipboard.
- `navigator.clipboard.writeText()` — fallback если недоступно: textarea для ручного копирования.
- При 0 поездках — empty state, кнопка неактивна.
- TypeScript noEmit — 0 ошибок.

---

## Phase 7 — Receipt capture ✓

**Цель:** пользователь фотографирует чек прямо при добавлении в QuickReceiptSheet; фото сохраняется в store и отображается в ReceiptDetailSheet.

**Задачи:** T-061, T-100, T-101

**Затронутые файлы:**
- `src/features/receipts/QuickReceiptSheet.tsx` — секция фото: capture input, превью, удалить/переснять
- `src/features/receipts/ReceiptDetailSheet.tsx` — отображение фото с graceful fallback

**Acceptance:**
- QuickReceiptSheet: кнопка открытия камеры, превью после выбора, "Переснять" / "Удалить".
- `imageUrl` (object URL) сохраняется в receipt через store.
- ReceiptDetailSheet показывает фото, если `imageUrl` доступен; молча скрывает при ошибке загрузки.
- Фото необязательно — existing save flow не изменён.
- TypeScript noEmit — 0 ошибок.

---

## Phase 8 — PDF путевого листа (F-018)

**Цель:** пользователь получает PDF путевого листа за выбранный месяц с данными workspace, автомобиля и поездок.

**Mini-cycle 8.1 (done):** derivation layer — `buildMonthlyWaybillData` + governance docs.

**Mini-cycle 8.2 (done):** WaybillPreviewSheet — preview данных, warnings, кнопка экспорта (disabled до isExportReady). VehicleProfile подключён в store.

**Mini-cycle 8.3 (done):** PDF generator — jsPDF + jspdf-autotable (D-013), A4 шаблон с Roboto TTF, download trigger.

**Задачи:** T-102, T-103, T-104

---

## Phase 8 — Backend foundation ✓

**Цель:** заменить mock-only persistence реальным backend, сохранив frontend architecture стабильной.

**Backend:** Supabase (PostgreSQL). Решение: D-014.

**Persistence strategy:** optimistic local update + async backend call. D-015.

**Backend-backed entities:** workspaces, org_profiles, vehicle_profiles, trips, receipts.
**Local-only (Phase 8):** documents, events — добавляются с RLS в Phase 9. D-016.

**Задачи:** T-070, T-106, T-107, T-108

**Затронутые файлы:**
- `src/lib/supabase.ts` (новый)
- `src/lib/db/repository.ts` (новый)
- `src/lib/db/schema.sql` (новый)
- `src/app/store/workspaceStore.ts` — backend-wired actions, hydration, new vehicle profile actions
- `src/app/App.tsx` — dynamic root redirect, hydration on mount
- `.env.example` (новый)

---

## Phase 9 — Real auth + subscription enforcement (draft)

**Цель:** заменить `isAuthenticated: true` + `user_id = 'user-1'` на реальный Supabase Auth flow. Добавить RLS policies.

**Принцип:** Supabase Auth JWT → `auth.uid()` заменяет `ANON_USER_ID` в repository. RLS policies на все таблицы. Phase 8 schema готова к этому переходу без изменений.

**Задачи:** T-071, T-072

---

## Phase 11 — Billing / subscriptions (Stripe + Pro gate)

**Цель:** первая рабочая фаза биллинга: workspace-scoped Free / Pro подписка, Stripe Checkout, BillingSection в SettingsPage, PDF-экспорт как Pro gate.

**Decisions:** D-020 (Stripe как провайдер), D-021 (workspace-scoped billing)

**Принцип:**
- Stripe secret key — только в Supabase Edge Function, никогда на клиенте.
- Клиент: вызов Edge Function → Checkout URL → редирект → return URL с `?billing=success/cancel`.
- В dev/mock-режиме: «Симулировать Pro» активирует Pro локально без оплаты.

**Backend:**
- schema.sql: таблица `subscriptions` (workspace_id FK, plan_code, status, stripe_*, period_end)
- rls-policies.sql: owner-only RLS для subscriptions
- repository.ts: `subscriptionRepo`, `fetchAllUserData` расширён

**Фронтенд:**
- `src/lib/billing/billingService.ts` — `createCheckoutSession()`
- workspaceStore.ts — `subscriptions[]`, `setSubscription`, `refreshSubscription`, `activateDevProSubscription`, `useIsProWorkspace()` selector
- SettingsPage — BillingSection с планом/статусом/CTA, обработка `?billing=success/cancel`
- WaybillPreviewSheet — PDF gate + PdfPaywall компонент

**Задачи:** T-072, T-114, T-115, T-116, T-117, T-118, T-119, T-120, T-121

---

## Phase 12 — Edge Functions: production billing backend

**Цель:** замкнуть billing loop на server-side — Stripe Checkout Session через Edge Function, синхронизация подписки через webhook.

**Задачи:** T-122, T-123

**Затронутые файлы:**
- `supabase/functions/create-checkout-session/index.ts` (новый)
- `supabase/functions/stripe-webhook/index.ts` (новый)
- `supabase/functions/_shared/cors.ts` (новый)
- `drivedocs-app/.env.example` — документация server-side secrets
- `docs/tech-spec.md` — раздел Billing / subscriptions

**Acceptance:**
- `create-checkout-session` возвращает `{ url }` при валидном запросе с auth.
- `stripe-webhook` обновляет таблицу `subscriptions` при `checkout.session.completed`.
- Подпись webhook валидируется; невалидные запросы → 400 без изменений в БД.
- Весь Stripe secret key flow остаётся на сервере; клиент получает только URL.

**Deploy:**
```
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
supabase secrets set STRIPE_PRICE_PRO_MONTHLY=price_...
```

---

## Phase 14 — Stripe Customer Portal

**Цель:** дать Pro-пользователю возможность самостоятельно управлять подпиской (отмена, смена карты, история платежей) через Stripe Billing Portal.

**Задачи:** T-125

**Затронутые файлы:**
- `supabase/functions/create-portal-session/index.ts` (новый)
- `src/lib/billing/billingService.ts` — добавлен `createPortalSession()`
- `src/pages/SettingsPage.tsx` — `handleManageSubscription` → вызов Edge Function → редирект

**Acceptance:**
- Pro-пользователь: «Управлять подпиской» → редирект на Stripe Billing Portal.
- Dev-режим (mock): кнопка обновляет данные из store (портал недоступен без Stripe).
- Ошибки показываются на русском под кнопкой.
- Stripe secret key не попадает в клиентский код.

**Deploy:**
```
supabase functions deploy create-portal-session
```

---

## Phase 10 — Backend-backed documents + events

**Цель:** перенести `documents` и `events` из local-only в Supabase backend.

**Schema:** таблицы `documents` и `events` + RLS policies добавлены в `schema.sql` / `rls-policies.sql`.

**Repository:** `documentRepo` (listByUser, upsert, updateStatus, bulkUpsert) и `eventRepo` (listByUser, insert, markRead) в `repository.ts`.

**Store:** `fetchAllUserData` расширён; hydration, `updateDocumentStatus`, `addEvent`, `markEventRead` синхронизируются с backend.

**Задачи:** T-112, T-113

---

## Traceability index

| Phase | Features | Key Tasks | User Stories |
|-------|----------|-----------|--------------|
| 5.5 — QuickReceipt + Rule engine | F-QR01, F-AT01 | T-080..T-084 | US-QR01, US-AT01 |
| 5.6 — Receipt list + trip linking | F-QR02 | T-085..T-088 | US-QR02, US-QR03 |
| 5.7 — Receipt history + analytics | F-QR03 | T-089..T-092 | US-QR04, US-QR05 |
| 5.8 — Period selector + unattached receipts attention | F-QR03 ext, F-AT02 | T-093..T-096 | US-QR06, US-AT02 |
| 0 — Foundation | — | T-001..T-005 | — |
| 1 — Workspace + Onboarding | F-001, F-002, F-013, F-015 | T-010..T-013 | US-001, US-002, US-003, US-011 |
| 2 — Trips | F-003, F-004, F-005, F-011 | T-020..T-024 | US-004, US-005, US-006, US-012 |
| 3 — Documents | F-006, F-007 | T-030..T-033 | US-007, US-008 |
| 4 — Events + Notifications | F-008, F-009, F-014 | T-040..T-045 | US-009, US-013 |
| 5 — Home + Detail flows | F-010, F-012 | T-050..T-053 | US-010 |
| 6 — Monthly report | F-016 | T-060, T-097..T-099 | US-016 |
| 7 — Receipt photo | F-017 | T-061, T-100, T-101 | US-017 |
| 8.1 — Waybill derivation | F-018 | T-102 | US-018, US-019 |
| 8.2 — Waybill preview | F-018 | T-103 | US-018, US-019 |
| 8.3 — PDF export | F-018 | T-104 | US-018 |
| 8.4 — PDF template enhancement | F-018 | T-105 | US-018, US-019 |
| 8 — Backend foundation | — | T-070, T-106, T-107, T-108 | all |
| 9 — Auth + Billing | F-020 | T-071, T-072 | US-001..US-003 |
| 11 — Billing Phase 1 (Stripe + Pro gate) | F-020 | T-072, T-114..T-121 | US-B01, US-B02 |
| 12 — Edge Functions: production billing backend | F-020 | T-122, T-123 | US-B01, US-B02 |

---

## Completed task list (Phase 0–5)

T-001, T-002, T-003, T-004, T-005,
T-010, T-011, T-012, T-013,
T-020, T-021, T-022, T-023, T-024,
T-030, T-031, T-032, T-033,
T-040, T-041, T-042, T-043, T-044, T-045,
T-050, T-051, T-052, T-053
