import type { TemplateDefinition } from './types'
import { IpCompensationOrder, ipCompensationOrderFields } from './IpCompensationOrder'
import { CompensationOrder, compensationOrderFields } from './CompensationOrder'
import { RentAgreement, rentAgreementFields } from './RentAgreement'
import { TripLog, tripLogFields } from './TripLog'
import { CompensationCalc, compensationCalcFields } from './CompensationCalc'
import { Waybill, waybillFields } from './Waybill'
import { FreeUseAgreement, freeUseAgreementFields } from './FreeUseAgreement'
import { BalanceUsagePolicy, balanceUsagePolicyFields } from './BalanceUsagePolicy'
import { BalanceVehicleAssignment, balanceVehicleAssignmentFields } from './BalanceVehicleAssignment'

const REGISTRY: Record<string, TemplateDefinition> = {
  ip_compensation_order: {
    title: 'Приказ об использовании личного авто (ИП)',
    getFields: ipCompensationOrderFields,
    Component: IpCompensationOrder,
  },
  compensation_order: {
    title: 'Приказ о выплате компенсации (ООО)',
    getFields: compensationOrderFields,
    Component: CompensationOrder,
  },
  rent_agreement: {
    title: 'Договор аренды ТС без экипажа',
    getFields: rentAgreementFields,
    Component: RentAgreement,
  },
  trip_log: {
    title: 'Журнал учёта служебных поездок',
    getFields: tripLogFields,
    Component: TripLog,
  },
  compensation_calc: {
    title: 'Расчёт суммы компенсации',
    getFields: compensationCalcFields,
    Component: CompensationCalc,
  },
  waybill: {
    title: 'Маршрутный лист',
    getFields: waybillFields,
    Component: Waybill,
  },
  free_use_agreement: {
    title: 'Договор безвозмездного пользования ТС',
    getFields: freeUseAgreementFields,
    Component: FreeUseAgreement,
  },
  balance_usage_policy: {
    title: 'Положение об использовании личного автотранспорта',
    getFields: balanceUsagePolicyFields,
    Component: BalanceUsagePolicy,
  },
  balance_vehicle_assignment: {
    title: 'Приказ о закреплении ТС за сотрудником',
    getFields: balanceVehicleAssignmentFields,
    Component: BalanceVehicleAssignment,
  },
}

export function getTemplate(templateKey?: string): TemplateDefinition | null {
  if (!templateKey) return null
  return REGISTRY[templateKey] ?? null
}
