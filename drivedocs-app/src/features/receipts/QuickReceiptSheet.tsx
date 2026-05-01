import { useState } from 'react'
import { X, Camera, RotateCcw, Loader, Sparkles, CheckCheck } from 'lucide-react'
import { useWorkspaceStore, todayISO } from '@/app/store/workspaceStore'
import { usePhotoCapture } from '@/shared/hooks/usePhotoCapture'
import { useOcrExtract } from '@/shared/hooks/useOcrExtract'
import { VoiceMicButton } from '@/shared/ui/VoiceMicButton'
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
  const set = (patch: Partial<FormState>) => setForm((prev) => ({ ...prev, ...patch }))

  const ocr = useOcrExtract()

  const photo = usePhotoCapture({
    onCapture: (base64) => {
      set({ imageUrl: base64 })
      ocr.clear()
    },
  })

  const handleRemovePhoto = () => {
    set({ imageUrl: undefined })
    ocr.clear()
  }

  const handleOcrApplyAll = () => {
    if (!ocr.result) return
    const patch: Partial<FormState> = {}
    if (ocr.result.amount) patch.amount = ocr.result.amount
    if (ocr.result.date) patch.date = ocr.result.date
    if (ocr.result.description) patch.description = ocr.result.description
    if (ocr.result.category) patch.category = ocr.result.category
    set(patch)
    ocr.clear()
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
            <div className="flex items-center gap-1.5">
              <input
                type="text"
                value={form.description}
                onChange={(e) => set({ description: e.target.value })}
                placeholder="Например, АЗС Лукойл"
                className={fieldClass(false)}
              />
              <VoiceMicButton onResult={(t) => set({ description: t })} />
            </div>
          </Field>

          {/* Photo capture */}
          <Field label="Фото чека (необязательно)">
            <input
              ref={photo.inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={photo.handleChange}
            />
            <PhotoPicker
              imageUrl={form.imageUrl}
              loading={photo.loading}
              error={photo.error}
              onOpen={photo.open}
              onRemove={handleRemovePhoto}
            />
            {form.imageUrl && !ocr.result && (
              <OcrPanel
                loading={ocr.loading}
                error={ocr.error}
                onExtract={() => ocr.extract(form.imageUrl!)}
              />
            )}
            {ocr.result && (
              <OcrResultPanel
                result={ocr.result}
                onApplyAll={handleOcrApplyAll}
                onDismiss={ocr.clear}
              />
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

// ─── OCR Panel ────────────────────────────────────────────────────────────────

function OcrPanel({
  loading,
  error,
  onExtract,
}: {
  loading: boolean
  error: string | null
  onExtract: () => void
}) {
  if (error) {
    return (
      <div className="mt-2 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
        <p className="text-xs text-amber-700">{error}</p>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={onExtract}
      disabled={loading}
      className="mt-2 w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-violet-50 border border-violet-200 rounded-xl text-violet-700 text-sm font-medium active:bg-violet-100 disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader size={15} className="animate-spin shrink-0" />
          Распознаём…
        </>
      ) : (
        <>
          <Sparkles size={15} className="shrink-0" />
          Распознать с фото
        </>
      )}
    </button>
  )
}

// ─── OCR Result Panel ─────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  fuel: 'Топливо', parking: 'Парковка', repair: 'Ремонт', wash: 'Мойка', other: 'Другое',
}

function OcrResultPanel({
  result,
  onApplyAll,
  onDismiss,
}: {
  result: import('@/shared/hooks/useOcrExtract').OcrReceiptResult
  onApplyAll: () => void
  onDismiss: () => void
}) {
  const items = [
    result.amount && { label: 'Сумма', value: `${result.amount} ₽` },
    result.date && { label: 'Дата', value: result.date },
    result.description && { label: 'Место', value: result.description },
    result.category && { label: 'Категория', value: CATEGORY_LABELS[result.category] ?? result.category },
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <div className="mt-2 px-3 py-3 bg-violet-50 border border-violet-200 rounded-xl space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
          <Sparkles size={13} />
          Распознано
        </span>
        <button
          type="button"
          onClick={onDismiss}
          className="text-violet-400 active:text-violet-600"
          aria-label="Закрыть"
        >
          <X size={14} />
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item.label}
            className="px-2 py-1 bg-white border border-violet-200 rounded-lg text-xs text-slate-700"
          >
            <span className="text-violet-500 font-medium">{item.label}:</span> {item.value}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={onApplyAll}
        className="w-full flex items-center justify-center gap-1.5 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium active:bg-violet-700"
      >
        <CheckCheck size={15} />
        Применить всё
      </button>
    </div>
  )
}

export function PhotoPicker({
  imageUrl,
  loading,
  error,
  onOpen,
  onRemove,
  label = 'Прикрепить фото',
}: {
  imageUrl?: string
  loading?: boolean
  error?: string | null
  onOpen: () => void
  onRemove: () => void
  label?: string
}) {
  if (loading) {
    return (
      <div className="w-full flex items-center gap-2.5 px-3.5 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
        <Loader size={18} className="animate-spin shrink-0" />
        <span className="text-sm">Загрузка…</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {imageUrl ? (
        <>
          <div className="relative">
            <img
              src={imageUrl}
              alt="Фото"
              className="w-full h-36 object-cover rounded-xl"
            />
            <button
              type="button"
              onClick={onRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white active:bg-black/70"
              aria-label="Удалить фото"
            >
              <X size={13} />
            </button>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="flex items-center gap-1.5 text-xs text-blue-600 font-medium py-0.5"
          >
            <RotateCcw size={13} />
            Переснять
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="w-full flex items-center gap-2.5 px-3.5 py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-500 active:bg-slate-50"
        >
          <Camera size={18} className="shrink-0 text-slate-400" />
          <span className="text-sm">{label}</span>
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
