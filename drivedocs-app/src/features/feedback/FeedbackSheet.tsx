import { useState, useRef, useEffect } from 'react'
import { X, Heart, Bug, Lightbulb, HelpCircle, Send, Check, Copy, Mic, MicOff } from 'lucide-react'
import { addFeedback, FEEDBACK_KIND_LABEL, type FeedbackKind } from '@/lib/feedback/feedbackStore'
import { useCurrentWorkspace } from '@/app/store/workspaceStore'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import { useSpeechRecognition } from '@/lib/voice/useSpeechRecognition'

// F-033 — FeedbackSheet
// Доставка: zero-backend. Текст копируется в буфер обмена, открывается чат с
// @drivedocs_bot в Telegram. Пользователь вставляет и отправляет одним тапом.
// Копия отзыва остаётся в localStorage (страховка от закрытия Telegram).

const INDIGO = 'oklch(52% 0.225 285)'
const INDIGO_SOFT = 'oklch(94% 0.044 285)'
const SORA = 'Sora, system-ui, sans-serif'
const TG_BOT = 'drivedocs_bot'

const KIND_OPTIONS: Array<{ kind: FeedbackKind; icon: typeof Heart; color: string }> = [
  { kind: 'love', icon: Heart, color: 'oklch(62% 0.18 0)' },
  { kind: 'bug', icon: Bug, color: 'oklch(58% 0.18 25)' },
  { kind: 'idea', icon: Lightbulb, color: 'oklch(70% 0.16 80)' },
  { kind: 'question', icon: HelpCircle, color: 'oklch(58% 0.14 240)' },
]

interface FeedbackSheetProps {
  onClose: () => void
}

