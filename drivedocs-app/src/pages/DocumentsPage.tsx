import { useState } from 'react'
import { FileText, CheckCircle, Clock, AlertCircle, Car, Printer, Square, CheckSquare } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/ui/components/Badge'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { DocumentDetailSheet } from '@/features/documents/DocumentDetailSheet'
import { BatchPrintSheet } from '@/features/documents/BatchPrintSheet'
import { getTemplate } from '@/features/documents/templates/registry'
import { useWorkspaceDocuments, useWorkspaceStore, useCurrentWorkspace } from '@/app/store/workspaceStore'
import { VEHICLE_USAGE_MODEL_LABELS } from '@/entities/constants/labels'
import { VEHICLE_DOCUMENT_CHECKLIST } from '@/entities/constants/vehicleDocumentChecklist'
import type { WorkspaceDocument, DocumentStatus } from '@/entities/types/domain'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocumentStatus,
  { label: string; badge: React.ComponentProps<typeof Badge>['variant'] }
> = {
  required: { label: 'Нужен', badge: 'red' },
  in_progress: { label: 'В работе', badge: 'yellow' },
  completed: { label: 'Готов', badge: 'green' },
  overdue: { label: 'Просрочен', badge: 'red' },
}

// ─── Progress helpers ─────────────────────────────────────────────────────────

function computeProgress(docs: WorkspaceDocument[]) {
  const total = docs.length
  const completed = docs.filter((d) => d.status === 'completed').length
  const pending = total - completed
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, pending, percent }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function DocumentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()

  const docs = useWorkspaceDocuments(id)
  const updateDocumentStatus = useWorkspaceStore((s) => s.updateDocumentStatus)
  const workspace = useCurrentWorkspace()

  const [selectedDoc, setSelectedDoc] = useState<WorkspaceDocument | null>(null)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchPrintDocs, setBatchPrintDocs] = useState<WorkspaceDocument[] | null>(null)

  const { total, completed, pending, percent } = computeProgress(docs)

  const printableDocs = docs.filter((d) => !!getTemplate(d.templateKey))

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const exitSelectMode = () => {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  const handleBatchPrint = () => {
    const chosen = docs.filter((d) => selectedIds.has(d.id) && !!getTemplate(d.templateKey))
    if (chosen.length === 0) return
    setBatchPrintDocs(chosen)
  }

  const checklist = workspace ? VEHICLE_DOCUMENT_CHECKLIST[workspace.vehicleUsageModel] : []
  const requiredCount = checklist.filter((d) => d.required).length

  // Group docs for display
  const attention = docs.filter((d) => d.status === 'required' || d.status === 'overdue')
  const inProgress = docs.filter((d) => d.status === 'in_progress')
  const done = docs.filter((d) => d.status === 'completed')

  const quickMarkDone = (doc: WorkspaceDocument) => {
    updateDocumentStatus(doc.id, 'completed')
  }

  return (
    <>
      <div className="px-4 py-5 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Документы</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {total === 0
                ? 'Нет документов для этого предприятия'
                : pending === 0
                ? 'Все документы готовы'
                : `${pending} из ${total} не готовы`}
            </p>
          </div>
          {printableDocs.length > 0 && (
            selectMode ? (
              <button
                onClick={exitSelectMode}
                className="text-sm font-medium text-slate-500 active:text-slate-700 shrink-0 mt-1"
              >
                Отмена
              </button>
            ) : (
              <button
                onClick={() => setSelectMode(true)}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-600 active:text-blue-800 shrink-0 mt-1"
              >
                <Printer size={15} />
                Пакет
              </button>
            )
          )}
        </div>

        {/* Scheme banner */}
        {workspace && (
          <button
            onClick={() => navigate(`/w/${id}/settings`)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl border border-blue-100 bg-blue-50 text-left active:bg-blue-100"
          >
            <div className="p-2 bg-blue-100 rounded-xl shrink-0">
              <Car size={16} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-blue-800">
                {VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}
              </p>
              <p className="text-xs text-blue-500 mt-0.5">
                {requiredCount} обязательных документа · Изменить схему →
              </p>
            </div>
          </button>
        )}

        {/* Progress bar */}
        {total > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-slate-400">{completed} готово</span>
              <span className="text-xs font-semibold text-slate-600">{percent}%</span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Empty state */}
        {total === 0 && (
          <EmptyState
            icon={<FileText size={48} />}
            title="Документов нет"
            description="Список документов формируется на основе налогового режима и правовой модели предприятия"
          />
        )}

        {/* Attention */}
        {attention.length > 0 && (
          <DocSection
            title="Нужны"
            docs={attention}
            onOpen={selectMode ? undefined : setSelectedDoc}
            onMarkDone={selectMode ? undefined : quickMarkDone}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
          />
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <DocSection
            title="В работе"
            docs={inProgress}
            onOpen={selectMode ? undefined : setSelectedDoc}
            onMarkDone={selectMode ? undefined : quickMarkDone}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
          />
        )}

        {/* Completed */}
        {done.length > 0 && (
          <DocSection
            title="Готовы"
            docs={done}
            onOpen={selectMode ? undefined : setSelectedDoc}
            selectMode={selectMode}
            selectedIds={selectedIds}
            onToggle={toggleSelect}
          />
        )}

        {/* Bottom spacer for batch bar */}
        {selectMode && <div className="h-20" />}
      </div>

      {/* Batch print sticky bar */}
      {selectMode && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-slate-100 px-4 py-3 safe-bottom">
          <button
            onClick={handleBatchPrint}
            disabled={selectedIds.size === 0}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-colors ${
              selectedIds.size > 0
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Printer size={16} />
            {selectedIds.size === 0
              ? 'Выберите документы'
              : `Распечатать ${selectedIds.size} ${pluralDocs(selectedIds.size)}`}
          </button>
        </div>
      )}

      {/* Detail sheet */}
      {selectedDoc && (
        <DocumentDetailSheet
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {/* Batch print renderer */}
      {batchPrintDocs && (
        <BatchPrintSheet
          docs={batchPrintDocs}
          onClose={() => {
            setBatchPrintDocs(null)
            exitSelectMode()
          }}
        />
      )}
    </>
  )
}

// ─── Section ──────────────────────────────────────────────────────────────────

function DocSection({
  title,
  docs,
  onOpen,
  onMarkDone,
  selectMode,
  selectedIds,
  onToggle,
}: {
  title: string
  docs: WorkspaceDocument[]
  onOpen?: (doc: WorkspaceDocument) => void
  onMarkDone?: (doc: WorkspaceDocument) => void
  selectMode?: boolean
  selectedIds?: Set<string>
  onToggle?: (id: string) => void
}) {
  const sectionIcon =
    title === 'Нужны' ? <AlertCircle size={13} className="text-red-400" /> :
    title === 'В работе' ? <Clock size={13} className="text-amber-500" /> :
    <CheckCircle size={13} className="text-emerald-500" />

  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        {sectionIcon}
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          {title}
        </h2>
      </div>
      <div className="space-y-2">
        {docs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            onOpen={onOpen ? () => onOpen(doc) : undefined}
            onMarkDone={onMarkDone ? () => onMarkDone(doc) : undefined}
            selectMode={selectMode}
            isSelected={selectedIds?.has(doc.id) ?? false}
            onToggle={onToggle ? () => onToggle(doc.id) : undefined}
          />
        ))}
      </div>
    </section>
  )
}

