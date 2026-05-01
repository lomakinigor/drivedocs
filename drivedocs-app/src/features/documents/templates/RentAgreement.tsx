import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const rentAgreementFields = (v: TemplateValues): TemplateField[] => [
  { key: 'contractNumber', label: 'Номер договора', value: v.contractNumber, required: false, placeholder: 'А-1/2026' },
  { key: 'city', label: 'Город', value: v.city, required: true, placeholder: 'Москва' },
  { key: 'orgName', label: 'Наименование арендатора (организация)', value: v.orgName, required: true, placeholder: 'ООО «Ромашка»' },
  { key: 'orgInn', label: 'ИНН арендатора', value: v.orgInn || v.inn, required: false, placeholder: '7712345678' },
  { key: 'ownerFullName', label: 'ФИО руководителя арендатора', value: v.ownerFullName, required: true, placeholder: 'Иванов Иван Иванович' },
  { key: 'lessorFullName', label: 'ФИО арендодателя (физлицо)', value: v.lessorFullName || '', required: true, placeholder: 'Петров Пётр Петрович' },
  { key: 'lessorPassport', label: 'Паспорт арендодателя', value: v.lessorPassport || '', required: false, placeholder: '45 12 345678, выдан УФМС...' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: true },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: true },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'vin', label: 'VIN', value: v.vin, required: false },
  { key: 'engineVolumeCc', label: 'Объём двигателя (куб. см)', value: v.engineVolumeCc, required: false },
  { key: 'rentAmount', label: 'Арендная плата (₽/мес)', value: v.rentAmount, required: true, placeholder: '20000' },
  { key: 'contractStartDate', label: 'Дата начала аренды', value: v.contractStartDate || v.today, required: true },
  { key: 'contractEndDate', label: 'Дата окончания аренды', value: v.contractEndDate || '', required: false, placeholder: '31.12.2026' },
]

export function RentAgreement({ v }: { v: TemplateValues }) {
  const lessor = blank(v.lessorFullName || '')
  const renter = blank(v.orgName)
  const contractNum = v.contractNumber ? ` № ${v.contractNumber}` : ''
  const dateRange = v.contractEndDate
    ? `с ${blank(v.contractStartDate || v.today)} по ${v.contractEndDate}`
    : `с ${blank(v.contractStartDate || v.today)}`

  return (
    <div className="doc-body">
      <p className="doc-center doc-title">
        ДОГОВОР АРЕНДЫ ТРАНСПОРТНОГО СРЕДСТВА БЕЗ ЭКИПАЖА{contractNum}
      </p>

      <p className="doc-meta">
        {blank(v.city, '___________')}, «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-p">
        <strong>{lessor}</strong>{v.lessorPassport ? `, паспорт: ${v.lessorPassport}` : ''},
        именуемый(ая) далее «Арендодатель», и <strong>{renter}</strong>
        {v.orgInn || v.inn ? `, ИНН ${v.orgInn || v.inn}` : ''}, в лице {blank(v.ownerFullName)},
        действующего на основании Устава, именуемое далее «Арендатор»,
        заключили настоящий Договор о нижеследующем.
      </p>

      <p className="doc-section">1. ПРЕДМЕТ ДОГОВОРА</p>

      <p className="doc-p">
        1.1. Арендодатель передаёт Арендатору во временное владение и пользование
        транспортное средство (далее — ТС):
      </p>
      <p className="doc-indent">марка, модель: <strong>{blank(v.vehicleMake)} {blank(v.vehicleModel, '')}</strong></p>
      {v.vehicleYear && <p className="doc-indent">год выпуска: {v.vehicleYear}</p>}
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.vin && <p className="doc-indent">VIN: {v.vin}</p>}
      {v.engineVolumeCc && <p className="doc-indent">объём двигателя: {v.engineVolumeCc} куб. см</p>}

      <p className="doc-p">
        1.2. ТС передаётся без экипажа. Арендатор самостоятельно осуществляет управление
        арендованным ТС и его эксплуатацию.
      </p>

      <p className="doc-p">
        1.3. Срок аренды: {dateRange}.
      </p>

      <p className="doc-section">2. АРЕНДНАЯ ПЛАТА И ПОРЯДОК РАСЧЁТОВ</p>

      <p className="doc-p">
        2.1. Ежемесячная арендная плата составляет <strong>{blank(v.rentAmount, '______')}&nbsp;руб.</strong>
      </p>

      <p className="doc-p">
        2.2. Арендная плата выплачивается Арендатором не позднее 15 числа месяца,
        следующего за отчётным. Арендатор выступает налоговым агентом и удерживает
        НДФЛ в размере 13% от суммы выплаты.
      </p>

      <p className="doc-section">3. ПРАВА И ОБЯЗАННОСТИ СТОРОН</p>

      <p className="doc-p">
        3.1. Арендатор обязуется: использовать ТС по назначению, поддерживать
        в исправном состоянии, нести расходы на ГСМ, ТО и страхование,
        соблюдать правила дорожного движения.
      </p>

      <p className="doc-p">
        3.2. Арендодатель гарантирует, что ТС не обременено правами третьих лиц
        и технически исправно.
      </p>

      <p className="doc-section">4. РАСТОРЖЕНИЕ И ПРОЧИЕ УСЛОВИЯ</p>

      <p className="doc-p">
        4.1. Договор может быть расторгнут досрочно по соглашению сторон или в
        одностороннем порядке с письменным уведомлением за 30 дней.
      </p>

      <p className="doc-p">
        4.2. Во всём, что не предусмотрено настоящим Договором, стороны
        руководствуются Гражданским кодексом РФ (ст. 642–649).
      </p>

      <p className="doc-p">
        4.3. Договор составлен в двух экземплярах, по одному для каждой из сторон.
      </p>

      <div className="doc-sign-row">
        <div className="doc-sign-col">
          <p className="doc-sign-header">АРЕНДОДАТЕЛЬ</p>
          <p>{lessor}</p>
          {v.lessorPassport && <p className="doc-small">Паспорт: {v.lessorPassport}</p>}
          <p className="doc-sign-line">_________________ / {blank(v.lessorFullName || '')} /</p>
        </div>
        <div className="doc-sign-col">
          <p className="doc-sign-header">АРЕНДАТОР</p>
          <p>{renter}</p>
          {(v.orgInn || v.inn) && <p className="doc-small">ИНН: {v.orgInn || v.inn}</p>}
          <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        </div>
      </div>
    </div>
  )
}
