import { useEffect, useState } from 'react'
import { Car, Bell, FileText, AlertTriangle, Receipt, ChevronRight, MapPin, Check, Wallet } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { TripDetailSheet } from '@/features/trips/TripDetailSheet'
import { DocumentDetailSheet } from '@/features/documents/DocumentDetailSheet'
import { QuickReceiptSheet } from '@/features/receipts/QuickReceiptSheet'
import { useOpenQuickTrip } from '@/features/trips/QuickTripContext'
import { useCurrentWorkspace } from '@/app/store/workspaceStore'
import { useHomeData } from '@/features/home/useHomeData'
import { EssentialsReminderCard, EssentialsSheet, useEssentialsStatus } from '@/features/home/EssentialsReminder'
import { recordMetric } from '@/lib/metrics/featureMetrics'

const SESSION_ESSENTIALS_SHOWN = 'drivedocs:essentials-shown-session:v1'

// Цветовая палитра трёх приоритетов уведомлений на главной (2026-05-13).
const TIER_STYLES = {
  red: {
    bg: 'oklch(96% 0.04 25)',
    border: 'oklch(88% 0.08 25)',
    iconBg: 'oklch(90% 0.10 25)',
    icon: 'oklch(40% 0.20 25)',
    title: 'oklch(38% 0.20 25)',
    subtitle: 'oklch(48% 0.18 25)',
    chevron: 'oklch(55% 0.16 25)',
  },
  yellow: {
    bg: 'oklch(96% 0.08 90)',
    border: 'oklch(88% 0.12 90)',
    iconBg: 'oklch(90% 0.12 90)',
    icon: 'oklch(40% 0.14 75)',
    title: 'oklch(35% 0.14 75)',
    subtitle: 'oklch(45% 0.13 75)',
    chevron: 'oklch(55% 0.13 75)',
  },
  white: {
    bg: 'white',
    border: 'oklch(94% 0.005 280)',
    iconBg: 'oklch(95% 0.005 280)',
    icon: 'oklch(45% 0.02 280)',
    title: 'oklch(22% 0.028 280)',
    subtitle: 'oklch(52% 0.02 280)',
    chevron: 'oklch(75% 0.01 280)',
  },
} as const
import type { AttentionItem } from '@/features/home/useHomeData'
import type { Trip, WorkspaceDocument, VehicleUsageModel } from '@/entities/types/domain'

// T-143 · F-025 · D-025 — HomePage redesign под mockup 02-home.html (Warm).
// 2026-05-12: после UX-audit (audit 44% на принципе «Выгода») вернули
// компактную строку tax-benefit под KPI — НЕ баннер, одна строка, 56px.

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота']
const MONTHS_GEN = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

function todayLabel(): string {
  const d = new Date()
  const wd = WEEKDAYS[d.getDay()]
  return `${wd[0].toUpperCase() + wd.slice(1)}, ${d.getDate()} ${MONTHS_GEN[d.getMonth()]}`
}

