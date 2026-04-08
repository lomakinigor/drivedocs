import { NavLink, useParams } from 'react-router-dom'
import { Home, CalendarDays, FileText, Car, Bell, Settings } from 'lucide-react'
import { useUnreadEventsCount } from '@/app/store/workspaceStore'

export function BottomNav() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const base = `/w/${workspaceId}`
  const unread = useUnreadEventsCount(workspaceId ?? '')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 safe-bottom">
      <div className="flex">
        {/* Home */}
        <NavLink
          to={`${base}/home`}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <Home size={22} />
          <span className="text-[10px] font-medium leading-tight">Главная</span>
        </NavLink>

        {/* Today */}
        <NavLink
          to={`${base}/today`}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <CalendarDays size={22} />
          <span className="text-[10px] font-medium leading-tight">Сегодня</span>
        </NavLink>

        {/* Documents */}
        <NavLink
          to={`${base}/documents`}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <FileText size={22} />
          <span className="text-[10px] font-medium leading-tight">Документы</span>
        </NavLink>

        {/* Trips */}
        <NavLink
          to={`${base}/trips`}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <Car size={22} />
          <span className="text-[10px] font-medium leading-tight">Поездки</span>
        </NavLink>

        {/* Events — with unread badge */}
        <NavLink
          to={`${base}/events`}
          className={({ isActive }) => navItemClass(isActive)}
        >
          <span className="relative">
            <Bell size={22} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1.5 min-w-[16px] h-4 px-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium leading-tight">События</span>
        </NavLink>

        {/* Settings */}
        <NavLink
          to={`${base}/settings`}
          className={({ isActive }) => navItemClass(isActive)}
        >
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
