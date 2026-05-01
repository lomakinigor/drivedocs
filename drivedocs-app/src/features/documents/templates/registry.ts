import type { TemplateDefinition } from './types'
import { IpCompensationOrder, ipCompensationOrderFields } from './IpCompensationOrder'
import { CompensationOrder, compensationOrderFields } from './CompensationOrder'
import { RentAgreement, rentAgreementFields } from './RentAgreement'
import { TripLog, tripLogFields } from './TripLog'

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
}

export function getTemplate(templateKey?: string): TemplateDefinition | null {
  if (!templateKey) return null
  return REGISTRY[templateKey] ?? null
}
