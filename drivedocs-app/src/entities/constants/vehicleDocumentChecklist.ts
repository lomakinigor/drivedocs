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

const BALANCE_DOCS: ChecklistItem[] = [
  {
    templateKey: 'balance_os1_act',
    title: 'Акт приёма-передачи ОС (форма ОС-1)',
    description: 'Оформляется при постановке на баланс; остаётся в бухгалтерии',
    required: true,
    normative: 'ФЗ № 402-ФЗ',
  },
  {
    templateKey: 'balance_commission_order',
    title: 'Приказ о вводе в эксплуатацию',
    description: 'Приказ руководителя о принятии ТС к учёту',
    required: true,
  },
  {
    templateKey: 'balance_usage_policy',
    title: 'Положение о служебном автотранспорте',
    description: 'Регламент использования, нормы ГСМ, ответственность водителей',
    required: true,
  },
  {
    templateKey: 'balance_vehicle_assignment',
    title: 'Приказ о закреплении ТС за водителем',
    description: 'Кто отвечает за авто, кто замещает; марка, VIN, госномер',
    required: true,
  },
  {
    templateKey: 'balance_fuel_norms_order',
    title: 'Приказ об утверждении норм расхода ГСМ',
    description: 'Нормы л/100 км по марке авто согласно Распоряжению Минтранса АМ-23-р',
    required: true,
    normative: 'Распоряжение Минтранса АМ-23-р от 14.03.2008',
  },
  {
    templateKey: 'balance_waybill',
    title: 'Путевые листы',
    description: 'Ежедневно/еженедельно: медосмотр, техконтроль, маршрут, одометр',
    required: true,
    normative: 'Приказ Минтранса № 390 от 28.09.2022',
  },
  {
    templateKey: 'balance_fuel_writeoff',
    title: 'Акт на списание ГСМ',
    description: 'Ежемесячно на основании путевых листов',
    required: true,
  },
  {
    templateKey: 'fuel_receipts',
    title: 'Чеки АЗС',
    description: 'Кассовые чеки или отчёты по топливной карте — первичное подтверждение',
    required: true,
  },
]

export const VEHICLE_DOCUMENT_CHECKLIST: Record<VehicleUsageModel, ChecklistItem[]> = {
  COMPENSATION: COMPENSATION_DOCS,
  RENT: RENT_WITHOUT_CREW_DOCS,
  FREE_USE: FREE_USE_DOCS,
  OWN_IP: OWN_IP_DOCS,
  BALANCE: BALANCE_DOCS,
}

export const VEHICLE_SCHEME_TITLE: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Компенсация за личный авто (ст. 188 ТК)',
  RENT: 'Аренда ТС без экипажа (ст. 642 ГК)',
  FREE_USE: 'Безвозмездное пользование — ссуда (ст. 689 ГК)',
  OWN_IP: 'ИП — собственный автомобиль',
  BALANCE: 'Авто на балансе предприятия (ФСБУ 6/2020)',
}

export const VEHICLE_SCHEME_SUBTITLE: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Для ООО и ИП с сотрудниками, самый распространённый вариант',
  RENT: 'Организация арендует авто у физлица или ИП',
  FREE_USE: 'Авто передаётся без оплаты, расходы несёт организация',
  OWN_IP: 'ИП использует свой авто непосредственно для бизнеса',
  BALANCE: 'Служебный транспорт организации — балансовый учёт, путевые листы обязательны',
}
