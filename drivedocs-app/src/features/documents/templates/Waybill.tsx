import type { TemplateValues, TemplateField } from './types'

const ROWS = 20

export const waybillFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orgName', label: 'Организация / ИП', value: v.orgName, required: true },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'driverFullName', label: 'ФИО водителя', value: v.driverFullName, required: true, placeholder: 'Иванов И.И.' },
  { key: 'currentMonth', label: 'Период (месяц год)', value: v.currentMonth, required: true, placeholder: 'Май 2026' },
  { key: 'odometerStart', label: 'Показания одометра в начале периода (км)', value: v.odometerStart, required: false, placeholder: '45000' },
  { key: 'odometerEnd', label: 'Показания одометра в конце периода (км)', value: v.odometerEnd, required: false, placeholder: '46200' },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
]

export function Waybill({ v }: { v: TemplateValues }) {
  const vehicle = [v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '']
    .filter(Boolean).join(' ')

  const totalKm =
    v.odometerStart && v.odometerEnd
      ? String(parseInt(v.odometerEnd, 10) - parseInt(v.odometerStart, 10))
      : ''

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{v.orgName || '___________________________'}</p>

      <p className="doc-center doc-title">МАРШРУТНЫЙ ЛИСТ</p>
      <p className="doc-meta">за <strong>{v.currentMonth || '_________________'}</strong></p>

      <table className="doc-info-table">
        <tbody>
          <tr>
            <td className="doc-info-label">Водитель:</td>
            <td className="doc-info-value"><strong>{v.driverFullName || '___________________________'}</strong></td>
          </tr>
          <tr>
            <td className="doc-info-label">Автомобиль:</td>
            <td className="doc-info-value">
              {vehicle || '___________________________'}, гос.&nbsp;номер&nbsp;
              <strong>{v.licensePlate || '__________'}</strong>
            </td>
          </tr>
          {(v.odometerStart || v.odometerEnd) && (
            <tr>
              <td className="doc-info-label">Одометр:</td>
              <td className="doc-info-value">
                начало периода: <strong>{v.odometerStart || '______'}</strong>&nbsp;км
                &nbsp;&nbsp;|&nbsp;&nbsp;
                конец периода: <strong>{v.odometerEnd || '______'}</strong>&nbsp;км
                {totalKm && <>&nbsp;&nbsp;|&nbsp;&nbsp;пробег: <strong>{totalKm}&nbsp;км</strong></>}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <table className="doc-table">
        <thead>
          <tr>
            <th className="doc-th doc-th-num">№</th>
            <th className="doc-th" style={{ width: '8%' }}>Дата</th>
            <th className="doc-th doc-th-wide">Откуда (адрес)</th>
            <th className="doc-th doc-th-wide">Куда (адрес)</th>
            <th className="doc-th doc-th-wide">Цель поездки</th>
            <th className="doc-th doc-th-sm">Км</th>
            <th className="doc-th" style={{ width: '9%' }}>Подпись</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i}>
              <td className="doc-td doc-td-center">{i + 1}</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
            </tr>
          ))}
          <tr className="doc-tr-total">
            <td className="doc-td doc-td-center" colSpan={5}>
              <strong>ИТОГО за период</strong>
            </td>
            <td className="doc-td doc-td-center">
              <strong>{totalKm || '&nbsp;'}</strong>
            </td>
            <td className="doc-td">&nbsp;</td>
          </tr>
        </tbody>
      </table>

      <div className="doc-sign-row doc-sign-bottom">
        <div className="doc-sign-col">
          <p>Водитель</p>
          <p className="doc-sign-line">_________________ / {v.driverFullName || '___________'} /</p>
        </div>
        <div className="doc-sign-col">
          <p>Руководитель</p>
          <p className="doc-sign-line">_________________ / {v.ownerFullName || '___________'} /</p>
        </div>
      </div>
    </div>
  )
}
