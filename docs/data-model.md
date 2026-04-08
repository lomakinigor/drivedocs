# Data Model

**Версия:** 3.0 — выровнена под фактическое состояние MVP кода.
**Дата:** 7 апреля 2026 г.

Сущности, которые не реализованы в коде, отмечены как `[planned]`.

---

## User

```typescript
interface User {
  id: string
  email: string
  name: string
  subscriptionStatus: SubscriptionStatus  // 'active' | 'trial' | 'expired' | 'none'
  subscriptionExpiresAt?: string          // ISO date
  createdAt: string
}
```

**Relations:** один пользователь → много Workspace
**Used in:** auth guard, MobileHeader (имя пользователя)
**Used by Features:** F-001
**Used by User Stories:** US-001, US-002, US-011
**Note:** В MVP `isAuthenticated: true` — хардкод. `subscriptionStatus` присутствует в типе, но биллинг не реализован (F-020, planned).

---

## Workspace

```typescript
interface Workspace {
  id: string
  userId: string
  name: string                          // e.g. "ИП Иванов А.В."
  entityType: EntityType                // 'IP' | 'OOO'
  taxMode: TaxMode                      // 'OSN' | 'USN_INCOME' | 'USN_INCOME_MINUS_EXPENSES' | 'PATENT' | 'ESHN'
  vehicleUsageModel: VehicleUsageModel  // 'COMPENSATION' | 'RENT' | 'FREE_USE'
  isConfigured: boolean                 // false until onboarding completed
  createdAt: string                     // ISO date
}
```

**Relations:** принадлежит User (userId); содержит Trip[], WorkspaceDocument[], WorkspaceEvent[]
**Used in:** все страницы (workspace scoping по workspaceId в URL)
**Used by Features:** F-001, F-002, F-010, F-013, F-015
**Used by User Stories:** US-001, US-002, US-003, US-011

---

## OrganizationProfile

```typescript
interface OrganizationProfile {
  workspaceId: string
  entityType: EntityType
  inn?: string               // ИНН
  ogrn?: string              // ОГРН (для ООО)
  organizationName?: string  // Наименование организации
  ownerFullName?: string     // ФИО владельца (для ИП)
}
```

**Relations:** один-к-одному с Workspace (по workspaceId)
**Used in:** OnboardingWizard (создание), SettingsPage (отображение), resetWorkspaceConfig (удаление при сбросе)
**Used by Features:** F-002, F-013
**Used by User Stories:** US-001, US-002, US-011
**Note:** `vehicleModel` не входит в OrganizationProfile — данные об автомобиле хранятся в отдельном `VehicleProfile`.

---

## Trip

```typescript
interface Trip {
  id: string
  workspaceId: string
  date: string          // ISO date 'YYYY-MM-DD'
  startLocation: string
  endLocation: string
  distanceKm: number
  purpose: string
  notes?: string
  createdAt: string
}
```

**Relations:** принадлежит Workspace (workspaceId)
**Used in:** TodayPage, TripsPage, HomePage (RecentTripsSection), TripDetailSheet, AddTripSheet
**Used by Features:** F-003, F-004, F-005, F-010, F-011
**Used by User Stories:** US-004, US-005, US-006, US-012

---

## WorkspaceDocument

```typescript
type DocumentType = 'one_time' | 'recurring'
type DocumentStatus = 'required' | 'in_progress' | 'completed' | 'overdue'

interface WorkspaceDocument {
  id: string
  workspaceId: string
  title: string
  description?: string
  type: DocumentType
  status: DocumentStatus
  dueDate?: string                 // ISO date
  completedAt?: string             // ISO date, заполняется при status='completed'
  templateKey?: string             // опциональный ключ в documentHelp config
}
```

**Relations:** принадлежит Workspace (workspaceId); `templateKey` → `documentHelp.ts` (plain-language config)
**Used in:** DocumentsPage, DocumentDetailSheet, HomePage (AttentionSection)
**Used by Features:** F-006, F-007, F-012
**Used by User Stories:** US-007, US-008, US-010

---

## WorkspaceEvent

```typescript
type EventType = 'fine' | 'reminder' | 'document_due' | 'system' | 'trip_logged' | 'receipt_added'
type EventSeverity = 'info' | 'warning' | 'urgent'

interface WorkspaceEvent {
  id: string
  workspaceId: string
  type: EventType
  title: string
  description: string
  date: string              // ISO datetime
  isRead: boolean
  severity: EventSeverity
  linkTo?: string           // optional deep link
}
```

**Relations:** принадлежит Workspace (workspaceId)
**Used in:** EventsPage, EventDetailSheet, NotificationsSheet, BottomNav (unread badge), HomePage (AttentionSection)
**Used by Features:** F-008, F-009, F-012, F-014
**Used by User Stories:** US-009, US-010, US-013

---

## OnboardingState

```typescript
type OnboardingStep =
  | 'entity_type'
  | 'workspace_name'
  | 'inn'
  | 'tax_mode'
  | 'vehicle_model'
  | 'summary'
  | 'complete'

interface OnboardingState {
  step: OnboardingStep          // строковый union, не number
  entityType?: EntityType
  workspaceName?: string
  inn?: string
  taxMode?: TaxMode
  vehicleUsageModel?: VehicleUsageModel
}
```

