import { useEffect } from 'react'
import { X, Bell, AlertTriangle, Info, FileText, Car, AlertCircle } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import type { WorkspaceEvent, EventType, EventSeverity } from '@/entities/types/domain'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function severityLabel(s: EventSeverity) {
  if (s === 'urgent') return { text: 'Срочно', cls: 'bg-red-100 text-red-600' }
  if (s === 'warning') return { text: 'Важно', cls: 'bg-yellow-100 text-yellow-700' }
  return { text: 'Инфо', cls: 'bg-slate-100 text-slate-500' }
}

function typeLabel(t: EventType): string {
  const map: Record<EventType, string> = {
    fine: 'Штраф',
    reminder: 'Напоминание',
    document_due: 'Документ',
    system: 'Система',
    trip_logged: 'Поездка',
    receipt_added: 'Чек',
  }
  return map[t] ?? t
}

function EventIcon({ type, severity }: { type: EventType; severity: EventSeverity }) {
  const color =
    severity === 'urgent' ? 'text-red-500' :
    severity === 'warning' ? 'text-yellow-500' : 'text-slate-400'

  const bg =
    severity === 'urgent' ? 'bg-red-50' :
    severity === 'warning' ? 'bg-yellow-50' : 'bg-slate-50'

  const Icon =
    type === 'fine' ? AlertCircle :
    type === 'document_due' ? FileText :
    type === 'trip_logged' ? Car :
    type === 'reminder' ? Bell : Info

  return (
    <div className={`p-3 rounded-2xl ${bg}`}>
      <Icon size={24} className={color} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EventDetailSheetProps {
  event: WorkspaceEvent
  onClose: () => void
}

export function EventDetailSheet({ event, onClose }: EventDetailSheetProps) {
  const markEventRead = useWorkspaceStore((s) => s.markEventRead)

  // Auto-mark as read when detail opens
  useEffect(() => {
    if (!event.isRead) {
      markEventRead(event.id)
    }
  }, [event.id, event.isRead, markEventRead])

  const severity = severityLabel(event.severity)

  const dateFormatted = new Date(event.date).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[75dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header row */}
        <div className="flex items-start justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-3">
            <EventIcon type={event.type} severity={event.severity} />
            <div>
              <p className="text-xs font-medium text-slate-400 mb-0.5">{typeLabel(event.type)}</p>
              <h2 className="text-base font-semibold text-slate-900 leading-snug">{event.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100 shrink-0"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-8 space-y-4">
          {/* Description */}
          <p className="text-sm text-slate-700 leading-relaxed">{event.description}</p>

          {/* Meta row */}
          <div className="flex flex-wrap gap-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${severity.cls}`}>
              {severity.text}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <AlertTriangle size={13} className="shrink-0 opacity-0" aria-hidden="true" />
            <span>{dateFormatted}</span>
          </div>
        </div>
      </div>
    </>
  )
}
