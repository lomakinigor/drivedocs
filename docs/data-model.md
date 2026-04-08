# Data Model

**Версия:** 3.0 — выровнена под фактическое состояние MVP кода.
**Дата:** 7 апреля 2026 г.

Сущности, которые не реализованы в коде, отмечены как `[planned]`.

---

## User

```typescript
interface User {
  id: string
  name: string
  email: string
}
```

**Связи:** один пользователь → много Workspace
**Используется в:** auth guard, MobileHeader (имя пользователя)
**Фичи:** F-001
**User stories:** US-001, US-002, US-011
**Примечание:** В MVP `isAuthenticated: true` — хардкод. Реальный auth не реализован.

---

## Workspace

```typescript
interface Workspace {
  id: string
  name: string
  entityType: EntityType           // 'ip' | 'ooo'
  taxMode: TaxMode                 // 'osn' | 'usn_income' | 'usn_income_expense' | 'patent'
  vehicleUsageModel: VehicleUsageModel  // 'compensation' | 'rent' | 'waybill'
  isConfigured: boolean
  createdAt: string                // ISO date
}
```

**Связи:** принадлежит User; содержит Trip[], WorkspaceDocument[], WorkspaceEvent[]; имеет один OrganizationProfile
**Используется в:** все страницы (workspace scoping по workspaceId в URL)
**Фичи:** F-001, F-002, F-010, F-013, F-015
**User stories:** US-001, US-002, US-003, US-011

---

## OrganizationProfile

```typescript
interface OrganizationProfile {
  workspaceId: string
  inn: string                      // ИНН
  vehicleModel: string             // Марка/модель автомобиля
}
```

**Связи:** один-к-одному с Workspace (по workspaceId)
**Используется в:** OnboardingWizard (создание), SettingsPage (отображение), resetWorkspaceConfig (удаление при сбросе)
**Фичи:** F-002, F-013
**User stories:** US-001, US-002, US-011

---

## Trip

```typescript
interface Trip {
  id: string
  workspaceId: string
  date: string                     // ISO date 'YYYY-MM-DD'
  startLocation: string
  endLocation: string
  distanceKm: number
  purpose: string
}
```

**Связи:** принадлежит Workspace (workspaceId)
**Используется в:** TodayPage, TripsPage, HomePage (RecentTripsSection), TripDetailSheet, AddTripSheet
**Фичи:** F-003, F-004, F-005, F-010, F-011
**User stories:** US-004, US-005, US-006, US-012

---

## WorkspaceDocument

```typescript
interface WorkspaceDocument {
  id: string
  workspaceId: string
  templateKey: string              // ключ в documentHelp config
  title: string
  description?: string
  type: 'one_time' | 'recurring'
  status: DocumentStatus           // 'required' | 'in_progress' | 'completed' | 'overdue'
  dueDate?: string                 // ISO date
  completedAt?: string             // ISO date, заполняется при status='completed'
}

type DocumentStatus = 'required' | 'in_progress' | 'completed' | 'overdue'
```

**Связи:** принадлежит Workspace (workspaceId); `templateKey` → `documentHelp.ts` (plain-language config)
**Используется в:** DocumentsPage, DocumentDetailSheet, HomePage (AttentionSection)
**Фичи:** F-006, F-007, F-012
**User stories:** US-007, US-008, US-010

---

## WorkspaceEvent

```typescript
interface WorkspaceEvent {
  id: string
  workspaceId: string
  type: EventType                  // 'trip_logged' | 'document_reminder' | 'fine' | 'system'
  title: string
  description: string
  date: string                     // ISO datetime
  isRead: boolean
  severity: 'info' | 'warning' | 'urgent'
}
```

**Связи:** принадлежит Workspace (workspaceId)
**Используется в:** EventsPage, EventDetailSheet, NotificationsSheet, BottomNav (unread badge), HomePage (AttentionSection)
**Фичи:** F-008, F-009, F-012, F-014
**User stories:** US-009, US-010, US-013

---

## OnboardingState

```typescript
interface OnboardingState {
  step: number
  entityType?: EntityType
  taxMode?: TaxMode
  vehicleUsageModel?: VehicleUsageModel
  workspaceName?: string
  inn?: string
  vehicleModel?: string
}
```

**Связи:** ephemeral; не сохраняется в persist; используется только во время wizard
**Используется в:** OnboardingWizard
**Фичи:** F-002
**User stories:** US-001, US-002

---

## Enums

```typescript
type EntityType = 'ip' | 'ooo'

type TaxMode = 'osn' | 'usn_income' | 'usn_income_expense' | 'patent'

type VehicleUsageModel = 'compensation' | 'rent' | 'waybill'

type EventType = 'trip_logged' | 'document_reminder' | 'fine' | 'system'
```

---

## Planned entities (не реализованы в MVP)

| Сущность | Назначение | Когда |
|----------|-----------|-------|
| Receipt | Чеки (фото + сумма + категория) | F-017 |
| Subscription | Биллинг и тарифный план | F-020 |
| Reminder | Правила отправки напоминаний | F-019 |

---

## Несоответствия с pre-MVP документацией

Следующие сущности были в старом `data-model.md`, но **не реализованы и не планируются в ближайших итерациях:**
- `TaxProfile` — заменён полями в `Workspace`
- `VehicleProfile` — заменён `vehicleModel` в `OrganizationProfile`
- `VehicleUsageModel` (как отдельная сущность) — заменён enum-полем в `Workspace`
- `OneTimeDocument` / `RecurringDocumentRequirement` — заменены единой `WorkspaceDocument` с полем `type`
- `Expense` — не реализовано
- `Fine` — представлено через `WorkspaceEvent` с `type: 'fine'`
- `HelpScenario` / `DecisionFlowSession` — заменены статическим `documentHelp.ts` config
