import { openPrintWindow } from '@/features/documents/templates/printUtils'
import type { MonthlyWaybillData } from './waybillData'
import type { WaybillTemplate } from '@/entities/types/domain'

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

function formatLitres(n: number): string {
  return n.toFixed(2).replace('.', ',')
}

function buildExtendedSection(data: MonthlyWaybillData): string {
  // Расширенные блоки: расширенные реквизиты + таблица рейсов с одометром + ГСМ
  const orgExtras = [
    data.organizationAddress
      ? `<tr><td class="wb-meta-label">Адрес:</td><td class="wb-meta-value">${escapeHtml(data.organizationAddress)}</td></tr>`
      : '',
    data.organizationPhone
      ? `<tr><td class="wb-meta-label">Телефон:</td><td class="wb-meta-value">${escapeHtml(data.organizationPhone)}</td></tr>`
      : '',
    data.organizationKpp
      ? `<tr><td class="wb-meta-label">КПП:</td><td class="wb-meta-value">${escapeHtml(data.organizationKpp)}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  const vehicleExtras = [
    data.vehicleTypeLabel
      ? `<tr><td class="wb-meta-label">Тип ТС:</td><td class="wb-meta-value">${escapeHtml(data.vehicleTypeLabel)}</td></tr>`
      : '',
    data.vehicleVin
      ? `<tr><td class="wb-meta-label">VIN:</td><td class="wb-meta-value">${escapeHtml(data.vehicleVin)}</td></tr>`
      : '',
    data.vehicleYear
      ? `<tr><td class="wb-meta-label">Год выпуска:</td><td class="wb-meta-value">${data.vehicleYear}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  const driverExtras = [
    data.driverLicense
      ? `<tr><td class="wb-meta-label">Водительское удостоверение:</td><td class="wb-meta-value">${escapeHtml(data.driverLicense)}</td></tr>`
      : '',
    data.driverLicenseCategories
      ? `<tr><td class="wb-meta-label">Категории:</td><td class="wb-meta-value">${escapeHtml(data.driverLicenseCategories)}</td></tr>`
      : '',
  ]
    .filter(Boolean)
    .join('')

  const extraMetaTable =
    orgExtras + vehicleExtras + driverExtras
      ? `
        <p class="wb-section">РАСШИРЕННЫЕ РЕКВИЗИТЫ</p>
        <table class="wb-meta-table">${orgExtras}${vehicleExtras}${driverExtras}</table>`
      : ''

  // Таблица рейсов с одометром
  const hasOdometer = data.rows.some((r) => r.odometerStart != null || r.odometerEnd != null)
  const odometerTable = hasOdometer
    ? `
      <p class="wb-section">МАРШРУТИЗАЦИЯ И ПОКАЗАНИЯ ОДОМЕТРА</p>
      <table class="doc-table wb-trips">
        <thead>
          <tr>
            <th class="doc-th" style="width: 14%">Дата</th>
            <th class="doc-th">Маршрут / цель</th>
            <th class="doc-th" style="width: 16%">Одометр выезд</th>
            <th class="doc-th" style="width: 16%">Одометр возврат</th>
            <th class="doc-th" style="width: 14%">Пробег</th>
          </tr>
        </thead>
        <tbody>
          ${data.rows
            .map(
              (r) => `
            <tr>
              <td class="doc-td doc-td-center">${escapeHtml(formatRowDate(r.date))}</td>
              <td class="doc-td">${escapeHtml(r.route)} · ${escapeHtml(r.purpose)}</td>
              <td class="doc-td doc-td-center">${r.odometerStart ?? '—'}</td>
              <td class="doc-td doc-td-center">${r.odometerEnd ?? '—'}</td>
              <td class="doc-td doc-td-center">${r.distanceKm != null ? r.distanceKm : '—'}</td>
            </tr>`,
            )
            .join('')}
        </tbody>
      </table>`
    : ''

  // Блок ГСМ
  const fuel = data.fuelSummary
  const fuelBlock = fuel
    ? `
      <p class="wb-section">УЧЁТ ТОПЛИВА (АМ-23-р)</p>
      <table class="wb-meta-table">
        <tr><td class="wb-meta-label">Марка топлива:</td><td class="wb-meta-value">${escapeHtml(fuel.fuelType)}</td></tr>
        ${
          fuel.baseRateLper100km != null
            ? `<tr><td class="wb-meta-label">Базовая норма расхода (Hs):</td><td class="wb-meta-value">${fuel.baseRateLper100km.toString().replace('.', ',')} л / 100 км</td></tr>`
            : `<tr><td class="wb-meta-label">Базовая норма:</td><td class="wb-meta-value" style="color:#a33;">не указана в профиле авто</td></tr>`
        }
        <tr><td class="wb-meta-label">Общий пробег (S):</td><td class="wb-meta-value">${fuel.totalDistanceKm.toFixed(1).replace('.', ',')} км</td></tr>
        <tr><td class="wb-meta-label">Поправочный коэффициент (D):</td><td class="wb-meta-value">${fuel.surchargePercent} %</td></tr>
        ${
          fuel.normLitres != null
            ? `<tr>
                 <td class="wb-meta-label" style="vertical-align: top;">Нормативный расход Qн:</td>
                 <td class="wb-meta-value">
                   <strong>${formatLitres(fuel.normLitres)} л</strong>
                   <div style="font-size: 8pt; color: #888; margin-top: 2pt;">Qн = 0,01 × Hs × S × (1 + 0,01 × D)</div>
                 </td>
               </tr>`
            : ''
        }
        <tr><td class="wb-meta-label">Фактически израсходовано:</td><td class="wb-meta-value">_______ л</td></tr>
        <tr><td class="wb-meta-label">Остаток на конец:</td><td class="wb-meta-value">_______ л</td></tr>
      </table>
      <p style="font-size: 8pt; color: #999; margin-top: 4pt;">
        Норма расхода рассчитана по Распоряжению Минтранса РФ от 14.03.2008 № АМ-23-р.
      </p>`
    : ''

  // Расширенные подписи: медосмотры, техконтроль, дата приёмки
  const signatureExtras = `
    <p class="wb-section">ОТМЕТКИ О КОНТРОЛЕ</p>
    <table class="wb-meta-table">
      <tr><td class="wb-meta-label">Предрейсовый медосмотр:</td><td class="wb-meta-value">Дата ___________  Время _______  Допущен: ☐ Да ☐ Нет</td></tr>
      <tr><td class="wb-meta-label">Подпись медработника:</td><td class="wb-meta-value">_______________________</td></tr>
      <tr><td class="wb-meta-label">Предрейсовый техконтроль:</td><td class="wb-meta-value">Дата ___________  Время _______  ТС исправно: ☐ Да ☐ Нет</td></tr>
      <tr><td class="wb-meta-label">Подпись механика:</td><td class="wb-meta-value">_______________________</td></tr>
      <tr><td class="wb-meta-label">Послерейсовый медосмотр:</td><td class="wb-meta-value">Дата ___________  Время _______  Подпись: ____________</td></tr>
    </table>`

  return `
    ${extraMetaTable}
    ${odometerTable}
    ${fuelBlock}
    ${signatureExtras}
  `
}

function buildWaybillHtml(data: MonthlyWaybillData, template: WaybillTemplate): string {
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

      ${template === 'extended' ? buildExtendedSection(data) : ''}

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

export async function exportWaybillPdf(
  data: MonthlyWaybillData,
  template: WaybillTemplate = 'minimal',
): Promise<void> {
  const html = buildWaybillHtml(data, template)
  const suffix = template === 'extended' ? ' · расширенный' : ''
  const title =
    data.fromDate === data.toDate
      ? `Путевой лист ${formatRowDate(data.fromDate)}${suffix}`
      : `Путевой лист ${capitalize(data.periodLabel)}${suffix}`
  openPrintWindow(html, title)
}
