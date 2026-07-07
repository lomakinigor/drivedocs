import { X, ArrowDown } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

export function OnboardingTour() {
  const hasSeenTour = useWorkspaceStore((s) => s.hasSeenTour)
  const completeTour = useWorkspaceStore((s) => s.completeTour)

  if (hasSeenTour) return null

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={completeTour}
        aria-hidden="true"
      />

      <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className="px-6 pt-6 pb-5 relative">
            <button
              onClick={completeTour}
              className="absolute top-5 right-5 p-3 text-slate-500 active:text-slate-600"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>

            <h2 className="text-lg font-bold text-slate-900 mb-2 pr-8">
              Готово, профиль настроен
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Дальше всё просто: создайте поездку, сфотографируйте чек —
              приложение само соберёт путевой лист и документы для ФНС.
            </p>

            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-blue-50 border border-blue-100 mb-5">
              <ArrowDown size={16} className="text-blue-600 shrink-0" />
              <p className="text-xs text-blue-900 leading-snug">
                Пролистайте главный экран вниз — там подсказки, что умеет приложение.
              </p>
            </div>

            <button
              onClick={completeTour}
              className="w-full bg-blue-600 text-white text-sm font-semibold py-3 rounded-2xl active:bg-blue-700"
            >
              Начать работу
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
