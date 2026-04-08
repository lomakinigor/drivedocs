import type { Receipt, ReceiptCategory } from '@/entities/types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ReceiptAnalytics {
  total: number
  byCategory: Record<ReceiptCategory, number>
}

// ─── Pure function (D-QR05) ───────────────────────────────────────────────────

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
