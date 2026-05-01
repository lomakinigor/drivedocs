import type { TemplateValues, TemplateField } from './types'

export const tripLogFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orgName', label: 'Организация / ИП', value: v.orgName, required: true },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'driverFullName', label: 'ФИО водителя', value: v.driverFullName, required: true, placeholder: 'Иванов И.И.' },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'currentMonth', label: 'Период (месяц год)', value: v.currentMonth, required: true, placeholder: 'Май 2026' },
]

const ROWS = 25

export function TripLog({ v }: { v: TemplateValues }) {
  const vehicle = [
    v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="doc-body">
      <p className="doc-center doc-title">ЖУРНАЛ УЧЁТА СЛУЖЕБНЫХ ПОЕЗДОК</p>

      <table className="doc-info-table">
        <tbody>
          <tr>
            <td className="doc-info-label">Организация (ИП):</td>
            <td className="doc-info-value"><strong>{v.orgName || '___________________________'}</strong></td>
          </tr>
          <tr>
            <td className="doc-info-label">Автомобиль:</td>
            <td className="doc-info-value">
              {vehicle || '___________________________'}, гос.&nbsp;номер&nbsp;
              <strong>{v.licensePlate || '__________'}</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-info-label">Период:</td>
            <td className="doc-info-value"><strong>{v.currentMonth || '_________________'}</strong></td>
          </tr>
        </tbody>
      </table>

      <table className="doc-table">
        <thead>
          <tr>
            <th className="doc-th doc-th-num">№</th>
            <th className="doc-th">Дата</th>
            <th className="doc-th doc-th-wide">Откуда</th>
            <th className="doc-th doc-th-wide">Куда</th>
            <th className="doc-th doc-th-wide">Цель поездки</th>
            <th className="doc-th doc-th-sm">Км</th>
            <th className="doc-th">Подпись</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: ROWS }).map((_, i) => (
            <tr key={i} className="doc-tr">
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
              <strong>ИТОГО</strong>
            </td>
            <td className="doc-td">&nbsp;</td>
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
