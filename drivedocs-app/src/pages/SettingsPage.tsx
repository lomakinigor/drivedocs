import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Building2,
  CreditCard,
  Car,
  Users,
  Check,
  Pencil,
  Plus,
  X,
  TriangleAlert,
  LogOut,
  Star,
  Loader,
  CheckCircle,
  XCircle,
  Archive,
  FileText,
  ChevronRight,
} from 'lucide-react'
import {
  useWorkspaceStore,
  useCurrentWorkspace,
  useOrgProfile,
  useWorkspaceSubscription,
  useIsProWorkspace,
  useWorkspaceDocuments,
} from '@/app/store/workspaceStore'
import { isBackendConfigured } from '@/lib/supabase'
import { createCheckoutSession, createPortalSession } from '@/lib/billing/billingService'
import {
  ENTITY_TYPE_LABELS,
  TAX_MODE_LABELS,
  VEHICLE_USAGE_MODEL_LABELS,
} from '@/entities/constants/labels'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import { HELP_STORAGE, HELP_WAYBILL_VS_ROUTE } from '@/entities/config/onboardingHelp'
import type { HelpContent } from '@/entities/config/onboardingHelp'
import { VehicleSchemeSheet } from '@/features/workspace/VehicleSchemeSheet'
import { VehicleProfileSheet } from '@/features/workspace/VehicleProfileSheet'
import { DriversSheet } from '@/features/workspace/DriversSheet'
import { OrgProfileSheet } from '@/features/workspace/OrgProfileSheet'
import { useVehicleProfile, useDrivers } from '@/app/store/workspaceStore'
import type { VehicleUsageModel } from '@/entities/types/domain'

// T-144 · F-025 — SettingsPage redesign под mockup 09-settings-warm.html (Warm).
// Визуальные токены: oklch indigo, rounded-[18px], section-labels uppercase,
// text-slate-500 вместо slate-400 (a11y фикс из UX-аудита 2026-05-12).
// «Реквизиты» свернуты в Profile-карточку как отдельная строка (consolidation).

const INDIGO = 'oklch(52% 0.225 285)'
const INDIGO_SOFT = 'oklch(94% 0.044 285)'
const SORA = 'Sora, system-ui, sans-serif'

// ─── Initials helper ─────────────────────────────────────────────────────────

