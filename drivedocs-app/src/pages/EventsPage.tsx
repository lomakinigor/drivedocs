import { useState } from 'react'
import { Bell, AlertTriangle, Info, FileText, Car } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { useWorkspaceEvents } from '@/app/store/workspaceStore'
import { EventDetailSheet } from '@/features/events/EventDetailSheet'
import type { WorkspaceEvent, EventType, EventSeverity } from '@/entities/types/domain'

// 2026-05-13 · MVP — штрафы и новости ПДД из приложения убраны
// (нет источника данных). Секция «Штрафы» удалена с этого экрана.

// ─── Event icon ───────────────────────────────────────────────────────────────

function EventIcon({ type, severity }: { type: EventType; severity: EventSeverity }) {
  const color =
    severity === 'urgent' ? 'text-red-500' :
    severity === 'warning' ? 'text-yellow-500' : 'text-slate-500'

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
      <Icon size={18} className={color} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EventsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  // 2026-05-13 — fine-евенты не показываем в MVP
  const events = useWorkspaceEvents(id).filter((e) => e.type !== 'fine')
  const unreadCount = events.filter((e) => !e.isRead).length

  const [selectedEvent, setSelectedEvent] = useState<WorkspaceEvent | null>(null)

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">События</h1>
        {unreadCount > 0 && (
          <p className="text-sm text-slate-500 mt-0.5">{unreadCount} непрочитанных</p>
        )}
      </div>

      {/* Event feed */}
      {events.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title="Событий пока нет"
          description="Здесь будут напоминания, уведомления и записи о поездках"
        />
      ) : (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Лента
          </h2>
          <div className="space-y-2">
            {events.map((event) => (
              <Card
                key={event.id}
                className={`p-4 ${!event.isRead ? 'border-l-2 border-l-blue-500' : ''}`}
                onClick={() => setSelectedEvent(event)}
              >
                <div className="flex items-start gap-3">
                  <EventIcon type={event.type} severity={event.severity} />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        !event.isRead ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'
                      }`}
                    >
                      {event.title}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                      {event.description}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(event.date).toLocaleString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {!event.isRead && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Detail sheet */}
      {selectedEvent && (
        <EventDetailSheet
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
        />
      )}
    </div>
  )
}
