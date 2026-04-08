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

## Planned / upcoming

| ID | Название | Статус |
|----|----------|--------|
| F-016 | Monthly trip report + clipboard export | planned |
| F-017 | Receipt capture flow | planned |
| F-018 | PDF путевых листов | draft |
| F-019 | Push / email напоминания | draft |
| F-020 | Биллинг и управление подпиской | draft |
