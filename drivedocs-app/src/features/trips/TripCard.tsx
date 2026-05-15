import { Car, MapPin } from 'lucide-react'
import type { Trip } from '@/entities/types/domain'

interface TripCardProps {
  trip: Trip
  /** Show date label (used on TripsPage). TodayPage omits it since context is clear. */
  showDate?: boolean
  onClick?: () => void
}

export function TripCard({ trip, showDate = false, onClick }: TripCardProps) {
  const fromCity = trip.startLocation.split(',')[0].trim()
  const toCity = trip.endLocation.split(',')[0].trim()

  const Tag = onClick ? 'button' : 'div'

  return (
    <Tag
      onClick={onClick}
      className={`flex items-start gap-3 w-full bg-white rounded-2xl border border-slate-100/70 p-4 text-left
        shadow-[0_2px_12px_oklch(22%_0.028_280/0.06),_0_1px_3px_oklch(22%_0.028_280/0.04)]
        ${onClick ? 'active:scale-[0.99] active:bg-slate-50/50 transition-all duration-150' : ''}`}
    >
      <div className="p-2 bg-blue-50 rounded-xl shrink-0 mt-0.5">
        <Car size={18} className="text-blue-500" strokeWidth={1.8} />
      </div>

      <div className="min-w-0 flex-1">
        {/* Route */}
        <div className="flex items-center gap-1 min-w-0 mb-1">
          <MapPin size={11} className="text-slate-500 shrink-0" />
          <span className="text-sm font-semibold text-slate-900 truncate">{fromCity}</span>
          <span className="text-slate-300 shrink-0 text-xs">→</span>
          <span className="text-sm font-semibold text-slate-900 truncate">{toCity}</span>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-slate-500">{trip.distanceKm} км</span>
          {showDate && (
            <>
              <span className="text-slate-200 text-xs">·</span>
              <span className="text-xs text-slate-500">
                {new Date(trip.date).toLocaleDateString('ru-RU', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </>
          )}
          <span className="text-slate-200 text-xs">·</span>
          <span className="text-xs text-slate-500 truncate">{trip.purpose}</span>
        </div>
      </div>
    </Tag>
  )
}
