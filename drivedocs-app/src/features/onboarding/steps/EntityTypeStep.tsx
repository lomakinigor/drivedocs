import { useState } from 'react'
import { Info } from 'lucide-react'
import type { EntityType } from '@/entities/types/domain'
import { ENTITY_TYPE_LABELS } from '@/entities/constants/labels'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { HELP_ENTITY_TYPE } from '@/entities/config/onboardingHelp'

// F-034 — Шаг объединяет выбор типа организации и опц. название.
// Это единственный шаг wizard'а: после него — сразу Home.

interface EntityTypeStepProps {
  selected?: EntityType
  workspaceName: string
  onSelectType: (type: EntityType) => void
  onChangeName: (name: string) => void
}

const options: { type: EntityType; description: string }[] = [
  {
    type: 'IP',
    description: 'Индивидуальный предприниматель — физлицо с упрощённой регистрацией',
  },
  {
    type: 'OOO',
    description: 'Общество с ограниченной ответственностью — юридическое лицо',
  },
]

function namePlaceholder(type: EntityType | undefined): string {
  if (type === 'OOO') return 'ООО «Рога и копыта»'
  return 'ИП Пупкин'
}

export function EntityTypeStep({
  selected,
  workspaceName,
  onSelectType,
  onChangeName,
}: EntityTypeStepProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="space-y-4">
      {/* Тип организации — основной выбор */}
      <div className="space-y-3">
        {options.map((opt) => (
          <button
            key={opt.type}
            type="button"
            onClick={() => onSelectType(opt.type)}
            className={`flex items-start gap-4 w-full p-4 rounded-2xl border-2 transition-colors text-left ${
              selected === opt.type
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white active:bg-slate-50'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
                selected === opt.type ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {ENTITY_TYPE_LABELS[opt.type]}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {ENTITY_TYPE_LABELS[opt.type]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Info-card: чем отличается ИП от ООО */}
      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-blue-50 border border-blue-100 active:bg-blue-100 text-left"
      >
        <Info size={18} className="text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">
            Чем отличаются ИП и ООО для документов?
          </p>
          <p className="text-xs text-blue-700 mt-0.5">Медосмотр, техосмотр, путевой лист</p>
        </div>
        <span className="text-blue-500 text-xs font-semibold shrink-0">Подробнее →</span>
      </button>

      {/* Опц. название — раскрывается после выбора типа */}
      {selected && (
        <div className="pt-2 space-y-2">
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
            Название · необязательно
          </label>
          <input
            type="text"
            value={workspaceName}
            onChange={(e) => onChangeName(e.target.value)}
            placeholder={namePlaceholder(selected)}
            className="w-full px-3.5 py-3 rounded-2xl border-2 border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
          />
          <p className="text-[12px] text-slate-500 px-1">
            Можно заполнить позже на главной — в реквизитах организации.
          </p>
        </div>
      )}

      {showHelp && (
        <HelpInfoSheet content={HELP_ENTITY_TYPE} onClose={() => setShowHelp(false)} />
      )}
    </div>
  )
}
