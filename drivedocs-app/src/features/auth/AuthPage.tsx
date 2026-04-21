import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { isBackendConfigured } from '@/lib/supabase'

type Tab = 'signin' | 'signup'

export function AuthPage() {
  const isAuthenticated = useWorkspaceStore((s) => s.isAuthenticated)
  const authChecked = useWorkspaceStore((s) => s.authChecked)
  const signIn = useWorkspaceStore((s) => s.signIn)
  const signUp = useWorkspaceStore((s) => s.signUp)

  const [tab, setTab] = useState<Tab>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // localStorage mode or already authenticated → skip auth
  if (!isBackendConfigured || (authChecked && isAuthenticated)) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccessMsg(null)
    setLoading(true)

    const trimmedEmail = email.trim().toLowerCase()
    const result =
      tab === 'signin'
        ? await signIn(trimmedEmail, password)
        : await signUp(trimmedEmail, password)

    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else if (tab === 'signup') {
      setSuccessMsg('Проверьте почту — мы отправили письмо для подтверждения.')
    }
    // signIn success: onAuthStateChange fires → setAuthUser → store becomes authenticated
    // → ProtectedRoute re-renders and lets user through
  }

  const switchTab = (t: Tab) => {
    setTab(t)
    setError(null)
    setSuccessMsg(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-md">
          <span className="text-white text-2xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">drivedocs</h1>
        <p className="text-sm text-slate-500 mt-1">Учёт поездок и документов для бизнеса</p>
      </div>

      {/* Card */}
      <div className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button
            type="button"
            onClick={() => switchTab('signin')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              tab === 'signin'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-400'
            }`}
          >
            Войти
          </button>
          <button
            type="button"
            onClick={() => switchTab('signup')}
            className={`flex-1 py-3.5 text-sm font-semibold transition-colors ${
              tab === 'signup'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-slate-400'
            }`}
          >
            Создать аккаунт
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-5 pt-5 pb-6 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="you@example.com"
              required
              className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === 'signin' ? 'current-password' : 'new-password'}
              placeholder={tab === 'signin' ? '••••••••' : 'Минимум 6 символов'}
              required
              minLength={6}
              className="w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}

          {/* Success */}
          {successMsg && (
            <div className="px-3.5 py-2.5 bg-green-50 border border-green-100 rounded-xl">
              <p className="text-xs text-green-700">{successMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors mt-1 ${
              loading
                ? 'bg-blue-300 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white active:bg-blue-700'
            }`}
          >
            {loading
              ? 'Загрузка...'
              : tab === 'signin'
              ? 'Войти'
              : 'Зарегистрироваться'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-center text-xs text-slate-400 mt-auto py-8">
        drivedocs · v0.1.0
      </p>
    </div>
  )
}
