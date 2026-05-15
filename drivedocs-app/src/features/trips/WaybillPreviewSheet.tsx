import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FileText, AlertTriangle, Download, Loader, Lock, Sparkles, Info } from 'lucide-react'
import {
  useWorkspaceStore,
  useOrgProfile,
  useVehicleProfile,
  useWorkspaceTrips,
  useDrivers,
  useIsProWorkspace,
} from '@/app/store/workspaceStore'
import { buildMonthlyWaybillData } from './waybillData'
import { exportWaybillPdf } from './exportWaybillPdf'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import type { WaybillExportRow } from './waybillData'
import type { WaybillTemplate } from '@/entities/types/domain'

const TEMPLATE_STORAGE_KEY = 'drivedocs:waybill.template'

function readTemplate(): WaybillTemplate {
  if (typeof window === 'undefined') return 'minimal'
  try {
    const v = window.localStorage.getItem(TEMPLATE_STORAGE_KEY)
    return v === 'extended' ? 'extended' : 'minimal'
  } catch {
    return 'minimal'
  }
}

function writeTemplate(t: WaybillTemplate): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(TEMPLATE_STORAGE_KEY, t)
  } catch {
    /* ignore */
  }
}

interface WaybillPreviewSheetProps {
  workspaceId: string
  fromDate: string   // ISO date 'YYYY-MM-DD'
  toDate: string     // ISO date 'YYYY-MM-DD'
  onClose: () => void
}

