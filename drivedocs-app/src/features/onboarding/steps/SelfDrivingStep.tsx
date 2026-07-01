import { User, Users } from 'lucide-react'

interface SelfDrivingStepProps {
  selected?: boolean
  onSelect: (isSelf: boolean) => void
}

export function SelfDrivingStep({ selected, onSelect }: SelfDrivingStepProps) {
  return (
    <div className="space-y-3">
      <p className="text-[13px] text-slate-500 leading-relaxed mb-3">
        От этого зависит, что будем заполнять сейчас, а что — когда пригласите водителей.
      </p>

      <Card
        active={selected === true}
        icon={<User size={20} />}
        title="Да, я сам вожу"
        subtitle="Один водитель — это я. Заполню данные о себе и машине."
        onClick={() => onSelect(true)}
      />

      <Card
        active={selected === false}
        icon={<Users size={20} />}
        title="Нет, я только владелец"
        subtitle="Водители — сотрудники. Приглашу их по коду после настройки, они сами заполнят свои данные и данные машины."
        onClick={() => onSelect(false)}
      />
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
