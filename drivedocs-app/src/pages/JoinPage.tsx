import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { supabase, isBackendConfigured } from '@/lib/supabase'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

type Stage = 'code' | 'confirm' | 'driver_data' | 'submitting' | 'success' | 'error'

interface DriverData {
  full_name: string
  license_number: string
  license_issued_at: string
  birth_date: string
  phone: string
}

export function JoinPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialCode = (searchParams.get('code') ?? '').toUpperCase()

  const isAuthenticated = useWorkspaceStore((s) => s.isAuthenticated)
  const authChecked = useWorkspaceStore((s) => s.authChecked)

  const [code, setCode] = useState(initialCode)
  const [stage, setStage] = useState<Stage>(initialCode ? 'confirm' : 'code')
  const [workspaceName, setWorkspaceName] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [driver, setDriver] = useState<DriverData>({
    full_name: '',
    license_number: '',
    license_issued_at: '',
    birth_date: '',
    phone: '',
  })

  useEffect(() => {
    if (initialCode && stage === 'confirm') {
      void validateCode(initialCode)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!isBackendConfigured) {
    return <Navigate to="/" replace />
  }

  // Требуем логин: если не залогинен — редиректим на /auth?redirect=/join?code=XXX
  if (authChecked && !isAuthenticated) {
    const redirectAfter = code ? `/join?code=${code}` : '/join'
    return <Navigate to={`/auth?redirect=${encodeURIComponent(redirectAfter)}`} replace />
  }

  async function validateCode(rawCode: string) {
    const cleaned = rawCode.trim().toUpperCase()
    if (!/^[A-Z0-9]{6}$/.test(cleaned)) {
      setError('Код должен состоять из 6 символов')
      return
    }
    setError(null)
    try {
      const resp = await fetch(`/api/invite-validate?code=${encodeURIComponent(cleaned)}`)
      const body = (await resp.json()) as {
        valid: boolean
        workspace_name?: string
        error?: string
      }
      if (!body.valid) {
        setError(mapValidationError(body.error))
        setStage('code')
        return
      }
      setWorkspaceName(body.workspace_name ?? '—')
      setCode(cleaned)
      setStage('confirm')
    } catch (e) {
      setError((e as Error).message)
      setStage('code')
    }
  }

  async function submitJoin() {
    setStage('submitting')
    setError(null)
    if (!supabase) {
      setError('Backend не подключён')
      setStage('error')
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Сессия истекла. Войдите заново.')
        setStage('error')
        return
      }
      const resp = await fetch('/api/invite-consume', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          driver: {
            full_name: driver.full_name,
            license_number: driver.license_number,
            license_issued_at: driver.license_issued_at || undefined,
            birth_date: driver.birth_date || undefined,
            phone: driver.phone || undefined,
          },
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        setError(mapConsumeError(body?.error))
        setStage('error')
        return
      }
      setStage('success')
    } catch (e) {
      setError((e as Error).message)
      setStage('error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-8 pb-4">
        <Link to="/" className="p-2 -ml-2 rounded-xl text-slate-500 active:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-[15px] font-semibold text-slate-700">Присоединиться к компании</h1>
      </div>

      <div className="flex-1 px-4 pb-8">
        {stage === 'code' && (
          <CodeStep
            code={code}
            onChange={setCode}
            error={error}
            onSubmit={() => void validateCode(code)}
          />
        )}
        {stage === 'confirm' && (
          <ConfirmStep
            workspaceName={workspaceName}
            code={code}
            onBack={() => setStage('code')}
            onContinue={() => setStage('driver_data')}
          />
        )}
        {stage === 'driver_data' && (
          <DriverDataStep
            driver={driver}
            onChange={setDriver}
            onBack={() => setStage('confirm')}
            onSubmit={() => void submitJoin()}
          />
        )}
        {stage === 'submitting' && (
          <div className="py-20 flex flex-col items-center">
            <div className="w-10 h-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin mb-4" />
            <p className="text-[13px] text-slate-500">Присоединяемся...</p>
          </div>
        )}
        {stage === 'success' && (
          <SuccessStep workspaceName={workspaceName} onContinue={() => navigate('/', { replace: true })} />
        )}
        {stage === 'error' && (
          <ErrorStep error={error} onRetry={() => setStage('driver_data')} />
        )}
      </div>
    </div>
  )
}

// ─── Steps ──────────────────────────────────────────────────────────────────

function CodeStep({
  code,
  onChange,
  error,
  onSubmit,
}: {
  code: string
  onChange: (v: string) => void
  error: string | null
  onSubmit: () => void
}) {
  return (
    <div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-2">Введите код приглашения</h2>
      <p className="text-[13px] text-slate-500 mb-6">
        Владелец компании отправит вам 6-значный код.
      </p>
      <input
        type="text"
        value={code}
        onChange={(e) => onChange(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
        placeholder="XXXXXX"
        maxLength={6}
        autoFocus
        className="w-full text-center text-[32px] font-bold tracking-widest tabular-nums px-4 py-4 rounded-2xl border-2 border-slate-200 bg-white outline-none focus:border-blue-500"
        style={{ fontFamily: 'monospace' }}
      />
      {error && (
        <p className="mt-3 text-[13px] text-red-600 text-center">{error}</p>
      )}
      <button
        onClick={onSubmit}
        disabled={code.length !== 6}
        className={`w-full mt-6 py-4 rounded-2xl text-[15px] font-semibold ${
          code.length === 6
            ? 'bg-blue-600 text-white active:bg-blue-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        Продолжить
      </button>
    </div>
  )
}

function ConfirmStep({
  workspaceName,
  code,
  onBack,
  onContinue,
}: {
  workspaceName: string | null
  code: string
  onBack: () => void
  onContinue: () => void
}) {
  return (
    <div>
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={24} className="text-blue-600" />
        </div>
        <h2 className="text-[20px] font-bold text-slate-900 mb-2">
          Код действителен
        </h2>
        <p className="text-[13px] text-slate-500 mb-6">Вы присоединяетесь к компании</p>
        <div className="inline-block px-4 py-3 rounded-2xl bg-white border border-slate-200">
          <p className="text-[18px] font-bold text-slate-900">{workspaceName ?? '—'}</p>
          <p className="text-[11px] text-slate-500 mt-1">Код: {code}</p>
        </div>
      </div>

      <button
        onClick={onContinue}
        className="w-full py-4 rounded-2xl bg-blue-600 text-white text-[15px] font-semibold active:bg-blue-700"
      >
        Продолжить
      </button>
      <button
        onClick={onBack}
        className="w-full mt-2 py-3 text-[13px] text-slate-500 active:text-slate-700"
      >
        Ввести другой код
      </button>
    </div>
  )
}

function DriverDataStep({
  driver,
  onChange,
  onBack,
  onSubmit,
}: {
  driver: DriverData
  onChange: (d: DriverData) => void
  onBack: () => void
  onSubmit: () => void
}) {
  const canSubmit =
    driver.full_name.trim().length >= 3 &&
    driver.license_number.trim().length >= 5

  const update = (patch: Partial<DriverData>) => onChange({ ...driver, ...patch })

  return (
    <div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-2">Ваши данные как водителя</h2>
      <p className="text-[13px] text-slate-500 mb-6">
        Понадобятся для оформления путевых листов. Информация доступна только владельцу компании.
      </p>

      <div className="space-y-4">
        <Field
          label="Полное ФИО *"
          value={driver.full_name}
          onChange={(v) => update({ full_name: v })}
          placeholder="Иванов Иван Иванович"
        />
        <Field
          label="Номер водительского удостоверения *"
          value={driver.license_number}
          onChange={(v) => update({ license_number: v })}
          placeholder="77 АА 123456"
        />
        <Field
          label="Дата выдачи прав"
          type="date"
          value={driver.license_issued_at}
          onChange={(v) => update({ license_issued_at: v })}
        />
        <Field
          label="Дата рождения"
          type="date"
          value={driver.birth_date}
          onChange={(v) => update({ birth_date: v })}
        />
        <Field
          label="Телефон"
          type="tel"
          value={driver.phone}
          onChange={(v) => update({ phone: v })}
          placeholder="+7 900 000-00-00"
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={`w-full mt-6 py-4 rounded-2xl text-[15px] font-semibold ${
          canSubmit
            ? 'bg-blue-600 text-white active:bg-blue-700'
            : 'bg-slate-100 text-slate-500'
        }`}
      >
        Присоединиться
      </button>
      <button
        onClick={onBack}
        className="w-full mt-2 py-3 text-[13px] text-slate-500 active:text-slate-700"
      >
        Назад
      </button>
    </div>
  )
}

function SuccessStep({
  workspaceName,
  onContinue,
}: {
  workspaceName: string | null
  onContinue: () => void
}) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 size={28} className="text-green-600" />
      </div>
      <h2 className="text-[22px] font-bold text-slate-900 mb-2">Готово!</h2>
      <p className="text-[13px] text-slate-500 mb-8">
        Вы присоединились к компании <b>{workspaceName}</b>. Теперь можно фиксировать поездки.
      </p>
      <button
        onClick={onContinue}
        className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-[15px] font-semibold active:bg-blue-700"
      >
        Перейти на главную
      </button>
    </div>
  )
}

function ErrorStep({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle size={28} className="text-red-600" />
      </div>
      <h2 className="text-[18px] font-bold text-slate-900 mb-2">Не получилось</h2>
      <p className="text-[13px] text-slate-500 mb-8">{error ?? 'Что-то пошло не так'}</p>
      <button
        onClick={onRetry}
        className="px-8 py-3 rounded-2xl bg-blue-600 text-white text-[15px] font-semibold active:bg-blue-700"
      >
        Попробовать снова
      </button>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-[12px] font-medium text-slate-500 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-3 text-[14px] text-slate-900 bg-white border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-colors"
      />
    </div>
  )
}

function mapValidationError(code?: string): string {
  switch (code) {
    case 'invalid_format': return 'Код должен быть 6 символов (A-Z, 0-9)'
    case 'not_found': return 'Код не найден. Проверьте правильность.'
    case 'already_used': return 'Этот код уже использован.'
    case 'expired': return 'Срок действия кода истёк. Попросите новый.'
    default: return 'Не удалось проверить код.'
  }
}

function mapConsumeError(code?: string): string {
  switch (code) {
    case 'already_used':
    case 'race_condition_already_used':
      return 'Этот код уже использован кем-то другим.'
    case 'expired': return 'Срок действия кода истёк.'
    case 'not_found': return 'Код не найден.'
    case 'driver_data_required': return 'Заполните обязательные поля.'
    case 'missing_token':
    case 'invalid_token': return 'Сессия истекла. Войдите заново.'
    default: return `Ошибка: ${code ?? 'unknown'}`
  }
}
