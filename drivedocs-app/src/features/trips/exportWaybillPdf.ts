import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MonthlyWaybillData } from './waybillData'

// ─── Font loading ─────────────────────────────────────────────────────────────

let cachedFontBase64: string | null = null

async function loadCyrillicFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  const response = await fetch('/fonts/Roboto-Regular.ttf')
  if (!response.ok) throw new Error('Не удалось загрузить шрифт для PDF')
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  // Convert in chunks to avoid stack overflow on large fonts
  const chunkSize = 8192
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  cachedFontBase64 = btoa(binary)
  return cachedFontBase64
}

// ─── File name helper ─────────────────────────────────────────────────────────

function buildFileName(fromDate: string): string {
  const [year, month] = fromDate.split('-')
  return `putevoy-list-${year}-${month}.pdf`
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportWaybillPdf(data: MonthlyWaybillData): Promise<void> {
  const fontBase64 = await loadCyrillicFont()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  // Register Cyrillic font
  doc.addFileToVFS('Roboto-Regular.ttf', fontBase64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.setFont('Roboto', 'normal')

  const pageW = doc.internal.pageSize.getWidth()
  const marginL = 20
  const marginR = 20
  const contentW = pageW - marginL - marginR
  let y = 20

  // ── Title block ──────────────────────────────────────────────────────────────

  doc.setFontSize(16)
  doc.setTextColor(30, 30, 30)
  doc.text('Путевой лист', pageW / 2, y, { align: 'center' })
  y += 7

  doc.setFontSize(10)
  doc.setTextColor(100, 100, 100)
  // Capitalize first letter for display
  const periodDisplay = data.periodLabel.charAt(0).toUpperCase() + data.periodLabel.slice(1)
  doc.text(periodDisplay, pageW / 2, y, { align: 'center' })
  y += 10

  // Horizontal rule
  doc.setDrawColor(200, 200, 200)
  doc.line(marginL, y, pageW - marginR, y)
  y += 6

  // ── Meta block ───────────────────────────────────────────────────────────────

  const metaRows: [string, string][] = [
    ['Организация:', data.organizationName],
  ]
  if (data.organizationInn) {
    metaRows.push(['ИНН:', data.organizationInn])
  }
  metaRows.push(
    ['Транспортное средство:', data.vehicleLabel],
    ['Водитель:', data.driverLabel],
  )

  doc.setFontSize(9)
  const labelX = marginL
  const valueX = marginL + 58

  for (const [label, value] of metaRows) {
    doc.setTextColor(120, 120, 120)
    doc.text(label, labelX, y)
    doc.setTextColor(30, 30, 30)
    doc.text(value, valueX, y)
    y += 5.5
  }

  y += 5

  // ── Trips table ──────────────────────────────────────────────────────────────

  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('Поездки', marginL, y)
  y += 4

  const tableRows = data.rows.map((row) => {
    const dateStr = new Date(row.date + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const km = row.distanceKm != null ? `${row.distanceKm} км` : '—'
    return [dateStr, row.route, row.purpose, km]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: marginL, right: marginR },
    head: [['Дата', 'Маршрут', 'Цель', 'Км']],
    body: tableRows,
    styles: {
      font: 'Roboto',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 30, 30],
      lineColor: [210, 210, 210],
      lineWidth: 0.2,
    },
    headStyles: {
      fillColor: [245, 247, 250],
      textColor: [80, 80, 80],
      fontStyle: 'normal',
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: contentW - 22 - 45 - 16 },
      2: { cellWidth: 45 },
      3: { cellWidth: 16, halign: 'right' },
    },
    alternateRowStyles: { fillColor: [252, 252, 253] },
  })

  // ── Totals block ─────────────────────────────────────────────────────────────

  const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
  const finalY = (lastTable?.finalY ?? 180) + 6

  doc.setDrawColor(200, 200, 200)
  doc.line(marginL, finalY, pageW - marginR, finalY)

  const totalY = finalY + 5
  doc.setFontSize(9)
  doc.setTextColor(100, 100, 100)
  doc.text(`Итого поездок: `, marginL, totalY)
  doc.setTextColor(30, 30, 30)
  doc.text(`${data.totals.tripsCount}`, marginL + 33, totalY)

  const kmFormatted =
    data.totals.totalDistanceKm % 1 === 0
      ? `${data.totals.totalDistanceKm} км`
      : `${data.totals.totalDistanceKm.toFixed(1)} км`
  doc.setTextColor(100, 100, 100)
  doc.text('Общий пробег: ', marginL + 45, totalY)
  doc.setTextColor(30, 30, 30)
  doc.text(kmFormatted, marginL + 45 + 31, totalY)

  // ── Save ─────────────────────────────────────────────────────────────────────

  // Derive fromDate from the first row or use a fallback
  const fromDate = data.rows[0]?.date ?? new Date().toISOString().slice(0, 7) + '-01'
  doc.save(buildFileName(fromDate))
}
