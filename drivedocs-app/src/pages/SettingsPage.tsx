import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import {
  Building2,
  CreditCard,
  Car,
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
} from 'lucide-react'
import { Card } from '@/shared/ui/components/Card'
import { Badge } from '@/shared/ui/components/Badge'
import {
  useWorkspaceStore,
  useCurrentWorkspace,
  useOrgProfile,
  useWorkspaceSubscription,
  useIsProWorkspace,
} from '@/app/store/workspaceStore'
import { isBackendConfigured } from '@/lib/supabase'
import { createCheckoutSession, createPortalSession } from '@/lib/billing/billingService'
import {
  ENTITY_TYPE_LABELS,
  TAX_MODE_LABELS,
  TAX_MODE_DESCRIPTIONS,
  VEHICLE_USAGE_MODEL_LABELS,
  VEHICLE_USAGE_MODEL_DESCRIPTIONS,
} from '@/entities/constants/labels'
import { VehicleSchemeSheet } from '@/features/workspace/VehicleSchemeSheet'
import type { VehicleUsageModel } from '@/entities/types/domain'

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
          <h2 className="text-base font-semibold text-slate-900">Переименовать</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
          >
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
            placeholder="Название рабочего пространства"
            className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-white border-2 border-blue-500 rounded-xl outline-none"
          />
        </div>
        <div className="px-5 pb-10 pt-1">
          <button
            onClick={handleSave}
            disabled={!ok}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors ${
              ok
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            Сохранить
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Config row ───────────────────────────────────────────────────────────────

function ConfigRow({
  icon,
  label,
  value,
  description,
  onEdit,
}: {
  icon: React.ReactNode
  label: string
  value: string
  description?: string
  onEdit?: () => void
}) {
  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="text-slate-400 shrink-0 mt-0.5">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
        {description && (
          <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{description}</p>
        )}
      </div>
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 rounded-xl text-slate-400 active:bg-slate-100 shrink-0 mt-0.5"
          aria-label="Изменить"
        >
          <Pencil size={14} />
        </button>
      )}
    </div>
  )
}

// ─── Billing section ──────────────────────────────────────────────────────────

interface BillingSectionProps {
  workspaceId: string
}

