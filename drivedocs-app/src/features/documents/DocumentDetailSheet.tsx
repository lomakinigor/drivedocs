import { useState } from 'react'
import { X, HelpCircle, Lightbulb, FileEdit, CheckCircle2 } from 'lucide-react'
import { useWorkspaceStore, useCurrentWorkspace } from '@/app/store/workspaceStore'
import { usePhotoCapture } from '@/shared/hooks/usePhotoCapture'
import { PhotoPicker } from '@/features/receipts/QuickReceiptSheet'
import { getDocumentHelp } from '@/entities/config/documentHelp'
import { getTemplate } from './templates/registry'
import { DocumentFillSheet } from './DocumentFillSheet'
import type { WorkspaceDocument, DocumentStatus } from '@/entities/types/domain'

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<DocumentStatus, string> = {
  required: 'Нужен',
  in_progress: 'В работе',
  completed: 'Готов',
  overdue: 'Просрочен',
}

const STATUS_COLOR: Record<DocumentStatus, string> = {
  required: 'text-red-600 bg-red-50',
  in_progress: 'text-yellow-700 bg-yellow-50',
  completed: 'text-green-700 bg-green-50',
  overdue: 'text-red-700 bg-red-50',
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DocumentDetailSheetProps {
  doc: WorkspaceDocument
  onClose: () => void
}

export function DocumentDetailSheet({ doc, onClose }: DocumentDetailSheetProps) {
  const updateDocumentStatus = useWorkspaceStore((s) => s.updateDocumentStatus)
  const updateDocumentImage = useWorkspaceStore((s) => s.updateDocumentImage)
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace)
  const workspace = useCurrentWorkspace()
  const liveDoc = useWorkspaceStore((s) => s.documents.find((d) => d.id === doc.id) ?? doc)
  const help = getDocumentHelp(doc.templateKey)
  const hasTemplate = !!getTemplate(doc.templateKey)
  const [showFill, setShowFill] = useState(false)

  // F-031 — пользователь сказал «у меня уже есть этот документ»
  const ackedIds = workspace?.acknowledgedDocumentIds ?? []
  const isAcked = ackedIds.includes(doc.id)

  const acknowledgeDoc = () => {
    if (!workspace) return
    updateWorkspace(workspace.id, {
      acknowledgedDocumentIds: [...ackedIds.filter((x) => x !== doc.id), doc.id],
    })
    onClose()
  }

  const unacknowledgeDoc = () => {
    if (!workspace) return
    updateWorkspace(workspace.id, {
      acknowledgedDocumentIds: ackedIds.filter((x) => x !== doc.id),
    })
    // не закрываем — пользователь хочет ввести данные сейчас
  }

  const photo = usePhotoCapture({
    onCapture: (base64) => updateDocumentImage(doc.id, base64),
  })

  const markDone = () => {
    updateDocumentStatus(doc.id, 'completed')
    onClose()
  }

  const undoComplete = () => {
    updateDocumentStatus(doc.id, 'required')
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[88dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3 gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLOR[doc.status]}`}
              >
                {STATUS_LABEL[doc.status]}
              </span>
              {doc.type === 'recurring' && (
                <span className="text-xs text-slate-500">Ежемесячно</span>
              )}
            </div>
            <h2 className="text-base font-bold text-slate-900 leading-snug">{doc.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100 shrink-0"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
          {/* F-031 — acked-сообщение перекрывает всё остальное содержимое */}
          {isAcked && (
            <div
              className="rounded-2xl px-4 py-4 space-y-2"
              style={{
                background: 'oklch(94% 0.044 285)',
                border: '1px solid oklch(88% 0.06 285)',
              }}
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} style={{ color: 'oklch(52% 0.225 285)' }} />
                <p
                  className="text-[14px] font-semibold"
                  style={{ color: 'oklch(35% 0.18 285)', fontFamily: 'Sora, system-ui, sans-serif' }}
                >
                  У вас уже есть этот документ
                </p>
              </div>
              <p className="text-[13px] text-slate-700 leading-relaxed">
                Вы указали, что «{doc.title}» у вас уже оформлен. Напоминалок не будет.
              </p>
              <p className="text-[13px] text-slate-600 leading-relaxed">
                Если хотите, чтобы мы сделали этот документ заново — введите недостающие данные.
              </p>
            </div>
          )}

          {/* Due date */}
          {doc.dueDate && doc.status !== 'completed' && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 rounded-xl">
              <span className="text-xs font-medium text-red-700">
                Срок:{' '}
                {new Date(doc.dueDate).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Completed at */}
          {doc.status === 'completed' && doc.completedAt && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-xl">
              <span className="text-xs font-medium text-green-700">
                Отмечен как готовый{' '}
                {new Date(doc.completedAt).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'long',
                })}
              </span>
            </div>
          )}

          {/* Help: why */}
          {help ? (
            <>
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <HelpCircle size={13} className="text-blue-500 shrink-0" />
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
                    Зачем нужен
                  </p>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{help.why}</p>
              </div>

              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Как подготовить
                </p>
                <p className="text-sm text-slate-700 leading-relaxed">{help.howTo}</p>
              </div>

              {help.tip && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 bg-amber-50 rounded-2xl">
                  <Lightbulb size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800 leading-relaxed">{help.tip}</p>
                </div>
              )}
            </>
          ) : (
            doc.description && (
              <p className="text-sm text-slate-600 leading-relaxed">{doc.description}</p>
            )
          )}

          {/* Scan attachment */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
              Скан подписанного документа
            </p>
            <p className="text-xs text-slate-500 mb-2">
              Когда подпишете «{doc.title}» — приложите фото или скан для архива
            </p>
            <input
              ref={photo.inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={photo.handleChange}
            />
            <PhotoPicker
              imageUrl={liveDoc.imageUrl}
              loading={photo.loading}
              error={photo.error}
              onOpen={photo.open}
              onRemove={() => updateDocumentImage(doc.id, undefined)}
              label="Прикрепить фото подписанного документа"
            />
          </div>

          <div className="h-1" />
        </div>

        {/* Sticky footer — actions */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-2">
          {isAcked ? (
            <>
              {/* F-031 — acked state: либо «ввести данные» (un-ack), либо закрыть */}
              <button
                onClick={unacknowledgeDoc}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white active:opacity-90"
                style={{ background: 'oklch(52% 0.225 285)' }}
              >
                Ввести данные
              </button>
              <button
                onClick={onClose}
                className="w-full py-3 rounded-2xl text-[13px] font-medium text-slate-500 active:text-slate-700"
              >
                Закрыть
              </button>
            </>
          ) : doc.status === 'completed' ? (
            <button
              onClick={undoComplete}
              className="w-full py-3.5 rounded-2xl text-sm font-semibold text-slate-500 border border-slate-200 active:bg-slate-50 transition-colors"
            >
              Отменить готовность
            </button>
          ) : (
            <>
              {hasTemplate && (
                <button
                  onClick={() => setShowFill(true)}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 active:bg-blue-100 transition-colors"
                >
                  <FileEdit size={16} />
                  Заполнить шаблон и распечатать
                </button>
              )}
              <button
                onClick={markDone}
                className="w-full py-4 rounded-2xl text-base font-semibold bg-green-600 text-white active:bg-green-700 transition-colors"
              >
                Отметить как готовый
              </button>
              {/* F-031 — не-критичные документы можно отложить с двумя сценариями */}
              <button
                onClick={acknowledgeDoc}
                className="w-full py-3 rounded-2xl text-[13px] font-semibold text-slate-700 border-2 border-slate-200 active:bg-slate-50"
              >
                У меня уже есть этот документ
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-2xl text-[12px] font-medium text-slate-500 active:text-slate-600"
              >
                Заполнить позже
              </button>
            </>
          )}
        </div>
      </div>

      {showFill && (
        <DocumentFillSheet doc={doc} onClose={() => setShowFill(false)} />
      )}
    </>
  )
}
