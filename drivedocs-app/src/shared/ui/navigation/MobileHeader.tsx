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
    <header
      className="sticky top-0 z-40 safe-top"
      style={{ background: 'rgba(255,255,255,0.88)', backdropFilter: 'blur(20px)', borderBottom: '1px solid oklch(92.5% 0.010 75 / 0.7)' }}
    >
      <div className="flex items-center justify-between px-4 h-14">
        {/* Workspace selector */}
        <button
          onClick={onOpenSwitcher}
          className="flex items-center gap-2 min-w-0 max-w-[70%] group"
          aria-label="Переключить предприятие"
        >
          {/* Brand dot */}
          <div className="w-7 h-7 rounded-xl bg-blue-600 flex items-center justify-center shrink-0
            shadow-[0_2px_8px_oklch(52%_0.225_285/0.35)]">
            <span className="text-white text-xs font-bold font-[Sora,system-ui]">D</span>
          </div>
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-widest leading-none">
              {ENTITY_TYPE_LABELS[workspace.entityType]}
            </span>
            <span className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {workspace.name}
            </span>
          </div>
          <ChevronDown size={14} className="text-slate-500 shrink-0 mt-0.5 group-active:text-slate-600 transition-colors" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl text-slate-500 active:bg-slate-100 transition-colors"
            aria-label="Уведомления"
          >
            <Bell size={20} strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full
                shadow-[0_0_0_2px_white]" />
            )}
          </button>
          <button
            onClick={onOpenQuickTrip}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600 text-white
              active:bg-blue-700 transition-all active:scale-95
              shadow-[0_2px_8px_oklch(52%_0.225_285/0.35)]"
            aria-label="Новая поездка"
          >
            <Plus size={18} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    </header>
  )
}
