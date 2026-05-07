import { NavLink, useParams } from 'react-router-dom'
import { Home, CalendarDays, FileText, Car, BarChart2, Settings } from 'lucide-react'

const NAV_ITEMS = [
  { to: 'home',      icon: Home,        label: 'Главная' },
  { to: 'today',     icon: CalendarDays, label: 'Сегодня' },
  { to: 'documents', icon: FileText,     label: 'Документы' },
  { to: 'trips',     icon: Car,          label: 'Поездки' },
  { to: 'analytics', icon: BarChart2,    label: 'Аналитика' },
  { to: 'settings',  icon: Settings,     label: 'Настройки' },
] as const

export function BottomNav() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const base = `/w/${workspaceId}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(20px)', borderTop: '1px solid oklch(92.5% 0.010 75 / 0.8)' }}
    >
      <div className="flex">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={`${base}/${to}`} className={({ isActive }) => navItemClass(isActive)}>
            {({ isActive }) => (
              <>
                <div className={`relative flex items-center justify-center w-10 h-8 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-100' : ''
                }`}>
                  <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`text-[10px] font-medium leading-tight mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function navItemClass(isActive: boolean) {
  return `flex flex-col items-center justify-center flex-1 py-2 gap-0 min-h-[56px] transition-colors ${
    isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'
  }`
}
