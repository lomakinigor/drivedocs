import { useState, useRef, useEffect } from 'react'
import { X, LocateFixed, Loader, HelpCircle, Satellite } from 'lucide-react'
import { useWorkspaceStore, todayISO, useCurrentWorkspace, useWorkspaceTrips } from '@/app/store/workspaceStore'
import { VoiceMicButton } from '@/shared/ui/VoiceMicButton'
import { reverseGeocode } from '@/shared/lib/reverseGeocode'
import { calcFuelNorm } from '@/entities/config/fuelNorms'
import { HelpFuelNormsSheet } from '@/features/help/HelpFuelNorms'
import { recordMetric } from '@/lib/metrics/featureMetrics'
import type { Trip, WorkspaceEvent } from '@/entities/types/domain'

// F-028 — GLONASS toggle хранится в localStorage (per-user, не per-workspace).
const GLONASS_KEY = 'drivedocs:glonass-enabled:v1'
function readGlonass(): boolean {
  if (typeof window === 'undefined') return false
  try { return window.localStorage.getItem(GLONASS_KEY) === '1' } catch { return false }
}
function writeGlonass(on: boolean): void {
  if (typeof window === 'undefined') return
  try { window.localStorage.setItem(GLONASS_KEY, on ? '1' : '0') } catch { /* ignore */ }
}

// Найти адрес, который встречался ≥3 раз в последних поездках. Если нет — undefined.
function frequentStart(trips: Trip[]): string | undefined {
  const counts = new Map<string, number>()
  for (const t of trips.slice(0, 20)) {
    const key = t.startLocation?.trim()
    if (!key) continue
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best: { addr: string; n: number } | undefined
  for (const [addr, n] of counts) {
    if (n >= 3 && (!best || n > best.n)) best = { addr, n }
  }
  return best?.addr
}

// Одометр последней поездки на возврате — подставляется как «выезд» новой.
function lastOdometerEnd(trips: Trip[]): number | undefined {
  const sorted = [...trips].sort((a, b) => {
    const dd = b.date.localeCompare(a.date)
    if (dd !== 0) return dd
    return (b.createdAt ?? '').localeCompare(a.createdAt ?? '')
  })
  for (const t of sorted) {
    if (typeof t.odometerEnd === 'number' && isFinite(t.odometerEnd) && t.odometerEnd > 0) {
      return t.odometerEnd
    }
  }
  return undefined
}

// ─── Purpose options ──────────────────────────────────────────────────────────

const PURPOSES = [
  'Встреча с клиентом',
  'Переговоры с партнёром',
  'Поездка в банк или налоговую',
  'Доставка документов',
  'Командировка',
  'Другое',
] as const

type PurposeOption = (typeof PURPOSES)[number]

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  date: string
  from: string
  to: string
  distanceKm: string
  purpose: PurposeOption | ''
  customPurpose: string
  // F-027 — приказ 368: одометр обязателен для путевого
  odometerStart: string
  odometerEnd: string
}

function initialState(): FormState {
  return {
    date: todayISO(),
    from: '',
    to: 'По городу',                  // F-028 — дефолт «Куда»
    distanceKm: '',
    purpose: 'Переговоры с партнёром', // F-027
    customPurpose: '',
    odometerStart: '',
    odometerEnd: '',
  }
}

// ─── Validation ───────────────────────────────────────────────────────────────

interface FieldErrors {
  from?: string
  to?: string
  distanceKm?: string
  purpose?: string
}

function validate(form: FormState): FieldErrors {
  const errors: FieldErrors = {}
  if (!form.from.trim()) errors.from = 'Укажите откуда'
  if (!form.to.trim()) errors.to = 'Укажите куда'
  const km = parseFloat(form.distanceKm.replace(',', '.'))
  if (!form.distanceKm || isNaN(km) || km <= 0) errors.distanceKm = 'Укажите расстояние'
  const purpose = form.purpose === 'Другое' ? form.customPurpose.trim() : form.purpose
  if (!purpose) errors.purpose = 'Выберите цель поездки'
  return errors
}

