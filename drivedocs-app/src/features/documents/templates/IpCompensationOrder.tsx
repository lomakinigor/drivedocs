import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const ipCompensationOrderFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orderNumber', label: 'Номер приказа', value: v.orderNumber, required: false, placeholder: '1' },
  { key: 'city', label: 'Город', value: v.city, required: true, placeholder: 'Москва' },
  { key: 'ownerFullName', label: 'ФИО предпринимателя', value: v.ownerFullName, required: true, placeholder: 'Иванов Иван Иванович' },
  { key: 'inn', label: 'ИНН', value: v.inn, required: true, placeholder: '123456789012' },
  { key: 'ogrn', label: 'ОГРНИП', value: v.ogrn, required: false, placeholder: '312345678901234' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true, placeholder: 'Toyota' },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: true, placeholder: 'Camry' },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: true, placeholder: '2020' },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true, placeholder: 'А001АА 77' },
  { key: 'vin', label: 'VIN', value: v.vin, required: false, placeholder: 'JTDBT923X71234567' },
  { key: 'compensationAmount', label: 'Сумма компенсации (₽/мес)', value: v.compensationAmount, required: true, placeholder: '5000' },
  { key: 'paymentDay', label: 'День выплаты (число месяца)', value: v.paymentDay, required: true, placeholder: '15' },
]

export function IpCompensationOrder({ v }: { v: TemplateValues }) {
  const vehicleDesc = [
    blank(v.vehicleMake, ''),
    blank(v.vehicleModel, ''),
    v.vehicleYear ? `${v.vehicleYear} г.в.` : '',
  ].filter(Boolean).join(' ')

  return (
    <div className="doc-body">
      <p className="doc-center doc-title">
        ПРИКАЗ{v.orderNumber ? ` № ${v.orderNumber}` : ''}
      </p>

      <p className="doc-meta">
        {blank(v.city, '___________')}, «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-subject">
        ОБ ИСПОЛЬЗОВАНИИ ЛИЧНОГО АВТОМОБИЛЯ В СЛУЖЕБНЫХ ЦЕЛЯХ
      </p>

      <p className="doc-p">
        Я, индивидуальный предприниматель <strong>{blank(v.ownerFullName)}</strong>,
        ИНН {blank(v.inn)}{v.ogrn ? `, ОГРНИП ${v.ogrn}` : ''},
      </p>

      <p className="doc-p doc-caps">ПРИКАЗЫВАЮ:</p>

      <p className="doc-p">
        1. Разрешить использование в служебных (производственных) целях личного автомобиля:
      </p>
      <p className="doc-indent">марка и модель: <strong>{blank(vehicleDesc || v.vehicleMake)}</strong></p>
      {v.vehicleYear && <p className="doc-indent">год выпуска: {v.vehicleYear}</p>}
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.vin && <p className="doc-indent">идентификационный номер (VIN): {v.vin}</p>}

      <p className="doc-p">
        2. Установить ежемесячную денежную компенсацию за использование личного
        транспортного средства в размере <strong>{blank(v.compensationAmount, '______')}&nbsp;руб.</strong>
      </p>

      <p className="doc-p">
        3. Компенсацию выплачивать ежемесячно не позднее {blank(v.paymentDay, '__')} числа
        месяца, следующего за отчётным.
      </p>

      <p className="doc-p">
        4. Дополнительные расходы на топливо, техническое обслуживание и ремонт
        возмещаются при предоставлении подтверждающих документов.
      </p>

      <p className="doc-p">
        5. Настоящий Приказ вступает в силу с даты подписания.
      </p>

      <p className="doc-p doc-basis">
        Основание: ст. 188 Трудового кодекса Российской Федерации.
      </p>

      <div className="doc-sign-block">
        <p>Индивидуальный предприниматель</p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
      </div>
    </div>
  )
}
