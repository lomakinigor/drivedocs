import { useState, useRef } from 'react'
import { X, Camera, RotateCcw } from 'lucide-react'
import { useWorkspaceStore, todayISO } from '@/app/store/workspaceStore'
import type { Receipt, ReceiptCategory } from '@/entities/types/domain'

// ─── Category options ─────────────────────────────────────────────────────────

const CATEGORIES: { value: ReceiptCategory; label: string }[] = [
  { value: 'fuel', label: 'Топливо' },
  { value: 'parking', label: 'Парковка' },
  { value: 'repair', label: 'Ремонт' },
  { value: 'wash', label: 'Мойка' },
  { value: 'other', label: 'Другое' },
]

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  amount: string
  category: ReceiptCategory | ''
  date: string
  description: string
  imageUrl: string | undefined
}

function initialState(): FormState {
  return { amount: '', category: '', date: todayISO(), description: '', imageUrl: undefined }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface QuickReceiptSheetProps {
  workspaceId: string
  onClose: () => void
}

export function QuickReceiptSheet({ workspaceId, onClose }: QuickReceiptSheetProps) {
  const addReceipt = useWorkspaceStore((s) => s.addReceipt)
  const [form, setForm] = useState<FormState>(initialState)
  const [touched, setTouched] = useState(false)
  const [photoError, setPhotoError] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoError(false)
    set({ imageUrl: URL.createObjectURL(file) })
  }

  const handleRemovePhoto = () => {
    set({ imageUrl: undefined })
    setPhotoError(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const amountNum = parseFloat(form.amount.replace(',', '.'))
  const isValid = form.amount.trim() !== '' && !isNaN(amountNum) && amountNum > 0

  const handleSave = () => {
    setTouched(true)
    if (!isValid) return

    const receipt: Receipt = {
      id: `rec-${Date.now()}`,
      workspaceId,
      date: form.date,
      amount: amountNum,
      category: form.category || 'other',
      description: form.description.trim() || undefined,
      imageUrl: form.imageUrl,
    }

    addReceipt(receipt)
    onClose()
  }

  const amountError = touched && !isValid ? 'Укажите сумму' : undefined

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[85dvh]">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-1 pb-3 shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Новый чек</h2>
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
          {/* Amount + Date */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Сумма, ₽" error={amountError}>
              <input
                type="text"
                inputMode="decimal"
                value={form.amount}
                onChange={(e) => set({ amount: e.target.value })}
                placeholder="0"
                autoFocus
                className={fieldClass(!!amountError)}
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

          {/* Category */}
          <Field label="Категория">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => set({ category: cat.value })}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-colors ${
                    form.category === cat.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-700 active:bg-slate-50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </Field>

          {/* Description (optional) */}
          <Field label="Комментарий (необязательно)">
            <input
              type="text"
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Например, АЗС Лукойл"
              className={fieldClass(false)}
            />
          </Field>

          {/* Photo capture */}
          <Field label="Фото чека (необязательно)">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handlePhotoChange}
            />
            {form.imageUrl ? (
              <div className="space-y-2">
                <div className="relative">
                  <img
                    src={form.imageUrl}
                    alt="Фото чека"
                    className="w-full h-32 object-cover rounded-xl"
                    onError={() => {
                      setPhotoError(true)
                      handleRemovePhoto()
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white active:bg-black/70"
                    aria-label="Удалить фото"
                  >
                    <X size={13} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 text-xs text-blue-600 font-medium py-0.5"
                >
                  <RotateCcw size={13} />
                  Переснять
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center gap-2.5 px-3.5 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 active:bg-slate-50"
              >
                <Camera size={18} className="shrink-0 text-slate-400" />
                <span className="text-sm">Прикрепить фото</span>
              </button>
            )}
            {photoError && (
              <p className="text-xs text-red-500 mt-1">Не удалось загрузить фото — попробуйте другой файл</p>
            )}
          </Field>

          <div className="h-2" />
        </div>

        {/* Sticky footer */}
        <div className="px-5 py-4 border-t border-slate-100 shrink-0">
          <button
            onClick={handleSave}
            className={`w-full py-4 rounded-2xl text-base font-semibold transition-colors ${
              isValid
                ? 'bg-blue-600 text-white active:bg-blue-700'
                : 'bg-slate-100 text-slate-400'
            }`}
          >
            Сохранить чек
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
