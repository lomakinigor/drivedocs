import { useState } from 'react'
import { Info } from 'lucide-react'
import type { EntityType } from '@/entities/types/domain'
import { ENTITY_TYPE_LABELS } from '@/entities/constants/labels'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { HELP_ENTITY_TYPE } from '@/entities/config/onboardingHelp'

interface EntityTypeStepProps {
  selected?: EntityType
  onSelect: (type: EntityType) => void
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

export function EntityTypeStep({ selected, onSelect }: EntityTypeStepProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <button
          key={opt.type}
          onClick={() => onSelect(opt.type)}
          className={`flex items-start gap-4 w-full p-4 rounded-2xl border-2 transition-colors text-left ${
            selected === opt.type
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white active:bg-slate-50'
          }`}
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 ${
              selected === opt.type
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-600'
            }`}
          >
            {ENTITY_TYPE_LABELS[opt.type]}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{ENTITY_TYPE_LABELS[opt.type]}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{opt.description}</p>
          </div>
        </button>
      ))}

      {/* Info-card: чем отличается ИП от ООО по требованиям к документам */}
      <button
        onClick={() => setShowHelp(true)}
        className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-blue-50 border border-blue-100 active:bg-blue-100 text-left mt-1"
      >
        <Info size={18} className="text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">Чем отличаются ИП и ООО для документов?</p>
          <p className="text-xs text-blue-700 mt-0.5">Медосмотр, техосмотр, путевой лист</p>
        </div>
        <span className="text-blue-400 text-xs font-semibold shrink-0">Подробнее →</span>
      </button>

      {showHelp && (
        <HelpInfoSheet content={HELP_ENTITY_TYPE} onClose={() => setShowHelp(false)} />
      )}
    </div>
  )
}
