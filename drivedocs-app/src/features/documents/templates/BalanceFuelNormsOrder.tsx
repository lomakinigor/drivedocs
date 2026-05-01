import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceFuelNormsOrderFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orderNumber', label: 'Номер приказа', value: v.orderNumber, required: false, placeholder: '9' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'orgName', label: 'Организация', value: v.orgName, required: true },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'fuelConsumption', label: 'Базовая норма расхода топлива (л/100 км)', value: v.fuelConsumption, required: true, placeholder: '9.0' },
  { key: 'fuelWinterAdd', label: 'Зимняя надбавка (%)', value: v.fuelWinterAdd || '', required: false, placeholder: '10' },
  { key: 'fuelWinterStart', label: 'Начало зимнего периода', value: v.fuelWinterStart || '', required: false, placeholder: '1 ноября' },
  { key: 'fuelWinterEnd', label: 'Конец зимнего периода', value: v.fuelWinterEnd || '', required: false, placeholder: '31 марта' },
  { key: 'fuelType', label: 'Вид топлива', value: v.fuelType || '', required: false, placeholder: 'АИ-95' },
]

export function BalanceFuelNormsOrder({ v }: { v: TemplateValues }) {
  const vehicleDesc = [v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '']
    .filter(Boolean).join(' ')

  const winterNorm = v.fuelConsumption && v.fuelWinterAdd
    ? (parseFloat(v.fuelConsumption) * (1 + parseFloat(v.fuelWinterAdd) / 100))
        .toFixed(1)
    : ''

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">
        ПРИКАЗ{v.orderNumber ? ` № ${v.orderNumber}` : ''}
      </p>
      <p className="doc-meta">
        {v.city ? `${v.city}, ` : ''}«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-subject">ОБ УТВЕРЖДЕНИИ НОРМ РАСХОДА ГОРЮЧЕ-СМАЗОЧНЫХ МАТЕРИАЛОВ</p>

      <p className="doc-p">
        В целях обеспечения надлежащего учёта расходов на ГСМ и их отнесения
        на расходы в целях бухгалтерского и налогового учёта,
      </p>

      <p className="doc-p doc-caps">ПРИКАЗЫВАЮ:</p>

      <p className="doc-p">
        1. Утвердить нормы расхода топлива для транспортного средства:
      </p>
      <p className="doc-indent">марка, модель: <strong>{blank(vehicleDesc || v.vehicleMake)}</strong></p>
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.fuelType && <p className="doc-indent">вид топлива: {v.fuelType}</p>}

      <table className="doc-table" style={{ marginTop: '8pt' }}>
        <thead>
          <tr>
            <th className="doc-th" style={{ width: '60%' }}>Режим эксплуатации</th>
            <th className="doc-th">Норма расхода, л/100 км</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td">
              Базовая норма (по данным Минтранса РФ, Распоряжение АМ-23-р)
            </td>
            <td className="doc-td doc-td-center">
              <strong>{blank(v.fuelConsumption, '___')}</strong>
            </td>
          </tr>
          {v.fuelWinterAdd && (
            <tr>
              <td className="doc-td">
                Зимний период ({blank(v.fuelWinterStart || '1 ноября')} — {blank(v.fuelWinterEnd || '31 марта')}),
                надбавка {v.fuelWinterAdd}%
              </td>
              <td className="doc-td doc-td-center">
                <strong>{winterNorm || blank('')}</strong>
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="doc-p">
        2. Списание ГСМ производить ежемесячно на основании путевых листов
        в пределах утверждённых норм.
      </p>

      <p className="doc-p">
        3. Перерасход топлива сверх норм относить на виновных лиц и не
        учитывать в составе расходов для целей налогообложения.
      </p>

      <p className="doc-p">
        4. Главному бухгалтеру обеспечить учёт ГСМ в соответствии с
        утверждёнными нормами.
      </p>

      <p className="doc-p doc-basis">
        Основание: Распоряжение Министерства транспорта РФ от 14.03.2008 № АМ-23-р
        «О введении в действие методических рекомендаций "Нормы расхода топлива
        и смазочных материалов на автомобильном транспорте"».
      </p>

      <div className="doc-sign-block">
        <p>Руководитель</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
      </div>
    </div>
  )
}
