import type { EntityType, TaxMode, VehicleUsageModel, ReceiptCategory } from '../types/domain'

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  IP: 'ИП',
  OOO: 'ООО',
}

export const TAX_MODE_LABELS: Record<TaxMode, string> = {
  OSN: 'ОСНО',
  USN_INCOME: 'УСН «Доходы» 6%',
  USN_INCOME_MINUS_EXPENSES: 'УСН «Доходы минус расходы» 15%',
  PATENT: 'Патент',
  ESHN: 'ЕСХН',
}

export const VEHICLE_USAGE_MODEL_LABELS: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Компенсация',
  RENT: 'Аренда',
  FREE_USE: 'Безвозмездное пользование',
  OWN_IP: 'ИП — собственный автомобиль',
  BALANCE: 'Авто на балансе предприятия',
}

export const TAX_MODE_DESCRIPTIONS: Record<TaxMode, string> = {
  OSN: 'Основная система налогообложения',
  USN_INCOME: 'Упрощёнка: налог 6% с доходов',
  USN_INCOME_MINUS_EXPENSES: 'Упрощёнка: налог 15% с прибыли',
  PATENT: 'Фиксированный патентный налог',
  ESHN: 'Единый сельскохозяйственный налог',
}

export const RECEIPT_CATEGORY_LABELS: Record<ReceiptCategory, string> = {
  fuel: 'Топливо',
  parking: 'Парковка',
  repair: 'Ремонт',
  wash: 'Мойка',
  other: 'Другое',
}

export const VEHICLE_USAGE_MODEL_DESCRIPTIONS: Record<VehicleUsageModel, string> = {
  COMPENSATION:
    'Сотрудник или ИП получает фиксированную ежемесячную компенсацию за использование личного авто',
  RENT: 'Организация заключает договор аренды авто с физлицом или ИП',
  FREE_USE: 'Авто передаётся организации по договору безвозмездного пользования',
  OWN_IP: 'ИП использует собственный автомобиль в предпринимательской деятельности напрямую',
  BALANCE:
    'Служебный автомобиль принадлежит организации, стоит на балансе. Обязательны путевые листы, учёт ГСМ, приказ о закреплении',
}
