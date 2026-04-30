import { useState } from 'react'
import { Car, Navigation, Receipt, Printer, Mic, ChevronRight, X } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

const STEPS = [
  {
    icon: Car,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    title: 'Добавляйте поездки',
    body: 'Нажмите «Поездка» на главном экране — укажите откуда, куда и расстояние. Данные сохранятся в журнал и попадут в путевой лист.',
  },
  {
    icon: Navigation,
    iconBg: 'bg-indigo-100',
    iconColor: 'text-indigo-600',
    title: 'GPS-отслеживание',
    body: 'Кнопка «Отслеживать маршрут» запустит запись пути. После завершения поездки расстояние посчитается автоматически.',
  },
  {
    icon: Receipt,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    title: 'Сохраняйте чеки',
    body: 'Кнопка «Чек» — добавьте расходы на топливо, парковку или ремонт. Можно привязать чек к конкретной поездке.',
  },
  {
    icon: Printer,
    iconBg: 'bg-violet-100',
    iconColor: 'text-violet-600',
    title: 'Путевой лист',
    body: 'Кнопка «Путевой лист за сегодня» сформирует PDF для печати — готовый документ для бухгалтерии и налоговой.',
  },
  {
    icon: Mic,
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    title: 'Голосовой ввод',
    body: 'Иконка микрофона рядом с полями ввода позволяет надиктовать адрес или комментарий — удобно за рулём.',
  },
] as const

export function OnboardingTour() {
  const hasSeenTour = useWorkspaceStore((s) => s.hasSeenTour)
  const completeTour = useWorkspaceStore((s) => s.completeTour)
  const [step, setStep] = useState(0)

  if (hasSeenTour) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
        onClick={completeTour}
        aria-hidden="true"
      />

      {/* Card */}
      <div className="fixed bottom-0 left-0 right-0 z-[60] px-4 pb-8">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Progress bar */}
          <div className="h-1 bg-slate-100">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="px-6 pt-6 pb-5">
            {/* Skip */}
            <button
              onClick={completeTour}
              className="absolute top-5 right-5 p-1.5 text-slate-400 active:text-slate-600"
              aria-label="Закрыть"
            >
              <X size={18} />
            </button>

            {/* Step counter */}
            <p className="text-xs font-medium text-slate-400 mb-4">
              {step + 1} из {STEPS.length}
            </p>

            {/* Icon */}
            <div className={`w-14 h-14 rounded-2xl ${current.iconBg} flex items-center justify-center mb-4`}>
              <Icon size={28} className={current.iconColor} />
            </div>

            {/* Text */}
            <h2 className="text-lg font-bold text-slate-900 mb-2">{current.title}</h2>
            <p className="text-sm text-slate-500 leading-relaxed">{current.body}</p>

            {/* Actions */}
            <div className="flex items-center justify-between mt-6">
              {step > 0 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="text-sm font-medium text-slate-400 active:text-slate-600 py-1"
                >
                  Назад
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => (isLast ? completeTour() : setStep((s) => s + 1))}
                className="flex items-center gap-2 bg-blue-600 text-white text-sm font-semibold px-5 py-3 rounded-2xl active:bg-blue-700"
              >
                {isLast ? 'Начать работу' : 'Далее'}
                {!isLast && <ChevronRight size={16} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
