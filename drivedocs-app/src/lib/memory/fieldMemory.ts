// F-029 — Правило «Запоминание» для полей форм (app-wide).
//
// Зафиксированное в коде поведение, по решению пользователя 2026-05-12:
//
//   Если в поле подряд 3 раза введено одно и то же значение,
//   следующий раз оно появляется в поле автоматически
//   (с возможностью ручной правки).
//
//   Если пользователь ИЗМЕНИЛ автозаполненное значение 2 раза подряд,
//   правило для этого поля сбрасывается — счётчик идёт заново до
//   следующих 3 одинаковых вводов.
//
//   Если между двумя «изменениями» пользователь снова ввёл совпадающее
//   значение — счётчик ошибок обнуляется (значит, не действительно
//   хочет менять).
//
// API:
//   getAutofillValue(key)   — что подставить в поле при открытии формы
//   recordFieldValue(key, value)  — вызвать на save формы с фактом ввода
//
// Хранилище: localStorage, ключ "drivedocs:field-memory:v1".
// Ключи фич рекомендуется делать scoped:
//   `${workspaceId}:addtrip.from`, `${workspaceId}:addtrip.to`,
//   `${workspaceId}:receipt.merchant`, и т.п.

const STORAGE_KEY = 'drivedocs:field-memory:v1'
const WINDOW_SIZE = 3              // 3 одинаковых ввода → autofill
const RESET_AFTER_OVERRIDES = 2    // 2 override-а → сброс правила

interface FieldEntry {
  /** Последние N (≤3) фактически сохранённых значений, oldest first. */
  recent: string[]
  /** Текущее автоподставляемое значение (если правило сработало). */
  autoValue?: string
  /** Счётчик override-ов с момента активации autoValue. */
  overrideCount: number
}

type Snapshot = Record<string, FieldEntry>

function read(): Snapshot {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Snapshot) : {}
  } catch {
    return {}
  }
}

function write(data: Snapshot): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    /* quota / private mode → silently skip */
  }
}

/** Что подставить в поле при открытии формы. Undefined = ничего не подставляем. */
export function getAutofillValue(key: string): string | undefined {
  return read()[key]?.autoValue
}

/**
 * Зафиксировать фактическое значение поля при сохранении формы.
 * Тут реализуется вся логика правила.
 */
export function recordFieldValue(key: string, value: string): void {
  const trimmed = value?.trim()
  if (!trimmed) return
  const data = read()
  const entry: FieldEntry = data[key] ?? { recent: [], overrideCount: 0 }

  const isOverride = !!entry.autoValue && trimmed !== entry.autoValue

  if (isOverride) {
    entry.overrideCount += 1
    if (entry.overrideCount >= RESET_AFTER_OVERRIDES) {
      // Сброс — пользователь точно хочет другое. Считаем заново.
      data[key] = { recent: [trimmed], overrideCount: 0 }
      write(data)
      return
    }
    // Один override — autoValue пока сохраняем, ждём второго
    entry.recent = [...entry.recent, trimmed].slice(-WINDOW_SIZE)
    data[key] = entry
    write(data)
    return
  }

  // Совпадает с autoValue или autoValue ещё не активирован → нормальная запись
  entry.recent = [...entry.recent, trimmed].slice(-WINDOW_SIZE)
  if (entry.autoValue && trimmed === entry.autoValue) {
    // Пользователь подтвердил autoValue → сбрасываем счётчик override-ов
    entry.overrideCount = 0
  }
  // Активация правила: если последние 3 = одно и то же
  if (
    entry.recent.length === WINDOW_SIZE &&
    entry.recent.every((v) => v === entry.recent[0])
  ) {
    entry.autoValue = entry.recent[0]
  }
  data[key] = entry
  write(data)
}

export function clearFieldMemory(key?: string): void {
  if (typeof window === 'undefined') return
  if (!key) {
    try { window.localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
    return
  }
  const data = read()
  delete data[key]
  write(data)
}

// Debug: window.drivedocsFieldMemory.get() / .clear()
if (typeof window !== 'undefined') {
  ;(window as unknown as { drivedocsFieldMemory: unknown }).drivedocsFieldMemory = {
    get: read,
    clear: clearFieldMemory,
  }
}
