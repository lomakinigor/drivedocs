import { useState } from 'react'
import { X, Receipt as ReceiptIcon, Link, Unlink, Car, ChevronRight } from 'lucide-react'
import { useWorkspaceStore, useWorkspaceTrips } from '@/app/store/workspaceStore'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Receipt, Trip } from '@/entities/types/domain'

interface ReceiptDetailSheetProps {
  receipt: Receipt
  workspaceId: string
  onClose: () => void
}

export function ReceiptDetailSheet({ receipt, workspaceId, onClose }: ReceiptDetailSheetProps) {
  const attachReceiptToTrip = useWorkspaceStore((s) => s.attachReceiptToTrip)
  const detachReceiptFromTrip = useWorkspaceStore((s) => s.detachReceiptFromTrip)
  const trips = useWorkspaceTrips(workspaceId)

  const [pickingTrip, setPickingTrip] = useState(false)

  // Current live receipt from store (reactive to attach/detach)
  const liveReceipt = useWorkspaceStore((s) =>
    s.receipts.find((r) => r.id === receipt.id) ?? receipt,
  )
  const linkedTrip = liveReceipt.tripId
    ? trips.find((t) => t.id === liveReceipt.tripId) ?? null
    : null

  const handleAttach = (trip: Trip) => {
    attachReceiptToTrip(liveReceipt.id, trip.id)
    setPickingTrip(false)
  }

  const handleDetach = () => {
    detachReceiptFromTrip(liveReceipt.id)
    setPickingTrip(false)
  }

  const dateFormatted = new Date(liveReceipt.date).toLocaleDateString('ru-RU', {
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[85dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-green-50 rounded-xl">
              <ReceiptIcon size={18} className="text-green-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                {liveReceipt.amount.toLocaleString('ru-RU')} ₽
              </h2>
              <p className="text-xs text-slate-400">
                {RECEIPT_CATEGORY_LABELS[liveReceipt.category]} · {dateFormatted}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-6 space-y-4">
          {/* Description */}
          {liveReceipt.description && (
            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3">
              {liveReceipt.description}
            </p>
          )}

          {/* Receipt photo */}
          {liveReceipt.imageUrl && (
            <ReceiptPhoto imageUrl={liveReceipt.imageUrl} />
          )}

          {/* Trip linking section */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Привязка к поездке
            </p>

            {linkedTrip ? (
              /* Linked state */
              <div className="bg-blue-50 rounded-2xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-1.5 bg-blue-100 rounded-lg shrink-0">
                    <Car size={15} className="text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {linkedTrip.startLocation} → {linkedTrip.endLocation}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {linkedTrip.distanceKm} км ·{' '}
                      {new Date(linkedTrip.date).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  </div>
                  <Link size={15} className="text-blue-400 shrink-0 mt-0.5" />
                </div>
                <button
                  onClick={handleDetach}
                  className="flex items-center gap-1.5 text-xs text-slate-500 font-medium active:text-slate-700"
                >
                  <Unlink size={13} />
                  Отвязать от поездки
                </button>
              </div>
            ) : pickingTrip ? (
              /* Trip picker */
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-slate-500">Выберите поездку</p>
                  <button
                    onClick={() => setPickingTrip(false)}
                    className="text-xs text-blue-600 font-medium"
                  >
                    Отмена
                  </button>
                </div>
                {trips.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Нет поездок для привязки
                  </p>
                ) : (
                  trips.map((trip) => (
                    <button
                      key={trip.id}
                      onClick={() => handleAttach(trip)}
                      className="w-full text-left flex items-center gap-3 px-4 py-3 bg-white border border-slate-200 rounded-2xl active:bg-slate-50"
                    >
                      <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                        <Car size={14} className="text-slate-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {trip.startLocation} → {trip.endLocation}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {trip.distanceKm} км ·{' '}
                          {new Date(trip.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <ChevronRight size={15} className="text-slate-300 shrink-0" />
                    </button>
                  ))
                )}
              </div>
            ) : (
              /* Unlinked state */
              <button
                onClick={() => setPickingTrip(true)}
                className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-50 border border-dashed border-slate-200 rounded-2xl active:bg-slate-100"
              >
                <div className="p-1.5 bg-slate-100 rounded-lg shrink-0">
                  <Car size={15} className="text-slate-400" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-slate-600">Не привязан к поездке</p>
                  <p className="text-xs text-slate-400 mt-0.5">Нажмите, чтобы выбрать поездку</p>
                </div>
                <ChevronRight size={15} className="text-slate-300 shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Receipt photo (graceful fallback on dead blob URL — D-009) ───────────────

function ReceiptPhoto({ imageUrl }: { imageUrl: string }) {
  const [broken, setBroken] = useState(false)

  if (broken) return null

  return (
    <div>
      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Фото чека
      </p>
      <div className="relative">
        <img
          src={imageUrl}
          alt="Фото чека"
          className="w-full rounded-2xl max-h-56 object-cover"
          onError={() => setBroken(true)}
        />
      </div>
    </div>
  )
}
