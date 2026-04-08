import { useState, useEffect, useRef } from 'react'
import { Car, Receipt, CheckCircle, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { QuickReceiptSheet } from '@/features/receipts/QuickReceiptSheet'
import { useTodayTrips } from '@/app/store/workspaceStore'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import type { Trip } from '@/entities/types/domain'

export function TodayPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const todayTrips = useTodayTrips(id)
  const openQuickTrip = useOpenQuickTrip()
  const [justAdded, setJustAdded] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showReceiptSheet, setShowReceiptSheet] = useState(false)

  // Show success banner when a new trip appears in today's list
  const prevCountRef = useRef(todayTrips.length)
  useEffect(() => {
    if (todayTrips.length > prevCountRef.current) {
      setJustAdded(true)
      const t = setTimeout(() => setJustAdded(false), 3000)
      prevCountRef.current = todayTrips.length
      return () => clearTimeout(t)
    }
    prevCountRef.current = todayTrips.length
  }, [todayTrips.length])

  const today = new Date().toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Date header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 capitalize">{today}</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          {todayTrips.length === 0
            ? 'Поездок пока не добавлено'
            : `${todayTrips.length} ${pluralTrips(todayTrips.length)} сегодня`}
        </p>
      </div>

      {/* Success banner */}
      {justAdded && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-2xl">
          <CheckCircle size={18} className="text-green-500 shrink-0" />
          <p className="text-sm font-medium text-green-800">Поездка добавлена</p>
        </div>
      )}

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <Card
          className="p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]"
          onClick={openQuickTrip}
        >
          <div className="p-2.5 bg-blue-100 rounded-2xl">
            <Car size={22} className="text-blue-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Поездка</span>
        </Card>

        <Card
          className="p-4 flex flex-col items-center justify-center gap-2 min-h-[100px]"
          onClick={() => setShowReceiptSheet(true)}
        >
          <div className="p-2.5 bg-green-100 rounded-2xl">
            <Receipt size={22} className="text-green-600" />
          </div>
          <span className="text-sm font-semibold text-slate-800">Чек</span>
        </Card>
      </div>

      {/* Journal */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Журнал за сегодня
        </h2>

        {todayTrips.length === 0 ? (
          <Card className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
              <Plus size={24} className="text-slate-400" />
            </div>
            <p className="text-sm font-medium text-slate-700">Ничего не добавлено</p>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Нажмите «Поездка», чтобы зафиксировать маршрут
            </p>
            <button
              onClick={openQuickTrip}
              className="text-sm font-semibold text-blue-600 active:text-blue-800"
            >
              + Добавить поездку
            </button>
          </Card>
        ) : (
          <div className="space-y-2">
            {todayTrips.map((trip) => (
              <TripCard key={trip.id} trip={trip} onClick={() => setSelectedTrip(trip)} />
            ))}
          </div>
        )}
      </section>
      {selectedTrip && (
        <TripDetailSheet
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}

      {showReceiptSheet && (
        <QuickReceiptSheet
          workspaceId={id}
          onClose={() => setShowReceiptSheet(false)}
        />
      )}
    </div>
  )
}

function pluralTrips(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'поездка'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'поездки'
  return 'поездок'
}