function initials(name: string): string {
  const parts = name.replace(/[«»"]/g, '').split(/\s+/).filter(Boolean)
  const letters = parts
    .filter((p) => /\p{L}/u.test(p[0]))
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return letters.slice(0, 2) || 'W'
}

export function HomePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''

  const workspace = useCurrentWorkspace()
  const data = useHomeData(id)
  const navigate = useNavigate()
  const openQuickTrip = useOpenQuickTrip()

  const [selectedDoc, setSelectedDoc] = useState<WorkspaceDocument | null>(null)
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [essentialsOpen, setEssentialsOpen] = useState(false)
  const essentialsStatus = useEssentialsStatus(id)

  // F-028 — фиксируем посещение редизайн-экрана
  useEffect(() => { recordMetric('view.home') }, [])

  // 2026-05-12 — Автооткрытие EssentialsSheet один раз за сессию,
  // если документы для путевого не заполнены и пользователь не сказал «уже есть».
  // Без этих данных приложение не выполняет свою главную задачу (формирование путевого).
  useEffect(() => {
    if (!essentialsStatus.shouldRemind) return
    try {
      if (sessionStorage.getItem(SESSION_ESSENTIALS_SHOWN) === '1') return
      sessionStorage.setItem(SESSION_ESSENTIALS_SHOWN, '1')
      setEssentialsOpen(true)
      recordMetric('essentials.autoopen')
    } catch { /* sessionStorage unavailable — silently skip */ }
  }, [essentialsStatus.shouldRemind])

  if (!workspace) return null

  // 2026-05-13 — Если workspace неконфигурирован (true first-run или после reset),
  // пользователь должен видеть полноценный WelcomePage с логотипом, а не dead-end.
  if (!data.isConfigured) {
    return <Navigate to="/welcome" replace />
  }

  // 2026-05-13 — Приоритеты уведомлений на главной (всегда показываем одно — самое верхнее).
  // MVP: штрафы / новости ПДД из приложения убраны (нет источника данных).
  //   RED    — ОСАГО / ВУ / ТО / КАСКО при ≤7 дней до истечения (или уже истекло)
  //   YELLOW — документы предприятия с дедлайнами (приказы, договоры, прочие expiry)
  //   WHITE  — мягкие info (чеки без поездки, прочие warning-евенты)
  const classify = (it: AttentionItem): 'red' | 'yellow' | 'white' => {
    if (it.kind === 'expiry' && typeof it.daysLeft === 'number' && it.daysLeft <= 7) return 'red'
    if (it.kind === 'document' || it.kind === 'expiry') return 'yellow'
    return 'white'
  }
  const TIER_RANK: Record<'red' | 'yellow' | 'white', number> = { red: 0, yellow: 1, white: 2 }
  const topAttention =
    [...data.attentionItems].sort((a, b) => TIER_RANK[classify(a)] - TIER_RANK[classify(b)])[0] ?? null
  const topTier = topAttention ? classify(topAttention) : null

  const handleAttentionTap = (item: AttentionItem) => {
    if (item.kind === 'document' && item.document) setSelectedDoc(item.document)
    else if (item.kind === 'receipt') navigate(`/w/${id}/trips?mode=receipts`)
    else if (item.kind === 'expiry') navigate(`/w/${id}/settings`)
    else navigate(`/w/${id}/notifications`)
  }

  const bellCount = data.attentionItems.length

  return (
    <div className="px-4 pt-2 pb-6">
      {/* Header */}
      <div className="flex items-start justify-between pb-4 pt-1">
        <div className="min-w-0 flex-1">
          <div
            className="text-[12px] font-bold text-slate-500 uppercase tracking-wider truncate"
            style={{ fontFamily: 'Sora, system-ui, sans-serif', letterSpacing: '0.04em' }}
          >
            {workspace.name}
          </div>
          <h1
            className="text-[28px] font-bold text-slate-900 mt-0.5 leading-tight"
            style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
          >
            Сегодня
          </h1>
          <div className="text-[13px] text-slate-500 mt-0.5">{todayLabel()}</div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 pt-1">
          <button
            onClick={() => navigate(`/w/${id}/notifications`)}
            className="relative w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)] active:bg-slate-50"
            aria-label="Уведомления"
          >
            <Bell size={18} className="text-slate-600" strokeWidth={2} />
            {bellCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                style={{ background: 'oklch(60% 0.21 25)' }}
              >
                {bellCount > 9 ? '9+' : bellCount}
              </span>
            )}
          </button>
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-[12px] font-bold"
            style={{
              background: 'linear-gradient(135deg, oklch(52% 0.225 285) 0%, oklch(46% 0.235 285) 100%)',
              fontFamily: 'Sora, system-ui, sans-serif',
            }}
          >
            {initials(workspace.name)}
          </div>
        </div>
      </div>

      {/* KPI tiles — today */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <KpiTile label="Поездок сегодня" value={String(data.todayTripCount)} isEmpty={data.todayTripCount === 0} />
        <KpiTile
          label="Пробег"
          value={data.todayKm % 1 === 0 ? String(data.todayKm) : data.todayKm.toFixed(1)}
          unit="км"
          isEmpty={data.todayKm === 0}
        />
      </div>

      {/* Tax benefit row — compact, под KPI */}
      <TaxBenefitRow
        monthlyExpenseTotal={data.monthlyExpenseTotal}
        vehicleUsageModel={workspace.vehicleUsageModel}
        monthLabel={data.monthlyStats.monthLabel}
        onTap={() => navigate(`/w/${id}/reports`)}
      />

      {/* Primary CTA */}
      <button
        onClick={openQuickTrip}
        className="w-full flex items-center justify-center gap-2.5 text-white font-semibold text-[15px] py-[18px] rounded-[22px] active:opacity-90 transition-opacity mb-3"
        style={{
          background: 'oklch(52% 0.225 285)',
          boxShadow: '0 8px 24px oklch(52% 0.225 285 / 0.32)',
          fontFamily: 'Sora, system-ui, sans-serif',
        }}
      >
        <Car size={22} strokeWidth={2} />
        Создать поездку
      </button>

      {/* Secondary CTA */}
      <button
        onClick={() => setReceiptOpen(true)}
        className="w-full bg-white flex items-center gap-3 py-4 px-4 rounded-[22px] border border-slate-100 active:bg-slate-50 shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)] mb-5"
      >
        <span
          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: 'oklch(94% 0.05 155)' }}
        >
          <Receipt size={16} style={{ color: 'oklch(50% 0.13 155)' }} strokeWidth={2} />
        </span>
        <span
          className="flex-1 text-left text-slate-700 font-semibold text-[14px]"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          Добавить расход
        </span>
        <ChevronRight size={16} className="text-slate-300" />
      </button>

      {/* F-026 — Essentials reminder (выше urgent-alert: без этих данных путевой не сформируется) */}
      <EssentialsReminderCard workspaceId={id} onTap={() => setEssentialsOpen(true)} />

      {/* Top alert — цвет по приоритету: red > yellow > white. Показываем одно. */}
      {topAttention && topTier && (() => {
        const style = TIER_STYLES[topTier]
        return (
          <button
            onClick={() => handleAttentionTap(topAttention)}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[18px] mb-6 text-left active:opacity-90"
            style={{ background: style.bg, border: `1px solid ${style.border}` }}
          >
            <span
              className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
              style={{ background: style.iconBg }}
            >
              <AlertTriangle size={18} style={{ color: style.icon }} strokeWidth={2.2} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[14px] leading-snug" style={{ color: style.title }}>
                {topAttention.title}
              </div>
              {topAttention.subtitle && (
                <div className="text-[12px] mt-0.5 line-clamp-1" style={{ color: style.subtitle }}>
                  {topAttention.subtitle}
                </div>
              )}
            </div>
            <ChevronRight size={18} style={{ color: style.chevron }} />
          </button>
        )
      })()}

      {/* Journal — today's trips */}
      <SectionLabel icon={<Car size={13} />} text="Журнал за сегодня" />

      {data.todayTrips.length === 0 ? (
        <div className="bg-white rounded-[18px] p-4 flex items-center gap-3 shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)]">
          <div className="w-10 h-10 rounded-[12px] bg-slate-50 flex items-center justify-center shrink-0">
            <Car size={18} className="text-slate-300" strokeWidth={1.8} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-medium text-slate-500">Поездок за сегодня ещё нет</p>
            <button onClick={openQuickTrip} className="text-[12px] font-semibold mt-0.5" style={{ color: 'oklch(52% 0.225 285)' }}>
              Записать первую →
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {data.todayTrips.map((trip) => (
            <TodayTripCard key={trip.id} trip={trip} onOpen={() => setSelectedTrip(trip)} />
          ))}
        </div>
      )}

      {selectedDoc && <DocumentDetailSheet doc={selectedDoc} onClose={() => setSelectedDoc(null)} />}
      {selectedTrip && <TripDetailSheet trip={selectedTrip} onClose={() => setSelectedTrip(null)} />}
      {receiptOpen && <QuickReceiptSheet workspaceId={id} onClose={() => setReceiptOpen(false)} />}
      {essentialsOpen && <EssentialsSheet workspaceId={id} onClose={() => setEssentialsOpen(false)} />}
    </div>
  )
}

