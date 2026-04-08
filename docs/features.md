# Features

Feature registry. Each entry is traceable to user stories and tasks.
Status: `draft` | `planned` | `in-dev` | `done`

---

## F-001 — Multi-workspace model

**Описание:** Один аккаунт может содержать несколько независимых рабочих пространств (предприятий). Каждый workspace имеет собственную конфигурацию (тип, налоговый режим, правовая модель) и изолированные данные (поездки, документы, события).

**Экраны / потоки:** SettingsPage, workspace routing (`/w/:workspaceId/*`), WorkspaceSwitcher
**Связанные user stories:** US-001, US-002, US-003, US-011
**Связанные tasks:** T-010, T-012, T-013
**Статус:** done

---

## F-002 — Onboarding wizard

**Описание:** Многошаговый wizard при создании или перенастройке workspace. Шаги: тип предприятия (ИП/ООО) → налоговый режим → модель использования автомобиля → название workspace → ИНН → модель автомобиля → итог. Поддерживает два режима: создание нового workspace и перенастройка существующего (через `?ws=<id>`).

**Экраны / потоки:** OnboardingWizard (7 шагов), `/onboarding`
**Связанные user stories:** US-001, US-002
**Связанные tasks:** T-011
**Статус:** done

---

## F-003 — Quick trip entry (global)

**Описание:** AddTripSheet доступен с любого экрана через MobileLayout. Открывается через React Context (`QuickTripContext`). После сохранения поездки создаётся событие `trip_logged` в ленте событий. Пользователь остаётся на текущем экране.

**Экраны / потоки:** AddTripSheet (bottom sheet), MobileHeader (кнопка +), TodayPage CTA, TripsPage кнопка, HomePage CTA
**Связанные user stories:** US-004
**Связанные tasks:** T-020, T-024, T-045
**Статус:** done

---

## F-004 — Trip list & history

**Описание:** Список всех поездок для workspace, сортировка по дате (новые сверху). Показывает маршрут, расстояние, дату, цель. Пустое состояние с CTA.

**Экраны / потоки:** TripsPage
**Связанные user stories:** US-004, US-005
**Связанные tasks:** T-022
**Статус:** done

---

## F-005 — Trip detail + delete

**Описание:** Tap на TripCard открывает TripDetailSheet с деталями: полный маршрут, км, цель, дата. Удаление с подтверждением (inline confirm block). После удаления sheet закрывается, список обновляется реактивно.

**Экраны / потоки:** TripDetailSheet (bottom sheet), TodayPage, TripsPage, HomePage RecentTripsSection
**Связанные user stories:** US-005, US-006
**Связанные tasks:** T-051, T-053
**Статус:** done

---

## F-006 — Document center

**Описание:** Список документов для workspace, сгруппированных по статусу (Нужны / В работе / Готовы). Прогресс-бар. Быстрая кнопка "Готово" прямо из списка. Пустое состояние если документов нет.

**Экраны / потоки:** DocumentsPage
**Связанные user stories:** US-007
**Связанные tasks:** T-031
**Статус:** done

---

## F-007 — Document detail + status actions

**Описание:** Tap на документ открывает DocumentDetailSheet с: статус-badge, дата дедлайна/готовности, "Зачем нужен" (plain-language), "Как подготовить", tip. Действия: "Отметить как готовый", "Пометить В работе", "Отменить готовность". Все изменения через store → реактивно обновляют DocumentsPage и HomePage.

**Экраны / потоки:** DocumentDetailSheet (bottom sheet), DocumentsPage, HomePage AttentionSection
**Связанные user stories:** US-007, US-008
**Связанные tasks:** T-032, T-033, T-052
**Статус:** done

---

## F-008 — Event feed

**Описание:** Лента событий для workspace: все события (trip_logged, штрафы, напоминания и т.п.) в обратном хронологическом порядке. Фильтр штрафов. Пустые состояния с учётом контекста (есть штрафы / нет вообще ничего).

**Экраны / потоки:** EventsPage
**Связанные user stories:** US-009
**Связанные tasks:** T-041
**Статус:** done

---

## F-009 — Event detail + mark read

**Описание:** Tap на событие → EventDetailSheet. При открытии sheet событие автоматически помечается прочитанным (useEffect). Показывает тип, severity badge, описание, дату.

**Экраны / потоки:** EventDetailSheet (bottom sheet), EventsPage, NotificationsSheet
**Связанные user stories:** US-009, US-013
**Связанные tasks:** T-042, T-043, T-044
**Статус:** done

---

## F-010 — Home dashboard

**Описание:** Главный экран. Конфиг-strip (tax mode, vehicle model). TodayCTA если нет поездок за сегодня. Месячная статистика (поездки + км). Секция "Требуют внимания" (срочные документы + события). Последние поездки. Guard если workspace не настроен.

**Экраны / потоки:** HomePage
**Связанные user stories:** US-010
**Связанные tasks:** T-050, T-052, T-053
**Статус:** done

---

## F-011 — Today journal

**Описание:** Экран "Сегодня": дата, счётчик поездок за сегодня, success banner при добавлении. Быстрые действия: поездка, чек (заглушка). Журнал за сегодня — список TripCard или пустое состояние.

**Экраны / потоки:** TodayPage
**Связанные user stories:** US-004, US-012
**Связанные tasks:** T-023, T-051
**Статус:** done

---

## F-012 — Attention layer (home)

**Описание:** На HomePage показывается секция "Требуют внимания" — до 3 элементов: сначала срочные документы (required/overdue), потом urgent/warning события. Tap на документ → DocumentDetailSheet. Tap на событие → EventsPage. Если элементов > 3 — ссылка "Все →".

**Экраны / потоки:** AttentionSection в HomePage
**Связанные user stories:** US-010
**Связанные tasks:** T-050, T-052
**Статус:** done

---

## F-013 — Workspace settings

**Описание:** SettingsPage: карточка текущего workspace (имя, тип, налоговый режим, модель авто). Переименование (inline RenameSheet). Список всех workspace с переключением. Добавление нового workspace (→ OnboardingWizard). Danger zone: сброс конфигурации с inline подтверждением. Блок аккаунта.

**Экраны / потоки:** SettingsPage, RenameSheet (inline)
**Связанные user stories:** US-011
**Связанные tasks:** T-013
**Статус:** done

---

## F-014 — Notifications mini-feed

**Описание:** Bell в MobileHeader → NotificationsSheet: список непрочитанных событий. Tap на событие → markEventRead, EventDetailSheet. Ссылка "Все события →" ведёт на EventsPage. Unread badge (красный кружок, 9+) на Bell-иконке в BottomNav.

**Экраны / потоки:** NotificationsSheet, MobileHeader, BottomNav
**Связанные user stories:** US-013
**Связанные tasks:** T-043, T-044
**Статус:** done

---

## F-015 — Workspace switcher

**Описание:** Tap на имя workspace в MobileHeader → WorkspaceSwitcher sheet: список всех workspace с active-check, переключение, кнопка добавить новый (→ OnboardingWizard).

**Экраны / потоки:** WorkspaceSwitcher (bottom sheet), MobileHeader
**Связанные user stories:** US-003, US-011
**Связанные tasks:** T-012
**Статус:** done

---

## Planned / upcoming

| ID | Название | Статус |
|----|----------|--------|
| F-016 | Monthly trip report + clipboard export | planned |
| F-017 | Receipt capture flow | planned |
| F-018 | PDF путевых листов | draft |
| F-019 | Push / email напоминания | draft |
| F-020 | Биллинг и управление подпиской | draft |
