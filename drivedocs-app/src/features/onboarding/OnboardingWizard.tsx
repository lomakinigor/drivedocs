import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { EntityTypeStep } from './steps/EntityTypeStep'
import { SelfDrivingStep } from './steps/SelfDrivingStep'
import { WorkspaceNameStep } from './steps/WorkspaceNameStep'
import { TaxModeStep } from './steps/TaxModeStep'
import { VehicleModelStep } from './steps/VehicleModelStep'
import { SummaryStep } from './steps/SummaryStep'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import type { EntityType, TaxMode, VehicleUsageModel } from '@/entities/types/domain'
import { generateInitialDocuments } from '@/features/documents/initialDocuments'
import { buildDemoSeedData } from '@/lib/demo/demoSeed'
import { workspaceMemberRepo } from '@/lib/db/repository'
import { captureAppError } from '@/lib/sentry'

// ─── Step config ─────────────────────────────────────────────────────────────

type Step = 'entity_type' | 'self_driving' | 'workspace_name' | 'tax_mode' | 'vehicle_model' | 'summary'

const STEP_ORDER: Step[] = [
  'entity_type',
  'self_driving',
  'workspace_name',
  'tax_mode',
  'vehicle_model',
  'summary',
]

const STEP_META: Record<Step, { label: string; title: string }> = {
  entity_type: {
    label: 'Статус',
    title: 'Кто вы по юридическому статусу?',
  },
  self_driving: {
    label: 'Водитель',
    title: 'Кто будет водить машину?',
  },
  workspace_name: {
    label: 'Название',
    title: 'Как назовём предприятие?',
  },
  tax_mode: {
    label: 'Налоги',
    title: 'Какой налоговый режим применяете?',
  },
  vehicle_model: {
    label: 'Автомобиль',
    title: 'Как оформлено использование авто?',
  },
  summary: {
    label: 'Итог',
    title: 'Всё верно?',
  },
}

// ─── Wizard state ─────────────────────────────────────────────────────────────

interface WizardState {
  entityType?: EntityType
  isSelfDriving?: boolean
  workspaceName: string
  taxMode?: TaxMode
  vehicleUsageModel?: VehicleUsageModel
}

// ─── Validation per step ──────────────────────────────────────────────────────

function canProceed(step: Step, state: WizardState): boolean {
  switch (step) {
    case 'entity_type':
      return !!state.entityType
    case 'self_driving':
      return state.isSelfDriving !== undefined
    case 'workspace_name':
      return state.workspaceName.trim().length >= 2
    case 'tax_mode':
      return !!state.taxMode
    case 'vehicle_model':
      return !!state.vehicleUsageModel
    case 'summary':
      return true
  }
}

