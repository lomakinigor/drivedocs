import { useState } from 'react'
import { X, AlertTriangle, CheckCircle } from 'lucide-react'
import type { EntityType, VehicleUsageModel } from '@/entities/types/domain'

interface VehicleModelStepProps {
  selected?: VehicleUsageModel
  onSelect: (model: VehicleUsageModel) => void
  entityType?: EntityType
}

// ─── Plain-language config ────────────────────────────────────────────────────

interface ModelConfig {
  model: VehicleUsageModel
  title: string
  plain: string
  note?: string
  noteType?: 'info' | 'warning'
  pros: string[]
  cons: string[]
}

const MODEL_CONFIG: ModelConfig[] = [
  {
    model: 'OWN_IP',
    title: 'Личный автомобиль ИП',
    plain:
      'Вы ИП и ездите на своей машине по рабочим делам. Расходы на бензин, ТО и страховку можно включать в затраты. Никаких договоров не нужно.',
    note: 'Самый простой вариант для ИП',
    noteType: 'info',
    pros: ['Никаких договоров', 'Расходы на авто идут в затраты', 'Минимум документов'],
    cons: ['Только для ИП — для ООО не подходит'],
  },
  {
    model: 'COMPENSATION',
    title: 'Компенсация за личный автомобиль',
    plain:
      'Организация платит фиксированную компенсацию за использование личной машины. Договор аренды не нужен. Но лимит без налогов — только 1 500 ₽ в месяц. Всё, что вы реально тратите на топливо и ремонт сверх этого, — за свой счёт и налоговую базу не уменьшает.',
    note: 'Расходы на авто сверх 1 500 ₽/мес налог не снижают',
    noteType: 'warning',
    pros: ['Не нужен договор аренды', 'Минимум документов'],
    cons: [
      'Лимит компенсации: 1 500 ₽/мес (до 2 000 куб. см)',
      'Реальные расходы на авто налоговую базу не уменьшают',
      'Невыгодно при высоких затратах на авто',
    ],
  },
  {
    model: 'RENT',
    title: 'Аренда — организация берёт авто у сотрудника',
    plain:
      'Организация официально арендует вашу машину по договору. Арендная плата — любого размера. Топливо, ремонт, страховка — всё идёт в расходы организации и реально уменьшает налог. Из арендных выплат удерживается НДФЛ 13%.',
    note: 'Выгоднее компенсации — реальные расходы на авто уменьшают налог',
    noteType: 'info',
    pros: ['Сумма аренды — любая по договору', 'Все расходы на авто уменьшают налоговую базу', 'Подходит для ООО и ИП'],
    cons: ['Нужен договор аренды', 'С арендных выплат удерживается НДФЛ 13%'],
  },
  {
    model: 'BALANCE',
    title: 'Автомобиль принадлежит организации',
    plain:
      'Компания купила авто на своё имя и поставила на баланс. Нужны путевые листы и учёт расхода топлива.',
    pros: [
      'Все расходы на авто — в затраты организации',
      'Амортизация снижает налог',
      'Подходит для нескольких машин',
    ],
    cons: [
      'Нужны ежедневные путевые листы',
      'Обязателен учёт расхода ГСМ',
      'Больше документов по ТО',
    ],
  },
  {
    model: 'FREE_USE',
    title: 'Бесплатное использование (редко)',
    plain:
      'Вы передаёте машину организации без договора аренды и без оплаты. Налоговая может расценить это как скрытый доход и начислить дополнительный налог.',
    note: 'Есть налоговые риски — лучше проконсультируйтесь с бухгалтером',
    noteType: 'warning',
    pros: ['Не нужно платить за аренду'],
    cons: [
      'ФНС может признать это скрытым доходом',
      'Риск доначисления налога',
      'Редко применяется на практике',
    ],
  },
]

// ─── Recommendation logic ─────────────────────────────────────────────────────

function getRecommended(entityType?: EntityType): VehicleUsageModel {
  return entityType === 'IP' ? 'OWN_IP' : 'RENT'
}