// ─── Card ─────────────────────────────────────────────────────────────────────

function DocCard({
  doc,
  onOpen,
  onMarkDone,
  selectMode,
  isSelected,
  onToggle,
}: {
  doc: WorkspaceDocument
  onOpen?: () => void
  onMarkDone?: () => void
  selectMode?: boolean
  isSelected?: boolean
  onToggle?: () => void
}) {
  const config = STATUS_CONFIG[doc.status]
  const isComplete = doc.status === 'completed'
  const hasTemplate = !!getTemplate(doc.templateKey)
  const selectable = selectMode && hasTemplate

  const iconEl =
    doc.status === 'completed' ? (
      <CheckCircle size={18} className="text-green-500" />
    ) : doc.status === 'in_progress' ? (
      <Clock size={18} className="text-yellow-500" />
    ) : (
      <AlertCircle size={18} className="text-red-500" />
    )

  return (
    <div
      className={`bg-white rounded-2xl border overflow-hidden transition-all
        shadow-[0_2px_12px_oklch(22%_0.028_280/0.06),_0_1px_3px_oklch(22%_0.028_280/0.04)]
        ${isSelected ? 'border-blue-400' : 'border-slate-100/70'}
        ${selectMode && !hasTemplate ? 'opacity-40' : ''}`}
    >
      <div className="flex items-start gap-3 p-4">
        {/* Select checkbox OR status icon */}
        {selectMode ? (
          <button
            onClick={selectable ? onToggle : undefined}
            disabled={!selectable}
            className="mt-0.5 shrink-0"
          >
            {isSelected
              ? <CheckSquare size={20} className="text-blue-600" />
              : <Square size={20} className="text-slate-300" />}
          </button>
        ) : (
          <div
            className={`p-2 rounded-xl shrink-0 ${
              isComplete ? 'bg-green-50' : doc.status === 'in_progress' ? 'bg-yellow-50' : 'bg-red-50'
            }`}
          >
            {iconEl}
          </div>
        )}

        {/* Content — tappable area */}
        <button
          onClick={selectable ? onToggle : onOpen}
          disabled={selectMode && !selectable}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-medium text-slate-900 leading-snug">{doc.title}</p>
          {doc.description && (
            <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{doc.description}</p>
          )}
          {doc.dueDate && !isComplete && (
            <p className="text-xs text-red-500 mt-1">
              До{' '}
              {new Date(doc.dueDate).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
              })}
            </p>
          )}
          {isComplete && doc.completedAt && (
            <p className="text-xs text-green-600 mt-1">
              Готов с{' '}
              {new Date(doc.completedAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'short',
              })}
            </p>
          )}
          {selectMode && hasTemplate && (
            <p className="text-xs text-blue-400 mt-0.5">есть шаблон</p>
          )}
        </button>

        {/* Badge — hidden in select mode */}
        {!selectMode && (
          <div className="shrink-0 mt-0.5">
            <Badge variant={config.badge}>{config.label}</Badge>
          </div>
        )}
      </div>

      {/* Quick action bar — only for non-completed, normal mode */}
      {!selectMode && !isComplete && onMarkDone && (
        <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-between">
          <button
            onClick={onOpen}
            className="text-xs text-blue-600 font-medium active:text-blue-800"
          >
            Подробнее →
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onMarkDone()
            }}
            className="flex items-center gap-1.5 text-xs font-semibold text-green-600 active:text-green-800"
          >
            <CheckCircle size={13} />
            Готово
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralDocs(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'документ'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'документа'
  return 'документов'
}
