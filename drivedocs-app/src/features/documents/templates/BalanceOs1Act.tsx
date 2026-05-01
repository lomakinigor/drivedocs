import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceOs1ActFields = (v: TemplateValues): TemplateField[] => [
  { key: 'actNumber', label: 'Номер акта', value: v.actNumber || '', required: false, placeholder: '1' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'orgName', label: 'Организация (получатель)', value: v.orgName, required: true },
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
  { key: 'contractNumber', label: 'Номер договора купли-продажи', value: v.contractNumber || '', required: false, placeholder: '47' },
  { key: 'contractDate', label: 'Дата договора', value: v.contractDate || '', required: false, placeholder: '01.04.2026' },
]

export function BalanceOs1Act({ v }: { v: TemplateValues }) {
  const vehicleDesc = [v.vehicleMake, v.vehicleModel, v.vehicleYear ? `${v.vehicleYear} г.в.` : '']
    .filter(Boolean).join(' ')

  const monthlyAmort = v.initialCost && v.usefulLifeYears
    ? (parseFloat(v.initialCost) / (parseFloat(v.usefulLifeYears) * 12))
        .toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''

  const initialCostFormatted = v.initialCost
    ? parseFloat(v.initialCost).toLocaleString('ru-RU', { minimumFractionDigits: 2 })
    : ''

  return (
    <div className="doc-body">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6pt' }}>
        <div style={{ flex: 1 }}>
          <p className="doc-center doc-org-header">{blank(v.orgName)}</p>
        </div>
        <div style={{ textAlign: 'right', minWidth: '180pt', fontSize: '9pt' }}>
          <p>Форма № ОС-1</p>
          <p>Утверждена Постановлением Госкомстата РФ</p>
          <p>от 21.01.2003 № 7</p>
        </div>
      </div>

      <p className="doc-center doc-title">
        АКТ О ПРИЁМЕ-ПЕРЕДАЧЕ ОБЪЕКТА ОСНОВНЫХ СРЕДСТВ{v.actNumber ? ` № ${v.actNumber}` : ''}
      </p>
      <p className="doc-meta">
        {v.city ? `${v.city}, ` : ''}«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.
      </p>

      <p className="doc-subject">(Форма ОС-1)</p>

      <table className="doc-info-table" style={{ marginBottom: '8pt' }}>
        <tbody>
          <tr>
            <td className="doc-info-label">Организация-получатель:</td>
            <td className="doc-info-value"><strong>{blank(v.orgName)}</strong></td>
          </tr>
          {(v.contractNumber || v.contractDate) && (
            <tr>
              <td className="doc-info-label">Основание передачи:</td>
              <td className="doc-info-value">
                Договор купли-продажи{v.contractNumber ? ` № ${v.contractNumber}` : ''}
                {v.contractDate ? ` от ${v.contractDate}` : ''}
              </td>
            </tr>
          )}
          <tr>
            <td className="doc-info-label">Инвентарный номер:</td>
            <td className="doc-info-value">{blank(v.inventoryNumber, 'не присвоен')}</td>
          </tr>
        </tbody>
      </table>

      <p className="doc-p">
        Комиссия в составе, назначенной приказом руководителя, произвела осмотр объекта
        основных средств и составила настоящий акт о нижеследующем:
      </p>

      <p className="doc-indent"><strong>1. Сведения об объекте ОС</strong></p>

      <table className="doc-table" style={{ marginBottom: '8pt' }}>
        <tbody>
          <tr>
            <td className="doc-td" style={{ width: '55%' }}>Наименование объекта</td>
            <td className="doc-td"><strong>{blank(vehicleDesc || v.vehicleMake)}</strong></td>
          </tr>
          <tr>
            <td className="doc-td">Государственный регистрационный знак</td>
            <td className="doc-td"><strong>{blank(v.licensePlate)}</strong></td>
          </tr>
          {v.vin && (
            <tr>
              <td className="doc-td">VIN / Идентификационный номер</td>
              <td className="doc-td">{v.vin}</td>
            </tr>
          )}
          {v.vehicleYear && (
            <tr>
              <td className="doc-td">Год выпуска</td>
              <td className="doc-td">{v.vehicleYear}</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="doc-indent"><strong>2. Бухгалтерские данные</strong></p>

      <table className="doc-table" style={{ marginBottom: '8pt' }}>
        <tbody>
          <tr>
            <td className="doc-td" style={{ width: '55%' }}>Первоначальная стоимость</td>
            <td className="doc-td doc-td-center">
              <strong>{initialCostFormatted ? `${initialCostFormatted} руб.` : blank('')}</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-td">Срок полезного использования</td>
            <td className="doc-td doc-td-center">
              {blank(v.usefulLifeYears, '___')} {v.usefulLifeYears ? 'лет' : ''}
            </td>
          </tr>
          {v.depreciationGroup && (
            <tr>
              <td className="doc-td">Амортизационная группа</td>
              <td className="doc-td doc-td-center">{v.depreciationGroup}</td>
            </tr>
          )}
          {monthlyAmort && (
            <tr className="doc-tr-total">
              <td className="doc-td">Ежемесячная сумма амортизации (линейный метод)</td>
              <td className="doc-td doc-td-center"><strong>{monthlyAmort} руб.</strong></td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="doc-indent"><strong>3. Заключение комиссии</strong></p>

      <p className="doc-p">
        Объект основных средств осмотрен комиссией, приведён в рабочее состояние,
        соответствует техническим условиям, пригоден к эксплуатации.
        Претензий к техническому состоянию нет.
      </p>

      {v.driverFullName && (
        <p className="doc-p">
          Ответственный за сохранность: <strong>{v.driverFullName}</strong>.
        </p>
      )}

      <p className="doc-p doc-basis">
        Основание: ФСБУ 6/2020 «Основные средства», Постановление Госкомстата РФ от 21.01.2003 № 7.
      </p>

      <div className="doc-sign-row doc-sign-bottom">
        <div className="doc-sign-col">
          <p>Председатель комиссии</p>
          <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        </div>
        <div className="doc-sign-col">
          <p>Главный бухгалтер</p>
          <p className="doc-sign-line">_________________ / _____________________ /</p>
        </div>
      </div>

      <div className="doc-sign-secondary">
        <p>Объект принял:</p>
        <p className="doc-sign-line">
          _________________ / {v.driverFullName ? v.driverFullName : '_____________________ '} /
        </p>
        <p className="doc-sign-date">«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.</p>
      </div>
    </div>
  )
}
