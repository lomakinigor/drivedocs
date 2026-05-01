import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

function pp92Norm(engineCc: string): number {
  const cc = parseInt(engineCc, 10)
  if (!cc || isNaN(cc)) return 0
  return cc <= 2000 ? 1200 : 1500
}

function calcAmount(
  compensationAmount: string,
  daysWorked: string,
  workingDaysInMonth: string,
): string {
  const base = parseFloat(compensationAmount.replace(',', '.'))
  const worked = parseInt(daysWorked, 10)
  const total = parseInt(workingDaysInMonth, 10)
  if (!base || isNaN(base)) return ''
  if (!worked || !total || isNaN(worked) || isNaN(total) || worked >= total) {
    return base.toLocaleString('ru-RU', { minimumFractionDigits: 2 })
  }
  const result = (base / total) * worked
  return result.toLocaleString('ru-RU', { minimumFractionDigits: 2 })
}

export const compensationCalcFields = (v: TemplateValues): TemplateField[] => {
  const norm = pp92Norm(v.engineVolumeCc)
  return [
    { key: 'orgName', label: 'Организация / ИП', value: v.orgName, required: true },
    { key: 'ownerFullName', label: 'ФИО руководителя / ИП', value: v.ownerFullName, required: true },
    { key: 'driverFullName', label: 'ФИО сотрудника', value: v.driverFullName, required: true, placeholder: 'Иванов Иван Иванович' },
    { key: 'vehicleMake', label: 'Марка', value: v.vehicleMake, required: true },
    { key: 'vehicleModel', label: 'Модель', value: v.vehicleModel, required: false },
    { key: 'licensePlate', label: 'Гос. номер', value: v.licensePlate, required: true },
    { key: 'engineVolumeCc', label: 'Объём двигателя (куб.см)', value: v.engineVolumeCc, required: true, placeholder: '1600' },
    { key: 'currentMonth', label: 'Период (месяц год)', value: v.currentMonth, required: true, placeholder: 'Май 2026' },
    { key: 'compensationAmount', label: 'Установленная компенсация (₽/мес)', value: v.compensationAmount || String(norm || ''), required: true, placeholder: '1200' },
    { key: 'workingDaysInMonth', label: 'Рабочих дней в месяце', value: v.workingDaysInMonth, required: false, placeholder: '21' },
    { key: 'daysWorked', label: 'Отработано дней', value: v.daysWorked, required: false, placeholder: '21' },
    { key: 'actualMileage', label: 'Фактический пробег (км)', value: v.actualMileage, required: false, placeholder: '1200' },
  ]
}

export function CompensationCalc({ v }: { v: TemplateValues }) {
  const norm = pp92Norm(v.engineVolumeCc)
  const normStr = norm ? `${norm.toLocaleString('ru-RU')} руб.` : blank('')
  const vehicle = [v.vehicleMake, v.vehicleModel].filter(Boolean).join(' ')
  const amount = v.compensationAmount
    ? calcAmount(v.compensationAmount, v.daysWorked, v.workingDaysInMonth)
    : ''

  return (
    <div className="doc-body">
      <p className="doc-center doc-org-header">{blank(v.orgName)}</p>

      <p className="doc-center doc-title">РАСЧЁТ СУММЫ КОМПЕНСАЦИИ</p>
      <p className="doc-meta">
        за использование личного автомобиля в служебных целях
        <br />за <strong>{blank(v.currentMonth)}</strong>
      </p>

      <table className="doc-info-table">
        <tbody>
          <tr>
            <td className="doc-info-label">Сотрудник:</td>
            <td className="doc-info-value"><strong>{blank(v.driverFullName)}</strong></td>
          </tr>
          <tr>
            <td className="doc-info-label">Автомобиль:</td>
            <td className="doc-info-value">
              {blank(vehicle || v.vehicleMake)}, гос.&nbsp;номер&nbsp;
              <strong>{blank(v.licensePlate)}</strong>
            </td>
          </tr>
          {v.engineVolumeCc && (
            <tr>
              <td className="doc-info-label">Объём двигателя:</td>
              <td className="doc-info-value">{v.engineVolumeCc}&nbsp;куб.&nbsp;см</td>
            </tr>
          )}
        </tbody>
      </table>

      <p className="doc-section">РАСЧЁТ</p>

      <table className="doc-table">
        <thead>
          <tr>
            <th className="doc-th" style={{ width: '55%' }}>Показатель</th>
            <th className="doc-th">Значение</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="doc-td">
              Норматив по Постановлению Правительства РФ&nbsp;№&nbsp;92
              {v.engineVolumeCc && ` (объём ${parseInt(v.engineVolumeCc)} куб.см)`}
            </td>
            <td className="doc-td doc-td-center">
              <strong>{norm ? normStr : blank('')}</strong>
            </td>
          </tr>
          <tr>
            <td className="doc-td">Установленная сумма компенсации (из Приказа)</td>
            <td className="doc-td doc-td-center">
              <strong>{v.compensationAmount ? `${parseFloat(v.compensationAmount).toLocaleString('ru-RU')} руб.` : blank('')}</strong>
            </td>
          </tr>
          {v.workingDaysInMonth && (
            <tr>
              <td className="doc-td">Рабочих дней в месяце</td>
              <td className="doc-td doc-td-center">{v.workingDaysInMonth}</td>
            </tr>
          )}
          {v.daysWorked && (
            <tr>
              <td className="doc-td">Фактически отработано дней</td>
              <td className="doc-td doc-td-center">{v.daysWorked}</td>
            </tr>
          )}
          {v.actualMileage && (
            <tr>
              <td className="doc-td">Фактический пробег за период</td>
              <td className="doc-td doc-td-center">{v.actualMileage}&nbsp;км</td>
            </tr>
          )}
          <tr className="doc-tr-total">
            <td className="doc-td"><strong>ИТОГО к выплате</strong></td>
            <td className="doc-td doc-td-center">
              <strong>{amount ? `${amount} руб.` : blank('')}</strong>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="doc-basis">
        Основание: Постановление Правительства РФ от 08.02.2002 №&nbsp;92
        «Об установлении норм расходов организаций на выплату компенсации
        за использование для служебных поездок личных легковых автомобилей
        и мотоциклов».
      </p>

      <div className="doc-sign-row doc-sign-bottom">
        <div className="doc-sign-col">
          <p>Сотрудник</p>
          <p className="doc-sign-line">_________________ / {blank(v.driverFullName)} /</p>
        </div>
        <div className="doc-sign-col">
          <p>Руководитель</p>
          <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        </div>
      </div>

      <p className="doc-sign-date">
        Дата:&nbsp;«{blank(v.todayDay)}»&nbsp;{blank(v.todayMonth)}&nbsp;{blank(v.todayYear)}&nbsp;г.
      </p>
    </div>
  )
}
