import { useState } from 'react'
import { Building2, Hash, CreditCard, Car, ChevronRight, Info } from 'lucide-react'
import type { EntityType, TaxMode, VehicleUsageModel } from '@/entities/types/domain'
import {
  ENTITY_TYPE_LABELS,
  TAX_MODE_LABELS,
  VEHICLE_USAGE_MODEL_LABELS,
} from '@/entities/constants/labels'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { HELP_PRE_TRIP } from '@/entities/config/onboardingHelp'

interface SummaryStepProps {
  workspaceName: string
  entityType: EntityType
  inn?: string
  taxMode: TaxMode
  vehicleUsageModel: VehicleUsageModel
  onEditStep: (step: 'workspace_name' | 'inn' | 'tax_mode' | 'vehicle_model') => void
}

interface SummaryRowProps {
  icon: React.ReactNode
  label: string
  value: string
  secondary?: string
  onEdit: () => void
}

function SummaryRow({ icon, label, value, secondary, onEdit }: SummaryRowProps) {
  return (
    <button
      onClick={onEdit}
      className="flex items-center gap-3 w-full py-3.5 text-left active:bg-slate-50 transition-colors"
    >
      <div className="text-blue-500 shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-slate-900 mt-0.5 truncate">{value}</p>
        {secondary && <p className="text-xs text-slate-400 mt-0.5">{secondary}</p>}
      </div>
      <ChevronRight size={14} className="text-slate-300 shrink-0" />
    </button>
  )
}

const VEHICLE_MODEL_NOTES: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Фиксированная ежемесячная выплата',
  RENT: 'Договор аренды + НДФЛ с выплат',
  FREE_USE: 'Договор безвозмездного пользования',
  OWN_IP: 'ИП — собственный автомобиль для бизнеса',
  BALANCE: 'Авто на балансе — путевые листы, учёт ГСМ',
}

export function SummaryStep({
  workspaceName,
  entityType,
  inn,
  taxMode,
  vehicleUsageModel,
  onEditStep,
}: SummaryStepProps) {
  const [showPreTripHelp, setShowPreTripHelp] = useState(false)

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="bg-white border border-slate-200 rounded-2xl px-4 divide-y divide-slate-100">
        <SummaryRow
          icon={<Building2 size={18} />}
          label="Название"
          value={workspaceName}
          secondary={ENTITY_TYPE_LABELS[entityType]}
          onEdit={() => onEditStep('workspace_name')}
        />
        <SummaryRow
          icon={<Hash size={18} />}
          label="ИНН"
          value={inn || 'Не указан'}
          onEdit={() => onEditStep('inn')}
        />
        <SummaryRow
          icon={<CreditCard size={18} />}
          label="Налоговый режим"
          value={TAX_MODE_LABELS[taxMode]}
          onEdit={() => onEditStep('tax_mode')}
        />
        <SummaryRow
          icon={<Car size={18} />}
          label="Правовая модель"
          value={VEHICLE_USAGE_MODEL_LABELS[vehicleUsageModel]}
          secondary={VEHICLE_MODEL_NOTES[vehicleUsageModel]}
          onEdit={() => onEditStep('vehicle_model')}
        />
      </div>

      {/* What happens next */}
      <div className="bg-blue-50 rounded-2xl p-4 space-y-2">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
          Что будет дальше
        </p>
        <ul className="space-y-1.5">
          {[
            'Создадим профиль предприятия и подготовим документы',
            'Покажем список документов, которые нужно оформить',
            'Настроим напоминания и ежедневный сценарий',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-blue-400 mt-0.5 shrink-0">·</span>
              <p className="text-sm text-blue-800 leading-snug">{item}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* Pre-trip checklist — info card with bottom sheet */}
      <button
        onClick={() => setShowPreTripHelp(true)}
        className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-slate-50 border border-slate-200 active:bg-slate-100 text-left"
      >
        <Info size={18} className="text-slate-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900">Как правильно оформить поездку</p>
          <p className="text-xs text-slate-500 mt-0.5">Что фиксировать до выезда</p>
        </div>
        <span className="text-slate-400 text-xs font-semibold shrink-0">Подробнее →</span>
      </button>

      {showPreTripHelp && (
        <HelpInfoSheet content={HELP_PRE_TRIP} onClose={() => setShowPreTripHelp(false)} />
      )}
    </div>
  )
}
