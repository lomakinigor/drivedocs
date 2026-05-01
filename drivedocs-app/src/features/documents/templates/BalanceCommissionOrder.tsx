import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceCommissionOrderFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orderNumber', label: 'Номер приказа', value: v.orderNumber, required: false, placeholder: '8' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'orgName', label: 'Организация', value: v.orgName, required: true },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'vin', label: 'VIN', value: v.vin, required: false },
  { key: 'inventoryNumber', label: 'Инвентарный номер ОС', value: v.inventoryNumber || '', required: false, placeholder: 'ОС-00123' },
  { key: 'initialCost', label: 'Первоначальная стоимость (₽)', value: v.initialCost || '', required: true, placeholder: '1500000' },
  { key: 'usefulLifeYears', label: 'Срок полезного использования (лет)', value: v.usefulLifeYears || '', required: true, placeholder: '5' },
  { key: 'depreciationGroup', label: 'Амортизационная группа', value: v.depreciationGroup || '', required: false, placeholder: '4 (от 5 до 7 лет)' },
  { key: 'driverFullName', label: 'ФИО ответственного за сохранность', value: v.driverFullName, required: false },
]

export function BalanceCommissionOrder({ v }: { v: TemplateValues }) {
  const vehicleDesc = [v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '']
    .filter(Boolean).join(' ')

  const monthlyAmort = v.initialCost && v.usefulLifeYears
    ? (parseFloat(v.initialCost) / (parseFloat(v.usefulLifeYears) * 12))
        .toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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

      <p className="doc-subject">О ВВОДЕ ТРАНСПОРТНОГО СРЕДСТВА В ЭКСПЛУАТАЦИЮ</p>

      <p className="doc-p doc-caps">ПРИКАЗЫВАЮ:</p>

      <p className="doc-p">
        1. Ввести в эксплуатацию транспортное средство:
      </p>
      <p className="doc-indent">марка, модель: <strong>{blank(vehicleDesc || v.vehicleMake)}</strong></p>
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.vin && <p className="doc-indent">VIN: {v.vin}</p>}
      {v.inventoryNumber && <p className="doc-indent">инвентарный номер: {v.inventoryNumber}</p>}

      <p className="doc-p">
        2. Принять транспортное средство к бухгалтерскому учёту в составе основных средств
        на основании акта приёма-передачи ОС-1.
      </p>

      <p className="doc-p">
        3. Установить следующие параметры бухгалтерского учёта:
      </p>
      <p className="doc-indent">
        первоначальная стоимость: <strong>{v.initialCost ? `${parseFloat(v.initialCost).toLocaleString('ru-RU')} руб.` : blank('')}</strong>
      </p>
      <p className="doc-indent">
        срок полезного использования: <strong>{blank(v.usefulLifeYears, '__')} лет</strong>
        {v.depreciationGroup && ` (${v.depreciationGroup})`}
      </p>
      <p className="doc-indent">метод начисления амортизации: линейный</p>
      {monthlyAmort && (
        <p className="doc-indent">ежемесячная сумма амортизации: <strong>{monthlyAmort} руб.</strong></p>
      )}

      <p className="doc-p">
        4. Начисление амортизации начать с 1-го числа месяца, следующего за месяцем
        ввода в эксплуатацию.
      </p>

      {v.driverFullName && (
        <p className="doc-p">
          5. Назначить ответственным за сохранность транспортного средства
          <strong> {v.driverFullName}</strong>.
        </p>
      )}

      <p className="doc-p doc-basis">
        Основание: Федеральный закон № 402-ФЗ «О бухгалтерском учёте»,
        ПБУ 6/01, ФСБУ 6/2020.
      </p>

      <div className="doc-sign-block">
        <p>Руководитель</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
      </div>
    </div>
  )
}
