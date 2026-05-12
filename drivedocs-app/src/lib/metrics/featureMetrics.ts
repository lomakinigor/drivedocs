// F-028 — Feature metrics (localStorage-based)
//
// Простой счётчик использования фич. Пишет в localStorage,
// читается админ-панелью или из консоли через `window.drivedocsMetrics`.
//
// Добавлять новые ключи — просто вызывать recordMetric('новый.ключ').
// Никаких миграций не требуется — отсутствующая запись = 0.
//
// Примеры ключей:
//   view.home / view.settings / view.reports / view.trips — page views
//   glonass.toggle — включение/выключение кнопки ГЛОНАСС (payload: { state: 'on'|'off' })
//   glonass.autofill — авто-заполнение адреса через GLONASS
//   addtrip.saved / addtrip.cancelled
//   ...

const STORAGE_KEY = 'drivedocs:metrics:v1'
const RECENT_LIMIT = 20

export interface MetricEntry {
  count: number
  firstUsed: string // ISO
  lastUsed: string  // ISO
  recent: Array<{ at: string; payload?: unknown }>
}

export type MetricsSnapshot = Record<string, MetricEntry>

function safeRead(): MetricsSnapshot {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MetricsSnapshot) : {}
  } catch {
    return {}
  }
}

function safeWrite(data: MetricsSnapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota / safari private mode → silently skip */
  }
}

/** Записать факт использования фичи. payload — опциональный контекст. */
export function recordMetric(key: string, payload?: unknown): void {
  const data = safeRead()
  const now = new Date().toISOString()
  const existing = data[key] ?? { count: 0, firstUsed: now, lastUsed: now, recent: [] }
  existing.count += 1
  existing.lastUsed = now
  const entry: { at: string; payload?: unknown } =
    payload === undefined ? { at: now } : { at: now, payload }
  existing.recent = [entry, ...existing.recent].slice(0, RECENT_LIMIT)
  data[key] = existing
  safeWrite(data)
}

export function getAllMetrics(): MetricsSnapshot {
  return safeRead()
}

export function getMetric(key: string): MetricEntry | undefined {
  return safeRead()[key]
}

export function clearMetrics(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

// ─── Debug expose ─────────────────────────────────────────────────────────────
// В консоли можно набрать: drivedocsMetrics.get() — увидеть все счётчики.
// Подключение в main.tsx не нужно — модуль self-attached при первом импорте.
if (typeof window !== 'undefined') {
  ;(window as unknown as { drivedocsMetrics: unknown }).drivedocsMetrics = {
    get: getAllMetrics,
    clear: clearMetrics,
    record: recordMetric,
  }
}
