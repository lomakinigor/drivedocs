import { useState, useMemo } from 'react'
import { X, Copy, Check, FileText, Printer } from 'lucide-react'
import {
  useWorkspaceTrips,
  useWorkspaceReceipts,
  useVehicleProfile,
  useCurrentWorkspace,
} from '@/app/store/workspaceStore'
import { openPrintWindow } from '@/features/documents/templates/printUtils'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Trip, Receipt, ReceiptCategory } from '@/entities/types/domain'

// ─── Period ───────────────────────────────────────────────────────────────────

type PeriodKey = 'month' | 'quarter' | 'year'

const PERIODS: { value: PeriodKey; label: string }[] = [
  { value: 'month', label: 'Месяц' },
  { value: 'quarter', label: 'Квартал' },
  { value: 'year', label: 'Год' },
]

const MONTH_NAMES = [
  'январь','февраль','март','апрель','май','июнь',
  'июль','август','сентябрь','октябрь','ноябрь','декабрь',
]

function getPeriodBounds(key: PeriodKey): { from: Date; to: Date; label: string } {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  if (key === 'month') {
    return {
      from: new Date(y, m, 1),
      to: new Date(y, m + 1, 0, 23, 59, 59),
      label: `${MONTH_NAMES[m]} ${y}`,
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

function filterByPeriod<T extends { date: string }>(items: T[], from: Date, to: Date): T[] {
  return items.filter((i) => {
    const d = new Date(i.date)
    return d >= from && d <= to
  })
}

// ─── PP92 compensation rate ───────────────────────────────────────────────────

function pp92Rate(engineCc: number | undefined): number | null {
  if (!engineCc || engineCc === 0) return null
  return engineCc <= 2000 ? 1200 : 1500
}

// ─── PDF generation ───────────────────────────────────────────────────────────

function buildReportHtml(
  orgName: string,
  periodLabel: string,
  trips: Trip[],
  receipts: Receipt[],
  byCategory: Record<ReceiptCategory, number>,
  totalExpenses: number,
  compensation: { rate: number; fuelLitres?: number } | null,
): string {
  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0)

  const tripRows = trips
    .map((t) => {
      const date = new Date(t.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
      return `<tr>
        <td class="doc-td doc-td-center">${date}</td>
        <td class="doc-td">${t.startLocation}</td>
        <td class="doc-td">${t.endLocation}</td>
        <td class="doc-td doc-td-center">${t.distanceKm}</td>
        <td class="doc-td">${t.purpose}</td>
      </tr>`
    })
    .join('')

  const catRows = (Object.entries(byCategory) as [ReceiptCategory, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, amount]) => `<tr>
      <td class="doc-td">${RECEIPT_CATEGORY_LABELS[cat]}</td>
      <td class="doc-td doc-td-center">${amount.toLocaleString('ru-RU')} ₽</td>
    </tr>`)
    .join('')

  const compensationBlock = compensation
    ? `<br>
      <p class="doc-section">3. Компенсация за использование личного автомобиля</p>
      <table class="doc-table">
        <tr><th class="doc-th" style="width:60%">Параметр</th><th class="doc-th">Значение</th></tr>
        <tr><td class="doc-td">Норматив ПП РФ № 92</td><td class="doc-td doc-td-center">${compensation.rate.toLocaleString('ru-RU')} ₽/мес</td></tr>
        ${compensation.fuelLitres !== undefined ? `<tr><td class="doc-td">Расход топлива</td><td class="doc-td doc-td-center">${compensation.fuelLitres.toFixed(1)} л</td></tr>` : ''}
      </table>`
    : ''

  return `<div class="doc-body">
    <p class="doc-org-header">${orgName}</p>
    <p class="doc-title doc-center">СВОДНЫЙ ОТЧЁТ ЗА ПЕРИОД</p>
    <p class="doc-meta">${periodLabel}</p>

    <p class="doc-section">1. Служебные поездки</p>
    <table class="doc-table">
      <tr>
        <th class="doc-th" style="width:12%">Дата</th>
        <th class="doc-th" style="width:24%">Откуда</th>
        <th class="doc-th" style="width:24%">Куда</th>
        <th class="doc-th" style="width:8%">Км</th>
        <th class="doc-th">Цель</th>
      </tr>
      ${tripRows || '<tr><td class="doc-td" colspan="5" style="text-align:center">Поездок нет</td></tr>'}
      <tr class="doc-tr-total">
        <td class="doc-td doc-td-center" colspan="3">Итого</td>
        <td class="doc-td doc-td-center">${totalKm.toLocaleString('ru-RU')}</td>
        <td class="doc-td"></td>
      </tr>
    </table>

    <br>
    <p class="doc-section">2. Расходы</p>
    <table class="doc-table">
      <tr>
        <th class="doc-th" style="width:60%">Категория</th>
        <th class="doc-th">Сумма</th>
      </tr>
      ${catRows || '<tr><td class="doc-td" colspan="2" style="text-align:center">Расходов нет</td></tr>'}
      <tr class="doc-tr-total">
        <td class="doc-td">Итого расходов</td>
        <td class="doc-td doc-td-center">${totalExpenses.toLocaleString('ru-RU')} ₽</td>
      </tr>
    </table>

    ${compensationBlock}

    <div class="doc-sign-block">
      <div class="doc-sign-row">
        <div class="doc-sign-col">
          <p class="doc-small">Составил</p>
          <div class="doc-sign-line">______________________</div>
          <p class="doc-sign-date">«___» ____________ ${new Date().getFullYear()} г.</p>
        </div>
        <div class="doc-sign-col">
          <p class="doc-small">Проверил</p>
          <div class="doc-sign-line">______________________</div>
          <p class="doc-sign-date">«___» ____________ ${new Date().getFullYear()} г.</p>
        </div>
      </div>
    </div>
  </div>`
}

// ─── Text report ──────────────────────────────────────────────────────────────

function buildTextReport(
  orgName: string,
  periodLabel: string,
  trips: Trip[],
  receipts: Receipt[],
  byCategory: Record<ReceiptCategory, number>,
  totalExpenses: number,
  compensation: { rate: number } | null,
): string {
  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0)

  const lines: string[] = [
    `Сводный отчёт — ${orgName}`,
    `Период: ${periodLabel}`,
    '',
    `1. Поездки`,
    `   Количество: ${trips.length}`,
    `   Пробег: ${totalKm.toLocaleString('ru-RU')} км`,
  ]

  if (trips.length > 0) {
    lines.push('')
    for (const t of trips) {
      const d = new Date(t.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
      lines.push(`   ${d}  ${t.startLocation} → ${t.endLocation}  ${t.distanceKm} км`)
    }
  }

  lines.push('', '2. Расходы', `   Итого: ${totalExpenses.toLocaleString('ru-RU')} ₽`)
  const cats = (Object.entries(byCategory) as [ReceiptCategory, number][]).filter(([, v]) => v > 0)
  for (const [cat, amount] of cats) {
    lines.push(`   ${RECEIPT_CATEGORY_LABELS[cat]}: ${amount.toLocaleString('ru-RU')} ₽`)
  }

  if (compensation) {
    lines.push('', '3. Компенсация', `   Норматив ПП РФ № 92: ${compensation.rate.toLocaleString('ru-RU')} ₽/мес`)
  }

  return lines.join('\n')
}

// ─── Component ────────────────────────────────────────────────────────────────

interface MonthlyReportSheetProps {
  workspaceId: string
  onClose: () => void
}

export function MonthlyReportSheet({ workspaceId, onClose }: MonthlyReportSheetProps) {
  const workspace = useCurrentWorkspace()
  const allTrips = useWorkspaceTrips(workspaceId)
  const allReceipts = useWorkspaceReceipts(workspaceId)
  const vehicle = useVehicleProfile(workspaceId)

  const [period, setPeriod] = useState<PeriodKey>('month')
  const [copied, setCopied] = useState(false)
  const [clipboardFailed, setClipboardFailed] = useState(false)

  const { from, to, label: periodLabel } = useMemo(() => getPeriodBounds(period), [period])

  const trips = useMemo(() => filterByPeriod(allTrips, from, to), [allTrips, from, to])
  const receipts = useMemo(() => filterByPeriod(allReceipts, from, to), [allReceipts, from, to])

  const totalKm = trips.reduce((s, t) => s + t.distanceKm, 0)
  const totalExpenses = receipts.reduce((s, r) => s + r.amount, 0)

  const byCategory = useMemo(() => {
    const acc: Record<ReceiptCategory, number> = { fuel: 0, parking: 0, repair: 0, wash: 0, other: 0 }
    for (const r of receipts) acc[r.category] += r.amount
    return acc
  }, [receipts])

  const orgName = workspace?.name ?? ''
  const showCompensation = workspace?.vehicleUsageModel === 'compensation'
  const rate = pp92Rate(vehicle?.engineVolume)
  const fuelLitres =
    vehicle?.fuelConsumptionPer100km && totalKm > 0
      ? (vehicle.fuelConsumptionPer100km / 100) * totalKm
      : undefined

  const compensation =
    showCompensation && rate !== null
      ? { rate, fuelLitres }
      : null

  const handlePrintPdf = () => {
    const html = buildReportHtml(orgName, periodLabel, trips, receipts, byCategory, totalExpenses, compensation)
    openPrintWindow(html, `Отчёт ${periodLabel} — ${orgName}`)
  }

  const reportText = buildTextReport(orgName, periodLabel, trips, receipts, byCategory, totalExpenses, compensation)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setClipboardFailed(true)
    }
  }

  const hasData = trips.length > 0 || receipts.length > 0

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 rounded-xl shrink-0">
              <FileText size={18} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Сводный отчёт</h2>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100">
            <X size={20} />
          </button>
        </div>

        {/* Period selector */}
        <div className="flex gap-2 px-5 pb-3 shrink-0">
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">

          {/* Summary bar */}
          <div className="grid grid-cols-3 gap-2">
            <SummaryCell label="Поездок" value={String(trips.length)} />
            <SummaryCell label="Пробег" value={`${totalKm.toLocaleString('ru-RU')} км`} />
            <SummaryCell label="Расходы" value={`${totalExpenses.toLocaleString('ru-RU')} ₽`} />
          </div>

          {!hasData ? (
            <div className="py-8 text-center">
              <p className="text-sm text-slate-500">Данных за этот период нет</p>
              <p className="text-xs text-slate-400 mt-1">Добавьте поездки и чеки</p>
            </div>
          ) : (
            <>
              {/* Trips */}
              {trips.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Поездки
                  </p>
                  <div className="divide-y divide-slate-50">
                    {trips.map((trip) => <TripRow key={trip.id} trip={trip} />)}
                  </div>
                </section>
              )}

              {/* Expenses */}
              {receipts.length > 0 && (
                <section>
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Расходы по категориям
                  </p>
                  <div className="space-y-2.5">
                    {(Object.entries(byCategory) as [ReceiptCategory, number][])
                      .filter(([, v]) => v > 0)
                      .sort(([, a], [, b]) => b - a)
                      .map(([cat, amount]) => (
                        <CategoryRow
                          key={cat}
                          label={RECEIPT_CATEGORY_LABELS[cat]}
                          amount={amount}
                          total={totalExpenses}
                        />
                      ))}
                  </div>
                </section>
              )}

              {/* Compensation */}
              {compensation && (
                <section className="bg-amber-50 rounded-2xl p-3.5 space-y-1.5">
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">
                    Компенсация (ПП РФ № 92)
                  </p>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-600">Норматив</span>
                    <span className="text-sm font-semibold">{compensation.rate.toLocaleString('ru-RU')} ₽/мес</span>
                  </div>
                  {compensation.fuelLitres !== undefined && (
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Расход топлива</span>
                      <span className="text-sm font-semibold">{compensation.fuelLitres.toFixed(1)} л</span>
                    </div>
                  )}
                </section>
              )}
            </>
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

        {/* Footer */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 shrink-0 space-y-2">
          <button
            onClick={handlePrintPdf}
            disabled={!hasData}
            className={`w-full py-3.5 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
              hasData
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Printer size={16} />
            Распечатать PDF
          </button>
          <button
            onClick={handleCopy}
            disabled={!hasData}
            className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors border ${
              !hasData
                ? 'border-slate-200 text-slate-400'
                : copied
                ? 'border-green-300 text-green-600'
                : 'border-slate-200 text-slate-600 active:bg-slate-50'
            }`}
          >
            {copied ? <><Check size={15} />Скопировано</> : <><Copy size={15} />Копировать текст</>}
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SummaryCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-xl p-3">
      <p className="text-xs text-slate-500 mb-0.5">{label}</p>
      <p className="text-sm font-bold text-slate-900 leading-tight">{value}</p>
    </div>
  )
}

function TripRow({ trip }: { trip: Trip }) {
  const date = new Date(trip.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
  const from = trip.startLocation.split(',')[0].trim()
  const to = trip.endLocation.split(',')[0].trim()
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-xs text-slate-400 shrink-0 mt-0.5 w-14">{date}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">{from} → {to}</p>
        <p className="text-xs text-slate-400 mt-0.5">{trip.distanceKm} км · {trip.purpose}</p>
      </div>
    </div>
  )
}

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
