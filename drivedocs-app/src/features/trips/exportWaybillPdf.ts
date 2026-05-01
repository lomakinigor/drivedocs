import { openPrintWindow } from '@/features/documents/templates/printUtils'
import type { MonthlyWaybillData } from './waybillData'

function formatRowDate(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
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

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function buildWaybillHtml(data: MonthlyWaybillData): string {
  const entityLabel =
    data.entityType === 'IP' ? 'Индивидуальный предприниматель' : 'Организация'
  const responsibleLabel =
    data.entityType === 'IP'
      ? 'Индивидуальный предприниматель'
      : 'Руководитель организации'
  const ogrnLabel = data.entityType === 'IP' ? 'ОГРНИП' : 'ОГРН'

  const kmFormatted =
    data.totals.totalDistanceKm % 1 === 0
      ? `${data.totals.totalDistanceKm} км`
      : `${data.totals.totalDistanceKm.toFixed(1)} км`

  const tableRows = data.rows
    .map(
      (row) => `
        <tr>
          <td class="doc-td doc-td-center">${escapeHtml(formatRowDate(row.date))}</td>
          <td class="doc-td">${escapeHtml(row.route)}</td>
          <td class="doc-td">${escapeHtml(row.purpose)}</td>
          <td class="doc-td doc-td-center">${row.distanceKm != null ? row.distanceKm : '—'}</td>
        </tr>`,
    )
    .join('')

  const metaRows = [
    `<tr><td class="wb-meta-label">Организация:</td><td class="wb-meta-value">${escapeHtml(data.organizationName)}</td></tr>`,
    data.organizationInn
      ? `<tr><td class="wb-meta-label">ИНН:</td><td class="wb-meta-value">${escapeHtml(data.organizationInn)}</td></tr>`
      : '',
    data.organizationOgrn
      ? `<tr><td class="wb-meta-label">${ogrnLabel}:</td><td class="wb-meta-value">${escapeHtml(data.organizationOgrn)}</td></tr>`
      : '',
    `<tr><td class="wb-meta-label">Транспортное средство:</td><td class="wb-meta-value">${escapeHtml(data.vehicleLabel)}</td></tr>`,
    `<tr><td class="wb-meta-label">Водитель:</td><td class="wb-meta-value">${escapeHtml(data.driverLabel)}</td></tr>`,
  ]
    .filter(Boolean)
    .join('')

  return `
    <div class="doc-body">
      <h1 class="doc-title doc-center">ПУТЕВОЙ ЛИСТ</h1>
      <p class="doc-meta">${escapeHtml(entityLabel)} · ${escapeHtml(capitalize(data.periodLabel))}</p>
      <p class="doc-meta" style="font-size: 9pt; color: #888;">Дата составления: ${todayRu()}</p>

      <p class="wb-section">РЕКВИЗИТЫ</p>
      <table class="wb-meta-table">${metaRows}</table>

      <p class="wb-section">СЛУЖЕБНЫЕ ПОЕЗДКИ ЗА ПЕРИОД</p>
      <table class="doc-table wb-trips">
        <thead>
          <tr>
            <th class="doc-th" style="width: 18%">Дата</th>
            <th class="doc-th">Маршрут следования</th>
            <th class="doc-th" style="width: 30%">Цель поездки</th>
            <th class="doc-th" style="width: 15%">Пробег, км</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>

      <table class="wb-totals">
        <tr>
          <td>Итого поездок:</td>
          <td class="wb-totals-value">${data.totals.tripsCount}</td>
          <td>Общий пробег:</td>
          <td class="wb-totals-value">${escapeHtml(kmFormatted)}</td>
        </tr>
      </table>

      <p class="wb-section">ПОДПИСИ</p>

      <div class="wb-sign-row">
        <span class="wb-sign-label">Водитель:</span>
        <span class="wb-sign-line"></span>
        <span class="wb-sign-hint">${escapeHtml(data.driverLabel)}</span>
      </div>

      <div class="wb-sign-row">
        <span class="wb-sign-label">${escapeHtml(responsibleLabel)}:</span>
        <span class="wb-sign-line"></span>
        <span class="wb-sign-hint">${escapeHtml(data.driverLabel)}</span>
      </div>

      <div class="wb-sign-bottom">
        <span class="wb-sign-label">Дата подписания:</span>
        <span class="wb-sign-line wb-sign-line-short"></span>
        <span class="wb-mp">М.П.</span>
      </div>
    </div>

    <style>
      .wb-section { font-size: 9pt; color: #888; letter-spacing: 0.05em; margin: 14pt 0 4pt; text-indent: 0; text-align: left; }
      .wb-meta-table { width: 100%; border-collapse: collapse; margin-bottom: 6pt; }
      .wb-meta-table td { padding: 2pt 0; vertical-align: top; }
      .wb-meta-label { width: 50mm; color: #666; font-size: 10pt; }
      .wb-meta-value { color: #111; font-size: 10pt; }
      .wb-trips td.doc-td-center { text-align: center; }
      .wb-totals { width: 100%; margin-top: 8pt; border-top: 0.5pt solid #ccc; border-bottom: 0.5pt solid #ccc; }
      .wb-totals td { padding: 6pt 4pt; font-size: 10pt; color: #666; }
      .wb-totals-value { font-weight: bold; color: #111; }
      .wb-sign-row { margin: 12pt 0; font-size: 10pt; }
      .wb-sign-label { color: #666; display: inline-block; min-width: 65mm; }
      .wb-sign-line { display: inline-block; width: 60mm; border-bottom: 0.4pt solid #999; height: 12pt; vertical-align: bottom; margin-right: 4pt; }
      .wb-sign-line-short { width: 35mm; }
      .wb-sign-hint { font-size: 8pt; color: #aaa; }
      .wb-sign-bottom { margin-top: 16pt; font-size: 10pt; }
      .wb-mp { display: inline-block; border: 0.3pt solid #aaa; padding: 6pt 12pt; margin-left: 16pt; font-size: 8pt; color: #888; }
    </style>
  `
}

export async function exportWaybillPdf(data: MonthlyWaybillData): Promise<void> {
  const html = buildWaybillHtml(data)
  const title =
    data.fromDate === data.toDate
      ? `Путевой лист ${formatRowDate(data.fromDate)}`
      : `Путевой лист ${capitalize(data.periodLabel)}`
  openPrintWindow(html, title)
}
