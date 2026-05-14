import type { WorkspaceDocument, WorkspaceEvent, Receipt, VehicleProfile, Driver } from '@/entities/types/domain'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttentionItemKind = 'document' | 'event' | 'receipt' | 'expiry'

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
  /** Сколько дней до истечения (только для kind='expiry'). Отрицательное = уже истёк.
   *  Используется на главной для эскалации ОСАГО/ВУ за неделю в RED tier. */
  daysLeft?: number
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
  acknowledgedDocumentIds: string[] = [],
): AttentionItem[] {
  // F-031 — документы, по которым пользователь сказал «у меня уже есть»,
  // не показываются как attention. Они доступны через список документов,
  // где увидит спецсообщение.
  const ackSet = new Set(acknowledgedDocumentIds)
  const docItems: AttentionItem[] = docs
    .filter((d) => !ackSet.has(d.id))
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
    // 2026-05-13 — MVP: штрафы убраны из приложения (нет источника данных)
    .filter((e) => e.type !== 'fine')
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

// ─── Expiry rules ─────────────────────────────────────────────────────────────

const EXPIRY_URGENT_DAYS = 14
const EXPIRY_WARNING_DAYS = 30

interface ExpiryCheck {
  id: string
  label: string
  date: string
}

export function buildExpiryItems(vehicle: VehicleProfile | null, drivers: Driver[]): AttentionItem[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checks: ExpiryCheck[] = []

  if (vehicle?.osagoExpires) checks.push({ id: 'osago', label: 'ОСАГО', date: vehicle.osagoExpires })
  if (vehicle?.kaskoExpires) checks.push({ id: 'kasko', label: 'КАСКО', date: vehicle.kaskoExpires })
  if (vehicle?.techInspectionExpires) checks.push({ id: 'to', label: 'Технический осмотр', date: vehicle.techInspectionExpires })

  const defaultDriver = drivers.find((d) => d.isDefault) ?? drivers[0]
  if (defaultDriver?.licenseExpires) {
    checks.push({ id: 'license', label: 'Водительское удостоверение', date: defaultDriver.licenseExpires })
  }

  const items: AttentionItem[] = []

  for (const { id, label, date } of checks) {
    const expires = new Date(date)
    expires.setHours(0, 0, 0, 0)
    const daysLeft = Math.ceil((expires.getTime() - today.getTime()) / 86_400_000)

    if (daysLeft > EXPIRY_WARNING_DAYS) continue

    const expired = daysLeft < 0
    const severity: 'urgent' | 'warning' = expired || daysLeft <= EXPIRY_URGENT_DAYS ? 'urgent' : 'warning'
    const subtitle = expired
      ? `Истёк ${Math.abs(daysLeft)} ${pluralDays(Math.abs(daysLeft))} назад`
      : daysLeft === 0
      ? 'Истекает сегодня'
      : `Через ${daysLeft} ${pluralDays(daysLeft)}`

    items.push({
      id: `expiry-${id}`,
      kind: 'expiry',
      title: `${label} — срок ${expired ? 'истёк' : 'истекает'}`,
      subtitle,
      severity,
      daysLeft,
    })
  }

  return items
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralDays(n: number): string {
  const abs = Math.abs(n)
  if (abs % 10 === 1 && abs % 100 !== 11) return 'день'
  if ([2, 3, 4].includes(abs % 10) && ![12, 13, 14].includes(abs % 100)) return 'дня'
  return 'дней'
}

function pluralReceipts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чек'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'чека'
  return 'чеков'
}
