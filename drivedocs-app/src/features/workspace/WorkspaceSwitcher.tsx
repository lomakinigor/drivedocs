import { Plus, Check, Building2 } from 'lucide-react'
import { BottomSheet } from '@/shared/ui/components/BottomSheet'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { ENTITY_TYPE_LABELS, TAX_MODE_LABELS } from '@/entities/constants/labels'

interface WorkspaceSwitcherProps {
  onSelect: (workspaceId: string) => void
  onClose: () => void
  onAddWorkspace: () => void
}

export function WorkspaceSwitcher({ onSelect, onClose, onAddWorkspace }: WorkspaceSwitcherProps) {
  const { workspaces, currentWorkspaceId } = useWorkspaceStore()

  return (
    <BottomSheet title="Выберите предприятие" onClose={onClose}>
      <div className="space-y-2 mb-4">
        {workspaces.map((ws) => {
          const isActive = ws.id === currentWorkspaceId
          return (
            <button
              key={ws.id}
              onClick={() => onSelect(ws.id)}
              className={`flex items-center gap-3 w-full p-3.5 rounded-2xl border transition-colors text-left ${
                isActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-slate-200 bg-white active:bg-slate-50'
              }`}
            >
              <div
                className={`p-2 rounded-xl shrink-0 ${
                  isActive ? 'bg-blue-100' : 'bg-slate-100'
                }`}
              >
                <Building2 size={20} className={isActive ? 'text-blue-600' : 'text-slate-500'} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold truncate ${
                    isActive ? 'text-blue-900' : 'text-slate-900'
                  }`}
                >
                  {ws.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {ENTITY_TYPE_LABELS[ws.entityType]} · {TAX_MODE_LABELS[ws.taxMode]}
                </p>
              </div>
              {isActive && (
                <Check size={18} className="text-blue-500 shrink-0" />
              )}
            </button>
          )
        })}
      </div>

      {/* Add workspace */}
      <button
        onClick={onAddWorkspace}
        className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 text-sm font-medium active:bg-slate-50"
      >
        <Plus size={18} />
        Добавить предприятие
      </button>
    </BottomSheet>
  )
}