function getOrder(entityType?: EntityType): VehicleUsageModel[] {
  if (entityType === 'IP') {
    return ['OWN_IP', 'COMPENSATION', 'RENT', 'BALANCE', 'FREE_USE']
  }
  // ООО — OWN_IP убираем: это схема только для ИП
  return ['COMPENSATION', 'RENT', 'BALANCE', 'FREE_USE']
}

// ─── Help sheet ───────────────────────────────────────────────────────────────

function HelpSheet({ onClose, entityType }: { onClose: () => void; entityType?: EntityType }) {
  const order = getOrder(entityType)
  const items = order.map((m) => MODEL_CONFIG.find((c) => c.model === m)!)

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85dvh] flex flex-col">
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Сравнение вариантов</h2>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100" aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 pb-8 space-y-5">
          {items.map((item) => (
            <div key={item.model} className="space-y-2 pb-4 border-b border-slate-100 last:border-0">
              <p className="text-sm font-semibold text-slate-900">{item.title}</p>
              <div className="space-y-1">
                {item.pros.map((pro) => (
                  <div key={pro} className="flex items-start gap-2">
                    <span className="text-green-500 text-xs mt-0.5 shrink-0 font-bold">+</span>
                    <p className="text-sm text-slate-700">{pro}</p>
                  </div>
                ))}
                {item.cons.map((con) => (
                  <div key={con} className="flex items-start gap-2">
                    <span className="text-red-400 text-xs mt-0.5 shrink-0 font-bold">−</span>
                    <p className="text-sm text-slate-500">{con}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="bg-blue-50 rounded-2xl p-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Можно изменить позже</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Схему использования авто можно поменять в Настройках в любой момент — список документов пересчитается автоматически.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VehicleModelStep({ selected, onSelect, entityType }: VehicleModelStepProps) {
  const [showHelp, setShowHelp] = useState(false)

  const recommended = getRecommended(entityType)
  const order = getOrder(entityType)
  const items = order.map((m) => MODEL_CONFIG.find((c) => c.model === m)!)

  const recConfig = MODEL_CONFIG.find((c) => c.model === recommended)!

  return (
    <>
      {/* ── Персональная рекомендация ── */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
          Рекомендуем для {entityType === 'IP' ? 'ИП' : 'ООО'}
        </p>
        <p className="text-sm font-semibold text-blue-900 mb-0.5">{recConfig.title}</p>
        <p className="text-xs text-blue-700 leading-relaxed">{recConfig.plain}</p>
        <button
          onClick={() => onSelect(recommended)}
          className="mt-3 text-xs font-semibold text-blue-600 underline underline-offset-2 active:text-blue-800"
        >
          Выбрать этот вариант →
        </button>
      </div>

      {/* ── Все варианты ── */}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-slate-500">Или выберите другую схему:</p>
        <button
          onClick={() => setShowHelp(true)}
          className="text-xs text-blue-600 font-medium active:text-blue-800"
        >
          Сравнить все →
        </button>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isSelected = selected === item.model
          const isRec = item.model === recommended

          return (
            <button
              key={item.model}
              onClick={() => onSelect(item.model)}
              className={`flex items-start gap-3 w-full p-4 rounded-2xl border-2 transition-colors text-left ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white active:bg-slate-50'
              }`}
            >
              {/* Radio */}
              <div
                className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                  isSelected ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
              </div>

              {/* Text */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                  {isRec && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 shrink-0">
                      Рекомендовано
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.plain}</p>
                {item.note && (
                  <div className={`flex items-start gap-1.5 mt-2 ${item.noteType === 'warning' ? 'text-yellow-600' : 'text-blue-600'}`}>
                    {item.noteType === 'warning'
                      ? <AlertTriangle size={11} className="shrink-0 mt-0.5" />
                      : <CheckCircle size={11} className="shrink-0 mt-0.5" />
                    }
                    <p className="text-[11px] font-medium leading-snug">{item.note}</p>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} entityType={entityType} />}
    </>
  )
}
