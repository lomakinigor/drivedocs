import { NavLink, useParams } from 'react-router-dom'
import { Home, CalendarDays, FileText, Car, BarChart2, Settings } from 'lucide-react'

export function BottomNav() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const base = `/w/${workspaceId}`

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-bottom">
      <div className="flex">
        {/* Home */}
        <NavLink to={`${base}/home`} className={({ isActive }) => navItemClass(isActive)}>
          <Home size={22} />
          <span className="text-[10px] font-medium leading-tight">Главная</span>
        </NavLink>

        {/* Today */}
        <NavLink to={`${base}/today`} className={({ isActive }) => navItemClass(isActive)}>
          <CalendarDays size={22} />
          <span className="text-[10px] font-medium leading-tight">Сегодня</span>
        </NavLink>

        {/* Documents */}
        <NavLink to={`${base}/documents`} className={({ isActive }) => navItemClass(isActive)}>
          <FileText size={22} />
          <span className="text-[10px] font-medium leading-tight">Документы</span>
        </NavLink>

        {/* Trips */}
        <NavLink to={`${base}/trips`} className={({ isActive }) => navItemClass(isActive)}>
          <Car size={22} />
          <span className="text-[10px] font-medium leading-tight">Поездки</span>
        </NavLink>

        {/* Analytics */}
        <NavLink to={`${base}/analytics`} className={({ isActive }) => navItemClass(isActive)}>
          <BarChart2 size={22} />
          <span className="text-[10px] font-medium leading-tight">Аналитика</span>
        </NavLink>

        {/* Settings */}
        <NavLink to={`${base}/settings`} className={({ isActive }) => navItemClass(isActive)}>
          <Settings size={22} />
          <span className="text-[10px] font-medium leading-tight">Настройки</span>
        </NavLink>
      </div>
    </nav>
  )
}

function navItemClass(isActive: boolean) {
  return `flex flex-col items-center justify-center flex-1 py-2 gap-0.5 min-h-[56px] transition-colors ${
    isActive ? 'text-blue-600' : 'text-slate-400 active:text-slate-600'
  }`
}
