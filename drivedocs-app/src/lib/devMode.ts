// Единый dev-режим для админ-кнопок (полный сброс, аналитика и т.п.).
// Активируется через ?dev=1 в URL — флаг сохраняется в localStorage,
// после чего параметр в URL не нужен.
// Отключается через ?dev=0.

const STORAGE_KEY = 'drivedocs:dev-mode'

// Прочитать ?dev=... из URL и сохранить/очистить флаг. Параметр удаляется из URL.
// Вызывается один раз при старте приложения.
export function initDevMode(): void {
  if (typeof window === 'undefined') return
  try {
    const params = new URLSearchParams(window.location.search)
    const dev = params.get('dev')
    if (dev === '1') {
      localStorage.setItem(STORAGE_KEY, '1')
    } else if (dev === '0') {
      localStorage.removeItem(STORAGE_KEY)
    } else {
      return
    }
    params.delete('dev')
    const newSearch = params.toString()
    const newUrl = window.location.pathname + (newSearch ? `?${newSearch}` : '') + window.location.hash
    window.history.replaceState(null, '', newUrl)
  } catch {
    /* ignore */
  }
}

export function isDevMode(): boolean {
  if (import.meta.env.DEV) return true
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}
