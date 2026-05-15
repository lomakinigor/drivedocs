import { useState } from 'react'
import { Info } from 'lucide-react'
import type { EntityType, TaxMode } from '@/entities/types/domain'
import { TAX_MODE_LABELS } from '@/entities/constants/labels'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { HELP_TAX_MODE } from '@/entities/config/onboardingHelp'

interface TaxModeStepProps {
  entityType: EntityType
  selected?: TaxMode
  onSelect: (mode: TaxMode) => void
}

const TAX_MODE_DESCRIPTIONS: Record<TaxMode, string> = {
  OSN: 'Общая система налогообложения — НДС + налог на прибыль/НДФЛ',
  USN_INCOME: '6% от доходов, без учёта расходов — просто и понятно',
  USN_INCOME_MINUS_EXPENSES: '15% от разницы доходов и расходов — выгодно при высоких затратах',
  PATENT: 'Фиксированный налог на определённый вид деятельности (только ИП)',
  ESHN: 'Единый сельскохозяйственный налог (только для производителей)',
}

// Tax modes available per entity type
const AVAILABLE_MODES: Record<EntityType, TaxMode[]> = {
  IP: ['OSN', 'USN_INCOME', 'USN_INCOME_MINUS_EXPENSES', 'PATENT', 'ESHN'],
  OOO: ['OSN', 'USN_INCOME', 'USN_INCOME_MINUS_EXPENSES', 'ESHN'],
}

export function TaxModeStep({ entityType, selected, onSelect }: TaxModeStepProps) {
  const modes = AVAILABLE_MODES[entityType]
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="space-y-2">
      {modes.map((mode) => (
        <button
          key={mode}
          onClick={() => onSelect(mode)}
          className={`flex items-start gap-3 w-full p-4 rounded-2xl border-2 transition-colors text-left ${
            selected === mode
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white active:bg-slate-50'
          }`}
        >
          <div
            className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
              selected === mode ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
            }`}
          >
            {selected === mode && (
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">{TAX_MODE_LABELS[mode]}</p>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              {TAX_MODE_DESCRIPTIONS[mode]}
            </p>
          </div>
        </button>
      ))}

      {/* F-021 · Help: как выбрать налоговый режим */}
      <button
        onClick={() => setShowHelp(true)}
        className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-blue-50 border border-blue-100 active:bg-blue-100 text-left mt-1"
      >
        <Info size={18} className="text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">Не уверены — какой режим выбрать?</p>
          <p className="text-xs text-blue-700 mt-0.5">Когда выгоден УСН, патент и ОСН</p>
        </div>
        <span className="text-blue-500 text-xs font-semibold shrink-0">Подробнее →</span>
      </button>

      {showHelp && (
        <HelpInfoSheet content={HELP_TAX_MODE} onClose={() => setShowHelp(false)} />
      )}
    </div>
  )
}
