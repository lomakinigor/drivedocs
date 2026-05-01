import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceFuelWriteoffFields = (v: TemplateValues): TemplateField[] => [
  { key: 'actNumber', label: 'Номер акта', value: v.actNumber || '', required: false, placeholder: '12' },
  { key: 'orgName', label: 'Организация', value: v.orgName, required: true },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'currentMonth', label: 'Период (месяц год)', value: v.currentMonth, required: true, placeholder: 'Май 2026' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'driverFullName', label: 'ФИО водителя', value: v.driverFullName, required: true },
  { key: 'totalMileage', label: 'Пробег за период (км)', value: v.totalMileage || '', required: true, placeholder: '1850' },
  { key: 'fuelConsumption', label: 'Норма расхода (л/100 км)', value: v.fuelConsumption, required: true, placeholder: '9.0' },
  { key: 'fuelFact', label: 'Фактический расход (л)', value: v.fuelFact || '', required: true, placeholder: '160' },
  { key: 'fuelPrice', label: 'Цена топлива (₽/л)', value: v.fuelPrice || '', required: true, placeholder: '58.50' },
  { key: 'accountantName', label: 'ФИО бухгалтера', value: v.accountantName || '', required: false, placeholder: 'Смирнова А.В.' },
]

export function BalanceFuelWriteoff({ v }: { v: TemplateValues }) {
  const vehicle = [v.vehicleMake, v.vehicleModel].filter(Boolean).join(' ')

  const normFuel = v.totalMileage && v.fuelConsumption
    ? ((parseFloat(v.totalMileage) * parseFloat(v.fuelConsumption)) / 100).toFixed(1)
    : ''

  const writeoffLiters = v.fuelFact
    ? v.fuelFact
    : normFuel

  const totalAmount = writeoffLiters && v.fuelPrice
    ? (parseFloat(writeoffLiters) * parseFloat(v.fuelPrice))
        .toLocaleString('ru-RU', { minimumFractionDigits: 2 })
    : ''

  const overrun = normFuel && v.fuelFact
    ? parseFloat(v.fuelFact) - parseFloat(normFuel)
    : 0

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">
        АКТ{v.actNumber ? ` № ${v.actNumber}` : ''} НА СПИСАНИЕ ГОРЮЧЕ-СМАЗОЧНЫХ МАТЕРИАЛОВ
      </p>
      <p className="doc-meta">
        за <strong>{blank(v.currentMonth)}</strong>
      </p>
      <p className="doc-meta">
        «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
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
            <td className="doc-info-value"><strong>{blank(v.driverFullName)}</strong></td>
          </tr>
        </tbody>
      </table>

      <table className="doc-table">
        <thead>
          <tr>
            <th className="doc-th" style={{ width: '45%' }}>Показатель</th>
            <th className="doc-th">Значение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td">Пробег за период</td>
            <td className="doc-td doc-td-center">
              <strong>{blank(v.totalMileage, '___')} км</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-td">
              Норма расхода ГСМ (по Приказу об утверждении норм)
            </td>
            <td className="doc-td doc-td-center">
              {blank(v.fuelConsumption, '___')} л / 100 км
            </td>
          </tr>
          <tr>
            <td className="doc-td">Расход по норме за период</td>
            <td className="doc-td doc-td-center">
              <strong>{normFuel ? `${normFuel} л` : blank('')}</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-td">Фактический расход (по путевым листам)</td>
            <td className="doc-td doc-td-center">
              <strong>{blank(v.fuelFact, '___')} л</strong>
            </td>
          </tr>
          {overrun > 0 && (
            <tr>
              <td className="doc-td">Перерасход (не принимается в расходы)</td>
              <td className="doc-td doc-td-center">{overrun.toFixed(1)} л</td>
            </tr>
          )}
          <tr>
            <td className="doc-td">Цена топлива</td>
            <td className="doc-td doc-td-center">
              {blank(v.fuelPrice, '___')} руб./л
            </td>
          </tr>
          <tr className="doc-tr-total">
            <td className="doc-td">
              <strong>К списанию (в пределах нормы)</strong>
            </td>
            <td className="doc-td doc-td-center">
              <strong>
                {normFuel ? `${normFuel} л` : blank('')}
                {totalAmount && normFuel
                  ? ` × ${blank(v.fuelPrice)} руб. = ${
                      (parseFloat(normFuel) * parseFloat(v.fuelPrice))
                        .toLocaleString('ru-RU', { minimumFractionDigits: 2 })
                    } руб.`
                  : ''}
              </strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p doc-basis">
        Основание: путевые листы за {blank(v.currentMonth)},
        Приказ об утверждении норм расхода ГСМ,
        Распоряжение Минтранса РФ № АМ-23-р от 14.03.2008.
      </p>

      <div className="doc-sign-row doc-sign-bottom">
        <div className="doc-sign-col">
          <p>Водитель</p>
          <p className="doc-sign-line">_________________ / {blank(v.driverFullName)} /</p>
        </div>
        <div className="doc-sign-col">
          {v.accountantName ? (
            <>
              <p>Бухгалтер</p>
              <p className="doc-sign-line">_________________ / {v.accountantName} /</p>
            </>
          ) : (
            <>
              <p>Бухгалтер</p>
              <p className="doc-sign-line">_________________ / _____________________ /</p>
            </>
          )}
        </div>
      </div>

      <div className="doc-sign-secondary">
        <p>Акт утверждаю. Списание ГСМ разрешаю.</p>
        <p>Руководитель</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        <p className="doc-sign-date">«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.</p>
      </div>
    </div>
  )
}
