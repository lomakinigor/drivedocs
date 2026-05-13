import { useState } from 'react'
import { AlertCircle, Check, X, Building2, Car, User, ChevronRight } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { VehicleProfileSheet } from '@/features/workspace/VehicleProfileSheet'
import { DriversSheet } from '@/features/workspace/DriversSheet'
import { OrgProfileSheet } from '@/features/workspace/OrgProfileSheet'
import { useVehicleProfile } from '@/app/store/workspaceStore'
import { useEssentialsStatus, type EssentialBlock } from './useEssentialsStatus'

// F-026 — Напоминалка о минимальных документах для путевого листа.
// КРАСНАЯ — блокирует основной use case (без неё путевой лист не формируется).
// Документы предприятия (приказы, договоры) — отдельный жёлтый attention.

const RED_BG = 'oklch(96% 0.04 25)'
const RED_BORDER = 'oklch(88% 0.08 25)'
const RED_ICON_BG = 'oklch(90% 0.10 25)'
const RED_TEXT = 'oklch(48% 0.18 25)'
const RED_DARK = 'oklch(40% 0.20 25)'

export function EssentialsReminderCard({
  workspaceId,
  onTap,
}: {
  workspaceId: string
  onTap: () => void
}) {
  const status = useEssentialsStatus(workspaceId)
  if (!status.shouldRemind) return null

  return (
    <button
      onClick={onTap}
      className="w-full mb-5 rounded-[18px] px-4 py-3.5 flex items-center gap-3 text-left active:opacity-90 transition-opacity"
      style={{ background: RED_BG, border: `1px solid ${RED_BORDER}` }}
    >
      <span
        className="w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0"
        style={{ background: RED_ICON_BG }}
      >
        <AlertCircle size={18} style={{ color: RED_DARK }} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-semibold leading-snug" style={{ color: RED_DARK }}>
          Документы для путевого листа
        </div>
        <div className="text-[11px] mt-0.5" style={{ color: RED_TEXT }}>
          Не хватает {status.missingCount} из 3 · без них путевой лист не оформить
        </div>
      </div>
      <ChevronRight size={18} style={{ color: RED_TEXT }} />
    </button>
  )
}

interface EssentialsSheetProps {
  workspaceId: string
  onClose: () => void
}

export function EssentialsSheet({ workspaceId, onClose }: EssentialsSheetProps) {
  const status = useEssentialsStatus(workspaceId)
  const vehicleProfile = useVehicleProfile(workspaceId)

  const [openSub, setOpenSub] = useState<null | 'org' | 'vehicle' | 'driver'>(null)

  const blockIcon = (key: EssentialBlock['key']) => {
    if (key === 'org') return <Building2 size={18} />
    if (key === 'vehicle') return <Car size={18} />
    return <User size={18} />
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl flex flex-col max-h-[92dvh]">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-start justify-between px-5 pt-2 pb-3 shrink-0">
          <div className="flex-1 min-w-0">
            <h2
              className="text-[18px] font-bold text-slate-900"
              style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
            >
              Документы для путевого листа
            </h2>
            <p className="text-[12px] text-slate-500 mt-0.5 leading-relaxed">
              Минимальный набор по приказу Минтранса № 152. Без него путевой лист
              не будет принят налоговой.
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 -mr-1 rounded-xl text-slate-500 active:bg-slate-100 shrink-0">
            <X size={20} />
          </button>
        </div>

        {/* Block list */}
        <div className="flex-1 overflow-y-auto px-5 pb-3 space-y-2">
          {status.blocks.map((b) => (
            <button
              key={b.key}
              onClick={() => {
                if (b.key === 'org') setOpenSub('org')
                else if (b.key === 'vehicle') setOpenSub('vehicle')
                else if (b.key === 'driver') setOpenSub('driver')
              }}
              className="w-full bg-white rounded-[16px] border border-slate-100 px-4 py-3 flex items-center gap-3 text-left active:bg-slate-50 transition-colors"
            >
              <span
                className={`w-9 h-9 rounded-[12px] flex items-center justify-center shrink-0 ${b.done ? '' : ''}`}
                style={
                  b.done
                    ? { background: 'oklch(94% 0.06 155)', color: 'oklch(45% 0.13 155)' }
                    : { background: RED_ICON_BG, color: RED_DARK }
                }
              >
                {b.done ? <Check size={18} strokeWidth={2.6} /> : blockIcon(b.key)}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className="text-[14px] font-semibold text-slate-900"
                  style={{ fontFamily: 'Sora, system-ui, sans-serif' }}
                >
                  {b.label}
                </div>
                <div className="text-[12px] text-slate-500 mt-0.5">
                  {b.done ? 'Заполнено' : b.description}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-300 shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer actions */}
        <div className="border-t border-slate-100 px-5 pt-3 pb-6 space-y-2 shrink-0">
          {/* 2026-05-13 — Кнопка «У меня уже есть документы» убрана:
              essentials критичны (без них путевой лист недействителен),
              их нельзя ack — только заполнить. */}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[13px] font-medium text-slate-500 active:text-slate-700"
          >
            Закрыть
          </button>
          <p className="text-[11px] text-center pt-1 leading-relaxed" style={{ color: 'oklch(50% 0.18 25)' }}>
            Без этих данных путевой лист недействителен. Напоминалка останется на главной,
            пока вы их не заполните — пропустить нельзя.
          </p>
        </div>
      </div>

      {/* Subsheets — переиспользуем существующие */}
      {openSub === 'org' && (
        <OrgProfileSheet
          workspaceId={workspaceId}
          entityType={useWorkspaceStore.getState().workspaces.find((w) => w.id === workspaceId)?.entityType ?? 'IP'}
          onClose={() => setOpenSub(null)}
        />
      )}
      {openSub === 'vehicle' && (
        <VehicleProfileSheet
          workspaceId={workspaceId}
          profile={vehicleProfile ?? {
            workspaceId,
            make: '',
            model: '',
            year: new Date().getFullYear(),
            licensePlate: '',
          }}
          onClose={() => setOpenSub(null)}
        />
      )}
      {openSub === 'driver' && (
        <DriversSheet workspaceId={workspaceId} onClose={() => setOpenSub(null)} />
      )}
    </>
  )
}

// Helper hook re-export for HomePage convenience
export { useEssentialsStatus } from './useEssentialsStatus'
