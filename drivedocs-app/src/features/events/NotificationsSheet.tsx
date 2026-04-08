import { Bell, AlertTriangle, Info, FileText, Car, X, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useWorkspaceStore, useWorkspaceEvents } from '@/app/store/workspaceStore'
import type { EventType, EventSeverity } from '@/entities/types/domain'

// ─── Event icon (inline — used only here) ────────────────────────────────────

function EventIcon({ type, severity }: { type: EventType; severity: EventSeverity }) {
  const color =
    severity === 'urgent' ? 'text-red-500' :
    severity === 'warning' ? 'text-yellow-500' : 'text-slate-400'
  const bg =
    severity === 'urgent' ? 'bg-red-50' :
    severity === 'warning' ? 'bg-yellow-50' : 'bg-slate-50'

  const Icon =
    type === 'fine' ? AlertTriangle :
    type === 'document_due' ? FileText :
    type === 'trip_logged' ? Car :
    type === 'reminder' ? Bell : Info

  return (
    <div className={`p-2 rounded-xl shrink-0 ${bg}`}>
      <Icon size={16} className={color} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface NotificationsSheetProps {
  workspaceId: string
  onClose: () => void
}

export function NotificationsSheet({ workspaceId, onClose }: NotificationsSheetProps) {
  const navigate = useNavigate()
  const allEvents = useWorkspaceEvents(workspaceId)
  const markEventRead = useWorkspaceStore((s) => s.markEventRead)

  const unread = allEvents.filter((e) => !e.isRead)

  const handleOpenAll = () => {
    onClose()
    navigate(`/w/${workspaceId}/events`)
  }

  const handleMarkRead = (id: string) => {
    markEventRead(id)
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[70dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Уведомления</h2>
            {unread.length > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{unread.length} непрочитанных</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-5 pb-2">
          {unread.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Bell size={36} className="text-slate-200" />
              <p className="text-sm text-slate-400">Нет непрочитанных уведомлений</p>
            </div>
          ) : (
            <div className="space-y-1">
              {unread.map((event) => (
                <button
                  key={event.id}
                  onClick={() => handleMarkRead(event.id)}
                  className="flex items-start gap-3 w-full text-left py-3 border-b border-slate-50 last:border-0 active:bg-slate-50 rounded-xl px-1 -mx-1 transition-colors"
                >
                  <EventIcon type={event.type} severity={event.severity} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                      {event.description}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(event.date).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleOpenAll}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-slate-50 text-sm font-medium text-slate-700 active:bg-slate-100 transition-colors"
          >
            Все события
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </>
  )
}
