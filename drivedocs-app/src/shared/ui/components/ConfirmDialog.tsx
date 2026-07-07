import { BottomSheet } from './BottomSheet'

interface ConfirmDialogProps {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <BottomSheet title={title} onClose={onCancel}>
      <p className="text-sm text-slate-600 leading-relaxed mb-5">{message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex-1 py-3 rounded-2xl border border-slate-200 text-sm font-medium text-slate-600 active:bg-slate-50 disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={busy}
          className={`flex-1 py-3 rounded-2xl text-sm font-semibold text-white active:opacity-90 disabled:opacity-50 ${
            danger ? 'bg-red-600' : 'bg-blue-600'
          }`}
        >
          {busy ? '…' : confirmLabel}
        </button>
      </div>
    </BottomSheet>
  )
}
