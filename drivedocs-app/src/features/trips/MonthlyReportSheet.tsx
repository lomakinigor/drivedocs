import { useState } from 'react'
import { X, Copy, Check, FileText } from 'lucide-react'
import { useWorkspaceTrips, useCurrentWorkspace } from '@/app/store/workspaceStore'
import { buildMonthlyTripReport } from './tripReport'
import type { Trip } from '@/entities/types/domain'

interface MonthlyReportSheetProps {
  workspaceId: string
  onClose: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function currentMonthPrefix(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function currentMonthLabel(): string {
  return new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthlyReportSheet({ workspaceId, onClose }: MonthlyReportSheetProps) {
  const workspace = useCurrentWorkspace()
  const allTrips = useWorkspaceTrips(workspaceId)

  const monthPrefix = currentMonthPrefix()
  const monthLabel = currentMonthLabel()
  const monthTrips = allTrips.filter((t) => t.date.startsWith(monthPrefix))

  const totalKm = monthTrips.reduce((sum, t) => sum + t.distanceKm, 0)
  const totalKmFormatted = totalKm % 1 === 0 ? String(totalKm) : totalKm.toFixed(1)

  const [copied, setCopied] = useState(false)
  const [clipboardFailed, setClipboardFailed] = useState(false)

  const reportText = buildMonthlyTripReport(monthTrips, monthLabel, workspace?.name ?? '')

  const handleCopy = async () => {
    if (monthTrips.length === 0) return
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setClipboardFailed(true)
    }
  }

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
            <div className="p-2 bg-blue-50 rounded-xl">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Отчёт за месяц</h2>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{monthLabel}</p>
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">
          {/* Summary */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Поездок</p>
              <p className="text-sm font-bold text-slate-900">{monthTrips.length}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">Пробег</p>
              <p className="text-sm font-bold text-slate-900">{totalKmFormatted} км</p>
            </div>
          </div>

          {/* Trip list or empty state */}
          {monthTrips.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-slate-500">В этом месяце поездок нет</p>
              <p className="text-xs text-slate-400 mt-1">Добавьте первую поездку на экране «Поездки»</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Маршруты
              </p>
              <div className="space-y-0 divide-y divide-slate-50">
                {monthTrips.map((trip) => (
                  <TripReportRow key={trip.id} trip={trip} />
                ))}
              </div>
            </div>
          )}

          {/* Clipboard fallback */}
          {clipboardFailed && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-medium text-slate-600 mb-2">Скопируйте текст вручную:</p>
              <textarea
                readOnly
                value={reportText}
                rows={8}
                className="w-full text-xs text-slate-700 bg-white border border-slate-200 rounded-xl p-3 resize-none focus:outline-none"
                onFocus={(e) => e.target.select()}
              />
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 shrink-0">
          <button
            onClick={handleCopy}
            disabled={monthTrips.length === 0}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              monthTrips.length === 0
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : copied
                ? 'bg-green-500 text-white'
                : 'bg-blue-600 text-white active:bg-blue-700'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} />
                Скопировано
              </>
            ) : (
              <>
                <Copy size={16} />
                Скопировать отчёт
              </>
            )}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TripReportRow({ trip }: { trip: Trip }) {
  const dateStr = new Date(trip.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
  const from = trip.startLocation.split(',')[0].trim()
  const to = trip.endLocation.split(',')[0].trim()

  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-xs text-slate-400 shrink-0 mt-0.5 w-14">{dateStr}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">
          {from} → {to}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {trip.distanceKm} км · {trip.purpose}
        </p>
      </div>
    </div>
  )
}
