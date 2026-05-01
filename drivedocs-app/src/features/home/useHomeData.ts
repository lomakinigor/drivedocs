import {
  useCurrentWorkspace,
  useWorkspaceTrips,
  useTodayTrips,
  useUrgentDocuments,
  useUrgentEvents,
  useReceiptsForPeriod,
  useVehicleProfile,
  useDrivers,
  todayISO,
} from '@/app/store/workspaceStore'
import { buildAttentionItems, buildExpiryItems } from './attentionRules'
import type { AttentionItem } from './attentionRules'
import type { Trip } from '@/entities/types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MonthlyStats {
  tripCount: number
  totalKm: number
  monthLabel: string
}

export interface HomeData {
  isConfigured: boolean
  monthlyStats: MonthlyStats
  /** Unified attention items — produced by rule engine, reactive to store changes */
  attentionItems: AttentionItem[]
  recentTrips: Trip[]
  hasTodayTrips: boolean
  todayTripCount: number
}

export type { AttentionItem }

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Days to look back for unattached-receipt attention rule (D-AT02) */
const UNATTACHED_RECEIPT_WINDOW_DAYS = 7

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function currentMonthPrefix(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('ru-RU', { month: 'long' })
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useHomeData(workspaceId: string): HomeData {
  const workspace = useCurrentWorkspace()

  // Trips — live from store
  const allTrips = useWorkspaceTrips(workspaceId)
  const todayTrips = useTodayTrips(workspaceId)

  // Documents — live from store selector (reactive to updateDocumentStatus)
  const urgentDocs = useUrgentDocuments(workspaceId)

  // Events — live from store selector (reactive to markEventRead / addEvent)
  const urgentEvents = useUrgentEvents(workspaceId)

  // Receipts — unattached within the attention window (D-AT02)
  const recentReceipts = useReceiptsForPeriod(
    workspaceId,
    daysAgoISO(UNATTACHED_RECEIPT_WINDOW_DAYS - 1),
    todayISO(),
  )
  const unattachedReceipts = recentReceipts.filter((r) => !r.tripId)

  // Vehicle and drivers for expiry rules
  const vehicle = useVehicleProfile(workspaceId)
  const drivers = useDrivers(workspaceId)

  // Attention rule engine — pure function, no hooks
  const expiryItems = buildExpiryItems(vehicle ?? null, drivers)
  const attentionItems = [...buildAttentionItems(urgentDocs, urgentEvents, unattachedReceipts), ...expiryItems].sort(
    (a, b) => (a.severity === 'urgent' ? 0 : 1) - (b.severity === 'urgent' ? 0 : 1),
  )

  // Monthly aggregation
  const monthPrefix = currentMonthPrefix()
  const monthTrips = allTrips.filter((t) => t.date.startsWith(monthPrefix))
  const monthlyStats: MonthlyStats = {
    tripCount: monthTrips.length,
    totalKm: Math.round(monthTrips.reduce((sum, t) => sum + t.distanceKm, 0) * 10) / 10,
    monthLabel: currentMonthLabel(),
  }

  return {
    isConfigured: workspace?.isConfigured ?? true,
    monthlyStats,
    attentionItems,
    recentTrips: allTrips.slice(0, 3),
    hasTodayTrips: todayTrips.length > 0,
    todayTripCount: todayTrips.length,
  }
}
