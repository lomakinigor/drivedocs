import type { EntityType } from '@/entities/types/domain'
import { ENTITY_TYPE_LABELS } from '@/entities/constants/labels'

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
    </div>
  )
}
