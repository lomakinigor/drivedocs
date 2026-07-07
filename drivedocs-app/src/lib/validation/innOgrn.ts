// S1 — валидация ИНН (10/12 цифр) и ОГРН/ОГРНИП (13/15 цифр) с контрольной суммой.
// Стандартные алгоритмы ФНС — см. приказ ФНС/методику расчёта контрольного числа.

function digits(value: string): number[] {
  return value.replace(/\D/g, '').split('').map(Number)
}

/** ИНН: 10 цифр — организации, 12 цифр — ИП/физлица. */
export function validateInn(raw: string): { valid: boolean; reason?: string } {
  const clean = raw.replace(/\D/g, '')
  if (!clean) return { valid: true } // пустое — не наша забота, поле опционально
  if (clean.length !== 10 && clean.length !== 12) {
    return { valid: false, reason: 'ИНН должен содержать 10 цифр (организация) или 12 цифр (ИП)' }
  }
  const d = digits(clean)

  if (clean.length === 10) {
    const coeffs = [2, 4, 10, 3, 5, 9, 4, 6, 8]
    const n = coeffs.reduce((sum, c, i) => sum + c * d[i], 0) % 11 % 10
    if (n !== d[9]) return { valid: false, reason: 'Некорректная контрольная сумма ИНН' }
    return { valid: true }
  }

  const coeffs11 = [7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
  const n11 = coeffs11.reduce((sum, c, i) => sum + c * d[i], 0) % 11 % 10
  const coeffs12 = [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8]
  const n12 = coeffs12.reduce((sum, c, i) => sum + c * d[i], 0) % 11 % 10
  if (n11 !== d[10] || n12 !== d[11]) {
    return { valid: false, reason: 'Некорректная контрольная сумма ИНН' }
  }
  return { valid: true }
}

/** ОГРН: 13 цифр — организации, ОГРНИП: 15 цифр — ИП. */
export function validateOgrn(raw: string): { valid: boolean; reason?: string } {
  const clean = raw.replace(/\D/g, '')
  if (!clean) return { valid: true }
  if (clean.length !== 13 && clean.length !== 15) {
    return { valid: false, reason: 'ОГРН должен содержать 13 цифр (организация) или 15 цифр (ИП)' }
  }

  if (clean.length === 13) {
    const body = Number(clean.slice(0, 12))
    const control = body % 11 % 10
    if (control !== Number(clean[12])) {
      return { valid: false, reason: 'Некорректная контрольная сумма ОГРН' }
    }
    return { valid: true }
  }

  const body = Number(clean.slice(0, 14))
  const control = body % 13 % 10
  if (control !== Number(clean[14])) {
    return { valid: false, reason: 'Некорректная контрольная сумма ОГРНИП' }
  }
  return { valid: true }
}
