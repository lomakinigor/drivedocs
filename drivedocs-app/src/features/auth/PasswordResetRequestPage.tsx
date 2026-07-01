import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { supabase, isBackendConfigured } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

export function PasswordResetRequestPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  if (!isBackendConfigured) {
    return <Navigate to="/" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return
    setError(null)
    setLoading(true)

    const redirectTo = `${window.location.origin}/reset-password`
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo,
    })

    setLoading(false)
    if (err) {
      setError(translateError(err.message))
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <div className="flex flex-col items-center pt-16 pb-8 px-6">
        <Link
          to="/auth"
          className="self-start flex items-center gap-1 text-[13px] text-slate-500 mb-6 active:text-slate-700"
        >
          <ArrowLeft size={14} />
          Назад ко входу
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-4 shadow-md">
          <span className="text-white text-2xl font-bold">D</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Восстановление пароля</h1>
        <p className="text-sm text-slate-500 mt-1 text-center">
          Введите email — отправим ссылку для сброса пароля
        </p>
      </div>

      <div className="mx-4 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        {sent ? (
          <div className="px-5 py-8 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">✉️</span>
            </div>
            <p className="text-[15px] font-semibold text-slate-900 mb-2">Письмо отправлено</p>
            <p className="text-[13px] text-slate-500 leading-relaxed">
              Проверьте почту <b>{email}</b> и перейдите по ссылке.
              Если письма нет — проверьте папку «Спам».
            </p>
            <Link
              to="/auth"
              className="inline-block mt-6 px-5 py-3 bg-blue-600 text-white text-[14px] font-semibold rounded-2xl active:bg-blue-700"
            >
              Вернуться ко входу
            </Link>
          </div>
        ) : (
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

            {error && (
              <div className="px-3.5 py-2.5 bg-red-50 border border-red-100 rounded-xl">
                <p className="text-xs text-red-600">{error}</p>
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
              {loading ? 'Отправляем...' : 'Отправить ссылку'}
            </button>
          </form>
        )}
      </div>

      <p className="text-center text-xs text-slate-500 mt-auto py-8">drivedocs · v0.1.0</p>
    </div>
  )
}

function translateError(msg: string): string {
  const m = msg.toLowerCase()
  if (m.includes('rate limit')) return 'Слишком много запросов. Попробуйте через минуту.'
  if (m.includes('not found') || m.includes('user')) return 'Не удалось отправить письмо. Проверьте email.'
  return 'Ошибка отправки. Попробуйте позже.'
}
