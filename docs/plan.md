# Implementation Plan — drivedocs

**Ссылки:** [PRD](PRD.md) | [Tech Spec](tech-spec.md) | [Features](features.md) | [Tasks](tasks.md)
**Дата:** 7 апреля 2026 г.

**Правило:** код не пишется, пока план не согласован с человеком для задач уровня "фича". Для мелких фиксов (1–3 файла, очевидный scope) план может быть изложен inline в ответе. Этот документ — living document, обновляется по мере прогресса.

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
| 6 | Monthly report + clipboard export | planned |
| 7 | Receipt capture | planned |
| 8 | Backend API integration | draft |
| 9 | Real auth + subscription enforcement | draft |

---

## Phase 6 — Monthly report (next)

**Цель:** пользователь получает текстовый отчёт за месяц (поездки, пробег, маршруты) прямо с телефона и может скопировать его для отправки в бухгалтерию.

**Задачи:**
- T-060: Monthly trip report + clipboard export

**Затронутые файлы:**
- `src/features/trips/MonthlyReportSheet.tsx` (новый)
- `src/pages/TripsPage.tsx` (кнопка "Отчёт")
- возможно: `src/pages/HomePage.tsx` (ссылка)

**Acceptance:**
- Sheet открывается с TripsPage.
- Показывает: месяц, количество поездок, суммарный км, список маршрутов с датами.
- Кнопка "Скопировать" копирует форматированный текст в clipboard.
- `navigator.clipboard.writeText()` — fallback если недоступно: показать текст для ручного копирования.

**Тесты / проверки:**
- Копирование работает в мобильном Safari.
- Список корректен при 0 поездках (empty state).
- Месяц соответствует текущему месяцу по умолчанию.

---

## Phase 7 — Receipt capture (planned)

**Цель:** пользователь прикрепляет чек к записи из TodayPage.

**Задачи:**
- T-061: Receipt capture flow

**Acceptance:** TBD при спецификации.

---

## Phase 8 — Backend integration (draft)

**Цель:** заменить Zustand mock-данные на API-интеграцию.

**Принцип:** store actions (`addTrip`, `updateDocumentStatus`, etc.) остаются публичным интерфейсом. Реализация actions переключается с мутации состояния на API-вызов + optimistic update или refetch. Компоненты не меняются.

**Задачи:** T-070, T-071, T-072

---

## Traceability index

| Phase | Features | Key Tasks | User Stories |
|-------|----------|-----------|--------------|
| 0 — Foundation | — | T-001..T-005 | — |
| 1 — Workspace + Onboarding | F-001, F-002, F-013, F-015 | T-010..T-013 | US-001, US-002, US-003, US-011 |
| 2 — Trips | F-003, F-004, F-005, F-011 | T-020..T-024 | US-004, US-005, US-006, US-012 |
| 3 — Documents | F-006, F-007 | T-030..T-033 | US-007, US-008 |
| 4 — Events + Notifications | F-008, F-009, F-014 | T-040..T-045 | US-009, US-013 |
| 5 — Home + Detail flows | F-010, F-012 | T-050..T-053 | US-010 |
| 6 — Monthly report (next) | F-016 | T-060 | US-005 (расширение) |
| 7 — Receipts | F-017 | T-061 | — |
| 8 — Backend | — | T-070 | all |
| 9 — Auth + Billing | F-020 | T-071, T-072 | US-001..US-003 |

---

## Completed task list (Phase 0–5)

T-001, T-002, T-003, T-004, T-005,
T-010, T-011, T-012, T-013,
T-020, T-021, T-022, T-023, T-024,
T-030, T-031, T-032, T-033,
T-040, T-041, T-042, T-043, T-044, T-045,
T-050, T-051, T-052, T-053
