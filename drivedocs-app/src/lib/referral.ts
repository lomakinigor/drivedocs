// drivedocs-671 — базовое отслеживание: кто кого привёл, без экрана
// «Пригласить друга» и без бонус-механики (см. тикет — полный scope отложен).

const STORAGE_KEY = 'drivedocs-referred-by'
// Без 0/O/1/I/L — на слух и на глаз не спутать при передаче кода.
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

export function generateReferralCode(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('')
}

/**
 * Читает ?ref=XXXX из текущего URL и запоминает первое касание в localStorage —
 * повторный визит без ?ref не должен затирать уже сохранённый код.
 * Вызывать один раз при старте приложения.
 */
export function captureReferralFromUrl(): void {
  const ref = new URLSearchParams(window.location.search).get('ref')
  if (!ref) return
  if (localStorage.getItem(STORAGE_KEY)) return
  localStorage.setItem(STORAGE_KEY, ref.trim().toUpperCase())
}

/** Код, с которым пришёл текущий (ещё не заведший workspace) посетитель — или null. */
export function getCapturedReferral(): string | null {
  return localStorage.getItem(STORAGE_KEY)
}
