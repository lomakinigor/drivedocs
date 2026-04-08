import type { WorkspaceDocument, WorkspaceEvent } from '@/entities/types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttentionItemKind = 'document' | 'event'

/**
 * Unified attention item — produced by buildAttentionItems(), never persisted.
 * Add new kinds here when extending the rule engine (e.g. 'receipt', 'subscription').
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
 * Takes all workspace docs and events, returns sorted AttentionItem[].
 *
 * Rules (extend here to add new attention item types):
 *  - Documents: status 'required' or 'overdue'
 *  - Events: unread, severity 'urgent' or 'warning'
 *
 * Sort order: urgent before warning; within same severity, docs before events.
 */
export function buildAttentionItems(
  docs: WorkspaceDocument[],
  events: WorkspaceEvent[],
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

  const severityRank = (s: 'urgent' | 'warning') => (s === 'urgent' ? 0 : 1)

  return [...docItems, ...eventItems].sort(
    (a, b) => severityRank(a.severity) - severityRank(b.severity),
  )
}