// ─── Sub-components ─────────────────────────────────────────────────────────────

function KpiTile({ label, value, unit, isEmpty }: { label: string; value: string; unit?: string; isEmpty: boolean }) {
  return (
    <div className="bg-white rounded-[18px] px-4 py-3.5 shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)]">
      <div
        className="text-[10px] font-semibold uppercase tracking-wider text-slate-500"
        style={{ letterSpacing: '0.08em' }}
      >
        {label}
      </div>
      <div
        className={`text-[30px] font-bold mt-1 leading-none ${isEmpty ? 'text-slate-200' : 'text-slate-900'}`}
        style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
      >
        {value}
        {unit && <span className="text-[14px] text-slate-500 font-medium ml-1">{unit}</span>}
      </div>
    </div>
  )
}

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div
      className="flex items-center gap-1.5 mb-2.5 text-slate-500"
      style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
    >
      <span className="text-slate-500">{icon}</span>
      <span className="text-[11px] font-semibold uppercase tracking-wider">{text}</span>
    </div>
  )
}

function TaxBenefitRow({
  monthlyExpenseTotal,
  vehicleUsageModel,
  monthLabel,
  onTap,
}: {
  monthlyExpenseTotal: number
  vehicleUsageModel: VehicleUsageModel
  monthLabel: string
  onTap: () => void
}) {
  // Для модели «Компенсация» расходы не вычитаются — баннер вводит в заблуждение.
  if (vehicleUsageModel === 'COMPENSATION') return null

  const fmt = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 0 }) + ' ₽'

  if (monthlyExpenseTotal > 0) {
    return (
      <button
        onClick={onTap}
        className="w-full mb-5 rounded-[18px] px-4 py-3.5 flex items-center gap-3 text-left active:opacity-90"
        style={{ background: 'oklch(96% 0.05 155)', border: '1px solid oklch(92% 0.06 155)' }}
      >
        <span
          className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'oklch(92% 0.08 155)' }}
        >
          <Wallet size={18} style={{ color: 'oklch(45% 0.13 155)' }} strokeWidth={2} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-snug" style={{ color: 'oklch(35% 0.12 155)' }}>
            {fmt(monthlyExpenseTotal)} за {monthLabel} — расходы бизнеса
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'oklch(48% 0.10 155)' }}>
            Эти деньги уже не из вашего кармана
          </div>
        </div>
        <ChevronRight size={18} style={{ color: 'oklch(60% 0.12 155)' }} />
      </button>
    )
  }

  return (
    <button
      onClick={onTap}
      className="w-full mb-5 rounded-[18px] px-4 py-3.5 flex items-center gap-3 text-left active:opacity-90"
      style={{ background: 'oklch(97.5% 0.022 285)', border: '1px solid oklch(94% 0.044 285)' }}
    >
      <span
        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: 'oklch(94% 0.044 285)' }}
      >
        <Wallet size={18} style={{ color: 'oklch(52% 0.225 285)' }} strokeWidth={2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-snug text-slate-800">
          Чеки → налоговый вычет
        </div>
        <div className="text-[11px] text-slate-500 mt-0.5">
          До 180 000 ₽/год перестают быть личными расходами
        </div>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  )
}

function TodayTripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  const time = trip.createdAt ? new Date(trip.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }) : ''
  return (
    <div className="bg-white rounded-[18px] overflow-hidden shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)]">
      <button onClick={onOpen} className="w-full text-left p-4 flex items-start gap-3 active:bg-slate-50">
        <div
          className="w-10 h-10 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: 'oklch(94% 0.044 285)' }}
        >
          <MapPin size={18} style={{ color: 'oklch(52% 0.225 285)' }} strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold text-slate-900 truncate">
            {trip.startLocation} → {trip.endLocation}
          </div>
          <div className="text-[12px] text-slate-500 mt-0.5 truncate">
            {time && <>{time} · </>}
            {trip.purpose || 'Без цели'}
          </div>
          <div className="flex gap-1.5 mt-2 flex-wrap">
            <span
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'oklch(94% 0.044 285)', color: 'oklch(52% 0.225 285)' }}
            >
              {trip.distanceKm} км
            </span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ background: 'oklch(94% 0.05 155)', color: 'oklch(48% 0.14 155)' }}
            >
              <Check size={11} strokeWidth={3} />
              Документы готовы
            </span>
          </div>
        </div>
      </button>
      <div className="border-t border-slate-100 px-4 py-2.5 flex justify-between items-center">
        <button
          onClick={onOpen}
          className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600 active:opacity-70"
        >
          <FileText size={14} strokeWidth={2} />
          Документы
        </button>
        <button onClick={onOpen} className="text-[13px] text-slate-500 active:text-slate-600">
          Подробнее →
        </button>
      </div>
    </div>
  )
}
