import { useState, useRef, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Building2,
  CreditCard,
  Car,
  Check,
  Pencil,
  Plus,
  X,
  TriangleAlert,
} from 'lucide-react'
import { Card } from '@/shared/ui/components/Card'
import { Badge } from '@/shared/ui/components/Badge'
import {
  useWorkspaceStore,
  useCurrentWorkspace,
  useOrgProfile,
} from '@/app/store/workspaceStore'
import {
  ENTITY_TYPE_LABELS,
  TAX_MODE_LABELS,
  TAX_MODE_DESCRIPTIONS,
  VEHICLE_USAGE_MODEL_LABELS,
  VEHICLE_USAGE_MODEL_DESCRIPTIONS,
} from '@/entities/constants/labels'

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
}: {
  icon: React.ReactNode
  label: string
  value: string
  description?: string
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
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SettingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()

  const workspace = useCurrentWorkspace()
  const orgProfile = useOrgProfile(id)
  const allWorkspaces = useWorkspaceStore((s) => s.workspaces)
  const user = useWorkspaceStore((s) => s.user)
  const { setCurrentWorkspace, updateWorkspace, resetWorkspaceConfig } = useWorkspaceStore()

  const [renameOpen, setRenameOpen] = useState(false)
  const [showResetConfirm, setShowResetConfirm] = useState(false)

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
              label="Правовая модель"
              value={VEHICLE_USAGE_MODEL_LABELS[workspace.vehicleUsageModel]}
              description={VEHICLE_USAGE_MODEL_DESCRIPTIONS[workspace.vehicleUsageModel]}
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

      {/* ── Account / Subscription ── */}
      <section>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Аккаунт
        </h2>
        <Card className="p-4 space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-800">{user.name}</p>
            <Badge variant={user.subscriptionStatus === 'active' ? 'green' : 'yellow'}>
              {user.subscriptionStatus === 'trial'
                ? 'Пробный период'
                : user.subscriptionStatus === 'active'
                ? 'Подписка активна'
                : 'Истекла'}
            </Badge>
          </div>
          <p className="text-xs text-slate-400">{user.email}</p>
          {user.subscriptionExpiresAt && (
            <p className="text-xs text-slate-400">
              {user.subscriptionStatus === 'trial' ? 'Пробный период до' : 'До'}{' '}
              {new Date(user.subscriptionExpiresAt).toLocaleDateString('ru-RU', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
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
    </div>
  )
}
