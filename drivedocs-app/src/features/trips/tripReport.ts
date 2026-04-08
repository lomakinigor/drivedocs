import type { Trip } from '@/entities/types/domain'

/**
 * Builds a plain-text monthly trip report suitable for clipboard export.
 * Pure function — no hooks, no side effects (D-008).
 *
 * Format:
 *   Отчёт о поездках — апрель 2026
 *   ИП Иванов А.В.
 *
 *   Поездок: 5
 *   Пробег: 342 км
 *
 *   Маршруты:
 *   1. 03.04 — Офис → Клиент — 45 км — деловая встреча
 *   ...
 */
export function buildMonthlyTripReport(
  trips: Trip[],
  monthLabel: string,
  workspaceName: string,
): string {
  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)
  const totalKmFormatted = totalKm % 1 === 0 ? String(totalKm) : totalKm.toFixed(1)

  const header = [
    `Отчёт о поездках — ${monthLabel}`,
    workspaceName,
    '',
    `Поездок: ${trips.length}`,
    `Пробег: ${totalKmFormatted} км`,
  ]

  if (trips.length === 0) {
    return header.join('\n')
  }

  const routeLines = trips.map((t, i) => {
    const date = new Date(t.date).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    })
    const from = t.startLocation.split(',')[0].trim()
    const to = t.endLocation.split(',')[0].trim()
    return `${i + 1}. ${date} — ${from} → ${to} — ${t.distanceKm} км — ${t.purpose}`
  })

  return [...header, '', 'Маршруты:', ...routeLines].join('\n')
}