**Relations:** ephemeral; не сохраняется в persist; используется только во время wizard
**Used in:** OnboardingWizard
**Used by Features:** F-002
**Used by User Stories:** US-001, US-002

---

## Enums

```typescript
type EntityType = 'IP' | 'OOO'

type TaxMode = 'OSN' | 'USN_INCOME' | 'USN_INCOME_MINUS_EXPENSES' | 'PATENT' | 'ESHN'

type VehicleUsageModel = 'COMPENSATION' | 'RENT' | 'FREE_USE'
//  COMPENSATION — компенсация за использование личного авто
//  RENT         — аренда авто у сотрудника/ИП
//  FREE_USE     — договор безвозмездного пользования

type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'none'
```

---

## TaxProfile

```typescript
interface TaxProfile {
  workspaceId: string
  taxMode: TaxMode
}
```

**Relations:** один-к-одному с Workspace (по workspaceId)
**Used by Features:** F-002
**Note:** Существует как отдельный тип в коде. В текущем MVP дублирует поле `taxMode` в `Workspace`; используется для детализации налоговой конфигурации в будущих итерациях.

---

## VehicleProfile

```typescript
interface VehicleProfile {
  workspaceId: string
  make: string
  model: string
  year: number
  licensePlate: string
  engineVolume?: number      // cc
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  ownerFullName?: string
}
```

**Relations:** один-к-одному с Workspace (по workspaceId)
**Used by Features:** F-002, F-013
**Note:** Существует как тип в коде. В текущем MVP данные об автомобиле вводятся в OnboardingWizard, но не сохраняются в отдельную сущность — хранятся в store как часть конфигурации. Полное использование запланировано в будущих итерациях.

---

## WorkspaceRuleConfig

```typescript
interface WorkspaceRuleConfig {
  entityType: EntityType
  taxMode: TaxMode
  vehicleUsageModel: VehicleUsageModel
  requiredDocuments: string[]          // document template keys
  compensationLimitMonthly?: number    // RUB, для COMPENSATION модели
  canDeductFuel: boolean
  canDeductRepairs: boolean
  requiresWaybill: boolean
  requiresLogbook: boolean
}
```

**Relations:** статическая конфигурация; не персистируется; вычисляется из параметров Workspace
**Used by Features:** F-002, F-006, F-007
**Note:** Rule engine config — определяет, какие документы требуются для данной комбинации entityType + taxMode + vehicleUsageModel.

---

## Receipt

```typescript
type ReceiptCategory = 'fuel' | 'parking' | 'repair' | 'wash' | 'other'

interface Receipt {
  id: string
  workspaceId: string
  tripId?: string        // optional link to a Trip
  date: string           // ISO date 'YYYY-MM-DD'
  amount: number         // roubles
  category: ReceiptCategory
  description?: string
  imageUrl?: string      // not used in MVP, reserved for photo capture (F-017)
}
```

**Relations:** принадлежит Workspace (workspaceId); опционально связан с Trip (tripId)
**Used in:** QuickReceiptSheet, workspaceStore (`receipts[]`, `addReceipt`)
**Used by Features:** F-QR01
**Used by User Stories:** US-QR01
**Note:** `tripId` и `imageUrl` — reserved для будущего расширения (F-017 full receipt capture). В MVP — опциональны и не отображаются.

---

## AttentionItem

```typescript
type AttentionItemKind = 'document' | 'event'

interface AttentionItem {
  id: string
  kind: AttentionItemKind
  title: string
  subtitle?: string
  severity: 'urgent' | 'warning'
  document?: WorkspaceDocument   // present if kind === 'document'
  event?: WorkspaceEvent         // present if kind === 'event'
}
```

**Relations:** виртуальная сущность — создаётся функцией `buildAttentionItems()`, не персистируется
**Used in:** `attentionRules.ts`, `useHomeData`, `HomePage/AttentionSection`
**Used by Features:** F-AT01, F-012
**Used by User Stories:** US-AT01

---

## Entities defined in code, not yet wired in UI

Следующие интерфейсы определены в `domain.ts`, но UI для них не реализован в текущем MVP:

| Entity | Назначение | Feature |
|--------|-----------|---------|
| `Expense` | Расходы, связанные с автомобилем | — (planned) |
| `Fine` | Штрафы ГИБДД с деталями (КоАП, сумма, статус) | — (сейчас через WorkspaceEvent type='fine') |
| `Reminder` | Правила напоминаний | F-019 (draft) |

---

## Несоответствия с pre-MVP документацией

- `OneTimeDocument` / `RecurringDocumentRequirement` → заменены единой `WorkspaceDocument` с полем `type`
- `HelpScenario` / `DecisionFlowSession` → заменены статическим `documentHelp.ts` config
- `VehicleUsageModel` `'waybill'` → переименован в `'FREE_USE'` в коде
- `TaxMode` `'usn_income_expense'` → переименован в `'USN_INCOME_MINUS_EXPENSES'`; добавлен `'ESHN'`
- Все enum values → **uppercase** в коде (`'IP'` не `'ip'`, `'OSN'` не `'osn'`)
