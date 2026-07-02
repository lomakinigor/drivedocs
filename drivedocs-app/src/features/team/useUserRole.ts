import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

export type UserRole = 'owner' | 'driver' | null

/**
 * Возвращает роль текущего юзера в workspace (owner | driver).
 * Загружается один раз при монтировании из workspace_members через RLS.
 *
 * Возвращает 'owner' если backend не подключён (localStorage-mode)
 * или если нет активного workspace'а — в этих случаях функциональность
 * ограничения доступа не применяется.
 */
export function useUserRole(workspaceId: string | undefined): UserRole {
  const authUserId = useWorkspaceStore((s) => s.authUserId)
  const [role, setRole] = useState<UserRole>(null)

  useEffect(() => {
    if (!workspaceId || !supabase || !authUserId) {
      // Без backend / без workspace — считаем owner'ом по-умолчанию
      setRole('owner')
      return
    }
    let cancelled = false

    supabase
      .from('workspace_members')
      .select('role')
      .eq('workspace_id', workspaceId)
      .eq('user_id', authUserId)
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data) {
          // Если запись не найдена — фолбэк на owner (нельзя блокировать UI)
          setRole('owner')
          return
        }
        setRole(data.role as UserRole)
      })

    return () => {
      cancelled = true
    }
  }, [workspaceId, authUserId])

  return role
}