export function FeedbackSheet({ onClose, initialKind }: FeedbackSheetProps & { initialKind?: FeedbackKind }) {
  const workspace = useCurrentWorkspace()
  const [kind, setKind] = useState<FeedbackKind>(initialKind ?? 'idea')
  const [text, setText] = useState('')
  const [contact, setContact] = useState('')
  const [includeMeta, setIncludeMeta] = useState(true)
  const [sent, setSent] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const voiceBaseRef = useRef('')

  const speech = useSpeechRecognition({
    onTranscript: (chunk, isFinal) => {
      if (isFinal) {
        voiceBaseRef.current = (voiceBaseRef.current + ' ' + chunk).trim()
        setText(voiceBaseRef.current)
      } else {
        const interim = (voiceBaseRef.current + ' ' + chunk).trim()
        setText(interim)
      }
    },
  })

  useEffect(() => {
    const t = setTimeout(() => textareaRef.current?.focus(), 200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    voiceBaseRef.current = text
  }, [speech.listening]) // sync baseline when mic toggled

  const [voiceUnsupportedNote, setVoiceUnsupportedNote] = useState<string | null>(null)
  const toggleMic = () => {
    if (!speech.supported) {
      setVoiceUnsupportedNote('Голос доступен в Chrome, Edge или Safari (включая iOS 14.5+). В Firefox распознавание речи отключено.')
      return
    }
    if (speech.listening) {
      speech.stop()
      recordMetric('feedback.voice.stop')
    } else {
      voiceBaseRef.current = text
      speech.start()
      recordMetric('feedback.voice.start')
    }
  }

  const trimmed = text.trim()
  const canSubmit = trimmed.length >= 5

  const buildMessage = (): string => {
    const lines = [
      `🚗 DriveDocs · ${FEEDBACK_KIND_LABEL[kind]}`,
      '',
      trimmed,
    ]
    if (contact.trim()) {
      lines.push('', `Контакт: ${contact.trim()}`)
    }
    if (includeMeta) {
      const meta: string[] = []
      if (workspace) {
        meta.push(`Workspace: ${workspace.entityType} · ${workspace.taxMode}`)
      }
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
      if (ua) {
        const short = ua.length > 120 ? ua.slice(0, 117) + '…' : ua
        meta.push(`UA: ${short}`)
      }
      meta.push(`Дата: ${new Date().toLocaleString('ru-RU')}`)
      if (meta.length > 0) {
        lines.push('', '— —', ...meta)
      }
    }
    return lines.join('\n')
  }

  const [autoDelivered, setAutoDelivered] = useState(false)

  const handleSubmit = async () => {
    if (!canSubmit) return
    const meta = includeMeta
      ? {
          workspace: workspace
            ? `${workspace.entityType} · ${workspace.taxMode}`
            : 'no-workspace',
          ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
          date: new Date().toLocaleString('ru-RU'),
        }
      : undefined

    // Сначала пытаемся доставить через backend (Vercel function → Telegram).
    // Если backend не сконфигурирован или упал — fallback на deep-link с буфером.
    let backendOk = false
    try {
      const resp = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind,
          text: trimmed,
          contact: contact.trim() || undefined,
          meta,
        }),
      })
      backendOk = resp.ok
    } catch {
      backendOk = false
    }

    addFeedback({
      kind,
      text: trimmed,
      contact: contact.trim() || undefined,
      meta,
      sentToTelegram: true,
    })
    recordMetric('feedback.submit', { kind, mode: backendOk ? 'auto' : 'deeplink' })

    if (backendOk) {
      setAutoDelivered(true)
      setSent(true)
      return
    }

    // Fallback: копируем текст и открываем чат с ботом
    const message = buildMessage()
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(message)
      }
    } catch {
      /* clipboard может быть недоступен — пользователь увидит инструкцию */
    }
    window.open(`https://t.me/${TG_BOT}`, '_blank', 'noopener,noreferrer')
    setSent(true)
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[88dvh]">
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        <div className="flex items-start justify-between px-5 pt-2 pb-3 gap-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2
              className="text-[18px] font-bold text-slate-900 leading-snug"
              style={{ fontFamily: SORA }}
            >
              {sent ? 'Спасибо!' : 'Связаться с нами'}
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5">
              {sent
                ? autoDelivered
                  ? 'Отправили — обычно отвечаем в течение дня'
                  : 'Текст скопирован — вставьте в чат и отправьте'
                : 'Напишите или надиктуйте — отвечаем лично'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100 shrink-0"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
            <div
              className="rounded-2xl px-4 py-4 flex items-start gap-3"
              style={{ background: INDIGO_SOFT, border: '1px solid oklch(88% 0.06 285)' }}
            >
              <Check size={18} style={{ color: INDIGO, marginTop: 2 }} />
              <div className="space-y-1.5">
                <p className="text-[14px] font-semibold" style={{ color: 'oklch(35% 0.18 285)' }}>
                  {autoDelivered ? 'Сообщение доставлено' : 'Telegram открылся в новой вкладке'}
                </p>
                <p className="text-[13px] text-slate-700 leading-relaxed">
                  {autoDelivered
                    ? 'Спасибо! Мы получили ваш отзыв и читаем его лично. Если оставили контакт — ответим в течение дня.'
                    : 'Вставьте текст в чат с @drivedocs_bot и нажмите «Отправить». Текст уже в буфере обмена — долгое нажатие на поле ввода → «Вставить».'}
                </p>
              </div>
            </div>

            {!autoDelivered && (
              <div className="rounded-2xl bg-slate-50 px-4 py-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Copy size={14} className="text-slate-500" />
                  <p className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">
                    Что в буфере
                  </p>
                </div>
                <pre className="text-[12px] text-slate-600 whitespace-pre-wrap font-mono leading-relaxed">
                  {buildMessage()}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
            {/* Kind selector */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Тип отзыва
              </p>
              <div className="grid grid-cols-4 gap-2">
                {KIND_OPTIONS.map(({ kind: k, icon: Icon, color }) => {
                  const active = k === kind
                  return (
                    <button
                      key={k}
                      onClick={() => setKind(k)}
                      className="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-2 active:scale-95 transition-transform"
                      style={{
                        borderColor: active ? color : 'oklch(92% 0.005 285)',
                        background: active ? `${color.replace(')', ' / 0.08)')}` : 'white',
                      }}
                    >
                      <Icon size={20} style={{ color }} />
                      <span
                        className="text-[11px] font-medium"
                        style={{ color: active ? color : 'oklch(45% 0.02 285)' }}
                      >
                        {FEEDBACK_KIND_LABEL[k]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Text */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  Сообщение
                </label>
                <button
                  type="button"
                  onClick={toggleMic}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold active:opacity-80"
                  style={{
                    background: speech.listening ? 'oklch(96% 0.04 25)' : INDIGO_SOFT,
                    color: speech.listening ? 'oklch(50% 0.21 25)' : INDIGO,
                    border: `1px solid ${speech.listening ? 'oklch(88% 0.08 25)' : 'oklch(88% 0.06 285)'}`,
                  }}
                  title={!speech.supported ? 'Голос доступен в Chrome, Edge или Safari' : undefined}
                >
                  {speech.listening ? <MicOff size={12} /> : <Mic size={12} />}
                  {speech.listening ? 'Стоп' : 'Надиктовать'}
                </button>
              </div>
              {speech.error && (
                <p className="text-[11px] text-red-600 mb-2">{speech.error}</p>
              )}
              {voiceUnsupportedNote && !speech.error && (
                <p className="text-[11px] text-slate-500 mb-2">{voiceUnsupportedNote}</p>
              )}
              <textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={5}
                placeholder={
                  kind === 'bug'
                    ? 'Что произошло? Где? Как воспроизвести?'
                    : kind === 'idea'
                    ? 'Что хотите добавить или улучшить?'
                    : kind === 'question'
                    ? 'Что непонятно?'
                    : 'Расскажите, что нравится — это важно'
                }
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400 resize-none"
              />
            </div>

            {/* Contact (optional) */}
            <div>
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">
                Контакт для ответа · необязательно
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="@username, e-mail или телефон"
                className="w-full px-3.5 py-3 rounded-2xl border border-slate-200 text-[14px] text-slate-900 placeholder:text-slate-500 focus:outline-none focus:border-slate-400"
              />
            </div>

            {/* Meta toggle */}
            <label className="flex items-start gap-3 px-3 py-3 rounded-2xl bg-slate-50 active:bg-slate-100 cursor-pointer">
              <input
                type="checkbox"
                checked={includeMeta}
                onChange={(e) => setIncludeMeta(e.target.checked)}
                className="mt-0.5 size-4 accent-slate-700"
              />
              <div>
                <p className="text-[13px] font-medium text-slate-900">
                  Приложить технические данные
                </p>
                <p className="text-[12px] text-slate-500 mt-0.5">
                  Тип организации, налоговый режим, версия браузера. Помогает быстрее
                  разобраться. Без персональных данных.
                </p>
              </div>
            </label>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0 space-y-2">
          {sent ? (
            <button
              onClick={onClose}
              className="w-full py-4 rounded-2xl text-base font-semibold text-white active:opacity-90"
              style={{ background: INDIGO }}
            >
              Готово
            </button>
          ) : (
            <>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white flex items-center justify-center gap-2 active:opacity-90 disabled:opacity-40"
                style={{ background: INDIGO }}
              >
                <Send size={16} />
                Отправить
              </button>
              <button
                onClick={onClose}
                className="w-full py-2 rounded-2xl text-[12px] font-medium text-slate-500 active:text-slate-600"
              >
                Отмена
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}
