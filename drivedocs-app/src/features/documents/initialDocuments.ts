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
