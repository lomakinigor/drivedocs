// ─── Entity types ────────────────────────────────────────────────────────────

export type EntityType = 'IP' | 'OOO'

export type TaxMode =
  | 'OSN'
  | 'USN_INCOME'
  | 'USN_INCOME_MINUS_EXPENSES'
  | 'PATENT'
  | 'ESHN'

export type VehicleUsageModel =
  | 'COMPENSATION'   // Компенсация за использование личного авто (наиболее частая для ИП и ООО)
  | 'RENT'           // Аренда авто у сотрудника/ИП
  | 'FREE_USE'       // Договор безвозмездного пользования
  | 'OWN_IP'         // ИП — собственный автомобиль используется для бизнеса напрямую

// ─── User & subscription ─────────────────────────────────────────────────────

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'none'

export interface User {
  id: string
  email: string
  name: string
  subscriptionStatus: SubscriptionStatus
  subscriptionExpiresAt?: string // ISO date
  createdAt: string
}

// ─── Workspace subscription (billing, F-020) ──────────────────────────────────

export type PlanCode = 'free' | 'pro'

// Stripe-originated status values
export type SubscriptionPaymentStatus = 'active' | 'canceled' | 'past_due' | 'incomplete'

export interface WorkspaceSubscription {
  id: string
  workspaceId: string
  planCode: PlanCode
  status: SubscriptionPaymentStatus
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  currentPeriodEnd?: string  // ISO timestamptz
  createdAt: string
  updatedAt: string
}

// ─── Workspace (enterprise context) ─────────────────────────────────────────

export interface Workspace {
  id: string
  userId: string
  name: string               // e.g. "ИП Иванов А.В."
  entityType: EntityType
  taxMode: TaxMode
  vehicleUsageModel: VehicleUsageModel
  isConfigured: boolean      // false until onboarding completed
  createdAt: string
}

// ─── Organization profile ─────────────────────────────────────────────────────

export interface OrganizationProfile {
  workspaceId: string
  entityType: EntityType
  inn?: string
  ogrn?: string
  organizationName?: string
  ownerFullName?: string     // ФИО owner for ИП
}

// ─── Tax profile ─────────────────────────────────────────────────────────────

export interface TaxProfile {
  workspaceId: string
  taxMode: TaxMode
}

// ─── Vehicle profile ─────────────────────────────────────────────────────────

export interface VehicleProfile {
  workspaceId: string
  make: string
  model: string
  year: number
  licensePlate: string
  engineVolume?: number     // cc
  fuelType?: 'gasoline' | 'diesel' | 'electric' | 'hybrid'
  fuelConsumptionPer100km?: number  // litres per 100 km
  ownerFullName?: string
}

// ─── Trip ─────────────────────────────────────────────────────────────────────

export interface Trip {
  id: string
  workspaceId: string
  date: string              // ISO date
  startLocation: string
  endLocation: string
  distanceKm: number
  purpose: string
  notes?: string
  createdAt: string
}

// ─── Receipt ─────────────────────────────────────────────────────────────────

export type ReceiptCategory = 'fuel' | 'parking' | 'repair' | 'wash' | 'other'

export interface Receipt {
  id: string
  workspaceId: string
  tripId?: string
  date: string
  amount: number            // rubles
  category: ReceiptCategory
  description?: string
  imageUrl?: string
}

// ─── Expense ─────────────────────────────────────────────────────────────────

export interface Expense {
  id: string
  workspaceId: string
  date: string
  amount: number
  category: string
  description?: string
  receiptId?: string
}

// ─── Documents ────────────────────────────────────────────────────────────────

export type DocumentType = 'one_time' | 'recurring'
export type DocumentStatus = 'required' | 'in_progress' | 'completed' | 'overdue'

export interface WorkspaceDocument {
  id: string
  workspaceId: string
  title: string
  description?: string
  type: DocumentType
  status: DocumentStatus
  dueDate?: string
  completedAt?: string
  templateKey?: string      // refers to a legal template
  imageUrl?: string         // base64 data URL of scanned document photo
}

// ─── Events ──────────────────────────────────────────────────────────────────

export type EventType =
  | 'fine'
  | 'reminder'
  | 'document_due'
  | 'system'
  | 'trip_logged'
  | 'receipt_added'

export type EventSeverity = 'info' | 'warning' | 'urgent'

export interface WorkspaceEvent {
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

// ─── Reminders ────────────────────────────────────────────────────────────────

export type ReminderType = 'document' | 'trip' | 'payment' | 'custom'

export interface Reminder {
  id: string
  workspaceId: string
  title: string
  dueDate: string
  isCompleted: boolean
  type: ReminderType
}

// ─── Fines ────────────────────────────────────────────────────────────────────

export type FineStatus = 'unpaid' | 'paid' | 'disputed'

export interface Fine {
  id: string
  workspaceId: string
  amount: number
  date: string
  description: string
  status: FineStatus
  licensePlate: string
  articleCode?: string      // e.g. "КоАП 12.9"
}

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStep =
  | 'entity_type'
  | 'workspace_name'
  | 'inn'
  | 'tax_mode'
  | 'vehicle_model'
  | 'summary'
  | 'complete'

export interface OnboardingState {
  step: OnboardingStep
  entityType?: EntityType
  workspaceName?: string
  inn?: string
  taxMode?: TaxMode
  vehicleUsageModel?: VehicleUsageModel
}

// ─── Rule engine config (typed, static) ──────────────────────────────────────

export interface WorkspaceRuleConfig {
  entityType: EntityType
  taxMode: TaxMode
  vehicleUsageModel: VehicleUsageModel
  requiredDocuments: string[]    // document template keys
  compensationLimitMonthly?: number  // RUB, for COMPENSATION model
  canDeductFuel: boolean
  canDeductRepairs: boolean
  requiresWaybill: boolean
  requiresLogbook: boolean
}
