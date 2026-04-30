import { useState } from 'react'
import { FileText, CheckCircle, Clock, AlertCircle, Car } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Badge } from '@/shared/ui/components/Badge'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { DocumentDetailSheet } from '@/features/documents/DocumentDetailSheet'
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

  const { total, completed, pending, percent } = computeProgress(docs)

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
          <DocSection title="Нужны" docs={attention} onOpen={setSelectedDoc} onMarkDone={quickMarkDone} />
        )}

        {/* In progress */}
        {inProgress.length > 0 && (
          <DocSection title="В работе" docs={inProgress} onOpen={setSelectedDoc} onMarkDone={quickMarkDone} />
        )}

        {/* Completed */}
        {done.length > 0 && (
          <DocSection title="Готовы" docs={done} onOpen={setSelectedDoc} />
        )}
      </div>

      {/* Detail sheet */}
      {selectedDoc && (
        <DocumentDetailSheet
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
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
}: {
  title: string
  docs: WorkspaceDocument[]
  onOpen: (doc: WorkspaceDocument) => void
  onMarkDone?: (doc: WorkspaceDocument) => void
}) {
  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        {title}
      </h2>
      <div className="space-y-2">
        {docs.map((doc) => (
          <DocCard
            key={doc.id}
            doc={doc}
            onOpen={() => onOpen(doc)}
            onMarkDone={onMarkDone ? () => onMarkDone(doc) : undefined}
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
}: {
  doc: WorkspaceDocument
  onOpen: () => void
  onMarkDone?: () => void
}) {
  const config = STATUS_CONFIG[doc.status]
  const isComplete = doc.status === 'completed'

  const iconEl =
    doc.status === 'completed' ? (
      <CheckCircle size={18} className="text-green-500" />
    ) : doc.status === 'in_progress' ? (
      <Clock size={18} className="text-yellow-500" />
    ) : (
      <AlertCircle size={18} className="text-red-500" />
    )

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="flex items-start gap-3 p-4">
        {/* Icon */}
        <div
          className={`p-2 rounded-xl shrink-0 ${
            isComplete ? 'bg-green-50' : doc.status === 'in_progress' ? 'bg-yellow-50' : 'bg-red-50'
          }`}
        >
          {iconEl}
        </div>

        {/* Content — tappable area → opens detail */}
        <button onClick={onOpen} className="min-w-0 flex-1 text-left">
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
        </button>

        {/* Badge */}
        <div className="shrink-0 mt-0.5">
          <Badge variant={config.badge}>{config.label}</Badge>
        </div>
      </div>

      {/* Quick action bar — only for non-completed */}
      {!isComplete && onMarkDone && (
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
