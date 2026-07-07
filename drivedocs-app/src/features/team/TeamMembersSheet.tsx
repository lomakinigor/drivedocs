import { useEffect, useState } from 'react'
import { X, User, UserX, Crown } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useUserRole } from './useUserRole'
import { HelpInfoSheet } from '@/shared/ui/components/HelpInfoSheet'
import { ConfirmDialog } from '@/shared/ui/components/ConfirmDialog'
import { HELP_TEAM_ROLES } from '@/entities/config/onboardingHelp'

interface TeamMembersSheetProps {
  workspaceId: string
  onClose: () => void
}

interface Member {
  id: string
  user_id: string
  role: 'owner' | 'driver'
  is_active_driver: boolean
  driver_full_name: string | null
  driver_phone: string | null
  joined_at: string
}

export function TeamMembersSheet({ workspaceId, onClose }: TeamMembersSheetProps) {
  const [members, setMembers] = useState<Member[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [revokingId, setRevokingId] = useState<string | null>(null)
  const [revokeError, setRevokeError] = useState<string | null>(null)
  const [pendingRevoke, setPendingRevoke] = useState<Member | null>(null)
  const userRole = useUserRole(workspaceId)
  const canRevoke = userRole === 'owner'
  const [showRolesHelp, setShowRolesHelp] = useState(false)

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function load() {
    if (!supabase) {
      setError('Backend не подключён')
      return
    }
    setError(null)
    const { data, error: err } = await supabase
      .from('workspace_members')
      .select('id, user_id, role, is_active_driver, driver_full_name, driver_phone, joined_at')
      .eq('workspace_id', workspaceId)
      .order('joined_at')
    if (err) {
      setError(err.message)
      return
    }
    setMembers((data ?? []) as Member[])
  }

  async function revoke(memberId: string) {
    if (!supabase) return
    setRevokeError(null)
    setRevokingId(memberId)
    const { error: err } = await supabase
      .from('workspace_members')
      .delete()
      .eq('id', memberId)
    setRevokingId(null)
    setPendingRevoke(null)
    if (err) {
      setRevokeError('Не удалось отозвать доступ: ' + err.message)
      return
    }
    void load()
  }

  const drivers = members?.filter((m) => m.role === 'driver') ?? []
  const owners = members?.filter((m) => m.role === 'owner') ?? []

  return (
    <>
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl overflow-hidden max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <h2 className="text-[17px] font-bold text-slate-900">Команда</h2>
            <button
              onClick={() => setShowRolesHelp(true)}
              className="text-[11px] font-semibold text-blue-600 active:text-blue-700"
            >
              Кто что может?
            </button>
          </div>
          <button onClick={onClose} className="p-3 -mr-1 rounded-lg active:bg-slate-100" aria-label="Закрыть">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {error && (
            <div className="mb-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[12px] text-red-700">{error}</p>
            </div>
          )}
          {revokeError && (
            <div className="mb-3 bg-red-50 border border-red-100 rounded-xl p-3">
              <p className="text-[12px] text-red-700">{revokeError}</p>
            </div>
          )}

          {members === null && !error && (
            <div className="py-10 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            </div>
          )}

          {members !== null && (
            <>
              {/* Owners */}
              {owners.length > 0 && (
                <div className="mb-5">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Владелец
                  </p>
                  {owners.map((m) => (
                    <MemberCard key={m.id} member={m} isOwner />
                  ))}
                </div>
              )}

              {/* Drivers */}
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Водители ({drivers.length}/10)
              </p>
              {drivers.length === 0 && (
                <div className="py-8 text-center bg-slate-50 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-2">
                    <User size={20} className="text-slate-400" />
                  </div>
                  <p className="text-[13px] font-semibold text-slate-700 mb-1">Ещё нет водителей</p>
                  <p className="text-[12px] text-slate-500 leading-relaxed px-6">
                    Создайте invite-код через кнопку «Пригласить водителя» и отправьте его сотруднику.
                  </p>
                </div>
              )}
              {drivers.map((m) => (
                <MemberCard
                  key={m.id}
                  member={m}
                  onRevoke={canRevoke ? () => setPendingRevoke(m) : undefined}
                  isRevoking={revokingId === m.id}
                />
              ))}
              {!canRevoke && drivers.length > 0 && (
                <p className="text-[11px] text-slate-500 leading-relaxed mt-3 px-1">
                  Отзывать доступ у водителей может только владелец компании.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>

    {showRolesHelp && (
      <HelpInfoSheet content={HELP_TEAM_ROLES} onClose={() => setShowRolesHelp(false)} />
    )}

    {pendingRevoke && (
      <ConfirmDialog
        title="Отозвать доступ"
        message={`Отозвать доступ у водителя «${pendingRevoke.driver_full_name?.trim() || 'без имени'}»? Он больше не сможет пользоваться приложением.`}
        confirmLabel="Отозвать"
        danger
        busy={revokingId === pendingRevoke.id}
        onConfirm={() => void revoke(pendingRevoke.id)}
        onCancel={() => setPendingRevoke(null)}
      />
    )}
    </>
  )
}

function MemberCard({
  member,
  isOwner,
  onRevoke,
  isRevoking,
}: {
  member: Member
  isOwner?: boolean
  onRevoke?: () => void
  isRevoking?: boolean
}) {
  const displayName = member.driver_full_name?.trim() || (isOwner ? 'Владелец компании' : 'Водитель')
  const joined = new Date(member.joined_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="mb-2 last:mb-0 flex items-center gap-3 p-3 rounded-2xl bg-white border border-slate-200">
      <div
        className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isOwner ? 'bg-amber-100' : 'bg-slate-100'
        }`}
      >
        {isOwner ? (
          <Crown size={16} className="text-amber-600" />
        ) : (
          <User size={16} className="text-slate-500" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-semibold text-slate-900 truncate">{displayName}</p>
        <p className="text-[11px] text-slate-500">
          {isOwner ? 'Полный доступ' : 'Присоединился ' + joined}
          {member.driver_phone && ` · ${member.driver_phone}`}
        </p>
      </div>
      {onRevoke && !isOwner && (
        <button
          onClick={onRevoke}
          disabled={isRevoking}
          className="shrink-0 p-2 rounded-xl text-red-500 active:bg-red-50 disabled:opacity-50"
          title="Отозвать доступ"
        >
          {isRevoking ? (
            <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
          ) : (
            <UserX size={16} />
          )}
        </button>
      )}
    </div>
  )
}
