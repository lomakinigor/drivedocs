import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const freeUseAgreementFields = (v: TemplateValues): TemplateField[] => [
  { key: 'contractNumber', label: 'Номер договора', value: v.contractNumber, required: false, placeholder: 'С-1/2026' },
  { key: 'city', label: 'Город', value: v.city, required: true, placeholder: 'Москва' },
  { key: 'orgName', label: 'Наименование ссудополучателя (организация)', value: v.orgName, required: true, placeholder: 'ООО «Ромашка»' },
  { key: 'inn', label: 'ИНН ссудополучателя', value: v.inn, required: false, placeholder: '7712345678' },
  { key: 'ownerFullName', label: 'ФИО руководителя ссудополучателя', value: v.ownerFullName, required: true },
  { key: 'lessorFullName', label: 'ФИО ссудодателя (физлицо)', value: v.lessorFullName || '', required: true, placeholder: 'Петров Пётр Петрович' },
  { key: 'lessorPassport', label: 'Паспорт ссудодателя', value: v.lessorPassport || '', required: false, placeholder: '45 12 345678, выдан УФМС...' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: true },
  { key: 'vehicleYear', label: 'Год выпуска', value: v.vehicleYear, required: true },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'vin', label: 'VIN', value: v.vin, required: false },
  { key: 'engineVolumeCc', label: 'Объём двигателя (куб. см)', value: v.engineVolumeCc, required: false },
  { key: 'contractStartDate', label: 'Дата начала', value: v.contractStartDate || v.today, required: true },
  { key: 'contractEndDate', label: 'Дата окончания', value: v.contractEndDate || '', required: false, placeholder: '31.12.2026' },
]

export function FreeUseAgreement({ v }: { v: TemplateValues }) {
  const lender = blank(v.lessorFullName || '')
  const borrower = blank(v.orgName)
  const contractNum = v.contractNumber ? ` № ${v.contractNumber}` : ''
  const dateRange = v.contractEndDate
    ? `с ${blank(v.contractStartDate || v.today)} по ${v.contractEndDate}`
    : `с ${blank(v.contractStartDate || v.today)} на неопределённый срок`

  return (
    <div className="doc-body">
      <p className="doc-center doc-title">
        ДОГОВОР БЕЗВОЗМЕЗДНОГО ПОЛЬЗОВАНИЯ ТРАНСПОРТНЫМ СРЕДСТВОМ{contractNum}
      </p>
      <p className="doc-meta">
        (договор ссуды)
      </p>

      <p className="doc-meta">
        {blank(v.city, '___________')}, «{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-p">
        <strong>{lender}</strong>{v.lessorPassport ? `, паспорт: ${v.lessorPassport}` : ''},
        именуемый(ая) далее «Ссудодатель», и <strong>{borrower}</strong>
        {v.inn ? `, ИНН ${v.inn}` : ''}, в лице {blank(v.ownerFullName)},
        действующего на основании Устава, именуемое далее «Ссудополучатель»,
        заключили настоящий Договор о нижеследующем.
      </p>

      <p className="doc-section">1. ПРЕДМЕТ ДОГОВОРА</p>

      <p className="doc-p">
        1.1. Ссудодатель передаёт Ссудополучателю в безвозмездное временное пользование
        транспортное средство (далее — ТС):
      </p>
      <p className="doc-indent">марка, модель: <strong>{blank(v.vehicleMake)} {blank(v.vehicleModel, '')}</strong></p>
      {v.vehicleYear && <p className="doc-indent">год выпуска: {v.vehicleYear}</p>}
      <p className="doc-indent">гос. регистрационный знак: <strong>{blank(v.licensePlate)}</strong></p>
      {v.vin && <p className="doc-indent">VIN: {v.vin}</p>}
      {v.engineVolumeCc && <p className="doc-indent">объём двигателя: {v.engineVolumeCc} куб. см</p>}

      <p className="doc-p">
        1.2. ТС передаётся без экипажа. Ссудополучатель самостоятельно осуществляет
        управление ТС и несёт все расходы на его эксплуатацию.
      </p>

      <p className="doc-p">
        1.3. Срок пользования: {dateRange}.
      </p>

      <p className="doc-section">2. БЕЗВОЗМЕЗДНОСТЬ И РАСХОДЫ</p>

      <p className="doc-p">
        2.1. Пользование ТС осуществляется безвозмездно. Арендная плата не взимается.
      </p>

      <p className="doc-p">
        2.2. Ссудополучатель за свой счёт несёт все расходы на ГСМ, техническое
        обслуживание, текущий ремонт и страхование ТС.
      </p>

      <p className="doc-p">
        2.3. Стоимость безвозмездного пользования подлежит включению в налоговую базу
        по налогу на прибыль в соответствии со ст. 250 НК РФ.
      </p>

      <p className="doc-section">3. ПРАВА И ОБЯЗАННОСТИ СТОРОН</p>

      <p className="doc-p">
        3.1. Ссудодатель обязуется передать ТС в исправном состоянии, пригодном для
        использования по назначению, и гарантирует отсутствие обременений.
      </p>

      <p className="doc-p">
        3.2. Ссудополучатель обязуется: использовать ТС строго в служебных целях,
        поддерживать в надлежащем техническом состоянии, не передавать третьим лицам
        без согласия Ссудодателя, вернуть в том же состоянии с учётом нормального износа.
      </p>

      <p className="doc-section">4. ВОЗВРАТ И РАСТОРЖЕНИЕ</p>

      <p className="doc-p">
        4.1. Ссудодатель вправе потребовать досрочного возврата ТС, уведомив
        Ссудополучателя за 30 (тридцать) дней.
      </p>

      <p className="doc-p">
        4.2. ТС возвращается по акту приёма-передачи (возврата).
      </p>

      <p className="doc-p">
        4.3. Настоящий Договор регулируется ст. 689–701 Гражданского кодекса РФ.
      </p>

      <p className="doc-p">
        4.4. Договор составлен в двух экземплярах, по одному для каждой из сторон.
      </p>

      <div className="doc-sign-row">
        <div className="doc-sign-col">
          <p className="doc-sign-header">ССУДОДАТЕЛЬ</p>
          <p>{lender}</p>
          {v.lessorPassport && <p className="doc-small">Паспорт: {v.lessorPassport}</p>}
          <p className="doc-sign-line">_________________ / {blank(v.lessorFullName || '')} /</p>
        </div>
        <div className="doc-sign-col">
          <p className="doc-sign-header">ССУДОПОЛУЧАТЕЛЬ</p>
          <p>{borrower}</p>
          {v.inn && <p className="doc-small">ИНН: {v.inn}</p>}
          <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        </div>
      </div>
    </div>
  )
}
