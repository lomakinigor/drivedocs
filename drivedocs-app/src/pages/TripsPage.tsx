import { useState } from 'react'
import { Car, Plus, FileText, ClipboardList } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { MonthlyReportSheet } from '@/features/trips/MonthlyReportSheet'
import { WaybillPreviewSheet } from '@/features/trips/WaybillPreviewSheet'
import { useWorkspaceTrips } from '@/app/store/workspaceStore'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import type { Trip } from '@/entities/types/domain'

function currentMonthRange(): { fromDate: string; toDate: string } {
  const d = new Date()
  const year = d.getFullYear()
  const month = d.getMonth()
  const fromDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const toDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { fromDate, toDate }
}

export function TripsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const trips = useWorkspaceTrips(id)
  const openQuickTrip = useOpenQuickTrip()
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [reportOpen, setReportOpen] = useState(false)
  const [waybillOpen, setWaybillOpen] = useState(false)
  const { fromDate: waybillFrom, toDate: waybillTo } = currentMonthRange()

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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWaybillOpen(true)}
            className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 text-sm font-medium px-3 py-2 rounded-2xl active:bg-slate-50 shadow-sm"
          >
            <ClipboardList size={15} strokeWidth={1.8} />
            Лист
          </button>
          <button
            onClick={() => setReportOpen(true)}
            className="flex items-center gap-1.5 border border-slate-200 bg-white text-slate-600 text-sm font-medium px-3 py-2 rounded-2xl active:bg-slate-50 shadow-sm"
          >
            <FileText size={15} strokeWidth={1.8} />
            Отчёт
          </button>
          <button
            onClick={openQuickTrip}
            className="flex items-center gap-1.5 text-white text-sm font-semibold px-3 py-2 rounded-2xl active:opacity-90 transition-opacity"
            style={{ background: 'oklch(52% 0.225 285)', boxShadow: '0 2px 8px oklch(52% 0.225 285 / 0.35)' }}
          >
            <Plus size={16} strokeWidth={2.2} />
            Добавить
          </button>
        </div>
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

      {reportOpen && (
        <MonthlyReportSheet
          workspaceId={id}
          onClose={() => setReportOpen(false)}
        />
      )}

      {waybillOpen && (
        <WaybillPreviewSheet
          workspaceId={id}
          fromDate={waybillFrom}
          toDate={waybillTo}
          onClose={() => setWaybillOpen(false)}
        />
      )}
    </div>
  )
}
