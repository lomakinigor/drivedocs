import { useState } from 'react'
import { X, CheckCircle, Circle, ChevronDown, ChevronUp, FileText } from 'lucide-react'
import type { VehicleUsageModel } from '@/entities/types/domain'
import {
  VEHICLE_DOCUMENT_CHECKLIST,
  VEHICLE_SCHEME_TITLE,
  VEHICLE_SCHEME_SUBTITLE,
} from '@/entities/constants/vehicleDocumentChecklist'

const SCHEMES: VehicleUsageModel[] = ['COMPENSATION', 'RENT', 'FREE_USE', 'OWN_IP']

interface VehicleSchemeSheetProps {
  current: VehicleUsageModel
  onSelect: (model: VehicleUsageModel) => void
  onClose: () => void
}

export function VehicleSchemeSheet({ current, onSelect, onClose }: VehicleSchemeSheetProps) {
  const [expanded, setExpanded] = useState<VehicleUsageModel | null>(current)
  const [selected, setSelected] = useState<VehicleUsageModel>(current)

  const handleSave = () => {
    onSelect(selected)
    onClose()
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Схема оформления авто</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {SCHEMES.map((scheme) => {
            const isSelected = selected === scheme
            const isExpanded = expanded === scheme
            const checklist = VEHICLE_DOCUMENT_CHECKLIST[scheme]
            const requiredCount = checklist.filter((d) => d.required).length

            return (
              <div
                key={scheme}
                className={`rounded-2xl border-2 transition-colors ${
                  isSelected ? 'border-blue-500 bg-blue-50/40' : 'border-slate-200 bg-white'
                }`}
              >
                {/* Scheme row */}
                <button
                  className="w-full flex items-start gap-3 px-4 py-3.5 text-left"
                  onClick={() => {
                    setSelected(scheme)
                    setExpanded(isExpanded ? null : scheme)
                  }}
                >
                  <span className="mt-0.5 shrink-0">
                    {isSelected
                      ? <CheckCircle size={20} className="text-blue-500" />
                      : <Circle size={20} className="text-slate-300" />
                    }
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {VEHICLE_SCHEME_TITLE[scheme]}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {VEHICLE_SCHEME_SUBTITLE[scheme]}
                    </p>
                    <p className="text-xs text-blue-500 mt-1 font-medium">
                      {requiredCount} обязательных документа
                    </p>
                  </div>
                  <span className="text-slate-500 shrink-0 mt-0.5">
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </span>
                </button>

                {/* Checklist */}
                {isExpanded && (
                  <div className="px-4 pb-3 space-y-1.5 border-t border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide pt-3 mb-2">
                      Чеклист документов
                    </p>
                    {checklist.map((item) => (
                      <div key={item.templateKey} className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">
                          <FileText
                            size={14}
                            className={item.required ? 'text-blue-500' : 'text-slate-300'}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-800">
                            {item.title}
                            {item.required && (
                              <span className="ml-1 text-red-400 font-semibold">*</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                          {item.normative && (
                            <p className="text-xs text-blue-400 mt-0.5">{item.normative}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500 pt-1">* — обязательный документ</p>
                  </div>
                )}
              </div>
            )
          })}
          <div className="h-2" />
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSave}
            className="w-full py-4 rounded-2xl text-base font-semibold bg-blue-600 text-white active:bg-blue-700"
          >
            Сохранить схему
          </button>
        </div>
      </div>
    </>
  )
}
