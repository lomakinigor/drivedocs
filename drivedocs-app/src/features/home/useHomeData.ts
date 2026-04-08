import {
  useCurrentWorkspace,
  useWorkspaceTrips,
  useTodayTrips,
  useUrgentDocuments,
  useUrgentEvents,
} from '@/app/store/workspaceStore'
import { buildAttentionItems } from './attentionRules'
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

  // Attention rule engine — pure function, no hooks
  const attentionItems = buildAttentionItems(urgentDocs, urgentEvents)

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
