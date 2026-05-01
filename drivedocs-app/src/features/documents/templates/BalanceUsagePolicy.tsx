import type { TemplateValues, TemplateField } from './types'

function blank(v: string, fallback = '___________') {
  return v.trim() || fallback
}

export const balanceUsagePolicyFields = (v: TemplateValues): TemplateField[] => [
  { key: 'orgName', label: 'Наименование организации', value: v.orgName, required: true, placeholder: 'ООО «Ромашка»' },
  { key: 'inn', label: 'ИНН', value: v.inn, required: false },
  { key: 'ownerFullName', label: 'ФИО руководителя', value: v.ownerFullName, required: true },
  { key: 'orderNumber', label: 'Номер приказа об утверждении', value: v.orderNumber, required: false, placeholder: '15' },
  { key: 'city', label: 'Город', value: v.city, required: false, placeholder: 'Москва' },
  { key: 'compensationAmount', label: 'Размер компенсации (₽/мес, до 2000 куб.см)', value: v.compensationAmount, required: false, placeholder: '1200' },
  { key: 'paymentDay', label: 'День выплаты компенсации', value: v.paymentDay, required: false, placeholder: '15' },
]

export function BalanceUsagePolicy({ v }: { v: TemplateValues }) {
  const approvalLine = v.orderNumber
    ? `Приказом № ${v.orderNumber} от «${blank(v.todayDay)}» ${blank(v.todayMonth)} ${blank(v.todayYear)} г.`
    : `Приказом от «${blank(v.todayDay)}» ${blank(v.todayMonth)} ${blank(v.todayYear)} г.`

  return (
    <div className="doc-body">
      <table className="doc-info-table">
        <tbody>
          <tr>
            <td style={{ width: '50%' }}>&nbsp;</td>
            <td>
              <p><strong>УТВЕРЖДЕНО</strong></p>
              <p>{approvalLine}</p>
              <p>Руководитель {blank(v.orgName)}</p>
              <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
            </td>
          </tr>
        </tbody>
      </table>

      <p className="doc-center doc-title">
        ПОЛОЖЕНИЕ
      </p>
      <p className="doc-center">
        об использовании личных автотранспортных средств сотрудников
        в служебных целях
      </p>
      <p className="doc-meta">
        {v.city ? `${v.city}, ` : ''}{blank(v.todayYear)} г.
      </p>

      <p className="doc-section">1. ОБЩИЕ ПОЛОЖЕНИЯ</p>

      <p className="doc-p">
        1.1. Настоящее Положение разработано в соответствии со ст. 188 Трудового
        кодекса Российской Федерации и регулирует порядок использования личных
        транспортных средств сотрудников <strong>{blank(v.orgName)}</strong>
        {v.inn ? ` (ИНН ${v.inn})` : ''} в служебных целях, а также условия
        выплаты денежной компенсации за их использование.
      </p>

      <p className="doc-p">
        1.2. Настоящее Положение является локальным нормативным актом организации
        и обязательно для исполнения всеми сотрудниками.
      </p>

      <p className="doc-p">
        1.3. Действие настоящего Положения распространяется на сотрудников,
        чья работа носит разъездной характер или предполагает регулярное использование
        личного автомобиля в служебных целях, при наличии соответствующего соглашения.
      </p>

      <p className="doc-section">2. УСЛОВИЯ ИСПОЛЬЗОВАНИЯ ЛИЧНОГО АВТОМОБИЛЯ</p>

      <p className="doc-p">
        2.1. Использование личного автомобиля сотрудника в служебных целях
        допускается при одновременном соблюдении следующих условий:
      </p>
      <p className="doc-indent">— наличие письменного соглашения между сотрудником и работодателем;</p>
      <p className="doc-indent">— наличие у сотрудника водительского удостоверения соответствующей категории;</p>
      <p className="doc-indent">— наличие действующего полиса ОСАГО, в который вписан сотрудник;</p>
      <p className="doc-indent">— техническая исправность транспортного средства.</p>

      <p className="doc-p">
        2.2. Перечень должностей (сотрудников), которым разрешено использование
        личного автомобиля в служебных целях, определяется приказом руководителя.
      </p>

      <p className="doc-p">
        2.3. Использование личного автомобиля допускается исключительно в рабочее
        время и только для выполнения служебных обязанностей.
      </p>

      <p className="doc-section">3. КОМПЕНСАЦИЯ И ВОЗМЕЩЕНИЕ РАСХОДОВ</p>

      <p className="doc-p">
        3.1. Сотруднику, использующему личный автомобиль в служебных целях,
        выплачивается ежемесячная денежная компенсация.
      </p>

      <p className="doc-p">
        3.2. Размер компенсации устанавливается дополнительным соглашением к
        трудовому договору и приказом руководителя.
      </p>

      <p className="doc-p">
        3.3. Нормы компенсации, не облагаемые налогом на прибыль (ПП РФ от
        08.02.2002 № 92):
      </p>
      <p className="doc-indent">— легковые автомобили с объёмом двигателя до 2 000 куб. см включительно — 1&nbsp;200 руб. в месяц;</p>
      <p className="doc-indent">— легковые автомобили с объёмом двигателя свыше 2 000 куб. см — 1&nbsp;500 руб. в месяц.</p>

      <p className="doc-p">
        3.4. Компенсация выплачивается за фактически отработанное время (пропорционально
        рабочим дням) не позднее {blank(v.paymentDay, '___')} числа месяца,
        следующего за отчётным.
      </p>

      <p className="doc-p">
        3.5. Помимо компенсации, организация возмещает документально подтверждённые
        расходы на ГСМ, использованный в служебных поездках, в пределах норм,
        установленных приказом руководителя.
      </p>

      <p className="doc-p">
        3.6. Для получения компенсации и возмещения расходов сотрудник обязан
        ежемесячно не позднее 5 числа представить:
      </p>
      <p className="doc-indent">— маршрутный лист (журнал учёта служебных поездок) за истекший месяц;</p>
      <p className="doc-indent">— чеки на ГСМ (при возмещении топлива);</p>
      <p className="doc-indent">— иные документы по требованию бухгалтерии.</p>

      <p className="doc-section">4. ДОКУМЕНТООБОРОТ И УЧЁТ ПОЕЗДОК</p>

      <p className="doc-p">
        4.1. Каждая служебная поездка фиксируется в маршрутном листе с указанием
        даты, маршрута (откуда/куда), цели поездки и пробега.
      </p>

      <p className="doc-p">
        4.2. Маршрутный лист подписывается сотрудником и утверждается непосредственным
        руководителем.
      </p>

      <p className="doc-p">
        4.3. Документы по использованию личного автомобиля хранятся в организации
        в течение 5 лет.
      </p>

      <p className="doc-section">5. ОТВЕТСТВЕННОСТЬ СТОРОН</p>

      <p className="doc-p">
        5.1. Сотрудник несёт ответственность за достоверность сведений,
        указанных в маршрутных листах.
      </p>

      <p className="doc-p">
        5.2. В случае дорожно-транспортного происшествия в нерабочее время
        ответственность за ущерб несёт сотрудник как владелец источника
        повышенной опасности.
      </p>

      <p className="doc-p">
        5.3. Организация не несёт ответственности за повреждение личного
        автомобиля, если иное не предусмотрено соглашением сторон.
      </p>

      <p className="doc-section">6. ЗАКЛЮЧИТЕЛЬНЫЕ ПОЛОЖЕНИЯ</p>

      <p className="doc-p">
        6.1. Настоящее Положение вступает в силу с момента утверждения руководителем.
      </p>

      <p className="doc-p">
        6.2. Изменения и дополнения в настоящее Положение вносятся приказом
        руководителя.
      </p>

      <p className="doc-p">
        6.3. Сотрудники знакомятся с настоящим Положением под подпись.
      </p>

      <div className="doc-sign-block">
        <p>Руководитель <strong>{blank(v.orgName)}</strong></p>
        <p className="doc-sign-line">_________________ / {blank(v.ownerFullName)} /</p>
        <p className="doc-sign-date">«{blank(v.todayDay)}» {blank(v.todayMonth)} {blank(v.todayYear)} г.</p>
      </div>
    </div>
  )
}