function ctaLabel(step: Step, isUpdate: boolean): string {
  if (step === 'summary') return isUpdate ? 'Сохранить настройки' : 'Готово, начать работу'
  return 'Далее'
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OnboardingWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  // If ?ws=<id> is present, we are re-configuring an existing workspace
  const targetWsId = searchParams.get('ws') ?? null

  const { addWorkspace, updateWorkspace, addOrgProfile, setCurrentWorkspace, initWorkspaceDocuments, addTrip, addReceipt, addEvent, user } =
    useWorkspaceStore()

  const [currentStep, setCurrentStep] = useState<Step>('entity_type')
  const [state, setState] = useState<WizardState>({
    workspaceName: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const stepIndex = STEP_ORDER.indexOf(currentStep)
  const totalSteps = STEP_ORDER.length
  const progress = ((stepIndex + 1) / totalSteps) * 100
  const meta = STEP_META[currentStep]

  // ── Navigation ──────────────────────────────────────────────────────────────

  const handleBack = () => {
    if (stepIndex === 0) {
      navigate(targetWsId ? '/' : '/welcome')
    } else {
      setCurrentStep(STEP_ORDER[stepIndex - 1])
    }
  }

  const handleNext = () => {
    if (currentStep === 'summary') {
      handleComplete()
      return
    }
    // Если владелец не сам водитель — пропускаем шаг vehicle_model,
    // машину будет оформлять сам приглашённый водитель через join-flow.
    // Ставим дефолт ORG_VEHICLE, чтобы не сломать логику генерации документов.
    if (currentStep === 'tax_mode' && state.isSelfDriving === false) {
      // Дефолт для «только владелец» — служебный авто на балансе (BALANCE).
      // Реальная модель может быть уточнена позже в настройках.
      setState((s) => ({ ...s, vehicleUsageModel: s.vehicleUsageModel ?? 'BALANCE' }))
      setCurrentStep('summary')
      return
    }
    setCurrentStep(STEP_ORDER[stepIndex + 1])
  }

  const handleBackSmart = () => {
    // При «не сам вожу» пропущенный шаг vehicle_model возвращать нельзя
    if (currentStep === 'summary' && state.isSelfDriving === false) {
      setCurrentStep('tax_mode')
      return
    }
    handleBack()
  }

  // Jump to a specific step (used from summary "edit" taps)
  const handleEditStep = (step: Exclude<Step, 'entity_type' | 'summary'>) => {
    setCurrentStep(step)
  }

  // ── Completion ──────────────────────────────────────────────────────────────

  const handleComplete = async () => {
    if (!state.entityType || !state.taxMode || !state.vehicleUsageModel) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setSubmitError(null)
    try {
      await handleCompleteInner()
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      captureAppError(error)
      setSubmitError(
        'Не удалось сохранить профиль. Проверьте соединение с интернетом и попробуйте ещё раз.',
      )
      setIsSubmitting(false)
    }
    // При успехе — navigate() уже увёл со страницы, isSubmitting сбрасывать не нужно
    // (компонент размонтируется вместе с этим состоянием).
  }

  const handleCompleteInner = async () => {
    if (!state.entityType || !state.taxMode || !state.vehicleUsageModel) return

    const workspaceName =
      state.workspaceName.trim() || defaultWorkspaceName(state.entityType, user.name)

    if (targetWsId) {
      // Re-configuring an existing workspace — regenerate documents for new config
      updateWorkspace(targetWsId, {
        name: workspaceName,
        entityType: state.entityType,
        taxMode: state.taxMode,
        vehicleUsageModel: state.vehicleUsageModel,
        isConfigured: true,
      })
      addOrgProfile({
        workspaceId: targetWsId,
        entityType: state.entityType,
        organizationName: state.entityType === 'OOO' ? workspaceName : undefined,
        ownerFullName: state.entityType === 'IP' ? user.name : undefined,
      })
      const docs = generateInitialDocuments(
        targetWsId,
        state.entityType,
        state.taxMode,
        state.vehicleUsageModel,
      )
      await initWorkspaceDocuments(targetWsId, docs)
      setCurrentWorkspace(targetWsId)
      navigate(`/w/${targetWsId}/home`)
    } else {
      // Creating a brand-new workspace
      const workspaceId = `ws-${Date.now()}`
      await addWorkspace({
        id: workspaceId,
        userId: user.id,
        name: workspaceName,
        entityType: state.entityType,
        taxMode: state.taxMode,
        vehicleUsageModel: state.vehicleUsageModel,
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
        state.taxMode,
        state.vehicleUsageModel,
      )
      await initWorkspaceDocuments(workspaceId, docs)

      // Split onboarding: если владелец не сам водитель — помечаем в
      // workspace_members что owner не активный водитель. Приглашённые
      // водители будут добавляться отдельно через invite-flow (B1.3).
      if (state.isSelfDriving === false) {
        try {
          await workspaceMemberRepo.setOwnerActiveDriver(workspaceId, user.id, false)
        } catch {
          // не блокируем онбординг — потом можно исправить в Settings
        }
      }

      // Seed demo data so the user immediately sees what the app can do
      // Только для self-driving: если водители будут наёмные, демо-поездки
      // от их лица создавать некорректно.
      if (state.isSelfDriving !== false) {
        const seed = buildDemoSeedData(workspaceId, state.entityType, state.vehicleUsageModel)
        await Promise.all(seed.trips.map((t) => addTrip(t)))
        await Promise.all(seed.receipts.map((r) => addReceipt(r)))
        seed.events.forEach((e) => addEvent(e))
      }

      navigate(`/w/${workspaceId}/home`)
    }
  }

  // ── State updaters ──────────────────────────────────────────────────────────

  const setEntityType = (type: EntityType) =>
    setState((s) => ({
      ...s,
      entityType: type,
      taxMode: undefined, // reset tax mode when entity type changes
    }))

  // ── Render ──────────────────────────────────────────────────────────────────

  const ok = canProceed(currentStep, state)
  const isSummary = currentStep === 'summary'

  // 2026-05-15 — Enter в input/textarea = клик «Далее».
  // НЕ используем <form onSubmit>, т.к. это делает все вложенные кнопки
  // submit-кнопками (стрелка назад, опции в radio-group, edit-step в summary),
  // и любой их клик дополнительно вызывает handleNext.
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Enter') return
    const t = e.target as HTMLElement
    if (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA') return
    // Не перехватываем Enter в textarea если зажат Shift (перенос строки)
    if (t.tagName === 'TEXTAREA' && e.shiftKey) return
    e.preventDefault()
    if (ok) handleNext()
  }

  return (
    <div onKeyDown={handleKeyDown} className="flex flex-col h-full bg-white">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 pt-12 pb-4">
        <button
          type="button"
          onClick={handleBackSmart}
          className="p-2 -ml-2 rounded-xl text-slate-500 active:bg-slate-100"
          aria-label="Назад"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Step dots */}
        <div className="flex items-center gap-1.5 flex-1 justify-center pr-8">
          {STEP_ORDER.map((step, i) => (
            <div
              key={step}
              className={`rounded-full transition-all duration-300 ${
                i === stepIndex
                  ? 'w-5 h-2 bg-blue-500'
                  : i < stepIndex
                  ? 'w-2 h-2 bg-blue-300'
                  : 'w-2 h-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="px-4">
        <div className="h-0.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        {/* Step heading */}
        <div className="mb-6">
          <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
            {meta.label}
          </p>
          <h1 className="text-xl font-bold text-slate-900 leading-snug">{meta.title}</h1>
        </div>

        {/* Step body */}
        {currentStep === 'entity_type' && (
          <EntityTypeStep selected={state.entityType} onSelect={setEntityType} />
        )}

        {currentStep === 'self_driving' && (
          <SelfDrivingStep
            selected={state.isSelfDriving}
            onSelect={(isSelf) => setState((s) => ({ ...s, isSelfDriving: isSelf }))}
          />
        )}

        {currentStep === 'workspace_name' && state.entityType && (
          <WorkspaceNameStep
            entityType={state.entityType}
            value={state.workspaceName}
            onChange={(name) => setState((s) => ({ ...s, workspaceName: name }))}
          />
        )}

        {currentStep === 'tax_mode' && state.entityType && (
          <TaxModeStep
            entityType={state.entityType}
            selected={state.taxMode}
            onSelect={(mode) => setState((s) => ({ ...s, taxMode: mode }))}
          />
        )}

        {currentStep === 'vehicle_model' && (
          <VehicleModelStep
            selected={state.vehicleUsageModel}
            onSelect={(model) => setState((s) => ({ ...s, vehicleUsageModel: model }))}
            entityType={state.entityType}
          />
        )}

        {isSummary && state.entityType && state.taxMode && state.vehicleUsageModel && (
          <SummaryStep
            workspaceName={
              state.workspaceName.trim() ||
              defaultWorkspaceName(state.entityType, user.name)
            }
            entityType={state.entityType}
            taxMode={state.taxMode}
            vehicleUsageModel={state.vehicleUsageModel}
            onEditStep={handleEditStep}
          />
        )}
      </div>

      {/* ── Footer CTA ── */}
      <div className="px-4 pb-10 pt-4 border-t border-slate-100">
        {submitError && (
          <div className="mb-3 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl">
            <p className="text-sm text-red-700 leading-relaxed">{submitError}</p>
          </div>
        )}
        <button
          type="button"
          onClick={handleNext}
          disabled={!ok || isSubmitting}
          className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors ${
            ok && !isSubmitting
              ? 'bg-blue-600 text-white active:bg-blue-700'
              : 'bg-slate-100 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isSubmitting
            ? 'Сохраняем…'
            : submitError
            ? 'Повторить'
            : ctaLabel(currentStep, !!targetWsId)}
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
