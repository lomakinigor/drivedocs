import { useState } from 'react'
import { Bell, AlertTriangle, Info, FileText, Car, AlertCircle } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { useWorkspaceEvents } from '@/app/store/workspaceStore'
import { mockFines } from '@/entities/mocks/events'
import { EventDetailSheet } from '@/features/events/EventDetailSheet'
import type { WorkspaceEvent, EventType, EventSeverity } from '@/entities/types/domain'

// ─── Event icon ───────────────────────────────────────────────────────────────

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
      <Icon size={18} className={color} />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function EventsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const events = useWorkspaceEvents(id)
  const fines = mockFines.filter((f) => f.workspaceId === id)
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

      {/* Fines */}
      {fines.length > 0 && (
        <section>
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Штрафы
          </h2>
          <div className="space-y-2">
            {fines.map((fine) => (
              <Card key={fine.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-red-50 rounded-xl shrink-0">
                    <AlertCircle size={18} className="text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-900">
                        {fine.amount.toLocaleString('ru-RU')} ₽
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          fine.status === 'unpaid'
                            ? 'bg-red-100 text-red-600'
                            : fine.status === 'paid'
                            ? 'bg-green-100 text-green-600'
                            : 'bg-yellow-100 text-yellow-600'
                        }`}
                      >
                        {fine.status === 'unpaid'
                          ? 'Не оплачен'
                          : fine.status === 'paid'
                          ? 'Оплачен'
                          : 'Оспаривается'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{fine.description}</p>
                    {fine.articleCode && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        {fine.articleCode} · {fine.licensePlate}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(fine.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Event feed */}
      {events.length === 0 ? (
        <EmptyState
          icon={<Bell size={48} />}
          title={fines.length > 0 ? 'Нет событий в ленте' : 'Событий пока нет'}
          description={
            fines.length > 0
              ? 'Напоминания и уведомления появятся здесь — штрафы отображаются отдельно выше'
              : 'Здесь будут напоминания, уведомления и записи о поездках'
          }
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
                    <p className="text-xs text-slate-400 mt-1">
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
