import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceVehicleAssignmentFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orderNumber', label: 'Номер приказа', value: v.orderNumber, required: false, placeholder: '12' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'orgName', label: 'Организация', value: v.orgName, required: true },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'driverFullName', label: 'ФИО ответственного сотрудника', value: v.driverFullName, required: true, placeholder: 'Иванов Иван Иванович' },
  { key: 'employeePosition', label: 'Должность сотрудника', value: v.employeePosition || '', required: false, placeholder: 'Менеджер по продажам' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'vin', label: 'VIN', value: v.vin, required: false },
  { key: 'inventoryNumber', label: 'Инвентарный номер ОС', value: v.inventoryNumber || '', required: false, placeholder: 'ОС-00123' },
]

export function BalanceVehicleAssignment({ v }: { v: TemplateValues }) {
  const vehicleDesc = [
    v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '',
  ].filter(Boolean).join(' ')

  const positionLine = v.employeePosition
    ? `${v.employeePosition} ${blank(v.driverFullName)}`
    : blank(v.driverFullName)

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">
        ПРИКАЗ{v.orderNumber ? ` № ${v.orderNumber}` : ''}
      </p>
      <p className="doc-meta">
        {v.city ? `${v.city}, ` : ''}«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-subject">
        О ЗАКРЕПЛЕНИИ ТРАНСПОРТНОГО СРЕДСТВА ЗА ОТВЕТСТВЕННЫМ СОТРУДНИКОМ
      </p>

      <p className="doc-p">
        В целях обеспечения сохранности и надлежащей эксплуатации транспортного
        средства, находящегося на балансе организации,
      </p>

      <p className="doc-p doc-caps">ПРИКАЗЫВАЮ:</p>

      <p className="doc-p">
        1. Закрепить транспортное средство:
      </p>
      <p className="doc-indent">марка, модель: <strong>{blank(vehicleDesc || v.vehicleMake)}</strong></p>
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.vin && <p className="doc-indent">VIN: {v.vin}</p>}
      {v.inventoryNumber && <p className="doc-indent">инвентарный номер: {v.inventoryNumber}</p>}

      <p className="doc-p">
        за {positionLine} (далее — Ответственное лицо).
      </p>

      <p className="doc-p">
        2. Ответственному лицу:
      </p>
      <p className="doc-indent">
        2.1. Обеспечить сохранность транспортного средства и его техническую исправность.
      </p>
      <p className="doc-indent">
        2.2. Вести учёт служебных поездок в установленном порядке (путевые листы
        / маршрутные листы).
      </p>
      <p className="doc-indent">
        2.3. Не допускать использования ТС в личных целях без письменного разрешения руководителя.
      </p>
      <p className="doc-indent">
        2.4. Незамедлительно сообщать руководителю о неисправностях и ДТП.
      </p>

      <p className="doc-p">
        3. Главному бухгалтеру отразить факт закрепления ТС в регистрах бухгалтерского
        учёта.
      </p>

      <p className="doc-p">
        4. Настоящий Приказ вступает в силу с даты подписания.
      </p>

      <div className="doc-sign-block">
        <p>Руководитель</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
      </div>

      <div className="doc-sign-secondary">
        <p className="doc-sign-header">С приказом ознакомлен(а):</p>
        <p>{positionLine}</p>
        <p className="doc-sign-line">_________________ / {blank(v.driverFullName)} /</p>
        <p className="doc-sign-date">«______» _________________ {blank(v.todayYear)} г.</p>
      </div>
    </div>
  )
}
