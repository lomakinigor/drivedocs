import { useState } from 'react'
import { HelpCircle, X } from 'lucide-react'
import type { VehicleUsageModel } from '@/entities/types/domain'
import {
  VEHICLE_USAGE_MODEL_LABELS,
  VEHICLE_USAGE_MODEL_DESCRIPTIONS,
} from '@/entities/constants/labels'

interface VehicleModelStepProps {
  selected?: VehicleUsageModel
  onSelect: (model: VehicleUsageModel) => void
}

const ALL_MODELS: VehicleUsageModel[] = ['COMPENSATION', 'RENT', 'FREE_USE', 'OWN_IP']

// Short helper text shown under each option title
const MODEL_HINTS: Record<VehicleUsageModel, string> = {
  COMPENSATION: 'Самый простой вариант для большинства ИП и ООО',
  RENT: 'Нужен договор аренды. С выплат удерживается НДФЛ 13%',
  FREE_USE: 'Автомобиль "передаётся" без оплаты. Есть налоговые риски',
  OWN_IP: 'ИП использует свой авто напрямую, без компенсаций',
}

// Content for the help bottom sheet
const HELP_ITEMS: Array<{
  model: VehicleUsageModel
  title: string
  pros: string[]
  cons: string[]
}> = [
  {
    model: 'COMPENSATION',
    title: 'Компенсация',
    pros: [
      'Не нужен договор аренды',
      'Минимум документов',
      'Подходит и ИП, и ООО',
    ],
    cons: [
      'Лимит для ООО: 1 200 ₽/мес для авто до 2 000 куб. см',
      'Сверхлимитная часть — не расход для налога',
    ],
  },
  {
    model: 'RENT',
    title: 'Аренда',
    pros: [
      'Сумма аренды любая — по договору',
      'Расходы признаются полностью',
    ],
    cons: [
      'Нужен договор аренды',
      'НДФЛ 13% удерживается из выплат физлицу',
      'Больше бухгалтерии',
    ],
  },
  {
    model: 'FREE_USE',
    title: 'Безвозмездное пользование',
    pros: [
      'Не надо платить за аренду',
    ],
    cons: [
      'ФНС может признать это доходом организации',
      'Риск доначисления налога',
      'Редко используется на практике',
    ],
  },
]

function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl max-h-[85dvh] flex flex-col">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-2 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Как выбрать модель?</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto px-5 pb-8 space-y-5">
          <p className="text-sm text-slate-500 leading-relaxed">
            Правовая модель определяет, как оформлено использование автомобиля и какие документы нужны.
            Большинству подходит компенсация — она проще всего.
          </p>

          {HELP_ITEMS.map((item) => (
            <div key={item.model} className="space-y-2">
              <p className="text-sm font-semibold text-slate-800">
                {VEHICLE_USAGE_MODEL_LABELS[item.model]}
              </p>
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
            <p className="text-xs font-semibold text-blue-700 mb-1">Подсказка</p>
            <p className="text-sm text-blue-800 leading-relaxed">
              Если вы только начинаете — выбирайте компенсацию. Её можно сменить позже в настройках предприятия.
            </p>
          </div>
        </div>
      </div>
    </>
  )
}

export function VehicleModelStep({ selected, onSelect }: VehicleModelStepProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <>
      {/* "Как выбрать?" link */}
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setShowHelp(true)}
          className="flex items-center gap-1 text-xs text-blue-600 font-medium active:text-blue-800"
        >
          <HelpCircle size={13} />
          Как выбрать?
        </button>
      </div>

      <div className="space-y-2">
        {ALL_MODELS.map((model) => (
          <button
            key={model}
            onClick={() => onSelect(model)}
            className={`flex items-start gap-3 w-full p-4 rounded-2xl border-2 transition-colors text-left ${
              selected === model
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white active:bg-slate-50'
            }`}
          >
            {/* Radio dot */}
            <div
              className={`w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center ${
                selected === model ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
              }`}
            >
              {selected === model && (
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-900">
                {VEHICLE_USAGE_MODEL_LABELS[model]}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                {VEHICLE_USAGE_MODEL_DESCRIPTIONS[model]}
              </p>
              <p
                className={`text-xs mt-1.5 font-medium ${
                  model === 'FREE_USE' ? 'text-yellow-600' : 'text-blue-600'
                }`}
              >
                {MODEL_HINTS[model]}
              </p>
            </div>
          </button>
        ))}
      </div>

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
    </>
  )
}
