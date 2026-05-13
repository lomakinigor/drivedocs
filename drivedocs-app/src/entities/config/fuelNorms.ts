// F-027a — Справочник норм расхода топлива
// Источник: Распоряжение Минтранса РФ от 14.03.2008 № АМ-23-р (ред. от 30.09.2021)
// Формула: Qн = 0.01 × Hs × S × (1 + 0.01 × D)
//   Hs — базовая норма (л/100 км) из карточки авто
//   S  — пробег (км)
//   D  — суммарная надбавка (%)

import type { TripMode, CitySize, WinterRegion } from '@/entities/types/domain'

export const LEGAL_REFS = {
  AM23R: 'Распоряжение Минтранса РФ от 14.03.2008 № АМ-23-р (ред. от 30.09.2021)',
  ORDER368: 'Приказ Минтранса РФ от 11.09.2020 № 368 «Об обязательных реквизитах путевого листа»',
  FZ259: 'Федеральный закон от 08.11.2007 № 259-ФЗ «Устав автомобильного транспорта»',
  FZ196: 'Федеральный закон от 10.12.1995 № 196-ФЗ «О безопасности дорожного движения»',
  NK_264: 'НК РФ, ст. 264 п. 1 пп. 11 — расходы на содержание служебного транспорта',
} as const

// ─── Коэффициенты ─────────────────────────────────────────────────────────────

/** Городская надбавка по численности населения. */
export const CITY_BONUS: Record<CitySize, { pct: number; label: string }> = {
  mega: { pct: 35, label: 'Москва, СПб (свыше 5 млн)' },
  large: { pct: 25, label: '1–5 млн жителей' },
  medium: { pct: 15, label: '250 тыс. – 1 млн' },
  small: { pct: 10, label: '100–250 тыс.' },
  tiny: { pct: 5, label: 'до 100 тыс.' },
}

/** Скидка для загородного / трассового режима (дороги I–III категории). */
export const HIGHWAY_DISCOUNT_PCT = -15

/** Зимняя надбавка по региону. Применяется в холодный сезон (см. WINTER_MONTHS). */
export const WINTER_BONUS: Record<WinterRegion, { pct: number; label: string; months: number[] }> = {
  mild: { pct: 5, label: 'Юг (Краснодар, Ставрополь)', months: [11, 0, 1] }, // дек–фев
  moderate: { pct: 10, label: 'Центр (Москва, СПб)', months: [10, 11, 0, 1, 2] }, // ноя–мар
  severe: { pct: 15, label: 'Урал, Западная Сибирь', months: [9, 10, 11, 0, 1, 2, 3] }, // окт–апр
  extreme: { pct: 20, label: 'Восточная Сибирь, Якутия, Крайний Север', months: [9, 10, 11, 0, 1, 2, 3] },
}

/** Кондиционер / климат-контроль (применяется в тёплый сезон). */
export const AC_BONUS_PCT = 7

/** Возрастные надбавки. */
export const AGE_BONUS = {
  age5: { pct: 5, label: 'Авто старше 5 лет / пробег > 100 000 км' },
  age8: { pct: 10, label: 'Авто старше 8 лет / пробег > 150 000 км' },
} as const

// ─── Тип результата ───────────────────────────────────────────────────────────

export interface FuelNormBonus {
  label: string
  pct: number
  legalRef: string
}

export interface FuelNormResult {
  /** Норма расхода в литрах для этой поездки. */
  normLiters: number
  /** Суммарный коэффициент D в процентах. */
  totalBonusPct: number
  /** Расшифровка применённых надбавок (для UI и PDF). */
  bonuses: FuelNormBonus[]
  /** Базовая норма авто, л/100 км. */
  baseRate: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isWinterMonth(date: Date, region: WinterRegion): boolean {
  return WINTER_BONUS[region].months.includes(date.getMonth())
}

// ─── Главная функция ──────────────────────────────────────────────────────────

export interface CalcFuelNormInput {
  /** Базовая норма авто, л/100 км (`VehicleProfile.fuelConsumptionPer100km`). */
  baseRate: number
  /** Пробег поездки, км. */
  distanceKm: number
  tripMode: TripMode
  citySize?: CitySize
  winterRegion?: WinterRegion
  hasAC?: boolean
  /** Возраст авто на момент поездки в годах (computed `today.year - vehicle.year`). */
  vehicleAgeYears?: number
  /** Дата поездки (для определения зимнего сезона). По умолчанию — сегодня. */
  date?: Date
}

export function calcFuelNorm(input: CalcFuelNormInput): FuelNormResult {
  const date = input.date ?? new Date()
  const bonuses: FuelNormBonus[] = []
  let totalPct = 0

  // 1. Городская надбавка ИЛИ загородная скидка
  if (input.tripMode === 'city') {
    const size = input.citySize ?? 'medium'
    const b = CITY_BONUS[size]
    bonuses.push({ label: `Город · ${b.label}`, pct: b.pct, legalRef: LEGAL_REFS.AM23R })
    totalPct += b.pct
  } else if (input.tripMode === 'suburban') {
    bonuses.push({
      label: 'Загородняя дорога (I–III кат.)',
      pct: HIGHWAY_DISCOUNT_PCT,
      legalRef: LEGAL_REFS.AM23R,
    })
    totalPct += HIGHWAY_DISCOUNT_PCT
  }

  // 2. Зимняя надбавка (авто по дате)
  if (input.winterRegion && isWinterMonth(date, input.winterRegion)) {
    const w = WINTER_BONUS[input.winterRegion]
    bonuses.push({ label: `Зима · ${w.label}`, pct: w.pct, legalRef: LEGAL_REFS.AM23R })
    totalPct += w.pct
  }

  // 3. Кондиционер (только в тёплый сезон — апрель–октябрь)
  if (input.hasAC) {
    const isWarm = date.getMonth() >= 3 && date.getMonth() <= 9
    if (isWarm) {
      bonuses.push({ label: 'Кондиционер', pct: AC_BONUS_PCT, legalRef: LEGAL_REFS.AM23R })
      totalPct += AC_BONUS_PCT
    }
  }

  // 4. Возраст авто
  if (input.vehicleAgeYears !== undefined) {
    if (input.vehicleAgeYears >= 8) {
      bonuses.push({ label: AGE_BONUS.age8.label, pct: AGE_BONUS.age8.pct, legalRef: LEGAL_REFS.AM23R })
      totalPct += AGE_BONUS.age8.pct
    } else if (input.vehicleAgeYears >= 5) {
      bonuses.push({ label: AGE_BONUS.age5.label, pct: AGE_BONUS.age5.pct, legalRef: LEGAL_REFS.AM23R })
      totalPct += AGE_BONUS.age5.pct
    }
  }

  // Qн = 0.01 × Hs × S × (1 + 0.01 × D)
  const normLiters = +(0.01 * input.baseRate * input.distanceKm * (1 + 0.01 * totalPct)).toFixed(2)

  return {
    normLiters,
    totalBonusPct: totalPct,
    bonuses,
    baseRate: input.baseRate,
  }
}
