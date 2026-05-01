import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { BarChart2, Car, Receipt, Wallet, TrendingDown, TrendingUp, Minus } from 'lucide-react'
import { Card } from '@/shared/ui/components/Card'
import {
  useWorkspaceTrips,
  useWorkspaceReceipts,
  useVehicleProfile,
  useCurrentWorkspace,
} from '@/app/store/workspaceStore'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Trip, Receipt as ReceiptType, ReceiptCategory } from '@/entities/types/domain'

// ─── Period ───────────────────────────────────────────────────────────────────

type PeriodKey = 'month' | 'quarter' | 'year'

const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

function getPeriodBounds(key: PeriodKey): { from: Date; to: Date; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (key === 'month') {
    const MONTHS = ['январь','февраль','март','апрель','май','июнь','июль','август','сентябрь','октябрь','ноябрь','декабрь']
    return {
      from: new Date(y, m, 1),
      to: new Date(y, m + 1, 0, 23, 59, 59),
      label: `${MONTHS[m]} ${y}`,
    }
  }
  if (key === 'quarter') {
    const q = Math.floor(m / 3)
    return {
      from: new Date(y, q * 3, 1),
      to: new Date(y, q * 3 + 3, 0, 23, 59, 59),
      label: `${q + 1} квартал ${y}`,
    }
  }
  return {
    from: new Date(y, 0, 1),
    to: new Date(y, 11, 31, 23, 59, 59),
    label: `${y} год`,
  }
}

function prevPeriodBounds(key: PeriodKey): { from: Date; to: Date } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (key === 'month') {
    return { from: new Date(y, m - 1, 1), to: new Date(y, m, 0, 23, 59, 59) }
  }
  if (key === 'quarter') {
    const q = Math.floor(m / 3)
    return { from: new Date(y, (q - 1) * 3, 1), to: new Date(y, q * 3, 0, 23, 59, 59) }
  }
  return { from: new Date(y - 1, 0, 1), to: new Date(y - 1, 11, 31, 23, 59, 59) }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function filterByPeriod<T extends { date: string }>(items: T[], from: Date, to: Date): T[] {
  return items.filter((i) => {
    const d = new Date(i.date)
    return d >= from && d <= to
  })
}

function sumKm(trips: Trip[]): number {
  return trips.reduce((acc, t) => acc + (t.distanceKm ?? 0), 0)
}

function sumAmount(receipts: ReceiptType[]): number {
  return receipts.reduce((acc, r) => acc + r.amount, 0)
}

