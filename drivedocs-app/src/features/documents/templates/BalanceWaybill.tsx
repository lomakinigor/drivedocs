import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

const TRIP_ROWS = 8

export const balanceWaybillFields = (v: TemplateValues): TemplateField[] => [
  { key: 'waybillNumber', label: 'Номер путевого листа', value: v.waybillNumber || '', required: true, placeholder: '42' },
  { key: 'orgName', label: 'Организация', value: v.orgName, required: true },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'driverFullName', label: 'ФИО водителя', value: v.driverFullName, required: true },
  { key: 'driverLicense', label: 'Водительское удостоверение', value: v.driverLicense, required: false, placeholder: '99 01 123456' },
  { key: 'odometerStart', label: 'Показания одометра при выезде (км)', value: v.odometerStart, required: false, placeholder: '45000' },
  { key: 'odometerEnd', label: 'Показания одометра при возврате (км)', value: v.odometerEnd, required: false, placeholder: '45250' },
  { key: 'fuelIssued', label: 'Выдано топлива (л)', value: v.fuelIssued || '', required: false, placeholder: '30' },
  { key: 'fuelRemainStart', label: 'Остаток топлива при выезде (л)', value: v.fuelRemainStart || '', required: false, placeholder: '15' },
  { key: 'fuelRemainEnd', label: 'Остаток топлива при возврате (л)', value: v.fuelRemainEnd || '', required: false, placeholder: '8' },
]

export function BalanceWaybill({ v }: { v: TemplateValues }) {
  const vehicle = [v.vehicleMake, v.vehicleModel].filter(Boolean).join(' ')
  const mileage = v.odometerStart && v.odometerEnd
    ? String(parseInt(v.odometerEnd, 10) - parseInt(v.odometerStart, 10))
    : ''

  const fuelSpent = v.fuelRemainStart && v.fuelRemainEnd && v.fuelIssued
    ? String(
        parseFloat(v.fuelRemainStart) + parseFloat(v.fuelIssued) - parseFloat(v.fuelRemainEnd)
      )
    : ''

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">
        ПУТЕВОЙ ЛИСТ № {blank(v.waybillNumber || '', '___')}
      </p>
      <p className="doc-meta">
        от «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <table className="doc-info-table">
        <tbody>
          <tr>
            <td className="doc-info-label">Автомобиль:</td>
            <td className="doc-info-value">
              <strong>{blank(vehicle || v.vehicleMake)}</strong>, гос.&nbsp;номер&nbsp;
              <strong>{blank(v.licensePlate)}</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-info-label">Водитель:</td>
            <td className="doc-info-value">
              <strong>{blank(v.driverFullName)}</strong>
              {v.driverLicense && `, ВУ № ${v.driverLicense}`}
            </td>
          </tr>
        </tbody>
      </table>

      {/* Медосмотр и техконтроль */}
      <table className="doc-table" style={{ marginBottom: '6pt' }}>
        <thead>
          <tr>
            <th className="doc-th" style={{ width: '50%' }}>Отметка о предрейсовом медосмотре</th>
            <th className="doc-th">Отметка о техническом контроле ТС</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td" style={{ height: '28pt' }}>
              <p className="doc-small">Водитель здоров, к рейсу допущен</p>
              <p className="doc-small">Медработник _________________ / _________ /</p>
              <p className="doc-small">«______» ______________ {blank(v.todayYear)} г.</p>
            </td>
            <td className="doc-td">
              <p className="doc-small">ТС исправно, выезд разрешён</p>
              <p className="doc-small">Механик _________________ / _________ /</p>
              <p className="doc-small">«______» ______________ {blank(v.todayYear)} г.</p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Одометр и топливо */}
      <table className="doc-table" style={{ marginBottom: '6pt' }}>
        <thead>
          <tr>
            <th className="doc-th" colSpan={2}>Одометр (км)</th>
            <th className="doc-th" colSpan={3}>Топливо (л)</th>
          </tr>
          <tr>
            <th className="doc-th">Выезд</th>
            <th className="doc-th">Возврат</th>
            <th className="doc-th">Остаток при выезде</th>
            <th className="doc-th">Выдано</th>
            <th className="doc-th">Остаток при возврате</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td doc-td-center">{v.odometerStart || ' '}</td>
            <td className="doc-td doc-td-center">{v.odometerEnd || ' '}</td>
            <td className="doc-td doc-td-center">{v.fuelRemainStart || ' '}</td>
            <td className="doc-td doc-td-center">{v.fuelIssued || ' '}</td>
            <td className="doc-td doc-td-center">{v.fuelRemainEnd || ' '}</td>
          </tr>
          <tr className="doc-tr-total">
            <td className="doc-td" colSpan={2}>
              <strong>Пробег: {mileage ? `${mileage} км` : '______ км'}</strong>
            </td>
            <td className="doc-td" colSpan={3}>
              <strong>Расход: {fuelSpent ? `${fuelSpent} л` : '______ л'}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Маршруты */}
      <table className="doc-table">
        <thead>
          <tr>
            <th className="doc-th doc-th-num">№</th>
            <th className="doc-th doc-th-wide">Откуда</th>
            <th className="doc-th doc-th-wide">Куда</th>
            <th className="doc-th doc-th-wide">Цель поездки</th>
            <th className="doc-th doc-th-sm">Км</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: TRIP_ROWS }).map((_, i) => (
            <tr key={i}>
              <td className="doc-td doc-td-center">{i + 1}</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
              <td className="doc-td">&nbsp;</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="doc-sign-row doc-sign-bottom">
        <div className="doc-sign-col">
          <p>Водитель</p>
          <p className="doc-sign-line">_________________ / {blank(v.driverFullName)} /</p>
        </div>
        <div className="doc-sign-col">
          <p>Диспетчер / Ответственный</p>
          <p className="doc-sign-line">_________________ / _____________________ /</p>
        </div>
      </div>
    </div>
  )
}
