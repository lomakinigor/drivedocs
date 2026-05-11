import { NavLink, useParams } from 'react-router-dom'
import { Home, Car, BarChart2, Settings } from 'lucide-react'

// T-127 · F-022 · D-023
// Bottom navigation reduced from 6 to 4 tabs as per 9-screen IA spec.
// Phase A: первый таб ведёт на /home (HomePage становится «Сегодня»);
// в Phase B `analytics` будет переименован в `reports`.

const NAV_ITEMS = [
  { to: 'home',      icon: Home,      label: 'Сегодня' },
  { to: 'trips',     icon: Car,       label: 'Поездки' },
  { to: 'analytics', icon: BarChart2, label: 'Отчёты' },
  { to: 'settings',  icon: Settings,  label: 'Настройки' },
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
                <div className={`relative flex items-center justify-center w-12 h-9 rounded-xl transition-all duration-200 ${
                  isActive ? 'bg-blue-100' : ''
                }`}>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  {isActive && (
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                  )}
                </div>
                <span className={`text-[11px] font-medium leading-tight mt-0.5 ${isActive ? 'font-semibold' : ''}`}>
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
  return `flex flex-col items-center justify-center flex-1 py-2 gap-0 min-h-[60px] transition-colors ${
    isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'
  }`
}
