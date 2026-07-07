import { useEffect, useRef, useState } from 'react'

// S5 — автосохранение черновиков форм (поездка, чек) в localStorage.
// Пишем раз в 3с, предлагаем восстановить при следующем открытии формы,
// очищаем после успешного submit. Черновики старше суток не предлагаем —
// скорее всего юзер уже не вспомнит контекст ввода.

const PREFIX = 'drivedocs:draft:'
const MAX_AGE_MS = 24 * 60 * 60 * 1000
const SAVE_INTERVAL_MS = 3000

interface DraftEnvelope<T> {
  savedAt: string
  values: T
}

function readDraft<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return null
    const parsed = JSON.parse(raw) as DraftEnvelope<T>
    if (Date.now() - new Date(parsed.savedAt).getTime() > MAX_AGE_MS) {
      localStorage.removeItem(PREFIX + key)
      return null
    }
    return parsed.values
  } catch {
    return null
  }
}

function writeDraft<T>(key: string, values: T): void {
  try {
    const envelope: DraftEnvelope<T> = { savedAt: new Date().toISOString(), values }
    localStorage.setItem(PREFIX + key, JSON.stringify(envelope))
  } catch {
    /* quota — молча пропускаем, это не критичный функционал */
  }
}

export function clearDraft(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    /* ignore */
  }
}

/**
 * Периодически сохраняет values под ключом key. initialDraft — то, что было
 * найдено ПРИ МОНТИРОВАНИИ компонента (для плашки «восстановить последний
 * ввод?»); хук не подписывается на изменения после монтирования сам —
 * актуальные values передаёт вызывающий код на каждый рендер.
 */
export function useFormDraft<T>(key: string, values: T): { initialDraft: T | null } {
  const [initialDraft] = useState<T | null>(() => readDraft<T>(key))
  const valuesRef = useRef(values)

  useEffect(() => {
    valuesRef.current = values
  }, [values])

  useEffect(() => {
    const interval = setInterval(() => {
      writeDraft(key, valuesRef.current)
    }, SAVE_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [key])

  return { initialDraft }
}
