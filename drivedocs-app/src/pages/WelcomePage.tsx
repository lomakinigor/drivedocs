import { useNavigate } from 'react-router-dom'
import { Car, FileText, Receipt, ArrowRight } from 'lucide-react'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full bg-white px-6 pt-16 pb-10">
      {/* Logo area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
          <Car size={36} className="text-white" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-3 leading-snug">
          DriveDocs
        </h1>
        <p className="text-base text-slate-500 leading-relaxed max-w-xs mb-10">
          Учёт служебного транспорта для&nbsp;ИП и&nbsp;ООО — путевые листы,
          расходы и документы без лишних бумаг.
        </p>

        {/* Feature pills */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <FeatureRow icon={Car} text="Поездки и путевые листы автоматически" />
          <FeatureRow icon={Receipt} text="Чеки на топливо и ТО — из кармана в расходы бизнеса" />
          <FeatureRow icon={FileText} text="Все документы готовы — договор, приказ, акт" />
        </div>
      </div>

      {/* CTA */}
      <div className="space-y-3">
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white text-base font-semibold py-4 rounded-2xl active:bg-blue-700 transition-colors"
        >
          Начать настройку
          <ArrowRight size={18} />
        </button>
        <p className="text-center text-xs text-slate-400">Займёт около 2 минут</p>
      </div>
    </div>
  )
}

function FeatureRow({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="flex items-center gap-3 bg-slate-50 rounded-2xl px-4 py-3 text-left">
      <div className="p-1.5 bg-white rounded-xl shadow-sm shrink-0">
        <Icon size={16} className="text-blue-600" />
      </div>
      <p className="text-sm text-slate-700 leading-snug">{text}</p>
    </div>
  )
}
