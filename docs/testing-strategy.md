# Testing Strategy — drivedocs

Практический подход к тестированию на текущем этапе MVP.

**Принцип:** acceptance criteria в user stories и tasks — первичный инструмент верификации.
Формальные тесты добавляются там, где они дают реальную защиту, а не "для галочки".

---

## Test levels

### Level 1 — Manual acceptance check (основной для MVP)

**Когда:** любая реализованная T-xxx задача.

Каждая задача в `docs/tasks.md` имеет поле `**Acceptance:**` — это checklist для ручной проверки. После реализации человек или Claude проходит по нему.

Примеры:
- "Поездка появляется в списке после сохранения" → открыть TodayPage, добавить поездку, убедиться
- "Badge с unread count обновляется при markEventRead" → открыть NotificationsSheet, тапнуть событие, проверить badge

Acceptance criteria из `docs/user-stories.md` — расширенный вариант для проверки фичи целиком.

---

### Level 2 — Unit tests (для изолированной логики)

**Когда:** чистые функции без UI-зависимостей.

**Подходит для:**
- `getDocumentHelp(templateKey)` — проверить возвращаемые объекты
- Store-селекторы (`useTodayTrips`, `useUrgentDocuments`, `useUnreadEventsCount`) — логика фильтрации
- Утилиты форматирования дат/расстояний (если появятся)

**Не подходит для:** компоненты React, store actions с side-effects.

---

### Level 3 — Integration tests (для store + логики)

**Когда:** при реализации backend-интеграции (T-070+).

**Подходит для:**
- Store actions (`addTrip`, `updateDocumentStatus`, `markEventRead`) против реального API
- Onboarding flow (создание workspace + orgProfile + редирект)

**MVP-статус:** не реализованы. Приоритет растёт при подключении backend.

---

### Level 4 — E2E (браузерный smoke-test)

**Когда:** pre-release проверка критических путей.

**Минимальный набор для drivedocs:**
1. Онбординг → создание workspace → попадание на HomePage
2. Добавить поездку → появляется в TodayPage + TripsPage
3. Сменить статус документа → отражается на HomePage AttentionSection
4. Открыть событие → badge уменьшается

**MVP-статус:** не реализованы. Рассматривать при стабилизации UI.

---

## Трактовка "test-first" для drivedocs

### Для backend-логики и store (будущее):
Test-first уместен: написать тест на `addTrip` action → реализовать → тест проходит.

### Для UI-компонентов:
Test-first неуместен в MVP. UI меняется быстро. Acceptance criteria в tasks.md → ручная проверка → достаточно.

### Для UX-polish и small fixes:
Acceptance criteria в T-xxx заменяют тесты:
- "Кнопка не активна если поле пустое" — ручная проверка
- "Sheet закрывается при tap на backdrop" — ручная проверка

Формальный тест здесь избыточен и ломается при любом рефакторинге разметки.

---

## Когда acceptance criteria достаточно

Acceptance criteria из `docs/tasks.md` и `docs/user-stories.md` **заменяют формальные тесты** для:
- UX-фиксов и polish
- Изменений в навигации и маршрутизации
- Изменений в store, которые видны через UI
- Новых экранов и sheet-компонентов

Формальные тесты **добавляются** для:
- Чистых функций (утилиты, конфиги, селекторы)
- Store actions после подключения API
- Критических business-правил (правила подбора документов по конфигурации workspace)

---

## Связь с governance-циклом

В фазе **Tasks** (Phase 4 workflow): каждая задача должна иметь хотя бы один acceptance check.
В фазе **Code + Tests** (Phase 5): acceptance checks выполняются как ручная или автоматическая проверка.
В фазе **Review** (Phase 6): acceptance criteria из US-xxx — финальный критерий приёмки фичи.

See: `docs/superpowers-workflow.md` для контекста фаз.
