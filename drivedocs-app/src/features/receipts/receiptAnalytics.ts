import type { Receipt, ReceiptCategory } from '@/entities/types/domain'

// ─── Basic analytics ──────────────────────────────────────────────────────────

export interface ReceiptAnalytics {
  total: number
  byCategory: Record<ReceiptCategory, number>
}

export function buildReceiptAnalytics(receipts: Receipt[]): ReceiptAnalytics {
  const byCategory: Record<ReceiptCategory, number> = {
    fuel: 0,
    parking: 0,
    repair: 0,
    wash: 0,
    other: 0,
  }

  let total = 0

  for (const r of receipts) {
    total += r.amount
    byCategory[r.category] += r.amount
  }

  return { total, byCategory }
}

// ─── Enhanced analytics (Pro) ─────────────────────────────────────────────────

export interface CategoryStat {
  category: ReceiptCategory
  amount: number
  count: number
  pct: number
}

export interface EnhancedAnalytics {
  total: number
  count: number
  average: number
  categories: CategoryStat[]
  /** Difference vs previous period in %. null if not enough data to compare. */
  trendPct: number | null
}

export function buildEnhancedAnalytics(
  current: Receipt[],
  previous: Receipt[],
): EnhancedAnalytics {
  const total = current.reduce((sum, r) => sum + r.amount, 0)
  const count = current.length
  const average = count > 0 ? Math.round(total / count) : 0

  const countByCategory: Record<ReceiptCategory, number> = {
    fuel: 0, parking: 0, repair: 0, wash: 0, other: 0,
  }
  const amountByCategory: Record<ReceiptCategory, number> = {
    fuel: 0, parking: 0, repair: 0, wash: 0, other: 0,
  }

  for (const r of current) {
    countByCategory[r.category] += 1
    amountByCategory[r.category] += r.amount
  }

  const categories: CategoryStat[] = (Object.keys(amountByCategory) as ReceiptCategory[])
    .filter((cat) => amountByCategory[cat] > 0)
    .map((cat) => ({
      category: cat,
      amount: amountByCategory[cat],
      count: countByCategory[cat],
      pct: total > 0 ? Math.round((amountByCategory[cat] / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  const prevTotal = previous.reduce((sum, r) => sum + r.amount, 0)
  let trendPct: number | null = null
  if (prevTotal > 0) {
    trendPct = Math.round(((total - prevTotal) / prevTotal) * 100)
  }

  return { total, count, average, categories, trendPct }
}
