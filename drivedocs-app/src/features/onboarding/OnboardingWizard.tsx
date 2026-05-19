import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EntityTypeStep } from './steps/EntityTypeStep'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import { readDraft, writeDraft, clearDraft } from '@/lib/onboarding/wizardDraft'
import type { EntityType, TaxMode, VehicleUsageModel } from '@/entities/types/domain'
import { generateInitialDocuments } from '@/features/documents/initialDocuments'
import { buildDemoSeedData } from '@/lib/demo/demoSeed'

// F-034 — Preview-first onboarding.
// Один экран: тип организации (обязательно) + название (опционально).
// Default'ы — УСН 15% + COMPENSATION — применяются автоматически.
// ИНН, авто, водитель — на Home через essentials-блоки.

const DEFAULT_TAX_MODE: TaxMode = 'USN_INCOME_MINUS_EXPENSES'
const DEFAULT_VEHICLE_USAGE: VehicleUsageModel = 'COMPENSATION'

interface WizardState {
  entityType?: EntityType
  workspaceName: string
}

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // ?ws=<id> — режим переконфигурации существующего workspace
  const targetWsId = searchParams.get('ws') ?? null

  const {
    addWorkspace,
    updateWorkspace,
    addOrgProfile,
    setCurrentWorkspace,
    initWorkspaceDocuments,
    addTrip,
    addReceipt,
    addEvent,
    user,
  } = useWorkspaceStore()

  // Восстанавливаем draft (если он есть и валиден)
  const [state, setState] = useState<WizardState>(() => {
    if (targetWsId) return { workspaceName: '' }
    const draft = readDraft()
    if (draft) {
      recordMetric('wizard.draft.resumed')
      return { entityType: draft.entityType, workspaceName: draft.workspaceName }
    }
    return { workspaceName: '' }
  })

  // Метрика: пользователь увидел wizard
  useEffect(() => {
    recordMetric('wizard.step.entity_type.viewed')
  }, [])

  // Автосохранение draft'а при каждом изменении (только в режиме создания)
  useEffect(() => {
    if (targetWsId) return
    if (!state.entityType && !state.workspaceName) return
    writeDraft({ entityType: state.entityType, workspaceName: state.workspaceName })
  }, [state, targetWsId])

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleBack = () => {
    navigate(targetWsId ? '/' : '/welcome')
  }

  // ── Completion ──────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (!state.entityType) return

    const workspaceName =
      state.workspaceName.trim() || defaultWorkspaceName(state.entityType, user.name)

    if (targetWsId) {
      // Re-config existing workspace
      updateWorkspace(targetWsId, {
        name: workspaceName,
        entityType: state.entityType,
        // Default режимы не перетираем — пользователь мог менять их вручную в Settings
        isConfigured: true,
      })
      addOrgProfile({
        workspaceId: targetWsId,
        entityType: state.entityType,
        organizationName: state.entityType === 'OOO' ? workspaceName : undefined,
        ownerFullName: state.entityType === 'IP' ? user.name : undefined,
      })
      setCurrentWorkspace(targetWsId)
      navigate(`/w/${targetWsId}/home`)
      return
    }

    // Создание нового workspace с default'ами
    const workspaceId = `ws-${Date.now()}`
    await addWorkspace({
      id: workspaceId,
      userId: user.id,
      name: workspaceName,
      entityType: state.entityType,
      taxMode: DEFAULT_TAX_MODE,
      vehicleUsageModel: DEFAULT_VEHICLE_USAGE,
      isConfigured: true,
      createdAt: new Date().toISOString(),
    })
    addOrgProfile({
      workspaceId,
      entityType: state.entityType,
      organizationName: state.entityType === 'OOO' ? workspaceName : undefined,
      ownerFullName: state.entityType === 'IP' ? user.name : undefined,
    })
    const docs = generateInitialDocuments(
      workspaceId,
      state.entityType,
      DEFAULT_TAX_MODE,
      DEFAULT_VEHICLE_USAGE,
    )
    await initWorkspaceDocuments(workspaceId, docs)

    // Демо-данные на новый workspace — чтобы Home не выглядел пустым
    const seed = buildDemoSeedData(workspaceId, state.entityType, DEFAULT_VEHICLE_USAGE)
    await Promise.all(seed.trips.map((t) => addTrip(t)))
    await Promise.all(seed.receipts.map((r) => addReceipt(r)))
    seed.events.forEach((e) => addEvent(e))

    clearDraft()
    recordMetric('wizard.step.entity_type.completed', { hasName: !!state.workspaceName.trim() })
    recordMetric('onboarding.complete')

    navigate(`/w/${workspaceId}/home`)
  }

  // ── State updaters ──────────────────────────────────────────────────────────

  const setEntityType = (type: EntityType) => setState((s) => ({ ...s, entityType: type }))
  const setWorkspaceName = (name: string) => setState((s) => ({ ...s, workspaceName: name }))

  // ── Render ──────────────────────────────────────────────────────────────────

  const ok = !!state.entityType

  // Enter в input = «Готово» если можно сабмитить
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    const t = e.target as HTMLElement
    if (t.tagName !== 'INPUT') return
    e.preventDefault()
    if (ok) handleComplete()
  }

  return (
    <div onKeyDown={handleKeyDown} className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <button
          type="button"
          onClick={handleBack}
          className="p-2 -ml-2 rounded-xl text-slate-500 active:bg-slate-100"
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 text-center text-[12px] font-medium text-slate-500 pr-8">
          1 из 1 · ~10 секунд
        </div>
      </div>

      {/* ── Progress bar (full при единственном шаге) ── */}
      <div className="px-4">
        <div className="h-0.5 bg-blue-500 rounded-full" />
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            Ваш бизнес
          </p>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">Кто вы?</h1>
          <p className="text-[13px] text-slate-500 mt-1.5 leading-relaxed">
            Это всё что нужно для старта. Остальные данные (ИНН, авто, водитель) —
            на главной, когда будет удобно.
          </p>
        </div>

        <EntityTypeStep
          selected={state.entityType}
          workspaceName={state.workspaceName}
          onSelectType={setEntityType}
          onChangeName={setWorkspaceName}
        />
      </div>

      {/* ── Footer CTA ── */}
      <div className="px-4 pb-10 pt-4 border-t border-slate-100">
        <button
          type="button"
          onClick={handleComplete}
          disabled={!ok}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors ${
            ok
              ? 'bg-blue-600 text-white active:bg-blue-700'
              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
          }`}
        >
          {targetWsId ? 'Сохранить' : 'Готово, начать работу'}
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function defaultWorkspaceName(entityType: EntityType, userName: string): string {
  const lastName = userName.split(' ')[0] ?? userName
  return entityType === 'IP' ? `ИП ${lastName}` : 'Моя организация'
}