function BillingSection({ workspaceId }: BillingSectionProps) {
  const subscription = useWorkspaceSubscription(workspaceId)
  const isPro = useIsProWorkspace(workspaceId)
  const { refreshSubscription, activateDevProSubscription } = useWorkspaceStore()

  const [isLoading, setIsLoading] = useState(false)
  const [billingError, setBillingError] = useState<string | null>(null)

  const planLabel = isPro ? 'Pro' : 'Бесплатный'
  const statusLabel = (() => {
    if (!subscription) return 'Активен'
    const map: Record<string, string> = {
      active: 'Активна',
      canceled: 'Отменена',
      past_due: 'Просрочена',
      incomplete: 'Не завершена',
    }
    return map[subscription.status] ?? subscription.status
  })()

  const handleUpgrade = async () => {
    setBillingError(null)
    setIsLoading(true)
    try {
      const returnBaseUrl = `${window.location.origin}/w/${workspaceId}/settings`
      const result = await createCheckoutSession(workspaceId, returnBaseUrl)
      if (result.error) {
        setBillingError(result.error)
        return
      }
      if (result.isMockMode) {
        // Dev mode: simulate activation
        activateDevProSubscription(workspaceId)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleManageSubscription = async () => {
    setBillingError(null)
    setIsLoading(true)
    try {
      const returnUrl = `${window.location.origin}/w/${workspaceId}/settings`
      const result = await createPortalSession(workspaceId, returnUrl)
      if (result.isMockMode) {
        // Dev mode: portal not available, just refresh data
        await refreshSubscription(workspaceId)
        return
      }
      if (result.error) {
        setBillingError(result.error)
        return
      }
      if (result.url) {
        window.location.href = result.url
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section>
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
        Подписка
      </h2>
      <Card className="p-4 space-y-4">
        {/* Plan + status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isPro ? (
              <Star size={16} className="text-amber-500 fill-amber-400" />
            ) : (
              <CreditCard size={16} className="text-slate-400" />
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">Тариф: {planLabel}</p>
              {subscription?.currentPeriodEnd && isPro && (
                <p className="text-xs text-slate-400 mt-0.5">
                  Действует до{' '}
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}
            </div>
          </div>
          <Badge variant={isPro ? 'green' : 'slate'}>{statusLabel}</Badge>
        </div>

        {/* Pro features list */}
        {!isPro && (
          <div className="bg-indigo-50 rounded-xl p-3 space-y-1.5">
            <p className="text-xs font-semibold text-indigo-800 mb-2">Pro включает:</p>
            {[
              'Скачивание путевого листа в PDF',
              'Продвинутая аналитика расходов',
              'Напоминания и уведомления (скоро)',
            ].map((f) => (
              <div key={f} className="flex items-start gap-2">
                <Check size={13} className="text-indigo-500 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-700">{f}</p>
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {billingError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2.5">
            <p className="text-xs text-red-700">{billingError}</p>
          </div>
        )}

        {/* Dev mode notice */}
        {!isBackendConfigured && !isPro && (
          <p className="text-xs text-slate-400 text-center">
            Оплата недоступна в демо-режиме — нажмите кнопку для симуляции Pro
          </p>
        )}

        {/* CTA */}
        {isPro ? (
          <button
            onClick={handleManageSubscription}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-sm font-semibold border border-slate-200 text-slate-700 bg-white active:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? <Loader size={15} className="animate-spin" /> : null}
            Управлять подпиской
          </button>
        ) : (
          <button
            onClick={handleUpgrade}
            disabled={isLoading}
            className="w-full py-3 rounded-2xl text-sm font-semibold bg-indigo-600 text-white active:bg-indigo-700 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {isLoading ? <Loader size={15} className="animate-spin" /> : <Star size={15} />}
            {isBackendConfigured ? 'Перейти на Pro' : 'Симулировать Pro (демо)'}
          </button>
        )}
      </Card>
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
  const { setCurrentWorkspace, updateWorkspace, resetWorkspaceConfig, refreshSubscription } =
    useWorkspaceStore()
  const signOut = useWorkspaceStore((s) => s.signOut)
  const resetTour = useWorkspaceStore((s) => s.resetTour)
  const updateWorkspaceFn = useWorkspaceStore((s) => s.updateWorkspace)
  const [schemeSheetOpen, setSchemeSheetOpen] = useState(false)

  const billingResult = searchParams.get('billing')
  const [renameOpen, setRenameOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  // Handle Stripe return URLs
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
    // Scroll to billing section on ?upgrade=1
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
    <div className="px-4 py-5 space-y-5 pb-10">
      <h1 className="text-xl font-bold text-slate-900">Настройки</h1>

      {/* ── Billing return banner ── */}
      {billingResult === 'success' && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-4 py-3">
          <CheckCircle size={18} className="text-green-600 shrink-0" />
          <p className="text-sm font-medium text-green-800">Подписка Pro успешно активирована!</p>
        </div>
      )}
      {billingResult === 'cancel' && (
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3">
          <XCircle size={18} className="text-slate-400 shrink-0" />
          <p className="text-sm text-slate-600">Оплата отменена. Вы можете попробовать снова.</p>
        </div>
      )}

      {/* ── Current workspace card ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Текущее рабочее пространство
        </h2>
        <Card className="px-4 pt-4 pb-2">
          {/* Name row */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="min-w-0">
              <p className="text-base font-bold text-slate-900 leading-snug">{workspace.name}</p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                <Badge variant="blue">{ENTITY_TYPE_LABELS[workspace.entityType]}</Badge>
                <Badge variant="slate">{TAX_MODE_LABELS[workspace.taxMode]}</Badge>
                <Badge variant="slate">{VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}</Badge>
              </div>
            </div>
            <button
              onClick={() => setRenameOpen(true)}
              className="p-2 rounded-xl text-slate-400 active:bg-slate-100 shrink-0 -mr-1 -mt-1"
              aria-label="Переименовать"
            >
              <Pencil size={16} />
            </button>
          </div>

          {/* Config rows */}
          <div className="divide-y divide-slate-100">
            <ConfigRow
              icon={<Building2 size={16} />}
              label="Тип субъекта"
              value={ENTITY_TYPE_LABELS[workspace.entityType]}
            />
            <ConfigRow
              icon={<CreditCard size={16} />}
              label="Налоговый режим"
              value={TAX_MODE_LABELS[workspace.taxMode]}
              description={TAX_MODE_DESCRIPTIONS[workspace.taxMode]}
            />
            <ConfigRow
              icon={<Car size={16} />}
              label="Схема оформления авто"
              value={VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}
              description={VEHICLE_USAGE_MODEL_DESCRIPTIONS[workspace.vehicleUsageModel]}
              onEdit={() => setSchemeSheetOpen(true)}
            />
            {orgProfile?.inn && (
              <ConfigRow
                icon={<Building2 size={16} />}
                label="ИНН"
                value={orgProfile.inn}
              />
            )}
          </div>
        </Card>
      </section>

      {/* ── Workspace list ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Рабочие пространства
        </h2>
        <div className="space-y-2">
          {allWorkspaces.map((ws) => {
            const isActive = ws.id === id
            return (
              <Card
                key={ws.id}
                className={`p-4 ${isActive ? 'border-blue-200 bg-blue-50/40' : ''}`}
                onClick={isActive ? undefined : () => handleSwitch(ws.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {ENTITY_TYPE_LABELS[ws.entityType]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">{ws.name}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {TAX_MODE_LABELS[ws.taxMode]} · {VEHICLE_USAGE_MODEL_LABELS[ws.vehicleUsageModel]}
                    </p>
                  </div>
                  {isActive && <Check size={18} className="text-blue-600 shrink-0" />}
                </div>
              </Card>
            )
          })}

          {/* Add workspace */}
          <button
            onClick={() => navigate('/onboarding')}
            className="flex items-center gap-3 w-full px-4 py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 active:border-blue-300 active:text-blue-500 transition-colors"
          >
            <Plus size={18} />
            <span className="text-sm font-medium">Добавить рабочее пространство</span>
          </button>
        </div>
      </section>

      {/* ── Billing ── */}
      <div id="billing-section">
        <BillingSection workspaceId={id} />
      </div>

      {/* ── Account ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Аккаунт
        </h2>
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
          </div>
          <p className="text-xs text-slate-400">{user.email}</p>
          <button
            onClick={resetTour}
            className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-100 w-full text-left text-sm font-medium text-blue-500 active:text-blue-700"
          >
            Показать стартовую инструкцию
          </button>
          {isBackendConfigured && (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full text-left text-sm font-medium text-red-500 active:text-red-700"
            >
              <LogOut size={15} />
              Выйти из аккаунта
            </button>
          )}
        </Card>
      </section>

      {/* ── Danger zone ── */}
      <section>
        <h2 className="text-xs font-semibold text-red-400 uppercase tracking-wide mb-2">
          Опасная зона
        </h2>
        <Card className="p-4">
          {!showResetConfirm ? (
            <button
              onClick={() => setShowResetConfirm(true)}
              className="flex items-center gap-3 w-full text-left"
            >
              <TriangleAlert size={18} className="text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-red-600">Начать настройку заново</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Сбрасывает конфигурацию текущего пространства. Поездки и документы сохранятся.
                </p>
              </div>
            </button>
          ) : (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <TriangleAlert size={18} className="text-red-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-slate-900">Вы уверены?</p>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Конфигурация «{workspace.name}» будет сброшена. Вы пройдёте настройку заново.
                    Поездки, документы и события останутся.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 active:bg-slate-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleReset}
                  className="flex-1 py-2.5 rounded-xl bg-red-600 text-sm font-medium text-white active:bg-red-700"
                >
                  Сбросить
                </button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Admin link — only for owner */}
      {user.email === 'claudesecond2026@gmail.com' || !isBackendConfigured ? (
        <button
          onClick={() => navigate('/admin')}
          className="w-full text-center text-xs text-slate-300 active:text-slate-500 py-1"
        >
          Аналитика · только для разработчика
        </button>
      ) : null}

      {/* Version */}
      <p className="text-center text-xs text-slate-400">drivedocs · v0.1.0</p>

      {/* Rename sheet */}
      {renameOpen && (
        <RenameSheet
          currentName={workspace.name}
          onSave={handleRename}
          onClose={() => setRenameOpen(false)}
        />
      )}

      {/* Vehicle scheme sheet */}
      {schemeSheetOpen && (
        <VehicleSchemeSheet
          current={workspace.vehicleUsageModel}
          onSelect={(model: VehicleUsageModel) =>
            updateWorkspaceFn(id, { vehicleUsageModel: model })
          }
          onClose={() => setSchemeSheetOpen(false)}
        />
      )}
    </div>
  )
}
