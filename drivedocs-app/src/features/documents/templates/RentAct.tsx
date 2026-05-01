import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const rentActFields = (v: TemplateValues): TemplateField[] => [
  { key: 'actNumber', label: 'Номер акта', value: v.actNumber || '', required: false, placeholder: '5' },
  { key: 'contractNumber', label: 'Номер договора аренды', value: v.contractNumber, required: false, placeholder: 'А-1/2026' },
  { key: 'currentMonth', label: 'Период (месяц год)', value: v.currentMonth, required: true, placeholder: 'Май 2026' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'orgName', label: 'Наименование арендатора', value: v.orgName, required: true },
  { key: 'ownerFullName', label: 'ФИО руководителя арендатора', value: v.ownerFullName, required: true },
  { key: 'lessorFullName', label: 'ФИО арендодателя', value: v.lessorFullName || '', required: true, placeholder: 'Петров Пётр Петрович' },
  { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
  { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
  { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
  { key: 'rentAmount', label: 'Арендная плата (₽/мес)', value: v.rentAmount, required: true, placeholder: '20000' },
]

export function RentAct({ v }: { v: TemplateValues }) {
  const vehicle = [v.vehicleMake, v.vehicleModel].filter(Boolean).join(' ')
  const actNum = v.actNumber ? ` № ${v.actNumber}` : ''
  const contractRef = v.contractNumber ? ` № ${v.contractNumber}` : ''

  return (
    <div className="doc-body">
      <p className="doc-center doc-title">
        АКТ{actNum} ОКАЗАНИЯ УСЛУГ ПО АРЕНДЕ ТРАНСПОРТНОГО СРЕДСТВА
      </p>
      <p className="doc-meta">
        за <strong>{blank(v.currentMonth)}</strong>
        {contractRef && ` к Договору аренды${contractRef}`}
      </p>
      <p className="doc-meta">
        {v.city ? `${v.city}, ` : ''}«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-p">
        <strong>{blank(v.lessorFullName || '')}</strong>, именуемый(ая) далее «Арендодатель»,
        и <strong>{blank(v.orgName)}</strong>, в лице {blank(v.ownerFullName)},
        именуемое далее «Арендатор», составили настоящий Акт о нижеследующем.
      </p>

      <p className="doc-p">
        Арендодатель в течение {blank(v.currentMonth)} предоставлял во временное
        владение и пользование транспортное средство:
      </p>
      <p className="doc-indent">
        <strong>{blank(vehicle || v.vehicleMake)}</strong>, гос.&nbsp;номер&nbsp;
        <strong>{blank(v.licensePlate)}</strong>
      </p>

      <p className="doc-p">
        Арендатор принял транспортное средство и использовал его по назначению.
        Претензий к техническому состоянию ТС и исполнению договора нет.
      </p>

      <table className="doc-table" style={{ marginTop: '12pt' }}>
        <thead>
          <tr>
            <th className="doc-th" style={{ width: '55%' }}>Услуга</th>
            <th className="doc-th">Период</th>
            <th className="doc-th">Сумма, руб.</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td">Аренда ТС без экипажа</td>
            <td className="doc-td doc-td-center">{blank(v.currentMonth)}</td>
            <td className="doc-td doc-td-center">
              <strong>{v.rentAmount ? parseFloat(v.rentAmount).toLocaleString('ru-RU') : blank('')}</strong>
            </td>
          </tr>
          <tr className="doc-tr-total">
            <td className="doc-td" colSpan={2}><strong>ИТОГО</strong></td>
            <td className="doc-td doc-td-center">
              <strong>{v.rentAmount ? parseFloat(v.rentAmount).toLocaleString('ru-RU') : blank('')}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p doc-basis">
        НДС не облагается (физическое лицо не является плательщиком НДС).
      </p>

      <div className="doc-sign-row">
        <div className="doc-sign-col">
          <p className="doc-sign-header">АРЕНДОДАТЕЛЬ</p>
          <p className="doc-sign-line">_________________ / {blank(v.lessorFullName || '')} /</p>
        </div>
        <div className="doc-sign-col">
          <p className="doc-sign-header">АРЕНДАТОР</p>
          <p>{blank(v.orgName)}</p>
          <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        </div>
      </div>
    </div>
  )
}
