import type { VehicleUsageModel } from '../types/domain'

export interface ChecklistItem {
  templateKey: string
  title: string
  description: string
  required: boolean
  normative?: string
}

const COMPENSATION_DOCS: ChecklistItem[] = [
  {
    templateKey: 'compensation_agreement',
    title: 'Соглашение об использовании личного авто',
    description: 'Дополнительное соглашение к трудовому договору или отдельный договор',
    required: true,
    normative: 'ст. 188 ТК РФ',
  },
  {
    templateKey: 'compensation_order',
    title: 'Приказ о выплате компенсации',
    description: 'Приказ руководителя с указанием суммы и сроков выплаты',
    required: true,
    normative: 'ст. 188 ТК РФ',
  },
  {
    templateKey: 'trip_log',
    title: 'Путевые листы',
    description: 'Ежедневный учёт поездок с маршрутами и километражем',
    required: true,
    normative: 'Приказ Минтранса № 152',
  },
  {
    templateKey: 'compensation_calc',
    title: 'Ежемесячный расчёт компенсации',
    description: 'Документ-основание для выплаты: дни использования, сумма',
    required: true,
  },
  {
    templateKey: 'fuel_receipts',
    title: 'Чеки на ГСМ',
    description: 'Кассовые чеки АЗС для подтверждения топливных расходов',
    required: false,
  },
]

const RENT_WITHOUT_CREW_DOCS: ChecklistItem[] = [
  {
    templateKey: 'rent_agreement',
    title: 'Договор аренды ТС без экипажа',
    description: 'Договор между арендодателем (физлицо/ИП) и арендатором (организация)',
    required: true,
    normative: 'ст. 642–649 ГК РФ',
  },
  {
    templateKey: 'rent_acceptance_act',
    title: 'Акт приёма-передачи ТС',
    description: 'Фиксирует состояние авто на момент передачи в аренду',
    required: true,
  },
  {
    templateKey: 'trip_log',
    title: 'Путевые листы',
    description: 'Обязательный учёт использования арендованного ТС',
    required: true,
    normative: 'Приказ Минтранса № 152',
  },
  {
    templateKey: 'rent_return_act',
    title: 'Акт возврата ТС',
    description: 'Оформляется при расторжении договора аренды',
    required: false,
  },
  {
    templateKey: 'additional_agreement',
    title: 'Дополнительное соглашение',
    description: 'При изменении условий аренды (ставка, срок, условия)',
    required: false,
  },
]

const RENT_WITH_CREW_DOCS: ChecklistItem[] = [
  {
    templateKey: 'rent_crew_agreement',
    title: 'Договор аренды ТС с экипажем',
    description: 'Включает оказание услуг управления и технического обслуживания',
    required: true,
    normative: 'ст. 632–641 ГК РФ',
  },
  {
    templateKey: 'rent_acceptance_act',
    title: 'Акт приёма-передачи ТС',
    description: 'Фиксирует состояние авто на момент начала аренды',
    required: true,
  },
  {
    templateKey: 'trip_log',
    title: 'Путевые листы',
    description: 'Учёт рабочего времени водителя и маршрутов',
    required: true,
    normative: 'Приказ Минтранса № 152',
  },
  {
    templateKey: 'service_report',
    title: 'Ежемесячный акт об оказании услуг',
    description: 'Подтверждает факт оказания услуг управления за период',
    required: true,
  },
]

const FREE_USE_DOCS: ChecklistItem[] = [
  {
    templateKey: 'free_use_agreement',
    title: 'Договор безвозмездного пользования (ссуды)',
    description: 'Авто передаётся без оплаты, расходы берёт на себя ссудополучатель',
    required: true,
    normative: 'ст. 689–701 ГК РФ',
  },
  {
    templateKey: 'free_use_acceptance_act',
    title: 'Акт приёма-передачи ТС',
    description: 'Фиксирует состояние авто при передаче в безвозмездное пользование',
    required: true,
  },
  {
    templateKey: 'trip_log',
    title: 'Путевые листы',
    description: 'Учёт использования ТС',
    required: true,
    normative: 'Приказ Минтранса № 152',
  },
  {
    templateKey: 'free_use_return_act',
    title: 'Акт возврата ТС',
    description: 'При прекращении договора безвозмездного пользования',
    required: false,
  },
]

const OWN_IP_DOCS: ChecklistItem[] = [
  {
    templateKey: 'trip_log',
    title: 'Путевые листы',
    description: 'Основной документ для подтверждения деловых поездок ИП',
    required: true,
    normative: 'Приказ Минтранса № 152',
  },
  {
    templateKey: 'fuel_receipts',
    title: 'Чеки на ГСМ',
    description: 'Кассовые чеки АЗС — для учёта расходов на топливо',
    required: true,
  },
  {
    templateKey: 'repair_receipts',
    title: 'Чеки на ТО и ремонт',
    description: 'Документы для списания расходов на содержание авто',
    required: false,
  },
  {
    templateKey: 'parking_receipts',
    title: 'Чеки на парковку',
    description: 'Квитанции за платную парковку в деловых целях',
    required: false,
  },
]

export const VEHICLE_DOCUMENT_CHECKLIST: Record<VehicleUsageModel, ChecklistItem[]> = {
  COMPENSATION: COMPENSATION_DOCS,
  RENT: RENT_WITHOUT_CREW_DOCS,
  FREE_USE: FREE_USE_DOCS,
  OWN_IP: OWN_IP_DOCS,
}

export const VEHICLE_SCHEME_TITLE: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Компенсация за личный авто (ст. 188 ТК)',
  RENT: 'Аренда ТС без экипажа (ст. 642 ГК)',
  FREE_USE: 'Безвозмездное пользование — ссуда (ст. 689 ГК)',
  OWN_IP: 'ИП — собственный автомобиль',
}

export const VEHICLE_SCHEME_SUBTITLE: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Для ООО и ИП с сотрудниками, самый распространённый вариант',
  RENT: 'Организация арендует авто у физлица или ИП',
  FREE_USE: 'Авто передаётся без оплаты, расходы несёт организация',
  OWN_IP: 'ИП использует свой авто непосредственно для бизнеса',
}
