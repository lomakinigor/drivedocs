import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const compensationOrderFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orderNumber', label: 'Номер приказа', value: v.orderNumber, required: false, placeholder: '12-к' },
  { key: 'city', label: 'Город', value: v.city, required: true, placeholder: 'Москва' },
  { key: 'orgName', label: 'Наименование организации', value: v.orgName, required: true, placeholder: 'ООО «Ромашка»' },
  { key: 'inn', label: 'ИНН организации', value: v.inn, required: false, placeholder: '7712345678' },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true, placeholder: 'Иванов Иван Иванович' },
  { key: 'employeeFullName', label: 'ФИО сотрудника', value: v.employeeFullName || '', required: true, placeholder: 'Петров Пётр Петрович' },
  { key: 'employeePosition', label: 'Должность сотрудника', value: v.employeePosition || '', required: true, placeholder: 'менеджер' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true, placeholder: 'Toyota' },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: true, placeholder: 'Camry' },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: true, placeholder: '2020' },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true, placeholder: 'А001АА 77' },
  { key: 'vin', label: 'VIN', value: v.vin, required: false },
  { key: 'compensationAmount', label: 'Сумма компенсации (₽/мес)', value: v.compensationAmount, required: true, placeholder: '1200' },
  { key: 'paymentDay', label: 'День выплаты (число месяца)', value: v.paymentDay, required: true, placeholder: '15' },
]

export function CompensationOrder({ v }: { v: TemplateValues }) {
  const employee = blank(v.employeeFullName || '')
  const position = blank(v.employeePosition || '', 'должность')

  return (
    <div className="doc-body">
      <p className="doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">
        ПРИКАЗ{v.orderNumber ? ` № ${v.orderNumber}` : ''}
      </p>

      <p className="doc-meta">
        {blank(v.city, '___________')}, «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-subject">
        О ВЫПЛАТЕ КОМПЕНСАЦИИ ЗА ИСПОЛЬЗОВАНИЕ ЛИЧНОГО АВТОМОБИЛЯ
      </p>

      <p className="doc-p doc-caps">ПРИКАЗЫВАЮ:</p>

      <p className="doc-p">
        1. Выплачивать <strong>{employee}</strong>, {position}, ежемесячную
        компенсацию за использование личного легкового автомобиля в служебных целях
        в размере <strong>{blank(v.compensationAmount, '______')}&nbsp;руб.</strong>
      </p>

      <p className="doc-p">
        2. Автомобиль: <strong>{blank(v.vehicleMake)} {blank(v.vehicleModel, '')}</strong>
        {v.vehicleYear ? `, ${v.vehicleYear} г.в.` : ''},
        гос. номер <strong>{blank(v.licensePlate)}</strong>
        {v.vin ? `, VIN: ${v.vin}` : ''}.
      </p>

      <p className="doc-p">
        3. Компенсацию выплачивать ежемесячно не позднее {blank(v.paymentDay, '__')} числа
        месяца, следующего за отчётным.
      </p>

      <p className="doc-p">
        4. Основание: заявление {employee}, дополнительное соглашение к трудовому договору.
      </p>

      <p className="doc-p doc-basis">
        Основание: ст. 188 Трудового кодекса Российской Федерации,
        Постановление Правительства РФ № 92 от 08.02.2002.
      </p>

      <div className="doc-sign-block">
        <p>Руководитель организации</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        <p className="doc-sign-date">«____» ______________ {blank(v.todayYear)} г.</p>
      </div>

      <div className="doc-sign-block doc-sign-secondary">
        <p>С приказом ознакомлен(а):</p>
        <p className="doc-sign-line">_________________ / {employee} /</p>
        <p className="doc-sign-date">«____» ______________ {blank(v.todayYear)} г.</p>
      </div>
    </div>
  )
}
