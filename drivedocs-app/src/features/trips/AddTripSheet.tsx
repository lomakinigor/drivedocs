import { useState, useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import { useWorkspaceStore, todayISO } from '@/app/store/workspaceStore'
import { VoiceMicButton } from '@/shared/ui/VoiceMicButton'
import type { Trip, WorkspaceEvent } from '@/entities/types/domain'

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
}

function initialState(): FormState {
  return {
    date: todayISO(),
    from: '',
    to: '',
    distanceKm: '',
    purpose: '',
    customPurpose: '',
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

interface AddTripSheetProps {
  workspaceId: string
  onClose: () => void
  onSaved: () => void
}

export function AddTripSheet({ workspaceId, onClose, onSaved }: AddTripSheetProps) {
  const addTrip = useWorkspaceStore((s) => s.addTrip)
  const addEvent = useWorkspaceStore((s) => s.addEvent)
  const fromRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [touched, setTouched] = useState(false)

  // Auto-focus first field after sheet animates in
  useEffect(() => {
    const t = setTimeout(() => fromRef.current?.focus(), 150)
    return () => clearTimeout(t)
  }, [])

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

    const trip: Trip = {
      id: `trip-${Date.now()}`,
      workspaceId,
      date: form.date,
      startLocation: form.from.trim(),
      endLocation: form.to.trim(),
      distanceKm: km,
      purpose,
      createdAt: new Date().toISOString(),
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
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Новая поездка</h2>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-xl text-slate-400 active:bg-slate-100"
            aria-label="Закрыть"
          >
            <X size={20} />
          </button>
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
            </div>
          </Field>

          {/* Distance + Date — side by side */}
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
