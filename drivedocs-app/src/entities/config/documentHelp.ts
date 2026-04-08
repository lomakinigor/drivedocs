// ─── Document help config ─────────────────────────────────────────────────────
// Keyed by WorkspaceDocument.templateKey.
// Provides plain-language explanations shown in the detail sheet.
// All text is intentionally short and non-intimidating.

export interface DocumentHelp {
  /** One-sentence answer to "зачем этот документ нужен?" */
  why: string
  /** Short actionable instruction */
  howTo: string
  /** Optional brief legal note (shown subtly, not as a warning) */
  tip?: string
}

export const DOCUMENT_HELP: Record<string, DocumentHelp> = {
  ip_compensation_order: {
    why: 'Подтверждает, что вы имеете право использовать личный автомобиль в служебных целях и получать компенсацию. Без него налоговая не примет расходы.',
    howTo: 'Составьте приказ в свободной форме. Укажите марку и номер авто, сумму компенсации в месяц и дату начала. Подпишите.',
    tip: 'Для ИП на УСН 6% компенсация не уменьшает налог, но приказ всё равно защитит вас при проверке.',
  },

  trip_log: {
    why: 'Журнал поездок — основное подтверждение того, что автомобиль реально используется в работе. Без него поездки нечем доказать.',
    howTo: 'Ведите журнал каждый месяц на основе записей в приложении. В конце месяца распечатайте, проверьте и подпишите.',
  },

  compensation_calc: {
    why: 'Фиксирует, на каком основании начислена компенсация и в каком размере. Это защита при спорах с бухгалтерией или налоговой.',
    howTo: 'Рассчитайте один раз при установке суммы. Если условия меняются — обновите расчёт и подпишите новый.',
  },

  ooo_rent_agreement: {
    why: 'Договор аренды — правовое основание для выплат физлицу. Без него организация не может включить арендную плату в расходы.',
    howTo: 'Заключите договор между ООО (арендатор) и физлицом (арендодатель). Укажите сумму, срок и реквизиты автомобиля.',
    tip: 'С суммы аренды ООО удерживает НДФЛ 13% и перечисляет его в бюджет — это обязательно.',
  },
}

/** Safe lookup with fallback */
export function getDocumentHelp(templateKey?: string): DocumentHelp | null {
  if (!templateKey) return null
  return DOCUMENT_HELP[templateKey] ?? null
}
