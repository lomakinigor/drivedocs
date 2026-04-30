import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { MonthlyWaybillData } from './waybillData'

// ─── Constants ────────────────────────────────────────────────────────────────

const MARGIN_L = 20
const MARGIN_R = 20
const PAGE_W = 210  // A4 mm

const COLOR_BLACK: [number, number, number] = [20, 20, 20]
const COLOR_DARK: [number, number, number] = [50, 50, 50]
const COLOR_MID: [number, number, number] = [100, 100, 100]
const COLOR_LIGHT: [number, number, number] = [160, 160, 160]
const COLOR_RULE: [number, number, number] = [190, 190, 190]
const COLOR_TABLE_HEAD_BG: [number, number, number] = [240, 242, 245]
const COLOR_TABLE_ALT: [number, number, number] = [251, 252, 253]

// ─── Font loading ─────────────────────────────────────────────────────────────

let cachedFontBase64: string | null = null

async function loadCyrillicFont(): Promise<string> {
  if (cachedFontBase64) return cachedFontBase64
  const response = await fetch('/fonts/Roboto-Regular.ttf')
  if (!response.ok) throw new Error('Не удалось загрузить шрифт для PDF')
  const buffer = await response.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunkSize = 8192
  for (let i = 0; i < bytes.byteLength; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  cachedFontBase64 = btoa(binary)
  return cachedFontBase64
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildFileName(fromDate: string, toDate: string): string {
  if (fromDate === toDate) return `putevoy-list-${fromDate}.pdf`
  const [year, month] = fromDate.split('-')
  return `putevoy-list-${year}-${month}.pdf`
}

function todayRu(): string {
  return new Date().toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Draws a thin horizontal rule across the content area */
function drawRule(doc: jsPDF, y: number): void {
  doc.setDrawColor(...COLOR_RULE)
  doc.setLineWidth(0.2)
  doc.line(MARGIN_L, y, PAGE_W - MARGIN_R, y)
}

/** Draws a meta row: grey label left, black value after fixed indent */
function drawMetaRow(doc: jsPDF, label: string, value: string, y: number): void {
  const LABEL_W = 52
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MID)
  doc.text(label, MARGIN_L, y)
  doc.setTextColor(...COLOR_DARK)
  doc.text(value, MARGIN_L + LABEL_W, y, { maxWidth: PAGE_W - MARGIN_R - MARGIN_L - LABEL_W })
}

/** Draws a signature line: label, underline, then optional name hint in grey */
function drawSignatureLine(
  doc: jsPDF,
  label: string,
  nameHint: string,
  y: number,
): void {
  const lineStart = MARGIN_L + 52
  const lineEnd = MARGIN_L + 110

  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MID)
  doc.text(label, MARGIN_L, y)

  doc.setDrawColor(...COLOR_RULE)
  doc.setLineWidth(0.25)
  doc.line(lineStart, y, lineEnd, y)

  if (nameHint) {
    doc.setFontSize(7.5)
    doc.setTextColor(...COLOR_LIGHT)
    const cx = (lineStart + lineEnd) / 2
    doc.text(nameHint, cx, y + 3.5, { align: 'center' })
  }
}

// ─── Main export function ─────────────────────────────────────────────────────

export async function exportWaybillPdf(data: MonthlyWaybillData): Promise<void> {
  const fontBase64 = await loadCyrillicFont()

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  doc.addFileToVFS('Roboto-Regular.ttf', fontBase64)
  doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal')
  doc.setFont('Roboto', 'normal')

  let y = 18

  // ── Title ────────────────────────────────────────────────────────────────────

  doc.setFontSize(15)
  doc.setTextColor(...COLOR_BLACK)
  doc.text('ПУТЕВОЙ ЛИСТ', PAGE_W / 2, y, { align: 'center' })
  y += 6

  const entityLabel = data.entityType === 'IP' ? 'Индивидуальный предприниматель' : 'Организация'
  const periodDisplay = capitalize(data.periodLabel)
  doc.setFontSize(8.5)
  doc.setTextColor(...COLOR_MID)
  doc.text(`${entityLabel}  ·  ${periodDisplay}`, PAGE_W / 2, y, { align: 'center' })
  y += 5

  doc.setFontSize(8)
  doc.setTextColor(...COLOR_LIGHT)
  doc.text(`Дата составления: ${todayRu()}`, PAGE_W / 2, y, { align: 'center' })
  y += 5

  drawRule(doc, y)
  y += 7

  // ── Реквизиты ────────────────────────────────────────────────────────────────

  doc.setFontSize(8)
  doc.setTextColor(...COLOR_LIGHT)
  doc.text('РЕКВИЗИТЫ', MARGIN_L, y)
  y += 4.5

  drawMetaRow(doc, 'Организация:', data.organizationName, y)
  y += 5.5

  if (data.organizationInn) {
    drawMetaRow(doc, 'ИНН:', data.organizationInn, y)
    y += 5.5
  }

  if (data.organizationOgrn) {
    const ogrnLabel = data.entityType === 'IP' ? 'ОГРНИП:' : 'ОГРН:'
    drawMetaRow(doc, ogrnLabel, data.organizationOgrn, y)
    y += 5.5
  }

  drawMetaRow(doc, 'Транспортное средство:', data.vehicleLabel, y)
  y += 5.5

  drawMetaRow(doc, 'Водитель:', data.driverLabel, y)
  y += 7

  drawRule(doc, y)
  y += 6

  // ── Trips table ──────────────────────────────────────────────────────────────

  doc.setFontSize(8)
  doc.setTextColor(...COLOR_LIGHT)
  doc.text('СЛУЖЕБНЫЕ ПОЕЗДКИ ЗА ПЕРИОД', MARGIN_L, y)
  y += 4

  const contentW = PAGE_W - MARGIN_L - MARGIN_R
  // Column widths: date=22, route=dynamic, purpose=48, km=15
  const kmW = 15
  const dateW = 22
  const purposeW = 48
  const routeW = contentW - dateW - purposeW - kmW

  const tableRows = data.rows.map((row) => {
    const dateStr = new Date(row.date + 'T00:00:00').toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
    const km = row.distanceKm != null ? String(row.distanceKm) : '—'
    return [dateStr, row.route, row.purpose, km]
  })

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN_L, right: MARGIN_R },
    head: [['Дата', 'Маршрут следования', 'Цель поездки', 'Пробег, км']],
    body: tableRows,
    styles: {
      font: 'Roboto',
      fontSize: 8.5,
      cellPadding: { top: 2.5, bottom: 2.5, left: 2.5, right: 2.5 },
      textColor: COLOR_DARK,
      lineColor: [215, 215, 215],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor: COLOR_TABLE_HEAD_BG,
      textColor: COLOR_MID,
      fontStyle: 'normal',
      fontSize: 7.5,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
    },
    columnStyles: {
      0: { cellWidth: dateW },
      1: { cellWidth: routeW },
      2: { cellWidth: purposeW },
      3: { cellWidth: kmW, halign: 'right' },
    },
    alternateRowStyles: { fillColor: COLOR_TABLE_ALT },
  })

  // ── Итоги ────────────────────────────────────────────────────────────────────

  const lastTable = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
  let afterTable = (lastTable?.finalY ?? 180) + 5

  drawRule(doc, afterTable)
  afterTable += 5

  const kmFormatted =
    data.totals.totalDistanceKm % 1 === 0
      ? `${data.totals.totalDistanceKm} км`
      : `${data.totals.totalDistanceKm.toFixed(1)} км`

  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MID)
  doc.text('Итого поездок:', MARGIN_L, afterTable)
  doc.setTextColor(...COLOR_BLACK)
  doc.text(String(data.totals.tripsCount), MARGIN_L + 34, afterTable)

  doc.setTextColor(...COLOR_MID)
  doc.text('Общий пробег:', MARGIN_L + 48, afterTable)
  doc.setTextColor(...COLOR_BLACK)
  doc.text(kmFormatted, MARGIN_L + 48 + 32, afterTable)

  afterTable += 10

  drawRule(doc, afterTable)
  afterTable += 8

  // ── Подписи ──────────────────────────────────────────────────────────────────

  doc.setFontSize(8)
  doc.setTextColor(...COLOR_LIGHT)
  doc.text('ПОДПИСИ', MARGIN_L, afterTable)
  afterTable += 5.5

  drawSignatureLine(doc, 'Водитель:', data.driverLabel, afterTable)
  afterTable += 10

  const responsibleLabel =
    data.entityType === 'IP'
      ? 'Индивидуальный предприниматель:'
      : 'Руководитель организации:'
  drawSignatureLine(doc, responsibleLabel, data.driverLabel, afterTable)
  afterTable += 10

  // Date of signing + М.П.
  doc.setFontSize(9)
  doc.setTextColor(...COLOR_MID)
  doc.text('Дата подписания:', MARGIN_L, afterTable)

  doc.setDrawColor(...COLOR_RULE)
  doc.setLineWidth(0.25)
  doc.line(MARGIN_L + 40, afterTable, MARGIN_L + 75, afterTable)

  // М.П. box
  const mpX = PAGE_W - MARGIN_R - 28
  const mpY = afterTable - 10
  doc.setDrawColor(...COLOR_RULE)
  doc.setLineWidth(0.2)
  doc.rect(mpX, mpY, 28, 14)
  doc.setFontSize(7.5)
  doc.setTextColor(...COLOR_LIGHT)
  doc.text('М.П.', mpX + 14, mpY + 7.5, { align: 'center' })

  // ── Сохранить ────────────────────────────────────────────────────────────────

  doc.save(buildFileName(data.fromDate, data.toDate))
}
