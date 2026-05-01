import { useState, useRef, useCallback } from 'react'
import { X, Printer, Eye, Edit3 } from 'lucide-react'
import { useParams } from 'react-router-dom'
import {
  useCurrentWorkspace,
  useOrgProfile,
  useVehicleProfile,
  useDrivers,
} from '@/app/store/workspaceStore'
import { buildTemplateContext } from './templates/context'
import { getTemplate } from './templates/registry'
import { openPrintWindow } from './templates/printUtils'
import type { TemplateValues } from './templates/types'
import type { WorkspaceDocument } from '@/entities/types/domain'

interface Props {
  doc: WorkspaceDocument
  onClose: () => void
}

export function DocumentFillSheet({ doc, onClose }: Props) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const workspace = useCurrentWorkspace()
  const org = useOrgProfile(id)
  const vehicle = useVehicleProfile(id)
  const drivers = useDrivers(id)

  const template = getTemplate(doc.templateKey)
  const baseCtx = workspace
    ? buildTemplateContext(workspace, org, vehicle, drivers)
    : ({} as TemplateValues)

  const [overrides, setOverrides] = useState<TemplateValues>({})
  const [tab, setTab] = useState<'fields' | 'preview'>('fields')
  const previewRef = useRef<HTMLDivElement>(null)

  const merged: TemplateValues = { ...baseCtx, ...overrides }

  const setField = useCallback((key: string, val: string) => {
    setOverrides((prev) => ({ ...prev, [key]: val }))
  }, [])

  const handlePrint = () => {
    if (!previewRef.current) return
    openPrintWindow(previewRef.current.innerHTML, doc.title)
  }

  if (!template) return null

  const fields = template.getFields(merged)
  const emptyRequired = fields.filter((f) => f.required && !merged[f.key]?.trim())
  const TemplateComponent = template.Component

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[95dvh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500 mb-0.5">Шаблон документа</p>
            <h2 className="text-sm font-bold text-slate-900 leading-snug">{doc.title}</h2>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-5 pb-3 shrink-0">
          <button
            onClick={() => setTab('fields')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'fields' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 active:bg-slate-50'
            }`}
          >
            <Edit3 size={14} />
            Данные
            {emptyRequired.length > 0 && (
              <span className="ml-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
                {emptyRequired.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('preview')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              tab === 'preview' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 active:bg-slate-50'
            }`}
          >
            <Eye size={14} />
            Предпросмотр
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {tab === 'fields' && (
            <div className="px-5 pb-4 space-y-3">
              {emptyRequired.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-semibold text-amber-700">
                    Заполните обязательные поля: {emptyRequired.map((f) => f.label).join(', ')}
                  </p>
                </div>
              )}

              {fields.map((field) => {
                const value = merged[field.key] ?? ''
                const isEmpty = field.required && !value.trim()
                return (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                    </label>
                    {field.multiline ? (
                      <textarea
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        rows={3}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white resize-none ${
                          isEmpty
                            ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                            : 'border-slate-200 focus:border-blue-400'
                        } outline-none transition-colors`}
                      />
                    ) : (
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setField(field.key, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        className={`w-full px-3 py-2.5 rounded-xl border text-sm bg-white ${
                          isEmpty
                            ? 'border-amber-400 bg-amber-50 focus:border-amber-500'
                            : 'border-slate-200 focus:border-blue-400'
                        } outline-none transition-colors`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {tab === 'preview' && (
            <div className="px-4 pb-4">
              <div className="bg-white border border-slate-200 rounded-xl p-5 overflow-x-auto text-xs leading-relaxed text-slate-800 font-serif">
                <TemplateComponent v={merged} />
              </div>
            </div>
          )}
        </div>

        {/* Print footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-2">
          <button
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-semibold bg-blue-600 text-white active:bg-blue-700 transition-colors"
          >
            <Printer size={18} />
            Печать / Сохранить PDF
          </button>
          <p className="text-center text-xs text-slate-400">
            Откроется диалог печати браузера — выберите «Сохранить как PDF»
          </p>
        </div>

        {/* Hidden print target */}
        <div className="hidden">
          <div ref={previewRef}>
            <TemplateComponent v={merged} />
          </div>
        </div>
      </div>
    </>
  )
}
