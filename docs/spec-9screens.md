# Spec — Перестройка приложения по 9-экранной архитектуре

**Дата:** 2026-05-11
**Статус:** Approved
**Owner:** AI
**Ветка:** `feature/9-screens-phase-a`
**Связи:** F-022, F-023, F-024 · D-023, D-024 · T-127..T-142

## Goal

Привести IA и UX-структуру работающего приложения к канонической архитектуре из ТЗ «Архитектура мобильного приложения учёта служебных поездок» (9 экранов), сохранив рабочую бизнес-логику и стиль Warm & Friendly.

## Why

- Текущая нижняя навигация перегружена (6 вкладок) — нарушает Hick's Law, размывает фокус на ежедневном сценарии.
- 9-экранная архитектура построена на матрице «частота × критичность» и помещает ежедневное (Сегодня, Поездки, Отчёты, Настройки) в нижнюю нав; разовое (Preview, Wizard) — в скрытый поток.
- Дизайн 0 (Warm & Friendly) выбран как базовый — 9 готовых макетов в `mockups/*-warm.html` = source of truth.

## Architecture

### Bottom navigation (4 таба)

```
[ 🏠 Сегодня ]  [ 🚗 Поездки ]  [ 📊 Отчёты ]  [ ⚙️ Настройки ]
```

### Маппинг существующих страниц

| Старая страница | Новое место | Решение |
|---|---|---|
| `HomePage` (Главная) | Сохраняется как «Сегодня» | label «Главная» → «Сегодня» |
| `TodayPage` (Сегодня) | Сливается с HomePage | Дублирование, контент мёрджится в HomePage |
| `TripsPage` (Поездки) | Остаётся, добавляется режим «Чеки» | toggle |
| `DocumentsPage` (Документы) | Удаляется из нав | Содержимое → SettingsPage + TripDetailSheet |
| `AnalyticsPage` (Аналитика) | Переименовывается в `ReportsPage` | + кнопки экспорта |
| `EventsPage` (Лента) | `NotificationsPage`, только через 🔔 в шапке | Не в нав |
| `ReceiptsPage` (Чеки) | Удаляется | Содержимое → TripsPage режим |
| `SettingsPage` | Расширяется секцией «Документы предприятия» | + |
| `WelcomePage` | Сохраняется | После Phase C перед ним добавляется Preview |
| `OnboardingWizard` | Не меняется структурно | + Preview перед wizard'ом (Phase C) |

### Скрытый поток (только при первом входе)

```
WelcomePage → /onboarding/preview (Preview карусель) → /onboarding (Wizard 6 шагов) → /home
```

## Phases & scope

### Phase A — IA фундамент (текущий релиз)

**Задачи T-127…T-135**
- T-127: новый BottomNav (4 таба) с labels «Сегодня · Поездки · Отчёты · Настройки»
- T-128: редиректы `/documents` → `/settings`, `/receipts` → `/trips?mode=receipts`, `/today` → `/home`
- T-129: переименование `EventsPage` → `NotificationsPage` + роут `/notifications`
- T-130: перенос «Документы предприятия» (одноразовые приказы) в `SettingsPage`
- T-131: перенос «Документы поездки» (путевой/маршрутный лист) в `TripDetailSheet`
- T-132: убрать `/documents` из роутов (оставить редирект)
- T-133: `TripsPage` режим «Чеки» (toggle Поездки / Чеки)
- T-134: чистка `TodayPage` (можно отложить если HomePage достаточно)
- T-135: TypeScript + smoke-тест + редеплой в master

### Phase B — Отчёты (следующий релиз)

**Задачи T-136…T-139**
- T-136: переименование `AnalyticsPage` → `ReportsPage`, роут `/reports`
- T-137: кнопка «Закрыть месяц» + Excel/PDF/CSV экспорт
- T-138: главная карточка предыдущего месяца (highlighted) + текущий + chip-история
- T-139: проверка соответствия макету `07-reports-warm.html`

### Phase C — Onboarding (последний релиз)

**Задачи T-140…T-142**
- T-140: создание `OnboardingPreview` (4 слайда из ТЗ + WelcomePage интеграция)
- T-141: проверка/полировка Wizard под `01-wizard-warm.html` (финальный шаг)
- T-142: общая проверка против `/ux-audit` (≥70 / ≥80 / ≥75)

## Definition of Done (Phase A)

1. Все 4 вкладки нав открываются без ошибок
2. Старые роуты `/documents` `/receipts` редиректят корректно
3. Документы предприятия видны в SettingsPage, на TripDetailSheet — документы поездки
4. TypeScript noEmit — 0 ошибок
5. Тест на dev — заход → создать поездку → закрыть → пройти по всем 4 табам — без regression

## Risks & mitigation

- **Risk:** старые роуты в push-уведомлениях/email — поломка deep-links → **Mitigation:** редиректы оставляем на 30 дней минимум.
- **Risk:** при удалении `DocumentsPage` теряются URL-якоря в feed-событиях → **Mitigation:** TripDetailSheet принимает `?doc=<id>` параметр.
- **Risk:** TodayPage используется как кэширующий компонент geo-tracking → **Mitigation:** проверить `GeoTripContext` зависимости перед удалением.
- **Risk:** Demo seed данные не совпадают с новой IA → **Mitigation:** не трогаем seed в Phase A, корректируем после смок-тестов.

## Non-goals (для Phase A)

- Не строим новые сущности данных (`MonthlyReport`, `ChecksFolder` и т.д.)
- Не меняем дизайн отдельных компонентов (`TripCard`, `Badge`, `Card`)
- Не трогаем биллинг / Pro gates
- Не реструктурируем wizard внутренне

## References

- `docs/Архитектура мобильного приложения учёта служебных поездок ИП и ООО.md` (ТЗ)
- `mockups/*-warm.html` — все 9 макетов
- `MEMORY.md` design_decision — Warm & Friendly как база
