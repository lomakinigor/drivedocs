import type {
  EntityType,
  TaxMode,
  VehicleUsageModel,
  WorkspaceDocument,
} from '@/entities/types/domain'

interface DocTemplate {
  title: string
  description: string
  type: WorkspaceDocument['type']
  templateKey: string
}

// ─── Template definitions ─────────────────────────────────────────────────────

const TRIP_LOG: DocTemplate = {
  title: 'Журнал учёта поездок',
  description: 'Ведётся ежемесячно для подтверждения служебного характера поездок',
  type: 'recurring',
  templateKey: 'trip_log',
}

const COMPENSATION_ORDER: DocTemplate = {
  title: 'Приказ об использовании личного автомобиля',
  description: 'Основной документ для оформления компенсации за использование личного авто',
  type: 'one_time',
  templateKey: 'ip_compensation_order',
}

const COMPENSATION_CALC: DocTemplate = {
  title: 'Расчёт суммы компенсации',
  description: 'Ежемесячный расчёт компенсации с учётом норм и фактического пробега',
  type: 'recurring',
  templateKey: 'compensation_calc',
}

const RENT_AGREEMENT: DocTemplate = {
  title: 'Договор аренды автомобиля',
  description: 'Договор аренды транспортного средства между сотрудником и организацией',
  type: 'one_time',
  templateKey: 'rent_agreement',
}

const RENT_ACT: DocTemplate = {
  title: 'Акт приёма-передачи автомобиля',
  description: 'Ежемесячный акт к договору аренды',
  type: 'recurring',
  templateKey: 'rent_act',
}

const FREE_USE_AGREEMENT: DocTemplate = {
  title: 'Договор безвозмездного пользования',
  description: 'Договор ссуды транспортного средства (без арендной платы)',
  type: 'one_time',
  templateKey: 'free_use_agreement',
}

const WAYBILL: DocTemplate = {
  title: 'Путевые листы',
  description: 'Обязательный документ для ООО при любой схеме использования авто',
  type: 'recurring',
  templateKey: 'waybill',
}

// ─── BALANCE templates ────────────────────────────────────────────────────────

const BALANCE_ACCEPTANCE_ACT: DocTemplate = {
  title: 'Акт приёма-передачи ОС (форма ОС-1)',
  description: 'Оформляется при постановке автомобиля на баланс. Основание для ввода в эксплуатацию',
  type: 'one_time',
  templateKey: 'balance_os1_act',
}

const BALANCE_COMMISSION_ORDER: DocTemplate = {
  title: 'Приказ о вводе автомобиля в эксплуатацию',
  description: 'Приказ руководителя о принятии ТС к учёту и вводе в эксплуатацию',
  type: 'one_time',
  templateKey: 'balance_commission_order',
}

const BALANCE_VEHICLE_ASSIGNMENT: DocTemplate = {
  title: 'Приказ о закреплении ТС за водителем',
  description: 'Определяет ответственного водителя: марка, VIN, госномер. Обновляется при смене водителя',
  type: 'one_time',
  templateKey: 'balance_vehicle_assignment',
}

const BALANCE_FUEL_NORMS_ORDER: DocTemplate = {
  title: 'Приказ об утверждении норм расхода ГСМ',
  description: 'Норма расхода топлива л/100 км по марке авто (Распоряжение Минтранса АМ-23-р)',
  type: 'one_time',
  templateKey: 'balance_fuel_norms_order',
}

const BALANCE_WAYBILL: DocTemplate = {
  title: 'Путевые листы',
  description: 'Ежедневный/еженедельный документ. Обязательны: медосмотр водителя, техконтроль ТС, маршрут, показания одометра',
  type: 'recurring',
  templateKey: 'balance_waybill',
}

const BALANCE_FUEL_WRITEOFF: DocTemplate = {
  title: 'Акт на списание ГСМ',
  description: 'Ежемесячно на основании путевых листов. Подтверждает расходы на топливо в бухгалтерии',
  type: 'recurring',
  templateKey: 'balance_fuel_writeoff',
}

const BALANCE_USAGE_POLICY: DocTemplate = {
  title: 'Положение об использовании служебного автотранспорта',
  description: 'Регламентирует порядок использования, круг водителей, нормы ГСМ, ответственность',
  type: 'one_time',
  templateKey: 'balance_usage_policy',
}

// ─── Template selection ───────────────────────────────────────────────────────

function selectTemplates(
  entityType: EntityType,
  _taxMode: TaxMode,
  vehicleUsageModel: VehicleUsageModel,
): DocTemplate[] {
  const isOOO = entityType === 'OOO'

  switch (vehicleUsageModel) {
    case 'COMPENSATION':
      return isOOO
        ? [COMPENSATION_ORDER, TRIP_LOG, COMPENSATION_CALC, WAYBILL]
        : [COMPENSATION_ORDER, TRIP_LOG, COMPENSATION_CALC]

    case 'RENT':
      return isOOO
        ? [RENT_AGREEMENT, RENT_ACT, TRIP_LOG, WAYBILL]
        : [RENT_AGREEMENT, RENT_ACT, TRIP_LOG]

    case 'FREE_USE':
      return isOOO
        ? [FREE_USE_AGREEMENT, TRIP_LOG, WAYBILL]
        : [FREE_USE_AGREEMENT, TRIP_LOG]

    case 'OWN_IP':
      return [TRIP_LOG]

    case 'BALANCE':
      return [
        BALANCE_ACCEPTANCE_ACT,
        BALANCE_COMMISSION_ORDER,
        BALANCE_USAGE_POLICY,
        BALANCE_VEHICLE_ASSIGNMENT,
        BALANCE_FUEL_NORMS_ORDER,
        BALANCE_WAYBILL,
        BALANCE_FUEL_WRITEOFF,
      ]
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function generateInitialDocuments(
  workspaceId: string,
  entityType: EntityType,
  taxMode: TaxMode,
  vehicleUsageModel: VehicleUsageModel,
): WorkspaceDocument[] {
  const templates = selectTemplates(entityType, taxMode, vehicleUsageModel)
  const now = new Date().toISOString()

  return templates.map((t, i) => ({
    id: `doc-${workspaceId}-${i}`,
    workspaceId,
    title: t.title,
    description: t.description,
    type: t.type,
    status: 'required' as WorkspaceDocument['status'],
    templateKey: t.templateKey,
    createdAt: now,
  }))
}
