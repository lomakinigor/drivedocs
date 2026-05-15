import { useState, useMemo, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Download, Calendar, FileText } from 'lucide-react'
import { useWorkspaceTrips, useWorkspaceReceipts } from '@/app/store/workspaceStore'
import { MonthlyReportSheet } from '@/features/trips/MonthlyReportSheet'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import type { Trip, Receipt } from '@/entities/types/domain'

// T-136 · T-137 · F-022 · D-024
// Reports — «бухгалтерский» экран. Готовый месячный close + выгрузка через MonthlyReportSheet.
// Аналитика с трендами/PP-92 остаётся внутри MonthlyReportSheet (period=month|quarter|year).

const MONTHS_RU = [
  'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
  'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
]

const MONTHS_RU_CAP = MONTHS_RU.map((m) => m[0].toUpperCase() + m.slice(1))

function monthBounds(year: number, month: number): { from: Date; to: Date } {
  return {
    from: new Date(year, month, 1),
    to: new Date(year, month + 1, 0, 23, 59, 59),
  }
}

function aggregate<T extends { date: string }>(items: T[], from: Date, to: Date): T[] {
  return items.filter((i) => {
    const d = new Date(i.date)
    return d >= from && d <= to
  })
}

function sumKm(trips: Trip[]): number {
  return trips.reduce((s, t) => s + (t.distanceKm ?? 0), 0)
}

function sumAmount(receipts: Receipt[]): number {
  return receipts.reduce((s, r) => s + r.amount, 0)
}

export function ReportsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const allTrips = useWorkspaceTrips(id)
  const allReceipts = useWorkspaceReceipts(id)

  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => { recordMetric('view.reports') }, [])

  const now = new Date()
  const currYear = now.getFullYear()
  const currMonth = now.getMonth()
  const prevYear = currMonth === 0 ? currYear - 1 : currYear
  const prevMonth = currMonth === 0 ? 11 : currMonth - 1

  const primary = useMemo(() => {
    const { from, to } = monthBounds(prevYear, prevMonth)
    const trips = aggregate(allTrips, from, to)
    const receipts = aggregate(allReceipts, from, to)
    return {
      label: `${MONTHS_RU_CAP[prevMonth]} ${prevYear}`,
      tripsCount: trips.length,
      km: sumKm(trips),
      expenses: sumAmount(receipts),
    }
  }, [allTrips, allReceipts, prevYear, prevMonth])

  const current = useMemo(() => {
    const { from, to } = monthBounds(currYear, currMonth)
    const trips = aggregate(allTrips, from, to)
    const receipts = aggregate(allReceipts, from, to)
    return {
      label: MONTHS_RU_CAP[currMonth],
      tripsCount: trips.length,
      km: sumKm(trips),
      expenses: sumAmount(receipts),
    }
  }, [allTrips, allReceipts, currYear, currMonth])

  const archive = useMemo(() => {
    const result: { key: string; label: string }[] = []
    for (let i = 2; i <= 4; i++) {
      const m = ((currMonth - i) % 12 + 12) % 12
      const y = currMonth - i < 0 ? currYear - 1 : currYear
      result.push({ key: `${y}-${m}`, label: `${MONTHS_RU_CAP[m]} ${y}` })
    }
    return result
  }, [currYear, currMonth])

  return (
    <div className="px-4 py-5 space-y-4 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900" style={{ fontFamily: 'Sora, system-ui, sans-serif' }}>
          Отчёты
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">Готовы к отправке в бухгалтерию</p>
      </div>

      {/* Primary report card — last completed month */}
      <div
        className="rounded-3xl p-5 text-white"
        style={{
          background: 'linear-gradient(135deg, oklch(52% 0.225 285) 0%, oklch(46% 0.235 285) 100%)',
          boxShadow: '0 8px 24px oklch(52% 0.225 285 / 0.32)',
        }}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <div
              className="text-[11px] font-semibold uppercase tracking-wider opacity-80"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Главный отчёт
            </div>
            <div
              className="text-[22px] font-bold mt-0.5"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              {primary.label}
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white/20">
            {primary.tripsCount > 0 ? 'Готов' : 'Пусто'}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-5">
          <Metric value={String(primary.tripsCount)} label="поездки" />
          <Metric value={primary.km.toLocaleString('ru-RU')} unit="км" label="пробег" />
          <Metric value={primary.expenses.toLocaleString('ru-RU')} unit="₽" label="расходы" />
        </div>

        <button
          onClick={() => setSheetOpen(true)}
          className="w-full py-3.5 rounded-2xl bg-white font-semibold text-sm flex items-center justify-center gap-2.5 active:opacity-90 transition-opacity"
          style={{ color: 'oklch(52% 0.225 285)', fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          <Download size={16} strokeWidth={2.2} />
          Выгрузить в бухгалтерию
        </button>
      </div>

      {/* Current month — work in progress */}
      <button
        onClick={() => setSheetOpen(true)}
        className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)] active:bg-slate-50 transition-colors text-left"
      >
        <div
          className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: 'oklch(94% 0.044 285)' }}
        >
          <Calendar size={20} style={{ color: 'oklch(52% 0.225 285)' }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-slate-900" style={{ fontFamily: 'Sora, system-ui, sans-serif' }}>
            {current.label} · текущий
          </div>
          <div className="text-xs text-slate-500 mt-0.5">
            {current.tripsCount > 0
              ? `${current.tripsCount} поездок · ${current.km} км · ${current.expenses.toLocaleString('ru-RU')} ₽`
              : 'Поездок пока нет'}
          </div>
        </div>
        <span className="text-slate-300 text-xl leading-none">›</span>
      </button>

      {/* Archive chips */}
      <div className="pt-2">
        <div
          className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Архив
        </div>
        <div className="flex gap-2 flex-wrap">
          {archive.map((m) => (
            <button
              key={m.key}
              onClick={() => setSheetOpen(true)}
              className="px-3.5 py-2 rounded-full text-xs font-semibold active:opacity-80"
              style={{
                background: 'oklch(94% 0.044 285)',
                color: 'oklch(52% 0.225 285)',
                fontFamily: 'Sora, system-ui, sans-serif',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Empty hint when no data at all */}
      {primary.tripsCount === 0 && current.tripsCount === 0 && (
        <div className="bg-slate-50 rounded-2xl p-4 flex gap-3 items-start mt-2">
          <FileText size={18} className="text-slate-500 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Добавьте поездки и чеки — здесь появится готовый месячный отчёт для бухгалтерии.
          </p>
        </div>
      )}

      {sheetOpen && (
        <MonthlyReportSheet workspaceId={id} onClose={() => setSheetOpen(false)} />
      )}
    </div>
  )
}

function Metric({ value, unit, label }: { value: string; unit?: string; label: string }) {
  return (
    <div>
      <div
        className="text-[22px] font-bold leading-none"
        style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {value}
        {unit && <span className="text-xs font-medium opacity-70 ml-1">{unit}</span>}
      </div>
      <div className="text-[11px] opacity-80 mt-1">{label}</div>
    </div>
  )
}
