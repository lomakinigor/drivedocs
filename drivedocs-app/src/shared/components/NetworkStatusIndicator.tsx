import { useEffect, useRef, useState } from 'react'
import { WifiOff, RefreshCw } from 'lucide-react'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { isBackendConfigured } from '@/lib/supabase'

// S4 — индикатор офлайн/сети. navigator.onLine + online/offline события.
// При восстановлении сети — автосинк (hydrateFromBackend) если юзер залогинен,
// плюс короткий тост «Снова онлайн» на 3 секунды.

export function NetworkStatusIndicator() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true))
  const [showReconnected, setShowReconnected] = useState(false)
  const wasOffline = useRef(false)
  const hydrateFromBackend = useWorkspaceStore((s) => s.hydrateFromBackend)
  const authUserId = useWorkspaceStore((s) => s.authUserId)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline.current) {
        wasOffline.current = false
        if (isBackendConfigured && authUserId) {
          void hydrateFromBackend()
        }
        setShowReconnected(true)
        const t = setTimeout(() => setShowReconnected(false), 3000)
        return () => clearTimeout(t)
      }
    }
    const handleOffline = () => {
      setIsOnline(false)
      wasOffline.current = true
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [authUserId, hydrateFromBackend])

  if (isOnline && !showReconnected) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[80] flex items-center justify-center gap-2 py-2 text-xs font-semibold text-white ${
        !isOnline ? 'bg-slate-800' : 'bg-green-600'
      }`}
      style={{ paddingTop: 'max(8px, env(safe-area-inset-top, 0px))' }}
    >
      {!isOnline ? (
        <>
          <WifiOff size={13} />
          Оффлайн-режим — данные сохранятся локально
        </>
      ) : (
        <>
          <RefreshCw size={13} className="animate-spin" />
          Снова онлайн — синхронизируем данные
        </>
      )}
    </div>
  )
}
