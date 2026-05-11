import { useState } from 'react'
import { Receipt, ArrowLeft, Lock, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { ReceiptDetailSheet } from '@/features/receipts/ReceiptDetailSheet'
import { useReceiptsForPeriod, useIsProWorkspace, todayISO } from '@/app/store/workspaceStore'
import { buildReceiptAnalytics, buildEnhancedAnalytics } from '@/features/receipts/receiptAnalytics'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Receipt as ReceiptType, ReceiptCategory } from '@/entities/types/domain'

// ─── Period selector ──────────────────────────────────────────────────────────

type PeriodDays = 7 | 30 | 90

const PERIODS: { value: PeriodDays; label: string }[] = [
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
]

const DEFAULT_PERIOD: PeriodDays = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── Component ────────────────────────────────────────────────────────────────

interface ReceiptsPageProps {
  /** When true, hides the page header (back-button + title) so the component
   * can be embedded inside TripsPage as «Чеки» режим (T-133). */
  embedded?: boolean
}

export function ReceiptsPage({ embedded = false }: ReceiptsPageProps = {}) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()

  const [period, setPeriod] = useState<PeriodDays>(DEFAULT_PERIOD)
  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null)

  const isPro = useIsProWorkspace(id)

  const toDate = todayISO()
  const fromDate = daysAgoISO(period - 1)
  const prevToDate = daysAgoISO(period)
  const prevFromDate = daysAgoISO(period * 2 - 1)

  const receipts = useReceiptsForPeriod(id, fromDate, toDate)
  const prevReceipts = useReceiptsForPeriod(id, prevFromDate, prevToDate)

  const analytics = buildReceiptAnalytics(receipts)
  const enhanced = buildEnhancedAnalytics(receipts, prevReceipts)

  return (
    <div className={embedded ? 'space-y-5' : 'px-4 py-5 space-y-5'}>
      {/* Header — скрыт в embedded-режиме (TripsPage показывает свой) */}
      {!embedded && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="Назад"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-900">История чеков</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {receipts.length > 0
                ? `${receipts.length} за ${period} дн.`
                : `За последние ${period} дней`}
            </p>
          </div>
        </div>
      )}

      {/* Period selector */}
      <div className="flex gap-2">
        {PERIODS.map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setPeriod(value)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${
              period === value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-slate-200 bg-white text-slate-600 active:bg-slate-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {receipts.length === 0 ? (
        /* Empty state */
        <Card className="p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Receipt size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">Чеков за этот период нет</p>
          <p className="text-xs text-slate-400 mt-1">
            Добавьте чек на экране «Сегодня» или выберите другой период
          </p>
        </Card>
      ) : (
        <>
          {/* Basic analytics block (Free + Pro) */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Итого за период
              </p>
              <p className="text-base font-bold text-slate-900">
                {analytics.total.toLocaleString('ru-RU')} ₽
              </p>
            </div>
            {Object.keys(analytics.byCategory).some(
              (k) => analytics.byCategory[k as ReceiptCategory] > 0,
            ) && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                {(Object.entries(analytics.byCategory) as [ReceiptCategory, number][])
                  .filter(([, amount]) => amount > 0)
                  .sort(([, a], [, b]) => b - a)
                  .map(([cat, amount]) => (
                    <div key={cat} className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">
                        {RECEIPT_CATEGORY_LABELS[cat]}
                      </p>
                      <p className="text-sm font-medium text-slate-800">
                        {amount.toLocaleString('ru-RU')} ₽
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </Card>

          {/* Pro analytics block */}
          {isPro ? (
            <ProAnalyticsBlock enhanced={enhanced} period={period} />
          ) : (
            <AnalyticsPaywall onUpgrade={() => navigate(`/w/${id}/settings?upgrade=1`)} />
          )}

          {/* Receipt list */}
          <section>
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
              Все чеки
            </h2>
            <div className="space-y-2">
              {receipts.map((receipt) => (
                <button
                  key={receipt.id}
                  onClick={() => setSelectedReceipt(receipt)}
                  className="w-full text-left"
                >
                  <Card className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-green-50 rounded-xl shrink-0">
                        <Receipt size={16} className="text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {receipt.amount.toLocaleString('ru-RU')} ₽
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {RECEIPT_CATEGORY_LABELS[receipt.category]} ·{' '}
                          {new Date(receipt.date).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-medium shrink-0 ${
                          receipt.tripId ? 'text-blue-500' : 'text-slate-400'
                        }`}
                      >
                        {receipt.tripId ? 'К поездке' : 'Не привязан'}
                      </span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>
          </section>
        </>
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

// ─── Pro analytics block ──────────────────────────────────────────────────────

import type { EnhancedAnalytics } from '@/features/receipts/receiptAnalytics'

function ProAnalyticsBlock({
  enhanced,
  period,
}: {
  enhanced: EnhancedAnalytics
  period: number
}) {
  return (
    <Card className="p-4 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Аналитика Pro
        </p>
        <span className="text-[10px] font-semibold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
          PRO
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Средний чек</p>
          <p className="text-base font-bold text-slate-900">
            {enhanced.average.toLocaleString('ru-RU')} ₽
          </p>
        </div>
        <div className="bg-slate-50 rounded-xl p-3">
          <p className="text-xs text-slate-500 mb-1">Всего чеков</p>
          <p className="text-base font-bold text-slate-900">{enhanced.count}</p>
        </div>
      </div>

      {/* Trend */}
      {enhanced.trendPct !== null && (
        <TrendBadge trendPct={enhanced.trendPct} period={period} />
      )}

      {/* Category bars */}
      {enhanced.categories.length > 0 && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            По категориям
          </p>
          {enhanced.categories.map((stat) => (
            <CategoryBar key={stat.category} stat={stat} />
          ))}
        </div>
      )}
    </Card>
  )
}

function TrendBadge({ trendPct, period }: { trendPct: number; period: number }) {
  const isUp = trendPct > 0
  const isFlat = trendPct === 0

  return (
    <div
      className={`flex items-center gap-2 rounded-xl px-3 py-2.5 ${
        isFlat
          ? 'bg-slate-50'
          : isUp
            ? 'bg-red-50'
            : 'bg-green-50'
      }`}
    >
      {isFlat ? (
        <Minus size={15} className="text-slate-400 shrink-0" />
      ) : isUp ? (
        <TrendingUp size={15} className="text-red-500 shrink-0" />
      ) : (
        <TrendingDown size={15} className="text-green-600 shrink-0" />
      )}
      <p
        className={`text-sm font-medium ${
          isFlat ? 'text-slate-500' : isUp ? 'text-red-600' : 'text-green-700'
        }`}
      >
        {isFlat
          ? 'Расходы на уровне прошлого периода'
          : isUp
            ? `На ${trendPct}% больше расходов, чем ${period} дней назад`
            : `На ${Math.abs(trendPct)}% меньше расходов, чем ${period} дней назад`}
      </p>
    </div>
  )
}

function CategoryBar({ stat }: { stat: { category: ReceiptCategory; amount: number; count: number; pct: number } }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-700">{RECEIPT_CATEGORY_LABELS[stat.category]}</span>
          <span className="text-xs text-slate-400">{stat.count} шт.</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{stat.pct}%</span>
          <span className="text-sm font-semibold text-slate-800">
            {stat.amount.toLocaleString('ru-RU')} ₽
          </span>
        </div>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full"
          style={{ width: `${stat.pct}%` }}
        />
      </div>
    </div>
  )
}

// ─── Analytics paywall ────────────────────────────────────────────────────────

function AnalyticsPaywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
          <Lock size={15} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">
            Детальная аналитика — тариф Pro
          </p>
          <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
            Прогресс по категориям, средний чек и сравнение с предыдущим периодом.
          </p>
        </div>
      </div>

      {/* Blurred preview */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="blur-sm pointer-events-none select-none p-3 bg-white space-y-2">
          {['Топливо', 'Парковка', 'Ремонт'].map((label) => (
            <div key={label} className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-slate-700">{label}</span>
                <span className="text-sm font-semibold text-slate-800">— ₽</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full">
                <div className="h-full bg-indigo-400 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-indigo-50/60" />
      </div>

      <button
        onClick={onUpgrade}
        className="w-full py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white active:bg-indigo-700 transition-colors"
      >
        Перейти на Pro
      </button>
    </div>
  )
}
