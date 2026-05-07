import { useState } from 'react'
import { ArrowRight, FileText, AlertTriangle, Receipt, Car, Plus, Settings, TrendingUp, Wallet } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Badge } from '@/shared/ui/components/Badge'
import { Card } from '@/shared/ui/components/Card'
import { TripCard } from '@/features/trips/TripCard'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { DocumentDetailSheet } from '@/features/documents/DocumentDetailSheet'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import { useCurrentWorkspace } from '@/app/store/workspaceStore'
import { useHomeData } from '@/features/home/useHomeData'
import { TAX_MODE_LABELS, VEHICLE_USAGE_MODEL_LABELS } from '@/entities/constants/labels'
import type { MonthlyStats, AttentionItem } from '@/features/home/useHomeData'
import type { Trip, WorkspaceDocument, VehicleUsageModel } from '@/entities/types/domain'

export function HomePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const workspace = useCurrentWorkspace()
  const data = useHomeData(id)
  const navigate = useNavigate()
  const openQuickTrip = useOpenQuickTrip()
  const [selectedDoc, setSelectedDoc] = useState<WorkspaceDocument | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)

  if (!workspace) return null

  const handleAttentionItemTap = (item: AttentionItem) => {
    if (item.kind === 'document' && item.document) {
      setSelectedDoc(item.document)
    } else if (item.kind === 'receipt') {
      navigate(`/w/${id}/receipts`)
    } else if (item.kind === 'expiry') {
      navigate(`/w/${id}/settings`)
    } else {
      navigate(`/w/${id}/events`)
    }
  }

  if (!data.isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 text-center py-16">
        <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <Settings size={28} className="text-slate-400" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-2">Настройка не завершена</h2>
        <p className="text-sm text-slate-500 mb-6 max-w-xs leading-relaxed">
          Укажите налоговый режим и правовую модель, чтобы приложение смогло настроить
          документы и подсказки.
        </p>
        <button
          onClick={() => navigate('/onboarding')}
          className="bg-blue-600 text-white text-sm font-semibold px-6 py-3 rounded-2xl active:bg-blue-700"
        >
          Завершить настройку
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-5 space-y-5">
      {/* Config strip */}
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="blue">{TAX_MODE_LABELS[workspace.taxMode]}</Badge>
        <Badge variant="slate">{VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}</Badge>
      </div>

      {/* Today CTA */}
      {!data.hasTodayTrips && (
        <TodayCta onAdd={openQuickTrip} />
      )}

      {/* Monthly stats */}
      <MonthlyStatsSection stats={data.monthlyStats} />

      {/* Tax benefit banner */}
      <TaxBenefitBanner
        monthlyExpenseTotal={data.monthlyExpenseTotal}
        vehicleUsageModel={workspace.vehicleUsageModel}
        monthLabel={data.monthlyStats.monthLabel}
      />

      {/* Attention items */}
      {data.attentionItems.length > 0 && (
        <AttentionSection
          items={data.attentionItems}
          workspaceId={id}
          onItemTap={handleAttentionItemTap}
        />
      )}

      {/* Recent trips */}
      <RecentTripsSection
        trips={data.recentTrips}
        workspaceId={id}
        onAdd={openQuickTrip}
        onOpen={setSelectedTrip}
      />

      {selectedDoc && (
        <DocumentDetailSheet
          doc={selectedDoc}
          onClose={() => setSelectedDoc(null)}
        />
      )}

      {selectedTrip && (
        <TripDetailSheet
          trip={selectedTrip}
          onClose={() => setSelectedTrip(null)}
        />
      )}
    </div>
  )
}

// ─── Sub-sections ──────────────────────────────────────────────────────────────

function TodayCta({ onAdd }: { onAdd: () => void }) {
  return (
    <button
      onClick={onAdd}
      className="flex items-center gap-3.5 w-full bg-white rounded-2xl px-4 py-3.5 text-left
        border border-slate-100/70 active:scale-[0.99] active:bg-slate-50/50 transition-all duration-150
        shadow-[0_2px_12px_oklch(22%_0.028_280/0.06),_0_1px_3px_oklch(22%_0.028_280/0.04)]"
    >
      <div
        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
        style={{
          background: 'oklch(52% 0.225 285)',
          boxShadow: '0 3px 10px oklch(52% 0.225 285 / 0.30)',
        }}
      >
        <Car size={21} className="text-white" strokeWidth={1.8} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-900 leading-snug">Добавить поездку</p>
        <p className="text-xs text-slate-400 mt-0.5">Сегодня поездок ещё нет</p>
      </div>
      <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <Plus size={15} className="text-slate-500" strokeWidth={2.2} />
      </div>
    </button>
  )
}

function MonthlyStatsSection({ stats }: { stats: MonthlyStats }) {
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-3">
        <TrendingUp size={13} className="text-slate-400" />
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          За {stats.monthLabel}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <StatTile
          value={String(stats.tripCount)}
          label="поездок"
          isEmpty={stats.tripCount === 0}
        />
        <StatTile
          value={stats.totalKm % 1 === 0 ? String(stats.totalKm) : stats.totalKm.toFixed(1)}
          label="км"
          isEmpty={stats.totalKm === 0}
        />
      </div>
    </section>
  )
}

