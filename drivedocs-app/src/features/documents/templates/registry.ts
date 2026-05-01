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
import { RentAct, rentActFields } from './RentAct'
import { BalanceCommissionOrder, balanceCommissionOrderFields } from './BalanceCommissionOrder'
import { BalanceFuelNormsOrder, balanceFuelNormsOrderFields } from './BalanceFuelNormsOrder'
import { BalanceWaybill, balanceWaybillFields } from './BalanceWaybill'
import { BalanceFuelWriteoff, balanceFuelWriteoffFields } from './BalanceFuelWriteoff'

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
  rent_act: {
    title: 'Акт оказания услуг по аренде ТС',
    getFields: rentActFields,
    Component: RentAct,
  },
  balance_commission_order: {
    title: 'Приказ о вводе ТС в эксплуатацию',
    getFields: balanceCommissionOrderFields,
    Component: BalanceCommissionOrder,
  },
  balance_fuel_norms_order: {
    title: 'Приказ об утверждении норм расхода ГСМ',
    getFields: balanceFuelNormsOrderFields,
    Component: BalanceFuelNormsOrder,
  },
  balance_waybill: {
    title: 'Путевой лист (служебный автомобиль)',
    getFields: balanceWaybillFields,
    Component: BalanceWaybill,
  },
  balance_fuel_writeoff: {
    title: 'Акт на списание ГСМ',
    getFields: balanceFuelWriteoffFields,
    Component: BalanceFuelWriteoff,
  },
}

export function getTemplate(templateKey?: string): TemplateDefinition | null {
  if (!templateKey) return null
  return REGISTRY[templateKey] ?? null
}
