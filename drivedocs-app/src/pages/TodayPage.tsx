import { useState, useEffect, useRef } from 'react'
import { Car, Receipt as ReceiptIcon, CheckCircle, Plus, Printer } from 'lucide-react'
import { useParams, Link } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { WaybillPreviewSheet } from '@/features/trips/WaybillPreviewSheet'
import { QuickReceiptSheet } from '@/features/receipts/QuickReceiptSheet'
import { ReceiptDetailSheet } from '@/features/receipts/ReceiptDetailSheet'
import { useTodayTrips, useTodayReceipts } from '@/app/store/workspaceStore'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Trip, Receipt } from '@/entities/types/domain'

export function TodayPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const todayTrips = useTodayTrips(id)
  const todayReceipts = useTodayReceipts(id)
  const openQuickTrip = useOpenQuickTrip()
  const [justAdded, setJustAdded] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [showReceiptSheet, setShowReceiptSheet] = useState(false)
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null)
  const [showWaybill, setShowWaybill] = useState(false)

  const todayIso = new Date().toISOString().slice(0, 10)

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
      <div className="space-y-2">
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
              <ReceiptIcon size={22} className="text-green-600" />
            </div>
            <span className="text-sm font-semibold text-slate-800">Чек</span>
          </Card>
        </div>
        <div className="flex justify-end">
          <Link
            to={`/w/${id}/receipts`}
            className="text-xs text-blue-600 font-medium py-1 px-0.5"
          >
            История чеков →
          </Link>
        </div>
      </div>

      {/* Daily waybill button */}
      <button
        onClick={() => setShowWaybill(true)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-slate-200 bg-white active:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl shrink-0">
            <Printer size={18} className="text-indigo-500" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-slate-900">Путевой лист за сегодня</p>
            <p className="text-xs text-slate-400 mt-0.5">Скачать PDF для печати</p>
          </div>
        </div>
        <span className="text-slate-300 text-lg leading-none">›</span>
      </button>

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
      {/* Receipts today */}
      {todayReceipts.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              Чеки сегодня
            </h2>
            <Link
              to={`/w/${id}/receipts`}
              className="text-xs text-blue-600 font-medium"
            >
              Все →
            </Link>
          </div>
          <div className="space-y-2">
            {todayReceipts.map((receipt) => (
              <button
                key={receipt.id}
                onClick={() => setSelectedReceipt(receipt)}
                className="w-full text-left"
              >
                <Card className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-xl shrink-0">
                      <ReceiptIcon size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {receipt.amount.toLocaleString('ru-RU')} ₽
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {RECEIPT_CATEGORY_LABELS[receipt.category]}
                      </p>
                    </div>
                    <span className={`text-xs font-medium shrink-0 ${receipt.tripId ? 'text-blue-500' : 'text-slate-400'}`}>
                      {receipt.tripId ? 'К поездке' : 'Не привязан'}
                    </span>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        </section>
      )}

      {selectedTrip && (
        <TripDetailSheet
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}

      {showWaybill && (
        <WaybillPreviewSheet
          workspaceId={id}
          fromDate={todayIso}
          toDate={todayIso}
          onClose={() => setShowWaybill(false)}
        />
      )}

      {showReceiptSheet && (
        <QuickReceiptSheet
          workspaceId={id}
          onClose={() => setShowReceiptSheet(false)}
        />
      )}

      {selectedReceipt && (
        <ReceiptDetailSheet
          receipt={selectedReceipt}
          workspaceId={id}
          onClose={() => setSelectedReceipt(null)}
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
