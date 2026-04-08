import { useState } from 'react'
import { X, MapPin, Car, Calendar, Target, Trash2, Receipt } from 'lucide-react'
import { useWorkspaceStore, useReceiptsByTrip } from '@/app/store/workspaceStore'
import type { Trip } from '@/entities/types/domain'

interface TripDetailSheetProps {
  trip: Trip
  onClose: () => void
}

export function TripDetailSheet({ trip, onClose }: TripDetailSheetProps) {
  const deleteTrip = useWorkspaceStore((s) => s.deleteTrip)
  const linkedReceipts = useReceiptsByTrip(trip.id)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    deleteTrip(trip.id)
    onClose()
  }

  const dateFormatted = new Date(trip.date).toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[80dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl">
              <Car size={18} className="text-blue-500" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">Поездка</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4">
          {/* Route */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="text-slate-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Откуда</p>
                <p className="text-sm font-medium text-slate-900 leading-snug">
                  {trip.startLocation}
                </p>
              </div>
            </div>
            <div className="ml-[23px] border-l-2 border-dashed border-slate-200 h-3" />
            <div className="flex items-start gap-2.5">
              <MapPin size={15} className="text-blue-400 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-xs text-slate-400 mb-0.5">Куда</p>
                <p className="text-sm font-medium text-slate-900 leading-snug">
                  {trip.endLocation}
                </p>
              </div>
            </div>
          </div>

          {/* Meta rows */}
          <div className="space-y-3">
            <MetaRow icon={<Car size={15} className="text-slate-400" />} label="Расстояние">
              {trip.distanceKm} км
            </MetaRow>
            <MetaRow icon={<Target size={15} className="text-slate-400" />} label="Цель поездки">
              {trip.purpose}
            </MetaRow>
            <MetaRow icon={<Calendar size={15} className="text-slate-400" />} label="Дата">
              <span className="capitalize">{dateFormatted}</span>
            </MetaRow>
            {linkedReceipts.length > 0 && (
              <MetaRow icon={<Receipt size={15} className="text-slate-400" />} label="Чеки">
                {linkedReceipts.length} {pluralReceipts(linkedReceipts.length)} ·{' '}
                {linkedReceipts
                  .reduce((sum, r) => sum + r.amount, 0)
                  .toLocaleString('ru-RU')}{' '}
                ₽
              </MetaRow>
            )}
          </div>

          {/* Delete section */}
          <div className="pt-2">
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="flex items-center gap-2 text-sm text-red-500 font-medium active:text-red-700 py-1"
              >
                <Trash2 size={15} />
                Удалить поездку
              </button>
            ) : (
              <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
                <p className="text-sm font-semibold text-slate-900 mb-1">Удалить поездку?</p>
                <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                  {trip.startLocation} → {trip.endLocation}, {trip.distanceKm} км. Это действие нельзя отменить.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-600 active:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white active:bg-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pluralReceipts(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'чек'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'чека'
  return 'чеков'
}

function MetaRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{children}</p>
      </div>
    </div>
  )
}
