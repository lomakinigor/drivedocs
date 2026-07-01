import { useEffect, useState } from 'react'
import { X, Copy, Check, Share2, AlertTriangle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface InviteDriverSheetProps {
  onClose: () => void
}

interface InviteResp {
  code: string
  expires_at: string
  workspace_name: string
}

export function InviteDriverSheet({ onClose }: InviteDriverSheetProps) {
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const [invite, setInvite] = useState<InviteResp | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    void generateInvite()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function generateInvite() {
    setState('loading')
    setError(null)
    if (!supabase) {
      setError('Backend не подключён')
      setState('error')
      return
    }
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setError('Войдите в аккаунт, чтобы приглашать водителей.')
        setState('error')
        return
      }
      const resp = await fetch('/api/invite-create', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        setError(mapError(body?.error))
        setState('error')
        return
      }
      const body = (await resp.json()) as InviteResp
      setInvite(body)
      setState('ready')
    } catch (e) {
      setError((e as Error).message)
      setState('error')
    }
  }

  const joinUrl = invite ? `${window.location.origin}/join?code=${invite.code}` : ''

  async function copyLink() {
    if (!joinUrl) return
    try {
      await navigator.clipboard.writeText(joinUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: prompt
      window.prompt('Скопируйте ссылку:', joinUrl)
    }
  }

  async function shareLink() {
    if (!invite || !joinUrl) return
    const text = `Присоединяйся к моей компании «${invite.workspace_name}» в DriveDocs. Код: ${invite.code}\n${joinUrl}`
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Приглашение в DriveDocs', text, url: joinUrl })
      } catch {
        // user canceled
      }
    } else {
      await copyLink()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-[17px] font-bold text-slate-900">Пригласить водителя</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg active:bg-slate-100">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="px-5 pb-6">
          {state === 'loading' && (
            <div className="py-10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}

          {state === 'error' && (
            <div className="py-8 text-center">
              <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle size={20} className="text-amber-600" />
              </div>
              <p className="text-[13px] text-slate-700 mb-4">{error}</p>
              <button
                onClick={() => void generateInvite()}
                className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-[13px] font-semibold"
              >
                Попробовать снова
              </button>
            </div>
          )}

          {state === 'ready' && invite && (
            <div>
              <p className="text-[13px] text-slate-500 leading-relaxed mb-4">
                Отправьте водителю этот код или ссылку. Он введёт свои данные и выберет машину.
              </p>

              {/* Code */}
              <div
                className="rounded-2xl p-4 mb-3 text-center"
                style={{ background: 'oklch(97% 0.04 285)', border: '1px solid oklch(90% 0.08 285)' }}
              >
                <p className="text-[11px] text-slate-500 uppercase tracking-wider mb-1">Код приглашения</p>
                <p
                  className="text-[32px] font-bold tabular-nums tracking-wider"
                  style={{ fontFamily: 'monospace', color: 'oklch(45% 0.20 285)' }}
                >
                  {invite.code}
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Действует 24 часа
                </p>
              </div>

              {/* Link */}
              <div className="rounded-xl bg-slate-50 p-3 mb-4">
                <p className="text-[11px] text-slate-500 mb-1">Ссылка для приглашения</p>
                <p className="text-[12px] text-slate-700 break-all">{joinUrl}</p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => void copyLink()}
                  className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-800 text-[13px] font-semibold flex items-center justify-center gap-2 active:bg-slate-200"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Скопировано' : 'Копировать'}
                </button>
                <button
                  onClick={() => void shareLink()}
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white text-[13px] font-semibold flex items-center justify-center gap-2 active:bg-blue-700"
                >
                  <Share2 size={16} />
                  Поделиться
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function mapError(code: string | undefined): string {
  switch (code) {
    case 'backend_not_configured':
      return 'На сервере не настроен доступ к БД. Свяжитесь с поддержкой.'
    case 'no_workspace':
      return 'У вас нет активной компании. Завершите онбординг сначала.'
    case 'missing_token':
    case 'invalid_token':
      return 'Сессия истекла. Обновите страницу и войдите заново.'
    default:
      return `Не удалось создать код (${code ?? 'unknown'}).`
  }
}
