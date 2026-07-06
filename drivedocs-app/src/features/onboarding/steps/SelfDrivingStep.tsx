import { useState } from 'react'
import { User, Users, Info } from 'lucide-react'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { HELP_TEAM_ROLES } from '@/entities/config/onboardingHelp'

interface SelfDrivingStepProps {
  selected?: boolean
  onSelect: (isSelf: boolean) => void
}

export function SelfDrivingStep({ selected, onSelect }: SelfDrivingStepProps) {
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-500 leading-relaxed mb-3">
        От этого зависит, что будем заполнять сейчас, а что — когда пригласите ещё водителей.
      </p>

      <Card
        active={selected === true}
        icon={<User size={20} />}
        title="Да, я вожу"
        subtitle="Заполню сейчас данные о себе и машине. Если позже понадобятся ещё водители — приглашу их по коду в настройках."
        onClick={() => onSelect(true)}
      />

      <Card
        active={selected === false}
        icon={<Users size={20} />}
        title="Нет, я только владелец"
        subtitle="Водители — сотрудники. Приглашу их сразу после настройки, они сами заполнят свои данные и данные машины."
        onClick={() => onSelect(false)}
      />

      <p className="text-[12px] text-slate-500 leading-relaxed mt-3 px-1">
        В любой момент можно добавить или убрать водителей в разделе «Настройки» → «Команда».
        Всего в одной компании — до 10 водителей и до 5 машин.
      </p>

      <button
        type="button"
        onClick={() => setShowHelp(true)}
        className="flex items-center gap-3 w-full p-3.5 rounded-2xl bg-blue-50 border border-blue-100 active:bg-blue-100 text-left mt-1"
      >
        <Info size={18} className="text-blue-600 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-900">Кто может добавлять и удалять водителей?</p>
          <p className="text-xs text-blue-700 mt-0.5">Права владельца и водителя — подробно</p>
        </div>
        <span className="text-blue-400 text-xs font-semibold shrink-0">Подробнее →</span>
      </button>

      {showHelp && (
        <HelpInfoSheet content={HELP_TEAM_ROLES} onClose={() => setShowHelp(false)} />
      )}
    </div>
  )
}

function Card({
  active,
  icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 rounded-2xl border-2 transition-colors active:opacity-90 ${
        active
          ? 'border-blue-500 bg-blue-50'
          : 'border-slate-200 bg-white active:border-slate-300'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
            active ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'
          }`}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className={`text-[15px] font-bold ${active ? 'text-blue-900' : 'text-slate-900'}`}>
            {title}
          </p>
          <p className="text-[13px] text-slate-600 leading-relaxed mt-1">{subtitle}</p>
        </div>
      </div>
    </button>
  )
}