function StatTile({
  value,
  label,
  isEmpty,
}: {
  value: string
  label: string
  isEmpty: boolean
}) {
  return (
    <div className="bg-white rounded-2xl px-4 py-4
      shadow-[0_2px_12px_oklch(22%_0.028_280/0.06),_0_1px_3px_oklch(22%_0.028_280/0.04)]">
      <p
        className={`text-[2rem] font-bold leading-none tracking-tight ${isEmpty ? 'text-slate-200' : 'text-slate-900'}`}
        style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {value}
      </p>
      <p className="text-[11px] font-medium text-slate-400 mt-2 uppercase tracking-wide">{label}</p>
    </div>
  )
}

function AttentionSection({
  items,
  workspaceId,
  onItemTap,
}: {
  items: AttentionItem[]
  workspaceId: string
  onItemTap: (item: AttentionItem) => void
}) {
  const MAX = 3
  const shown = items.slice(0, MAX)

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={13} className="text-amber-500" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Требуют внимания
          </h2>
        </div>
        {items.length > MAX && (
          <Link
            to={`/w/${workspaceId}/events`}
            className="text-xs text-blue-600 font-medium flex items-center gap-0.5"
          >
            Все <ArrowRight size={12} />
          </Link>
        )}
      </div>
      <div className="space-y-2">
        {shown.map((item) => {
          const isUrgent = item.severity === 'urgent'
          const Icon =
            item.kind === 'document' ? FileText :
            item.kind === 'receipt' ? Receipt :
            AlertTriangle
          return (
            <button
              key={item.id}
              onClick={() => onItemTap(item)}
              className="w-full text-left"
            >
              <Card className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isUrgent ? 'bg-red-50' : 'bg-amber-50'}`}>
                    <Icon
                      size={18}
                      className={isUrgent ? 'text-red-500' : 'text-amber-500'}
                      strokeWidth={1.8}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-900 leading-snug">{item.title}</p>
                    {item.subtitle && (
                      <p className={`text-xs mt-0.5 line-clamp-1 ${isUrgent ? 'text-red-500' : 'text-slate-500'}`}>
                        {item.subtitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-blue-600 font-medium shrink-0 mt-0.5">
                    {item.kind === 'document' ? 'Открыть →' : '→'}
                  </span>
                </div>
              </Card>
            </button>
          )
        })}
      </div>
    </section>
  )
}

function TaxBenefitBanner({
  monthlyExpenseTotal,
  vehicleUsageModel,
  monthLabel,
}: {
  monthlyExpenseTotal: number
  vehicleUsageModel: VehicleUsageModel
  monthLabel: string
}) {
  if (vehicleUsageModel === 'COMPENSATION') return null

  const fmt = (n: number) =>
    n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'

  if (monthlyExpenseTotal > 0) {
    const annualProjection = Math.round((monthlyExpenseTotal / new Date().getDate()) * 365)
    return (
      <div className="bg-emerald-50 border border-emerald-100/80 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-xl shrink-0">
            <Wallet size={18} className="text-emerald-700" strokeWidth={1.8} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-emerald-900 leading-snug">
              {fmt(monthlyExpenseTotal)} за {monthLabel} — уже расходы бизнеса
            </p>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              При таком темпе ~{fmt(annualProjection)} в год выходят из бизнеса, а не из кармана.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl p-4"
      style={{ background: 'oklch(97.5% 0.022 285)', border: '1px solid oklch(94% 0.044 285)' }}>
      <div className="flex items-start gap-3">
        <div className="p-2.5 rounded-xl shrink-0" style={{ background: 'oklch(94% 0.044 285)' }}>
          <Wallet size={18} className="text-blue-700" strokeWidth={1.8} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-blue-900 leading-snug">
            Расходы на авто идут из кармана — а могли бы из бизнеса
          </p>
          <p className="text-xs text-blue-700 mt-1 leading-relaxed">
            Добавьте чек на топливо, ТО или страховку — он станет расходом бизнеса.
            До 180 000 ₽ в год перестают быть вашими личными потерями.
          </p>
        </div>
      </div>
    </div>
  )
}

function RecentTripsSection({
  trips,
  workspaceId,
  onAdd,
  onOpen,
}: {
  trips: ReturnType<typeof useHomeData>['recentTrips']
  workspaceId: string
  onAdd: () => void
  onOpen: (trip: Trip) => void
}) {
  return (
    <section className="pb-2">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <Car size={13} className="text-slate-400" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Последние поездки
          </h2>
        </div>
        {trips.length > 0 && (
          <Link
            to={`/w/${workspaceId}/trips`}
            className="text-xs text-blue-600 font-medium flex items-center gap-0.5"
          >
            Все <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {trips.length === 0 ? (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 rounded-xl shrink-0">
              <Car size={18} className="text-slate-300" strokeWidth={1.8} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-500">Поездок пока нет</p>
              <button
                onClick={onAdd}
                className="text-xs text-blue-600 font-semibold mt-0.5"
              >
                Записать первую →
              </button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} showDate onClick={() => onOpen(trip)} />
          ))}
        </div>
      )}
    </section>
  )
}
