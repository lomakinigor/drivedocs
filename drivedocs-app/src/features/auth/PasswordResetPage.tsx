import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { supabase, isBackendConfigured } from '@/lib/supabase'

// Supabase после клика по ссылке в письме редиректит на /reset-password с
// access_token в URL hash. Клиент автоматически подхватывает session, юзер
// становится «залогинен на время сброса». Достаточно вызвать updateUser.

export function PasswordResetPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return
    // Ждём, пока supabase-js обработает hash и создаст сессию.
    supabase.auth.getSession().then(({ data }) => {
      setSessionReady(!!data.session)
    })
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) {
        setSessionReady(true)
      }
    })
    return () => data.subscription.unsubscribe()
  }, [])

  if (!isBackendConfigured) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null)

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }
    if (password !== confirm) {
      setError('Пароли не совпадают')
      return
    }

    setLoading(true)
    const { error: err } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (err) {
      setError(translateError(err.message))
    } else {
      // Success — юзер уже залогинен новым паролем, ведём на Home.
      navigate('/', { replace: true })
    }
  }

  if (sessionReady === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
          <span className="text-2xl">⚠️</span>
        </div>
        <h1 className="text-lg font-bold text-slate-900 mb-2 text-center">Ссылка недействительна</h1>
        <p className="text-sm text-slate-500 text-center mb-6 max-w-sm">
          Возможно, ссылка устарела или уже была использована. Запросите новую.
        </p>
        <button
          onClick={() => navigate('/reset-password-request')}
          className="px-5 py-3 bg-blue-600 text-white text-[14px] font-semibold rounded-2xl active:bg-blue-700"
        >
          Запросить новую ссылку
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-md">
          <span className="text-white text-2xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Новый пароль</h1>
        <p className="text-sm text-slate-500 mt-1 text-center">Придумайте новый пароль для входа</p>
      </div>

      <div className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <form onSubmit={handleSubmit} className="px-5 pt-5 pb-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Новый пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="Минимум 6 символов"
              required
              minLength={6}
              className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Повторите пароль</label>
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="Повторите"
              required
              minLength={6}
              className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || sessionReady === null}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors mt-1 ${
              loading || sessionReady === null
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white active:bg-blue-700'
            }`}
          >
            {loading ? 'Сохраняем...' : 'Сохранить и войти'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-slate-500 mt-auto py-8">drivedocs · v0.1.0</p>
    </div>
  )
}

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('same') || m.includes('different')) return 'Новый пароль должен отличаться от старого'
  if (m.includes('weak')) return 'Пароль слишком простой'
  if (m.includes('session')) return 'Сессия истекла. Запросите новую ссылку.'
  return 'Не удалось сохранить пароль. Попробуйте позже.'
}
