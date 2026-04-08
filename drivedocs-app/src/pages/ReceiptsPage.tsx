import { useState } from 'react'
import { Receipt, ArrowLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card } from '@/shared/ui/components/Card'
import { ReceiptDetailSheet } from '@/features/receipts/ReceiptDetailSheet'
import { useReceiptsForPeriod, todayISO } from '@/app/store/workspaceStore'
import { buildReceiptAnalytics } from '@/features/receipts/receiptAnalytics'
import { RECEIPT_CATEGORY_LABELS } from '@/entities/constants/labels'
import type { Receipt as ReceiptType, ReceiptCategory } from '@/entities/types/domain'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PERIOD_DAYS = 30

function daysAgoISO(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ReceiptsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()

  const fromDate = daysAgoISO(PERIOD_DAYS - 1)
  const toDate = todayISO()
  const receipts = useReceiptsForPeriod(id, fromDate, toDate)
  const analytics = buildReceiptAnalytics(receipts)

  const [selectedReceipt, setSelectedReceipt] = useState<ReceiptType | null>(null)

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Header */}
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
          <p className="text-sm text-slate-500 mt-0.5">Последние {PERIOD_DAYS} дней</p>
        </div>
      </div>

      {receipts.length === 0 ? (
        /* Empty state */
        <Card className="p-8 flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Receipt size={28} className="text-slate-400" />
          </div>
          <p className="text-sm font-medium text-slate-700">Чеков пока нет</p>
          <p className="text-xs text-slate-400 mt-1">
            Добавьте чек на экране «Сегодня»
          </p>
        </Card>
      ) : (
        <>
          {/* Analytics block */}
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