function trendPct(curr: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((curr - prev) / prev) * 100)
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AnalyticsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()

  const [period, setPeriod] = useState<PeriodKey>('month')

  const allTrips = useWorkspaceTrips(id)
  const allReceipts = useWorkspaceReceipts(id)
  const vehicle = useVehicleProfile(id)
  const workspace = useCurrentWorkspace()

  const { from, to, label } = useMemo(() => getPeriodBounds(period), [period])
  const { from: pFrom, to: pTo } = useMemo(() => prevPeriodBounds(period), [period])

  const trips = useMemo(() => filterByPeriod(allTrips, from, to), [allTrips, from, to])
  const receipts = useMemo(() => filterByPeriod(allReceipts, from, to), [allReceipts, from, to])
  const prevTrips = useMemo(() => filterByPeriod(allTrips, pFrom, pTo), [allTrips, pFrom, pTo])
  const prevReceipts = useMemo(() => filterByPeriod(allReceipts, pFrom, pTo), [allReceipts, pFrom, pTo])

  const totalKm = sumKm(trips)
  const prevKm = sumKm(prevTrips)
  const totalExpenses = sumAmount(receipts)
  const prevExpenses = sumAmount(prevReceipts)

  const avgTripKm = trips.length > 0 ? Math.round(totalKm / trips.length) : 0

  // Compensation estimate (Постановление Правительства № 92)
  const engineCc = vehicle?.engineVolume ?? 0
  const pp92Rate = engineCc > 0 && engineCc <= 2000 ? 1200 : engineCc > 2000 ? 1500 : null
  const showCompensation = workspace?.vehicleUsageModel === 'compensation' && pp92Rate !== null

  // Receipts by category
  const byCategory = useMemo(() => {
    const acc: Record<ReceiptCategory, number> = { fuel: 0, parking: 0, repair: 0, wash: 0, other: 0 }
    for (const r of receipts) acc[r.category] += r.amount
    return acc
  }, [receipts])

  const categoryEntries = (Object.entries(byCategory) as [ReceiptCategory, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)

  const hasData = trips.length > 0 || receipts.length > 0

  return (
    <div className="px-4 py-5 space-y-5 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900">Аналитика</h1>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map(({ value, label: lbl }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
              period === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {!hasData ? (
        <Card className="p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <BarChart2 size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">Данных за этот период нет</p>
          <p className="text-xs text-slate-400 mt-1">
            Добавьте поездки и чеки — здесь появится сводка
          </p>
        </Card>
      ) : (
        <>
          {/* Trips card */}
          <StatCard
            icon={<Car size={18} className="text-blue-600" />}
            iconBg="bg-blue-50"
            title="Поездки"
            items={[
              { label: 'Всего поездок', value: String(trips.length) },
              { label: 'Пробег', value: `${totalKm.toLocaleString('ru-RU')} км` },
              ...(avgTripKm > 0 ? [{ label: 'Средняя поездка', value: `${avgTripKm} км` }] : []),
            ]}
            trend={trendPct(totalKm, prevKm)}
            trendLabel="км"
            onDetails={() => navigate(`/w/${id}/trips`)}
          />

          {/* Expenses card */}
          <StatCard
            icon={<Receipt size={18} className="text-green-600" />}
            iconBg="bg-green-50"
            title="Расходы"
            items={[
              { label: 'Итого', value: `${totalExpenses.toLocaleString('ru-RU')} ₽` },
              { label: 'Чеков', value: String(receipts.length) },
            ]}
            trend={trendPct(totalExpenses, prevExpenses)}
            trendLabel="расходов"
            onDetails={() => navigate(`/w/${id}/receipts`)}
          >
            {categoryEntries.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100 space-y-2.5">
                {categoryEntries.map(([cat, amount]) => (
                  <CategoryRow
                    key={cat}
                    label={RECEIPT_CATEGORY_LABELS[cat]}
                    amount={amount}
                    total={totalExpenses}
                  />
                ))}
              </div>
            )}
          </StatCard>

          {/* Compensation estimate */}
          {showCompensation && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl shrink-0">
                  <Wallet size={18} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Компенсация</p>
                  <p className="text-xs text-slate-400">По нормам ПП РФ № 92</p>
                </div>
              </div>
              <div className="bg-amber-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Норматив</span>
                  <span className="text-sm font-semibold text-slate-800">{pp92Rate!.toLocaleString('ru-RU')} ₽/мес</span>
                </div>
                {vehicle?.fuelConsumptionPer100km && totalKm > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Расход топлива</span>
                    <span className="text-sm font-semibold text-slate-800">
                      {((vehicle.fuelConsumptionPer100km / 100) * totalKm).toFixed(1)} л
                    </span>
                  </div>
                )}
                <p className="text-xs text-slate-400 pt-1 leading-snug">
                  Точный расчёт — в разделе «Документы» → Расчёт компенсации
                </p>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  iconBg,
  title,
  items,
  trend,
  trendLabel,
  onDetails,
  children,
}: {
  icon: React.ReactNode
  iconBg: string
  title: string
  items: { label: string; value: string }[]
  trend: number | null
  trendLabel: string
  onDetails: () => void
  children?: React.ReactNode
}) {
  return (
    <Card className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 ${iconBg} rounded-xl shrink-0`}>{icon}</div>
          <p className="text-sm font-semibold text-slate-900">{title}</p>
        </div>
        <button
          onClick={onDetails}
          className="text-xs text-blue-600 font-medium active:opacity-70"
        >
          Подробнее
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <div key={item.label} className="bg-slate-50 rounded-xl p-3">
            <p className="text-xs text-slate-500 mb-0.5">{item.label}</p>
            <p className="text-base font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      {trend !== null && <TrendRow pct={trend} label={trendLabel} />}

      {children}
    </Card>
  )
}

// ─── TrendRow ─────────────────────────────────────────────────────────────────

function TrendRow({ pct, label }: { pct: number; label: string }) {
  const isUp = pct > 0
  const isFlat = pct === 0
  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${isFlat ? 'bg-slate-50' : isUp ? 'bg-red-50' : 'bg-green-50'}`}>
      {isFlat
        ? <Minus size={14} className="text-slate-400 shrink-0" />
        : isUp
        ? <TrendingUp size={14} className="text-red-500 shrink-0" />
        : <TrendingDown size={14} className="text-green-600 shrink-0" />}
      <p className={`text-xs font-medium ${isFlat ? 'text-slate-500' : isUp ? 'text-red-600' : 'text-green-700'}`}>
        {isFlat
          ? `${label} на уровне прошлого периода`
          : isUp
          ? `+${pct}% ${label} к прошлому периоду`
          : `${pct}% ${label} к прошлому периоду`}
      </p>
    </div>
  )
}

// ─── CategoryRow ──────────────────────────────────────────────────────────────

function CategoryRow({ label, amount, total }: { label: string; amount: number; total: number }) {
  const pct = total > 0 ? Math.round((amount / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between">
        <span className="text-sm text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{pct}%</span>
          <span className="text-sm font-semibold text-slate-800">{amount.toLocaleString('ru-RU')} ₽</span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}
