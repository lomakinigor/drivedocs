import type { WorkspaceDocument, WorkspaceEvent, Receipt } from '@/entities/types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttentionItemKind = 'document' | 'event' | 'receipt'

/**
 * Unified attention item — produced by buildAttentionItems(), never persisted.
 * Add new kinds here when extending the rule engine (D-AT01, D-AT02).
 */
export interface AttentionItem {
  id: string
  kind: AttentionItemKind
  title: string
  subtitle?: string
  severity: 'urgent' | 'warning'
  // Typed payloads — present based on kind
  document?: WorkspaceDocument
  event?: WorkspaceEvent
}

// ─── Rule engine ──────────────────────────────────────────────────────────────

/**
 * Pure function — no hooks, no side effects.
 *
 * Rules (extend here to add new attention item types):
 *  - Documents: status 'required' or 'overdue'
 *  - Events: unread, severity 'urgent' or 'warning'
 *  - Receipts: unattached (no tripId) in recent window → single warning card (D-AT02)
 *
 * Sort order: urgent before warning; within same severity, docs before events before receipts.
 *
 * @param unattachedReceipts - receipts without tripId for the attention window (e.g. last 7 days).
 *   Defaults to [] for backward compatibility — existing callers need no changes.
 */
export function buildAttentionItems(
  docs: WorkspaceDocument[],
  events: WorkspaceEvent[],
  unattachedReceipts: Receipt[] = [],
): AttentionItem[] {
  const docItems: AttentionItem[] = docs
    .filter((d) => d.status === 'required' || d.status === 'overdue')
    .map((d) => ({
      id: `doc-${d.id}`,
      kind: 'document' as const,
      title: d.title,
      subtitle: d.dueDate
        ? `До ${new Date(d.dueDate).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
          })}`
        : undefined,
      severity: (d.status === 'overdue' ? 'urgent' : 'warning') as 'urgent' | 'warning',
      document: d,
    }))

  const eventItems: AttentionItem[] = events
    .filter((e) => !e.isRead && (e.severity === 'urgent' || e.severity === 'warning'))
    .map((e) => ({
      id: `ev-${e.id}`,
      kind: 'event' as const,
      title: e.title,
      subtitle: e.description,
      severity: e.severity as 'urgent' | 'warning',
      event: e,
    }))

  // Rule: unattached receipts in the recent window → single consolidated warning
  const receiptItems: AttentionItem[] = []
  if (unattachedReceipts.length > 0) {
    const n = unattachedReceipts.length
    receiptItems.push({
      id: 'receipts-unattached',
      kind: 'receipt',
      title: 'Есть чеки без поездки',
      subtitle: `${n} ${pluralReceipts(n)} за последние 7 дней`,
      severity: 'warning',
    })
  }

  const severityRank = (s: 'urgent' | 'warning') => (s === 'urgent' ? 0 : 1)

  return [...docItems, ...eventItems, ...receiptItems].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralReceipts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чек'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'чека'
  return 'чеков'
}
