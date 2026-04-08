import { ChevronDown, Bell, Plus } from 'lucide-react'
import { useParams } from 'react-router-dom'
import { useCurrentWorkspace, useUnreadEventsCount } from '@/app/store/workspaceStore'
import { ENTITY_TYPE_LABELS } from '@/entities/constants/labels'

interface MobileHeaderProps {
  onOpenSwitcher: () => void
  onOpenNotifications: () => void
  onOpenQuickTrip: () => void
}

export function MobileHeader({ onOpenSwitcher, onOpenNotifications, onOpenQuickTrip }: MobileHeaderProps) {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const workspace = useCurrentWorkspace()
  const unreadCount = useUnreadEventsCount(workspaceId ?? '')

  if (!workspace) return null

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-100 safe-top">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Workspace selector */}
        <button
          onClick={onOpenSwitcher}
          className="flex items-center gap-2 min-w-0 max-w-[70%]"
          aria-label="Переключить предприятие"
        >
          <div className="flex flex-col items-start min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wide">
                {ENTITY_TYPE_LABELS[workspace.entityType]}
              </span>
            </div>
            <span className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {workspace.name}
            </span>
          </div>
          <ChevronDown size={16} className="text-slate-400 shrink-0 mt-0.5" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-500 active:bg-slate-100"
            aria-label="Уведомления"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            )}
          </button>
          <button
            onClick={onOpenQuickTrip}
            className="p-2 rounded-xl bg-blue-600 text-white active:bg-blue-700"
            aria-label="Новая поездка"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>
    </header>
  )
}