function initials(name: string): string {
  const parts = name.replace(/[«»"]/g, '').split(/\s+/).filter(Boolean)
  const letters = parts
    .filter((p) => /\p{L}/u.test(p[0]))
    .map((p) => p[0])
    .join('')
    .toUpperCase()
  return letters.slice(0, 2) || 'W'
}

// ─── Rename sheet ─────────────────────────────────────────────────────────────

interface RenameSheetProps {
  currentName: string
  onSave: (name: string) => void
  onClose: () => void
}

function RenameSheet({ currentName, onSave, onClose }: RenameSheetProps) {
  const [value, setValue] = useState(currentName)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  const trimmed = value.trim()
  const ok = trimmed.length >= 2

  const handleSave = () => {
    if (!ok) return
    onSave(trimmed)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-2 pb-4 shrink-0">
          <h2 className="text-base font-semibold text-slate-900" style={{ fontFamily: SORA }}>Переименовать</h2>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-3">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="Название предприятия"
            className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-400 bg-white rounded-xl outline-none"
            style={{ border: `2px solid ${INDIGO}` }}
          />
        </div>
        <div className="px-5 pb-10 pt-1">
          <button
            onClick={handleSave}
            disabled={!ok}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-opacity ${ok ? 'text-white active:opacity-90' : 'bg-slate-100 text-slate-400'}`}
            style={ok ? { background: INDIGO, fontFamily: SORA } : { fontFamily: SORA }}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Section primitives ──────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[11px] font-semibold uppercase tracking-wider mx-1 mt-1 mb-2 text-slate-500"
      style={{ fontFamily: SORA, letterSpacing: '0.06em' }}
    >
      {children}
    </h2>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-[18px] shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)] ${className}`}>
      {children}
    </div>
  )
}

function Row({
  icon,
  title,
  subtitle,
  value,
  onClick,
  chevron = true,
}: {
  icon?: React.ReactNode
  title: React.ReactNode
  subtitle?: React.ReactNode
  value?: React.ReactNode
  onClick?: () => void
  chevron?: boolean
}) {
  const inner = (
    <div className="px-4 py-3 flex items-center gap-3 min-h-[52px]">
      {icon && (
        <div
          className="w-8 h-8 rounded-[12px] flex items-center justify-center shrink-0"
          style={{ background: INDIGO_SOFT }}
        >
          {icon}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-slate-900 truncate">{title}</div>
        {subtitle && <div className="text-[12px] text-slate-500 mt-0.5 truncate">{subtitle}</div>}
      </div>
      {value && <span className="text-[12px] text-slate-500 shrink-0">{value}</span>}
      {chevron && onClick && <ChevronRight size={16} className="text-slate-300 shrink-0" />}
    </div>
  )
  return onClick ? (
    <button onClick={onClick} className="w-full text-left active:bg-slate-50 transition-colors">
      {inner}
    </button>
  ) : (
    inner
  )
}

function Divider() {
  return <div className="h-px bg-slate-100 mx-4" />
}

// ─── Billing section ──────────────────────────────────────────────────────────

function BillingSection({ workspaceId }: { workspaceId: string }) {
  const subscription = useWorkspaceSubscription(workspaceId)
  const isPro = useIsProWorkspace(workspaceId)
  const { refreshSubscription, activateDevProSubscription } = useWorkspaceStore()
  const [isLoading, setIsLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const planLabel = isPro ? 'Pro' : 'Бесплатный'
  const statusLabel = (() => {
    if (!subscription) return 'Активен'
    const map: Record<string, string> = {
      active: 'Активна', canceled: 'Отменена', past_due: 'Просрочена', incomplete: 'Не завершена',
    }
    return map[subscription.status] ?? subscription.status
  })()

  const handleUpgrade = async () => {
    setBillingError(null)
    setIsLoading(true)
    try {
      const returnBaseUrl = `${window.location.origin}/w/${workspaceId}/settings`
      const result = await createCheckoutSession(workspaceId, returnBaseUrl)
      if (result.error) { setBillingError(result.error); return }
      if (result.isMockMode) { activateDevProSubscription(workspaceId); return }
      if (result.url) window.location.href = result.url
    } finally { setIsLoading(false) }
  }

  const handleManage = async () => {
    setBillingError(null)
    setIsLoading(true)
    try {
      const returnUrl = `${window.location.origin}/w/${workspaceId}/settings`
      const result = await createPortalSession(workspaceId, returnUrl)
      if (result.isMockMode) { await refreshSubscription(workspaceId); return }
      if (result.error) { setBillingError(result.error); return }
      if (result.url) window.location.href = result.url
    } finally { setIsLoading(false) }
  }

  return (
    <section>
      <SectionLabel>Подписка</SectionLabel>
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            {isPro ? (
              <Star size={16} className="text-amber-500 fill-amber-400" />
            ) : (
              <CreditCard size={16} className="text-slate-500" />
            )}
            <div>
              <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: SORA }}>
                Тариф: {planLabel}
              </p>
              {subscription?.currentPeriodEnd && isPro && (
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Действует до{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
          <span
            className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold"
            style={isPro ? { background: 'oklch(96% 0.05 155)', color: 'oklch(40% 0.13 155)' } : { background: 'oklch(95% 0.01 280)', color: 'oklch(50% 0.02 280)' }}
          >
            {statusLabel}
          </span>
        </div>

        {!isPro && (
          <div className="rounded-[14px] p-3 space-y-1.5" style={{ background: INDIGO_SOFT }}>
            <p className="text-[12px] font-semibold mb-1.5" style={{ color: INDIGO, fontFamily: SORA }}>
              Pro включает:
            </p>
            {[
              'Скачивание путевого листа в PDF',
              'Продвинутая аналитика расходов',
              'Напоминания и уведомления (скоро)',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check size={13} style={{ color: INDIGO }} className="shrink-0 mt-0.5" />
                <p className="text-[12px]" style={{ color: 'oklch(35% 0.18 285)' }}>{f}</p>
              </div>
            ))}
          </div>
        )}

        {billingError && (
          <div className="rounded-[12px] border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-[12px] text-red-700">{billingError}</p>
          </div>
        )}

        {!isBackendConfigured && !isPro && (
          <p className="text-[11px] text-slate-500 text-center">
            Оплата недоступна в демо-режиме — нажмите кнопку для симуляции Pro
          </p>
        )}

        {isPro ? (
          <button
            onClick={handleManage}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold border border-slate-200 text-slate-700 bg-white active:bg-slate-50 flex items-center justify-center gap-2"
            style={{ fontFamily: SORA }}
          >
            {isLoading && <Loader size={15} className="animate-spin" />}
            Управлять подпиской
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-[14px] font-semibold text-white active:opacity-90 flex items-center justify-center gap-2 disabled:opacity-70"
            style={{ background: INDIGO, fontFamily: SORA, boxShadow: '0 4px 16px oklch(52% 0.225 285 / 0.28)' }}
          >
            {isLoading ? <Loader size={15} className="animate-spin" /> : <Star size={15} />}
            {isBackendConfigured ? 'Перейти на Pro' : 'Симулировать Pro (демо)'}
          </button>
        )}
      </Card>
    </section>
  )
}

// ─── Documents section ─────────────────────────────────────────────────────

function WorkspaceDocumentsSection({ workspaceId, onOpen }: { workspaceId: string; onOpen: () => void }) {
  const docs = useWorkspaceDocuments(workspaceId)
  const total = docs.length
  const ready = docs.filter((d) => d.status === 'completed').length
  const percent = total === 0 ? 0 : Math.round((ready / total) * 100)
  const pending = total - ready

  return (
    <section>
      <SectionLabel>Документы предприятия</SectionLabel>
      <Card className="overflow-hidden">
        <button onClick={onOpen} className="w-full text-left active:bg-slate-50 transition-colors">
          <div className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
                style={{ background: INDIGO_SOFT }}
              >
                <FileText size={18} style={{ color: INDIGO }} />
              </div>
              <div className="flex-1 min-w-0">
                {total === 0 ? (
                  <>
                    <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: SORA }}>
                      Документы ещё не сформированы
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">Завершите настройку — список появится автоматически</p>
                  </>
                ) : pending === 0 ? (
                  <>
                    <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: SORA }}>
                      Все документы готовы
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{total} из {total} оформлено</p>
                  </>
                ) : (
                  <>
                    <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: SORA }}>
                      {ready} из {total} готово
                    </p>
                    <p className="text-[12px] text-slate-500 mt-0.5">Осталось {pending} {pluralDocs(pending)}</p>
                  </>
                )}
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </div>
            {total > 0 && (
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${percent}%`, background: INDIGO }} />
              </div>
            )}
          </div>
        </button>
      </Card>
    </section>
  )
}

function pluralDocs(n: number): string {
  if (n % 10 === 1 && n % 100 !== 11) return 'документ'
  if ([2, 3, 4].includes(n % 10) && ![12, 13, 14].includes(n % 100)) return 'документа'
  return 'документов'
}

// ─── Vehicle + Drivers section ─────────────────────────────────────────────

function VehicleAndDriversSection({ workspaceId }: { workspaceId: string }) {
  const vehicleProfile = useVehicleProfile(workspaceId)
  const drivers = useDrivers(workspaceId)
  const [vehicleSheetOpen, setVehicleSheetOpen] = useState(false)
  const [driversSheetOpen, setDriversSheetOpen] = useState(false)

  return (
    <section>
      <SectionLabel>Автомобиль и водители</SectionLabel>
      <Card>
        <Row
          icon={<Car size={14} style={{ color: INDIGO }} />}
          title={vehicleProfile ? `${vehicleProfile.make} ${vehicleProfile.model} ${vehicleProfile.year}` : 'Заполнить профиль авто'}
          subtitle={
            vehicleProfile
              ? [
                  vehicleProfile.licensePlate,
                  vehicleProfile.vin && `VIN: ${vehicleProfile.vin}`,
                  vehicleProfile.osagoExpires && `ОСАГО до ${new Date(vehicleProfile.osagoExpires).toLocaleDateString('ru-RU')}`,
                ].filter(Boolean).join(' · ')
              : undefined
          }
          onClick={() => setVehicleSheetOpen(true)}
        />
        <Divider />
        <Row
          icon={<Users size={14} style={{ color: INDIGO }} />}
          title={
            drivers.length > 0
              ? drivers.find((d) => d.isDefault)?.fullName ?? drivers[0]?.fullName
              : 'Добавить водителей'
          }
          subtitle={
            drivers.length > 0
              ? `Водитель${drivers.length > 1 ? `и · ${drivers.length}` : ''}`
              : undefined
          }
          onClick={() => setDriversSheetOpen(true)}
        />
      </Card>

      {vehicleSheetOpen && vehicleProfile && (
        <VehicleProfileSheet
          workspaceId={workspaceId}
          profile={vehicleProfile}
          onClose={() => setVehicleSheetOpen(false)}
        />
      )}
      {driversSheetOpen && (
        <DriversSheet workspaceId={workspaceId} onClose={() => setDriversSheetOpen(false)} />
      )}
    </section>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const workspace = useCurrentWorkspace()
  const orgProfile = useOrgProfile(id)
  const allWorkspaces = useWorkspaceStore((s) => s.workspaces)
  const user = useWorkspaceStore((s) => s.user)
  const { setCurrentWorkspace, updateWorkspace, resetWorkspaceConfig, refreshSubscription } = useWorkspaceStore()
  const signOut = useWorkspaceStore((s) => s.signOut)
  const resetTour = useWorkspaceStore((s) => s.resetTour)
  const updateWorkspaceFn = useWorkspaceStore((s) => s.updateWorkspace)
  const [schemeSheetOpen, setSchemeSheetOpen] = useState(false)
  const [orgProfileSheetOpen, setOrgProfileSheetOpen] = useState(false)

  const billingResult = searchParams.get('billing')
  const [renameOpen, setRenameOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [helpSheet, setHelpSheet] = useState<HelpContent | null>(null)

  useEffect(() => { recordMetric('view.settings') }, [])

  useEffect(() => {
    if (billingResult === 'success') {
      refreshSubscription(id).catch(console.error)
      const p = new URLSearchParams(searchParams)
      p.delete('billing')
      setSearchParams(p, { replace: true })
    } else if (billingResult === 'cancel') {
      const p = new URLSearchParams(searchParams)
      p.delete('billing')
      setSearchParams(p, { replace: true })
    }
    if (searchParams.get('upgrade') === '1') {
      const p = new URLSearchParams(searchParams)
      p.delete('upgrade')
      setSearchParams(p, { replace: true })
      setTimeout(() => {
        document.getElementById('billing-section')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!workspace) return null

  const handleSwitch = (wsId: string) => {
    if (wsId === id) return
    setCurrentWorkspace(wsId)
    navigate(`/w/${wsId}/home`)
  }

  const handleRename = (newName: string) => {
    updateWorkspace(id, { name: newName })
  }

  const handleReset = () => {
    resetWorkspaceConfig(id)
    setShowResetConfirm(false)
    navigate(`/onboarding?ws=${id}`)
  }

  return (
    <div className="px-4 py-4 pb-10" style={{ background: 'oklch(97.5% 0.022 285)', minHeight: '100%' }}>
      <h1
        className="text-[24px] font-bold text-slate-900 mb-3 mx-1"
        style={{ fontFamily: SORA }}
      >
        Настройки
      </h1>

      {/* Billing return banner */}
      {billingResult === 'success' && (
        <div className="flex items-center gap-3 rounded-[18px] px-4 py-3 mb-3" style={{ background: 'oklch(96% 0.05 155)', border: '1px solid oklch(92% 0.06 155)' }}>
          <CheckCircle size={18} style={{ color: 'oklch(45% 0.13 155)' }} className="shrink-0" />
          <p className="text-[13px] font-medium" style={{ color: 'oklch(35% 0.13 155)' }}>Подписка Pro успешно активирована!</p>
        </div>
      )}
      {billingResult === 'cancel' && (
        <div className="flex items-center gap-3 bg-white rounded-[18px] px-4 py-3 mb-3 shadow-[0_2px_12px_oklch(22%_0.028_280/0.06)]">
          <XCircle size={18} className="text-slate-500 shrink-0" />
          <p className="text-[13px] text-slate-700">Оплата отменена. Вы можете попробовать снова.</p>
        </div>
      )}

      <div className="space-y-3">
        {/* ── Profile hero card ── */}
        <button
          onClick={() => setRenameOpen(true)}
          className="w-full rounded-[18px] p-4 flex items-center gap-3 text-left active:opacity-90 transition-opacity"
          style={{ background: INDIGO_SOFT }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-bold shrink-0"
            style={{
              background: `linear-gradient(135deg, ${INDIGO} 0%, oklch(46% 0.235 285) 100%)`,
              boxShadow: '0 4px 16px oklch(52% 0.225 285 / 0.32)',
              fontFamily: SORA,
            }}
          >
            {initials(workspace.name)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-bold text-slate-900 truncate" style={{ fontFamily: SORA }}>
              {workspace.name}
            </div>
            <div className="text-[12px] font-medium mt-0.5 truncate" style={{ color: INDIGO }}>
              {ENTITY_TYPE_LABELS[workspace.entityType]} · {TAX_MODE_LABELS[workspace.taxMode]}
            </div>
          </div>
          <Pencil size={16} style={{ color: INDIGO }} className="shrink-0" />
        </button>

        {/* ── Profile config card ── */}
        <Card>
          <Row
            icon={<Car size={14} style={{ color: INDIGO }} />}
            title="Схема оформления авто"
            subtitle={VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}
            onClick={() => setSchemeSheetOpen(true)}
          />
          <Divider />
          <Row
            icon={<Building2 size={14} style={{ color: INDIGO }} />}
            title={`Реквизиты ${workspace.entityType === 'IP' ? 'ИП' : 'организации'}`}
            subtitle={
              orgProfile?.organizationName || orgProfile?.ownerFullName
                ? [orgProfile.organizationName || orgProfile.ownerFullName, orgProfile.inn && `ИНН ${orgProfile.inn}`].filter(Boolean).join(' · ')
                : 'Заполнить'
            }
            onClick={() => setOrgProfileSheetOpen(true)}
          />
        </Card>

        {/* ── Vehicle & Drivers ── */}
        <VehicleAndDriversSection workspaceId={id} />

        {/* ── Документы предприятия ── */}
        <WorkspaceDocumentsSection workspaceId={id} onOpen={() => navigate(`/w/${id}/settings/documents`)} />

        {/* ── Workspaces ── */}
        <section>
          <SectionLabel>Предприятия</SectionLabel>
          <Card>
            {allWorkspaces.map((ws, idx) => {
              const isActive = ws.id === id
              return (
                <div key={ws.id}>
                  {idx > 0 && <Divider />}
                  <button
                    onClick={isActive ? undefined : () => handleSwitch(ws.id)}
                    disabled={isActive}
                    className={`w-full text-left transition-colors ${isActive ? '' : 'active:bg-slate-50'}`}
                  >
                    <div className="px-4 py-3 flex items-center gap-3 min-h-[52px]">
                      <div
                        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 text-[11px] font-bold"
                        style={
                          isActive
                            ? { background: INDIGO, color: 'white', fontFamily: SORA }
                            : { background: INDIGO_SOFT, color: INDIGO, fontFamily: SORA }
                        }
                      >
                        {ENTITY_TYPE_LABELS[ws.entityType]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-slate-900 truncate" style={{ fontFamily: SORA }}>{ws.name}</p>
                        <p className="text-[12px] text-slate-500 mt-0.5 truncate">
                          {TAX_MODE_LABELS[ws.taxMode]} · {VEHICLE_USAGE_MODEL_LABELS[ws.vehicleUsageModel]}
                        </p>
                      </div>
                      {isActive && <Check size={18} style={{ color: INDIGO }} className="shrink-0" />}
                    </div>
                  </button>
                </div>
              )
            })}
          </Card>
          <button
            onClick={() => navigate('/onboarding')}
            className="mt-2 w-full px-4 py-3 rounded-[18px] border-2 border-dashed border-slate-200 text-slate-500 active:text-slate-700 active:border-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <Plus size={16} />
            <span className="text-[13px] font-medium">Добавить другое предприятие</span>
          </button>
        </section>

        {/* ── Billing ── */}
        <div id="billing-section">
          <BillingSection workspaceId={id} />
        </div>

        {/* ── Help ── */}
        <section>
          <SectionLabel>Справка по документам</SectionLabel>
          <Card>
            <Row
              icon={<Archive size={14} style={{ color: INDIGO }} />}
              title="Как хранить путевые листы и чеки"
              subtitle="Сроки, формат, где держать"
              onClick={() => setHelpSheet(HELP_STORAGE)}
            />
            <Divider />
            <Row
              icon={<FileText size={14} style={{ color: INDIGO }} />}
              title="Путевой и маршрутный лист"
              subtitle="В чём разница"
              onClick={() => setHelpSheet(HELP_WAYBILL_VS_ROUTE)}
            />
          </Card>
        </section>

        {/* ── Account ── */}
        <section>
          <SectionLabel>Аккаунт</SectionLabel>
          <Card className="overflow-hidden">
            <div className="px-4 py-3 min-h-[52px]">
              <p className="text-[14px] font-medium text-slate-900">{user.name}</p>
              <p className="text-[12px] text-slate-500 mt-0.5">{user.email}</p>
            </div>
            <Divider />
            <Row title="Показать стартовую инструкцию" onClick={resetTour} />
            {isBackendConfigured && (
              <>
                <Divider />
                <button
                  onClick={() => signOut()}
                  className="w-full px-4 py-3 flex items-center gap-2 text-left active:bg-slate-50 min-h-[52px]"
                >
                  <LogOut size={14} className="text-red-500" />
                  <span className="text-[14px] font-medium text-red-600">Выйти из аккаунта</span>
                </button>
              </>
            )}
          </Card>
        </section>

        {/* ── Danger zone ── */}
        <section>
          <h2
            className="text-[11px] font-semibold uppercase tracking-wider mx-1 mt-1 mb-2"
            style={{ fontFamily: SORA, letterSpacing: '0.06em', color: 'oklch(58% 0.21 25)' }}
          >
            Опасная зона
          </h2>
          <Card className="p-4">
            {!showResetConfirm ? (
              <button onClick={() => setShowResetConfirm(true)} className="flex items-center gap-3 w-full text-left">
                <TriangleAlert size={18} style={{ color: 'oklch(60% 0.21 25)' }} className="shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold" style={{ color: 'oklch(50% 0.21 25)' }}>Начать настройку заново</p>
                  <p className="text-[12px] text-slate-500 mt-0.5">
                    Сбрасывает настройки профиля. Поездки и документы сохранятся.
                  </p>
                </div>
              </button>
            ) : (
              <div>
                <div className="flex items-start gap-3 mb-4">
                  <TriangleAlert size={18} style={{ color: 'oklch(60% 0.21 25)' }} className="shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[14px] font-semibold text-slate-900" style={{ fontFamily: SORA }}>Вы уверены?</p>
                    <p className="text-[12px] text-slate-500 mt-1 leading-relaxed">
                      Конфигурация «{workspace.name}» будет сброшена. Вы пройдёте настройку заново.
                      Поездки, документы и события останутся.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-[13px] font-medium text-slate-600 active:bg-slate-50"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white active:opacity-90"
                    style={{ background: 'oklch(55% 0.22 25)' }}
                  >
                    Сбросить
                  </button>
                </div>
              </div>
            )}
          </Card>
        </section>

        {/* Admin link */}
        {(user.email === 'claudesecond2026@gmail.com' || !isBackendConfigured) && (
          <button
            onClick={() => navigate('/admin')}
            className="w-full text-center text-[11px] text-slate-400 active:text-slate-600 py-1"
          >
            Аналитика · только для разработчика
          </button>
        )}

        <p className="text-center text-[11px] text-slate-400">drivedocs · v0.1.0</p>
      </div>

      {/* Sheets */}
      {renameOpen && (
        <RenameSheet
          currentName={workspace.name}
          onSave={handleRename}
          onClose={() => setRenameOpen(false)}
        />
      )}

      {schemeSheetOpen && (
        <VehicleSchemeSheet
          current={workspace.vehicleUsageModel}
          onSelect={(model: VehicleUsageModel) => updateWorkspaceFn(id, { vehicleUsageModel: model })}
          onClose={() => setSchemeSheetOpen(false)}
        />
      )}

      {orgProfileSheetOpen && (
        <OrgProfileSheet
          workspaceId={id}
          entityType={workspace.entityType}
          onClose={() => setOrgProfileSheetOpen(false)}
        />
      )}

      {helpSheet && <HelpInfoSheet content={helpSheet} onClose={() => setHelpSheet(null)} />}
    </div>
  )
}
