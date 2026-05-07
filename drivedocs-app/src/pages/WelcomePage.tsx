import { useNavigate } from 'react-router-dom'
import { Car, FileText, Receipt, ArrowRight, Clock } from 'lucide-react'

export function WelcomePage() {
  const navigate = useNavigate()

  return (
    <div className="flex flex-col h-full" style={{ background: 'oklch(98.8% 0.005 80)' }}>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 pt-14 pb-6 text-center overflow-hidden">

        {/* Background glow */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, oklch(94% 0.044 285 / 0.6), transparent 70%)' }}
        />

        {/* Brand mark */}
        <div className="relative mb-8 z-10">
          <div
            className="w-24 h-24 rounded-[28px] flex items-center justify-center"
            style={{
              background: 'oklch(52% 0.225 285)',
              boxShadow: '0 8px 32px oklch(52% 0.225 285 / 0.35), 0 2px 8px oklch(52% 0.225 285 / 0.20)',
            }}
          >
            <Car size={42} className="text-white" strokeWidth={1.7} />
          </div>
          {/* Trust badge */}
          <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center border-[2.5px] border-white shadow-sm">
            <span className="text-white text-sm leading-none font-bold">✓</span>
          </div>
        </div>

        {/* Headline */}
        <h1
          className="text-[2rem] font-bold text-slate-900 mb-2.5 leading-tight tracking-tight z-10"
          style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
        >
          DriveDocs
        </h1>
        <p className="text-[15px] text-slate-500 leading-relaxed max-w-[270px] mb-10 z-10">
          Учёт служебного транспорта для&nbsp;ИП и&nbsp;ООО —
          без&nbsp;Excel и&nbsp;лишних бумаг.
        </p>

        {/* Features */}
        <div className="flex flex-col gap-2.5 w-full max-w-sm z-10">
          <FeatureRow
            icon={Car}
            color="blue"
            title="Поездки и путевые листы"
            desc="GPS-трек или ввод вручную — документ готов"
          />
          <FeatureRow
            icon={Receipt}
            color="emerald"
            title="Чеки становятся расходами бизнеса"
            desc="До 180 000 ₽ в год — не из кармана, из компании"
          />
          <FeatureRow
            icon={FileText}
            color="violet"
            title="Документы за секунды"
            desc="Договор, приказ, акт — готовы к подписи"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-10 pt-2 space-y-3">
        <button
          onClick={() => navigate('/onboarding')}
          className="flex items-center justify-center gap-2.5 w-full text-white text-[15px] font-semibold py-4 rounded-2xl transition-all active:scale-[0.98]"
          style={{
            background: 'oklch(52% 0.225 285)',
            boxShadow: '0 4px 20px oklch(52% 0.225 285 / 0.40)',
          }}
        >
          Начать настройку
          <ArrowRight size={18} strokeWidth={2.2} />
        </button>
        <div className="flex items-center justify-center gap-1.5">
          <Clock size={12} className="text-slate-400" />
          <p className="text-xs text-slate-400">Займёт около 2 минут</p>
        </div>
      </div>
    </div>
  )
}

function FeatureRow({
  icon: Icon,
  color,
  title,
  desc,
}: {
  icon: React.ElementType
  color: 'blue' | 'emerald' | 'violet'
  title: string
  desc: string
}) {
  const styles = {
    blue:    { pill: 'bg-blue-100',    icon: 'text-blue-600' },
    emerald: { pill: 'bg-emerald-100', icon: 'text-emerald-600' },
    violet:  { pill: 'bg-violet-100',  icon: 'text-violet-600' },
  }
  const s = styles[color]

  return (
    <div className="flex items-center gap-3.5 bg-white rounded-2xl px-4 py-3.5 text-left shadow-[0_2px_10px_oklch(22%_0.028_280/0.05),_0_1px_3px_oklch(22%_0.028_280/0.04)]">
      <div className={`p-2.5 ${s.pill} rounded-xl shrink-0`}>
        <Icon size={18} className={s.icon} strokeWidth={1.8} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 leading-snug">{title}</p>
        <p className="text-xs text-slate-500 mt-0.5 leading-snug">{desc}</p>
      </div>
    </div>
  )
}