export function WaybillPreviewSheet({
  workspaceId,
  fromDate,
  toDate,
  onClose,
}: WaybillPreviewSheetProps) {
  const workspace = useWorkspaceStore(
    (s) => s.workspaces.find((ws) => ws.id === workspaceId) ?? null,
  )
  const orgProfile = useOrgProfile(workspaceId)
  const vehicleProfile = useVehicleProfile(workspaceId)
  const allTrips = useWorkspaceTrips(workspaceId)
  const drivers = useDrivers(workspaceId)
  const isPro = useIsProWorkspace(workspaceId)
  const navigate = useNavigate()

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const [template, setTemplate] = useState<WaybillTemplate>(() => readTemplate())

  useEffect(() => {
    writeTemplate(template)
  }, [template])

  const periodTrips = useMemo(
    () => allTrips.filter((t) => t.date >= fromDate && t.date <= toDate),
    [allTrips, fromDate, toDate],
  )

  const data = useMemo(() => {
    if (!workspace) return null
    return buildMonthlyWaybillData({
      workspace,
      orgProfile,
      vehicleProfile,
      trips: periodTrips,
      fromDate,
      toDate,
      drivers,
      fuelProfile: workspace.fuelProfile,
    })
  }, [workspace, orgProfile, vehicleProfile, periodTrips, drivers, fromDate, toDate])

  if (!data) return null

  const handleExportPress = async () => {
    if (isExporting || !data) return
    setIsExporting(true)
    setExportError(null)
    try {
      recordMetric('waybill.export', { template })
      await exportWaybillPdf(data, template)
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Не удалось создать PDF. Попробуйте ещё раз.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleUpgradePress = () => {
    onClose()
    navigate(`/w/${workspaceId}/settings?upgrade=1`)
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
            <div className="p-2 bg-indigo-50 rounded-xl">
              <FileText size={18} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Путевой лист</h2>
              <p className="text-xs text-slate-500 mt-0.5 capitalize">{data.periodLabel}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">
          {/* F-032 · Template toggle */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Шаблон
            </p>
            <div className="grid grid-cols-2 gap-2">
              <TemplateOption
                active={template === 'minimal'}
                title="Минимальный"
                subtitle="10 обязательных реквизитов приказа 368"
                badge="По умолчанию"
                onClick={() => {
                  setTemplate('minimal')
                  recordMetric('waybill.template.switch', { to: 'minimal' })
                }}
              />
              <TemplateOption
                active={template === 'extended'}
                title="Расширенный"
                subtitle="+ ГСМ (АМ-23-р), VIN, ВУ, медконтроль"
                badge="Рекомендуем"
                badgeIcon={<Sparkles size={11} />}
                onClick={() => {
                  setTemplate('extended')
                  recordMetric('waybill.template.switch', { to: 'extended' })
                }}
              />
            </div>
            {template === 'extended' && (
              <div className="flex items-start gap-2 mt-2 px-3 py-2.5 bg-indigo-50 rounded-xl">
                <Info size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-indigo-700 leading-relaxed">
                  Для ФНС, списания ГСМ и аудита. Расчёт нормы расхода
                  по&nbsp;АМ-23-р делается за&nbsp;вас — экономит ~20&nbsp;минут
                  на&nbsp;каждый путевой.
                </p>
              </div>
            )}
            {template === 'minimal' && (
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed px-1">
                Полное соответствие приказу 368 — для повседневной отчётности.
                Готовим PDF за&nbsp;5–10 секунд.
              </p>
            )}
          </div>

          {/* Summary card */}
          <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
            <SummaryRow label="Организация" value={data.organizationName} />
            {data.organizationInn && (
              <SummaryRow label="ИНН" value={data.organizationInn} />
            )}
            {data.organizationOgrn && (
              <SummaryRow
                label={data.entityType === 'IP' ? 'ОГРНИП' : 'ОГРН'}
                value={data.organizationOgrn}
              />
            )}
            <SummaryRow label="Транспортное средство" value={data.vehicleLabel} />
            <SummaryRow label="Водитель" value={data.driverLabel} />
          </div>

          {/* Warnings */}
          {data.warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle size={15} className="text-amber-500 shrink-0" />
                <p className="text-xs font-semibold text-amber-700">
                  Для полноценного экспорта требуется:
                </p>
              </div>
              <ul className="space-y-1">
                {data.warnings.map((w) => (
                  <li key={w} className="text-xs text-amber-700 pl-4 before:content-['·'] before:-ml-3 before:mr-1">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Trip rows */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
              Поездки
            </p>
            {data.rows.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-500">Нет поездок за период</p>
                <p className="text-xs text-slate-500 mt-1">
                  Добавьте поездки, чтобы сформировать путевой лист
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50">
                {data.rows.map((row) => (
                  <WaybillRow key={row.id} row={row} />
                ))}
              </div>
            )}
          </div>

          {/* Totals */}
          {data.rows.length > 0 && (
            <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Итого поездок</p>
                <p className="text-sm font-bold text-slate-900">{data.totals.tripsCount}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Итого пробег</p>
                <p className="text-sm font-bold text-slate-900">
                  {data.totals.totalDistanceKm % 1 === 0
                    ? data.totals.totalDistanceKm
                    : data.totals.totalDistanceKm.toFixed(1)}{' '}
                  км
                </p>
              </div>
            </div>
          )}

          {/* Export error */}
          {exportError && (
            <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-xs text-red-700">{exportError}</p>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <div className="px-5 pb-6 pt-3 border-t border-slate-100 shrink-0 space-y-2.5">
          {isPro ? (
            <button
              onClick={handleExportPress}
              disabled={!data.isExportReady || isExporting}
              className={`w-full py-3 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors ${
                data.isExportReady && !isExporting
                  ? 'bg-indigo-600 text-white active:bg-indigo-700'
                  : 'bg-slate-100 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isExporting ? (
                <>
                  <Loader size={16} className="animate-spin" />
                  Создание PDF…
                </>
              ) : (
                <>
                  <Download size={16} />
                  Скачать PDF
                </>
              )}
            </button>
          ) : (
            <PdfPaywall onUpgrade={handleUpgradePress} />
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-sm font-semibold text-slate-600 border border-slate-200 bg-white active:bg-slate-50"
          >
            Закрыть
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Paywall block ────────────────────────────────────────────────────────────

function PdfPaywall({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="p-1.5 bg-indigo-100 rounded-lg shrink-0">
          <Lock size={15} className="text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-semibold text-indigo-900">Функция доступна на тарифе Pro</p>
          <p className="text-xs text-indigo-700 mt-0.5 leading-relaxed">
            Скачивание путевого листа в PDF доступно на платном тарифе.
            Просмотр и сводка — бесплатно.
          </p>
        </div>
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

// ─── Sub-components ───────────────────────────────────────────────────────────

interface TemplateOptionProps {
  active: boolean
  title: string
  subtitle: string
  badge?: string
  badgeIcon?: React.ReactNode
  onClick: () => void
}

function TemplateOption({ active, title, subtitle, badge, badgeIcon, onClick }: TemplateOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-2xl border-2 p-3 active:scale-[0.98] transition-transform ${
        active
          ? 'border-indigo-500 bg-indigo-50'
          : 'border-slate-200 bg-white active:bg-slate-50'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className={`text-[13px] font-semibold ${active ? 'text-indigo-900' : 'text-slate-900'}`}>
          {title}
        </p>
        {badge && (
          <span
            className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5 ${
              active ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {badgeIcon}
            {badge}
          </span>
        )}
      </div>
      <p className={`text-[11px] leading-snug ${active ? 'text-indigo-700' : 'text-slate-500'}`}>
        {subtitle}
      </p>
    </button>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <p className="text-xs text-slate-500 shrink-0">{label}</p>
      <p className="text-xs font-medium text-slate-900 text-right">{value}</p>
    </div>
  )
}

function WaybillRow({ row }: { row: WaybillExportRow }) {
  const dateStr = new Date(row.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  })
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-xs text-slate-500 shrink-0 mt-0.5 w-14">{dateStr}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">{row.route}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {row.distanceKm != null ? `${row.distanceKm} км · ` : ''}{row.purpose}
        </p>
      </div>
    </div>
  )
}
