import type { ReactNode } from 'react'

interface BottomSheetProps {
  title?: string
  onClose: () => void
  children: ReactNode
}

export function BottomSheet({ title, onClose, children }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl safe-bottom animate-slide-up">
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {title && (
          <div className="px-5 pb-3 pt-1">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
          </div>
        )}

        <div className="px-5 pb-6">{children}</div>
      </div>
    </>
  )
}
