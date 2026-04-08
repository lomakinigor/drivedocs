import { useState } from 'react'
import { Car, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { useWorkspaceTrips } from '@/app/store/workspaceStore'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import type { Trip } from '@/entities/types/domain'

export function TripsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const trips = useWorkspaceTrips(id)
  const openQuickTrip = useOpenQuickTrip()
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  const totalKm = trips.reduce((sum, t) => sum + t.distanceKm, 0)

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Поездки</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {trips.length > 0
              ? `${trips.length} поездок · ${totalKm} км`
              : 'Пока нет поездок'}
          </p>
        </div>
        <button
          onClick={openQuickTrip}
          className="flex items-center gap-1.5 bg-blue-600 text-white text-sm font-medium px-3 py-2 rounded-xl active:bg-blue-700"
        >
          <Plus size={16} />
          Добавить
        </button>
      </div>

      {/* List */}
      {trips.length === 0 ? (
        <EmptyState
          icon={<Car size={48} />}
          title="Поездок пока нет"
          description="Записывайте служебные поездки — это основа для подтверждения расходов"
          action={
            <button
              onClick={openQuickTrip}
              className="bg-blue-600 text-white text-sm font-medium px-5 py-2.5 rounded-xl"
            >
              Первая поездка
            </button>
          }
        />
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} showDate onClick={() => setSelectedTrip(trip)} />
          ))}
        </div>
      )}

      {selectedTrip && (
        <TripDetailSheet
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  )
}
