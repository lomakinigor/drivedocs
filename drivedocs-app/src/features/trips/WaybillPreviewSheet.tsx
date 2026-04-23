import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, FileText, AlertTriangle, Download, Loader, Lock } from 'lucide-react'
import {
  useWorkspaceStore,
  useOrgProfile,
  useVehicleProfile,
  useWorkspaceTrips,
  useIsProWorkspace,
} from '@/app/store/workspaceStore'
import { buildMonthlyWaybillData } from './waybillData'
import { exportWaybillPdf } from './exportWaybillPdf'
import type { WaybillExportRow } from './waybillData'

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
  const isPro = useIsProWorkspace(workspaceId)
  const navigate = useNavigate()

  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

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
    })
  }, [workspace, orgProfile, vehicleProfile, periodTrips, fromDate, toDate])

  if (!data) return null

  const handleExportPress = async () => {
    if (isExporting || !data) return
    setIsExporting(true)
    setExportError(null)
    try {
      await exportWaybillPdf(data)
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
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 pb-4 space-y-4 min-h-0">
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
                <p className="text-xs text-slate-400 mt-1">
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
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
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
      <span className="text-xs text-slate-400 shrink-0 mt-0.5 w-14">{dateStr}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 truncate">{row.route}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {row.distanceKm != null ? `${row.distanceKm} км · ` : ''}{row.purpose}
        </p>
      </div>
    </div>
  )
}
