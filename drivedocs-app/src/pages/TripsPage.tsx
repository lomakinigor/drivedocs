import { useState } from 'react'
import { Car, Plus, FileText, ClipboardList } from 'lucide-react'
import { useParams, useSearchParams } from 'react-router-dom'
import { EmptyState } from '@/shared/ui/components/EmptyState'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { MonthlyReportSheet } from '@/features/trips/MonthlyReportSheet'
import { WaybillPreviewSheet } from '@/features/trips/WaybillPreviewSheet'
import { ReceiptsPage } from '@/pages/ReceiptsPage'
import { useWorkspaceTrips } from '@/app/store/workspaceStore'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import type { Trip } from '@/entities/types/domain'

type TripsMode = 'trips' | 'receipts'

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
  const [searchParams, setSearchParams] = useSearchParams()

  // T-133 · F-022 — toggle Поездки / Чеки. URL `?mode=receipts` устанавливает initial.
  const initialMode: TripsMode = searchParams.get('mode') === 'receipts' ? 'receipts' : 'trips'
  const [mode, setMode] = useState<TripsMode>(initialMode)

  const switchMode = (next: TripsMode) => {
    setMode(next)
    const p = new URLSearchParams(searchParams)
    if (next === 'receipts') p.set('mode', 'receipts')
    else p.delete('mode')
    setSearchParams(p, { replace: true })
  }

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
          <h1 className="text-xl font-bold text-slate-900">
            {mode === 'trips' ? 'Поездки' : 'Чеки'}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {mode === 'trips'
              ? trips.length > 0
                ? `${trips.length} поездок · ${totalKm} км`
                : 'Пока нет поездок'
              : 'История расходов по периоду'}
          </p>
        </div>
        {mode === 'trips' && (
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
        )}
      </div>

      {/* Mode toggle (T-133 · F-022) */}
      <div className="flex gap-1 p-1 bg-slate-100/70 rounded-2xl">
        {(['trips', 'receipts'] as TripsMode[]).map((m) => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
              mode === m
                ? 'bg-white text-blue-700 shadow-[0_1px_4px_oklch(22%_0.028_280/0.10)]'
                : 'text-slate-500 active:text-slate-700'
            }`}
          >
            {m === 'trips' ? 'Поездки' : 'Чеки'}
          </button>
        ))}
      </div>

      {/* Content per mode */}
      {mode === 'trips' ? (
        trips.length === 0 ? (
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
        )
      ) : (
        <ReceiptsPage embedded />
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
