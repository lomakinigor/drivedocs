// F-033 — Feedback store (localStorage)
//
// Хранит отправленные/черновые отзывы локально как страховку — пользователь
// уходит в Telegram (@drivedocs_bot), но копия остаётся в браузере на случай,
// если Telegram не открылся или пользователь передумал отправлять.
//
// Доставка отзывов — через deep link в Telegram (zero-backend, см. FeedbackSheet).

const STORAGE_KEY = 'drivedocs:feedback:v1'
const MAX_ENTRIES = 50

export type FeedbackKind = 'love' | 'bug' | 'idea' | 'question'

export const FEEDBACK_KIND_LABEL: Record<FeedbackKind, string> = {
  love: 'Нравится',
  bug: 'Баг',
  idea: 'Идея',
  question: 'Вопрос',
}

export interface FeedbackEntry {
  id: string
  kind: FeedbackKind
  text: string
  contact?: string
  meta?: Record<string, unknown>
  createdAt: string
  /** Открыл ли пользователь Telegram. Не гарантирует отправку — только намерение. */
  sentToTelegram: boolean
}

function safeRead(): FeedbackEntry[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : []
  } catch {
    return []
  }
}

function safeWrite(data: FeedbackEntry[]): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data.slice(0, MAX_ENTRIES)))
  } catch {
    /* quota — silently skip */
  }
}

export function listFeedback(): FeedbackEntry[] {
  return safeRead()
}

export function addFeedback(entry: Omit<FeedbackEntry, 'id' | 'createdAt'>): FeedbackEntry {
  const full: FeedbackEntry = {
    ...entry,
    id: `fb-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  }
  safeWrite([full, ...safeRead()])
  return full
}

export function clearFeedback(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { drivedocsFeedback: unknown }).drivedocsFeedback = {
    list: listFeedback,
    clear: clearFeedback,
  }
}