function isValid(form: FormState): boolean {
  return Object.keys(validate(form)).length === 0
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TripPrefill {
  from?: string
  to?: string
  distanceKm?: number
}

interface AddTripSheetProps {
  workspaceId: string
  prefill?: TripPrefill
  onClose: () => void
  onSaved: () => void
}

export function AddTripSheet({ workspaceId, prefill, onClose, onSaved }: AddTripSheetProps) {
  const addTrip = useWorkspaceStore((s) => s.addTrip)
  const addEvent = useWorkspaceStore((s) => s.addEvent)
  const vehicleProfile = useWorkspaceStore((s) =>
    s.vehicleProfiles.find((v) => v.workspaceId === workspaceId),
  )
  const workspace = useCurrentWorkspace()
  const trips = useWorkspaceTrips(workspaceId) // мемоизированный селектор — критично, иначе infinite render
  const fromRef = useRef<HTMLInputElement>(null)
  const [helpOpen, setHelpOpen] = useState(false)
  const [glonassOn, setGlonassOn] = useState(() => readGlonass())

  const [form, setForm] = useState<FormState>(() => {
    const base = initialState()
    const freqFrom = frequentStart(trips) // F-028 — повторный адрес ≥3 раз
    const prevOdo = lastOdometerEnd(trips) // F-028 — одометр возврата прошлой поездки
    return {
      ...base,
      from: prefill?.from ?? freqFrom ?? '',
      to: prefill?.to ?? base.to,
      distanceKm: prefill?.distanceKm ? String(prefill.distanceKm) : '',
      odometerStart: prevOdo !== undefined ? String(prevOdo) : '',
    }
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)
  const [locatingFrom, setLocatingFrom] = useState(false)
  const [locatingTo, setLocatingTo] = useState(false)

  // Auto-focus first field after sheet animates in
  useEffect(() => {
    const t = setTimeout(() => fromRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

  // F-028 — Если GLONASS включён, при открытии формы пытаемся определить адрес.
  // Значение ГЛОНАСС всегда главное — перетирает frequent-fill, даже если уже стоит.
  useEffect(() => {
    if (!glonassOn || !navigator.geolocation) return
    let cancelled = false
    setLocatingFrom(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return
        try {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (!cancelled && addr) {
            setForm((prev) => ({ ...prev, from: addr }))
            recordMetric('glonass.autofill', { source: 'opensheet' })
          }
        } finally {
          if (!cancelled) setLocatingFrom(false)
        }
      },
      () => { if (!cancelled) setLocatingFrom(false) },
      { enableHighAccuracy: true, timeout: 10000 },
    )
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleGlonass = () => {
    const next = !glonassOn
    setGlonassOn(next)
    writeGlonass(next)
    recordMetric('glonass.toggle', { state: next ? 'on' : 'off' })
    // При включении сразу пытаемся определить
    if (next && navigator.geolocation) {
      setLocatingFrom(true)
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
          if (addr) {
            set({ from: addr })
            recordMetric('glonass.autofill', { source: 'toggle' })
          }
          setLocatingFrom(false)
        },
        () => setLocatingFrom(false),
        { enableHighAccuracy: true, timeout: 10000 },
      )
    }
  }

  const locateField = async (field: 'from' | 'to') => {
    if (!navigator.geolocation) return
    if (field === 'from') setLocatingFrom(true)
    else setLocatingTo(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const addr = await reverseGeocode(pos.coords.latitude, pos.coords.longitude)
        set({ [field]: addr })
        if (field === 'from') setLocatingFrom(false)
        else setLocatingTo(false)
      },
      () => {
        if (field === 'from') setLocatingFrom(false)
        else setLocatingTo(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const set = (patch: Partial<FormState>) =>
    setForm((prev) => ({ ...prev, ...patch }))

  const handleBlur = () => {
    if (!touched) return
    setErrors(validate(form))
  }

  const handleSubmit = () => {
    setTouched(true)
    const errs = validate(form)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    const km = parseFloat(form.distanceKm.replace(',', '.'))
    const purpose = form.purpose === 'Другое' ? form.customPurpose.trim() : form.purpose

    const odoStart = parseFloat(form.odometerStart.replace(',', '.'))
    const odoEnd = parseFloat(form.odometerEnd.replace(',', '.'))

    const trip: Trip = {
      id: `trip-${Date.now()}`,
      workspaceId,
      date: form.date,
      startLocation: form.from.trim(),
      endLocation: form.to.trim(),
      distanceKm: km,
      purpose,
      createdAt: new Date().toISOString(),
      tripMode: 'city', // F-028 — по умолчанию city; chip удалён
      ...(isFinite(odoStart) && odoStart >= 0 ? { odometerStart: odoStart } : {}),
      ...(isFinite(odoEnd) && odoEnd >= 0 ? { odometerEnd: odoEnd } : {}),
    }

    addTrip(trip)

    const event: WorkspaceEvent = {
      id: `ev-trip-${Date.now()}`,
      workspaceId,
      type: 'trip_logged',
      title: 'Поездка записана',
      description: `${trip.startLocation} → ${trip.endLocation}, ${trip.distanceKm} км`,
      date: new Date().toISOString(),
      isRead: false,
      severity: 'info',
    }
    addEvent(event)

    onSaved()
  }

  const ok = isValid(form)

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0 gap-3">
          <h2 className="text-base font-semibold text-slate-900">Новая поездка</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleGlonass}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[12px] font-semibold transition-colors ${
                glonassOn ? 'text-white' : 'border border-slate-200 text-slate-600 active:bg-slate-50'
              }`}
              style={glonassOn ? { background: 'oklch(52% 0.225 285)' } : undefined}
              aria-pressed={glonassOn}
            >
              <Satellite size={13} />
              ГЛОНАСС
            </button>
            <button
              onClick={onClose}
              className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100"
              aria-label="Закрыть"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable form */}
        <div className="flex-1 overflow-y-auto px-5 pb-2 space-y-4">
          {/* From */}
          <Field label="Откуда" error={touched ? errors.from : undefined}>
            <div className="flex items-center gap-1.5">
              <input
                ref={fromRef}
                type="text"
                value={form.from}
                onChange={(e) => set({ from: e.target.value })}
                onBlur={handleBlur}
                placeholder="Адрес или район"
                className={fieldClass(touched && !!errors.from)}
              />
              <VoiceMicButton onResult={(t) => set({ from: t })} />
              <button
                type="button"
                onClick={() => locateField('from')}
                disabled={locatingFrom}
                className="shrink-0 p-2 rounded-xl text-slate-400 active:bg-slate-100 disabled:opacity-40"
                aria-label="Определить местоположение"
              >
                {locatingFrom ? <Loader size={17} className="animate-spin" /> : <LocateFixed size={17} />}
              </button>
            </div>
          </Field>

          {/* To */}
          <Field label="Куда" error={touched ? errors.to : undefined}>
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={form.to}
                onChange={(e) => set({ to: e.target.value })}
                onBlur={handleBlur}
                placeholder="Адрес или район"
                className={fieldClass(touched && !!errors.to)}
              />
              <VoiceMicButton onResult={(t) => set({ to: t })} />
              <button
                type="button"
                onClick={() => locateField('to')}
                disabled={locatingTo}
                className="shrink-0 p-2 rounded-xl text-slate-400 active:bg-slate-100 disabled:opacity-40"
                aria-label="Определить местоположение"
              >
                {locatingTo ? <Loader size={17} className="animate-spin" /> : <LocateFixed size={17} />}
              </button>
            </div>
          </Field>

          {/* Odometer — пара (приказ 368, обязательное поле путевого) */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Одометр, выезд">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                autoComplete="off"
                value={form.odometerStart}
                onChange={(e) => {
                  // F-028 — допускаем только цифры и один разделитель (точка/запятая)
                  const next = e.target.value.replace(/[^\d.,]/g, '').replace(/([.,]).*\1/g, '$1')
                  const s = parseFloat(next.replace(',', '.'))
                  const eVal = parseFloat(form.odometerEnd.replace(',', '.'))
                  set({
                    odometerStart: next,
                    ...(isFinite(s) && isFinite(eVal) && eVal > s
                      ? { distanceKm: String(+(eVal - s).toFixed(1)) }
                      : {}),
                  })
                }}
                placeholder="км"
                className={fieldClass(false)}
              />
            </Field>
            <Field label="Одометр, возврат">
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                autoComplete="off"
                value={form.odometerEnd}
                onChange={(e) => {
                  const next = e.target.value.replace(/[^\d.,]/g, '').replace(/([.,]).*\1/g, '$1')
                  const s = parseFloat(form.odometerStart.replace(',', '.'))
                  const eVal = parseFloat(next.replace(',', '.'))
                  set({
                    odometerEnd: next,
                    ...(isFinite(s) && isFinite(eVal) && eVal > s
                      ? { distanceKm: String(+(eVal - s).toFixed(1)) }
                      : {}),
                  })
                }}
                placeholder="км"
                className={fieldClass(false)}
              />
            </Field>
          </div>

          {/* Distance + Date */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Расстояние, км" error={touched ? errors.distanceKm : undefined}>
              <input
                type="text"
                inputMode="decimal"
                value={form.distanceKm}
                onChange={(e) => set({ distanceKm: e.target.value })}
                onBlur={handleBlur}
                placeholder="0"
                className={fieldClass(touched && !!errors.distanceKm)}
              />
            </Field>

            <Field label="Дата">
              <input
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                max={todayISO()}
                className={fieldClass(false)}
              />
            </Field>
          </div>

          {/* Fuel norm preview (F-027) — режим всегда 'city' */}
          {(() => {
            const km = parseFloat(form.distanceKm.replace(',', '.'))
            const baseRate = vehicleProfile?.fuelConsumptionPer100km
            if (!baseRate || !isFinite(km) || km <= 0) return null
            const vehicleAgeYears = vehicleProfile?.year
              ? new Date().getFullYear() - vehicleProfile.year
              : undefined
            const profile = workspace?.fuelProfile
            const result = calcFuelNorm({
              baseRate,
              distanceKm: km,
              tripMode: 'city',
              citySize: profile?.citySize,
              winterRegion: profile?.winterRegion,
              hasAC: profile?.hasAC,
              vehicleAgeYears,
              date: form.date ? new Date(form.date) : new Date(),
            })
            return (
              <div
                className="rounded-[12px] px-3 py-2.5 flex items-start gap-2"
                style={{ background: 'oklch(94% 0.044 285)' }}
              >
                <div className="flex-1 text-[12px]" style={{ color: 'oklch(40% 0.18 285)' }}>
                  Норма расхода по АМ-23-р: <b>{result.normLiters.toLocaleString('ru-RU')} л</b>
                  {result.totalBonusPct !== 0 && (
                    <span className="opacity-75">
                      {' '}(база {baseRate} л/100 км × {result.totalBonusPct > 0 ? '+' : ''}{result.totalBonusPct}%)
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setHelpOpen(true)}
                  className="shrink-0 p-1 -m-1 rounded-lg active:bg-white/40"
                  style={{ color: 'oklch(52% 0.225 285)' }}
                  aria-label="Справка по нормам расхода"
                >
                  <HelpCircle size={16} />
                </button>
              </div>
            )
          })()}

          {/* Purpose */}
          <Field label="Цель поездки" error={touched ? errors.purpose : undefined}>
            <div className="space-y-1.5">
              {PURPOSES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    set({ purpose: p, customPurpose: '' })
                    setTouched(true)
                    setErrors((e) => ({ ...e, purpose: undefined }))
                  }}
                  className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl border transition-colors text-left ${
                    form.purpose === p
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 bg-white active:bg-slate-50'
                  }`}
                >
                  {/* Radio dot */}
                  <span
                    className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      form.purpose === p ? 'border-blue-500 bg-blue-500' : 'border-slate-300'
                    }`}
                  >
                    {form.purpose === p && (
                      <span className="w-1.5 h-1.5 bg-white rounded-full block" />
                    )}
                  </span>
                  <span className="text-sm text-slate-800">{p}</span>
                </button>
              ))}
            </div>

            {/* Custom purpose input */}
            {form.purpose === 'Другое' && (
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  value={form.customPurpose}
                  onChange={(e) => set({ customPurpose: e.target.value })}
                  onBlur={handleBlur}
                  placeholder="Опишите цель поездки"
                  autoFocus
                  className={fieldClass(touched && !form.customPurpose.trim())}
                />
                <VoiceMicButton onResult={(t) => set({ customPurpose: t })} />
              </div>
            )}
          </Field>

          {/* Bottom padding so last field clears sticky footer */}
          <div className="h-2" />
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSubmit}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors ${
              ok
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            Добавить поездку
          </button>
        </div>
      </div>

      {helpOpen && <HelpFuelNormsSheet onClose={() => setHelpOpen(false)} />}
    </>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fieldClass(hasError: boolean) {
  return `w-full px-3.5 py-3 text-sm text-slate-900 placeholder-slate-300 bg-white border-2 rounded-xl outline-none focus:border-blue-500 transition-colors ${
    hasError ? 'border-red-300' : 'border-slate-200'
  }`
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
