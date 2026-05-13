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
  | 'BALANCE'        // Автомобиль на балансе предприятия (служебный транспорт)

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
  /**
   * @deprecated 2026-05-13 — essentials критичны, ack убран. Без них путевой
   *   лист недействителен — пропустить нельзя. Поле сохранено только для
   *   обратной совместимости с persisted localStorage (не используется в логике).
   */
  essentialsAck?: boolean
  /**
   * F-027 — преднабор для расчёта нормы расхода АМ-23-р. Заполняется один раз
   * в Settings; коэффициенты применяются автоматически к каждой поездке.
   */
  fuelProfile?: FuelProfile
  createdAt: string
}

// F-027 — Fuel norm profile (АМ-23-р)
export type CitySize = 'mega' | 'large' | 'medium' | 'small' | 'tiny'
export type WinterRegion = 'mild' | 'moderate' | 'severe' | 'extreme'

export interface FuelProfile {
  /** Размер города для городского режима. Если не задан — берём 'medium'. */
  citySize?: CitySize
  /** Зимний регион — для авто-надбавки в холодный сезон. */
  winterRegion?: WinterRegion
  /** Кондиционер/климат-контроль (+7% в тёплое время года). */
  hasAC?: boolean
}

// ─── Organization profile ─────────────────────────────────────────────────────

export interface OrganizationProfile {
  workspaceId: string
  entityType: EntityType
  organizationName?: string
  ownerFullName?: string     // ФИО owner для ИП / руководитель для ООО
  inn?: string
  kpp?: string               // КПП (только для ООО)
  ogrn?: string              // ОГРН (ООО) или ОГРНИП (ИП)
  address?: string           // Юридический адрес
  city?: string              // Город (используется в документах)
  phone?: string
  email?: string
  bankName?: string          // Наименование банка
  bankBik?: string           // БИК банка
  bankAccount?: string       // Расчётный счёт
  bankCorAccount?: string    // Корреспондентский счёт
  accountantName?: string    // ФИО главного бухгалтера
}

// ─── Tax profile ─────────────────────────────────────────────────────────────

export interface TaxProfile {
  workspaceId: string
  taxMode: TaxMode
}

// ─── Vehicle profile ─────────────────────────────────────────────────────────

export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid'

export interface VehicleProfile {
  workspaceId: string
  make: string
  model: string
  year: number
  licensePlate: string
  engineVolume?: number     // cc
  enginePowerHp?: number    // л.с.
  vehicleCategory?: string  // A, B, C, D, ...
  fuelType?: FuelType
  fuelConsumptionPer100km?: number  // litres per 100 km
  ownerFullName?: string

  // ПТС
  ptsNumber?: string        // серия и номер ПТС
  vin?: string

  // СТС
  stsNumber?: string        // номер свидетельства о регистрации
  stsDate?: string          // дата регистрации ISO

  // ОСАГО
  osagoNumber?: string
  osagoInsurer?: string     // наименование страховщика
  osagoExpires?: string     // ISO date — дата окончания полиса
  kaskoNumber?: string
  kaskoInsurer?: string
  kaskoExpires?: string

  // Техосмотр (ТО)
  techInspectionExpires?: string  // ISO date
}

// ─── Driver ──────────────────────────────────────────────────────────────────

export interface Driver {
  id: string
  workspaceId: string
  fullName: string
  licenseNumber: string     // серия + номер ВУ, напр. «77 АА 123456»
  licenseIssueDate?: string // ISO date
  licenseExpires?: string   // ISO date — напоминание за 30 и 7 дней
  licenseCategories?: string // напр. «B, C»
  isDefault?: boolean       // основной водитель для путевых листов
}

// ─── Trip ─────────────────────────────────────────────────────────────────────

/** F-027 · приказ Минтранса 368 — режим поездки для расчёта нормы расхода */
export type TripMode = 'city' | 'suburban'

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

  // F-027 — показания одометра (приказ 368 п. 6 — обязательное поле путевого)
  odometerStart?: number    // км на момент выезда
  odometerEnd?: number      // км на момент возврата
  tripMode?: TripMode       // по умолчанию 'city'
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
