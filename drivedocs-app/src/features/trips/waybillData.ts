import type { Trip, Workspace, OrganizationProfile, VehicleProfile, EntityType } from '@/entities/types/domain'

// ─── Derived export types (D-011) ────────────────────────────────────────────

export interface WaybillExportRow {
  id: string
  date: string        // ISO date 'YYYY-MM-DD'
  route: string       // "Откуда → Куда"
  purpose: string
  distanceKm: number | null
}

export interface MonthlyWaybillTotals {
  tripsCount: number
  totalDistanceKm: number  // sum of rows where distanceKm is known
}

export interface MonthlyWaybillData {
  workspaceId: string
  entityType: EntityType       // 'IP' | 'OOO' — for signature block wording
  fromDate: string             // ISO date — period start, for filename + doc date
  toDate: string               // ISO date — period end (same as fromDate for daily)
  periodLabel: string          // "апрель 2026" or "30 апреля 2026"
  organizationName: string     // resolved or fallback to workspace.name
  organizationInn: string | null
  organizationOgrn: string | null  // ОГРН (ООО) or ОГРНИП (ИП), gracefully null
  vehicleLabel: string         // "Toyota Camry А123ВГ77" or fallback
  driverLabel: string          // owner full name or fallback
  rows: WaybillExportRow[]
  totals: MonthlyWaybillTotals
  warnings: string[]
  isExportReady: boolean       // false if trips === 0 or critical fields missing
}

export interface MonthlyWaybillInput {
  workspace: Workspace
  orgProfile: OrganizationProfile | null
  vehicleProfile: VehicleProfile | null
  trips: Trip[]      // pre-filtered for the period by the caller
  fromDate: string   // ISO date — period start, used for label
  toDate: string     // ISO date — period end (inclusive)
}

// ─── Pure function (D-010, D-011) ────────────────────────────────────────────

/**
 * Prepares a typed data structure for waybill preview and PDF export (F-018).
 * Pure function — no hooks, no store access, no side effects.
 *
 * Caller is responsible for pre-filtering trips to the desired period.
 * fromDate is used only for periodLabel derivation.
 */
export function buildMonthlyWaybillData(input: MonthlyWaybillInput): MonthlyWaybillData {
  const { workspace, orgProfile, vehicleProfile, trips, fromDate } = input
  const warnings: string[] = []

  // Period label — "30 апреля 2026" for single day, "апрель 2026" for month range
  const { toDate } = input
  const periodLabel =
    fromDate === toDate
      ? new Date(fromDate + 'T00:00:00').toLocaleDateString('ru-RU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : new Date(fromDate + 'T00:00:00').toLocaleDateString('ru-RU', {
          month: 'long',
          year: 'numeric',
        })

  // Organization name — most specific source first
  const organizationName =
    orgProfile?.organizationName ??
    orgProfile?.ownerFullName ??
    workspace.name

  if (!orgProfile) {
    warnings.push('Не указан профиль организации')
  }

  // Vehicle label
  let vehicleLabel: string
  if (vehicleProfile) {
    vehicleLabel = `${vehicleProfile.make} ${vehicleProfile.model} ${vehicleProfile.licensePlate}`
  } else {
    vehicleLabel = 'Автомобиль не указан'
    warnings.push('Не указаны данные автомобиля')
  }

  // Driver label — ФИО owner preferred; workspace.name is last resort
  const hasDriverName = !!(orgProfile?.ownerFullName ?? vehicleProfile?.ownerFullName)
  const driverLabel =
    orgProfile?.ownerFullName ??
    vehicleProfile?.ownerFullName ??
    workspace.name

  if (!hasDriverName) {
    warnings.push('Не указано ФИО водителя')
  }

  if (trips.length === 0) {
    warnings.push('Нет поездок за выбранный период')
  }

  // Rows — sorted ascending by date
  const sorted = [...trips].sort((a, b) => a.date.localeCompare(b.date))

  const rows: WaybillExportRow[] = sorted.map((t) => ({
    id: t.id,
    date: t.date,
    route: `${t.startLocation.split(',')[0].trim()} → ${t.endLocation.split(',')[0].trim()}`,
    purpose: t.purpose,
    distanceKm: t.distanceKm,
  }))

  const totalDistanceKm = rows.reduce((sum, r) => sum + (r.distanceKm ?? 0), 0)

  const totals: MonthlyWaybillTotals = {
    tripsCount: trips.length,
    totalDistanceKm,
  }

  // Export is ready only when the document would be printable
  const isExportReady = trips.length > 0 && vehicleProfile !== null && !!orgProfile

  return {
    workspaceId: workspace.id,
    entityType: workspace.entityType,
    fromDate,
    toDate,
    periodLabel,
    organizationName,
    organizationInn: orgProfile?.inn ?? null,
    organizationOgrn: orgProfile?.ogrn ?? null,
    vehicleLabel,
    driverLabel,
    rows,
    totals,
    warnings,
    isExportReady,
  }
}
