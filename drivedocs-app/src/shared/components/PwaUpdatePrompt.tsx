import { useEffect, useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'
import { RefreshCw, X } from 'lucide-react'

// Индикатор обновления PWA (registerType: 'prompt' в vite.config).
//
// Показывается юзеру когда:
// - Установлен новый Service Worker и ждёт активации (needRefresh=true)
//
// При тапе «Обновить» → updateServiceWorker(true) вызывает skipWaiting
// на новом SW → reload → юзер получает свежий бандл.
//
// «Отложить» скрывает индикатор до следующего запуска или до следующей
// проверки обновлений (SW каждые несколько минут пингует сервер).

export function PwaUpdatePrompt() {
  const [dismissed, setDismissed] = useState(false)

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      // Логируем чтобы видеть в devtools
      // eslint-disable-next-line no-console
      console.log('[pwa] update available')
    },
    onOfflineReady() {
      // eslint-disable-next-line no-console
      console.log('[pwa] ready to work offline')
    },
    onRegisteredSW(swUrl, registration) {
      // Проверять обновления каждый час — на случай, если юзер держит
      // приложение открытым долго. Иначе SW обновляется только при
      // навигации/перезапуске.
      if (registration) {
        setInterval(() => {
          registration.update().catch(() => {})
        }, 60 * 60 * 1000)
      }
      // eslint-disable-next-line no-console
      console.log('[pwa] SW registered', swUrl)
    },
  })

  // Reset dismissed state когда прилетает новое обновление
  useEffect(() => {
    if (needRefresh) setDismissed(false)
  }, [needRefresh])

  if (!needRefresh || dismissed) return null

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[60] w-[calc(100vw-32px)] max-w-md"
      style={{ bottom: 'max(16px, env(safe-area-inset-bottom, 0px))' }}
    >
      <div
        className="rounded-2xl shadow-lg px-4 py-3 flex items-center gap-3"
        style={{
          background: 'oklch(35% 0.024 278)',
          color: 'white',
          boxShadow: '0 10px 30px oklch(22% 0.028 280 / 0.30)',
        }}
      >
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'oklch(52% 0.225 285)' }}
        >
          <RefreshCw size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-bold leading-tight">Доступно обновление</p>
          <p className="text-[11px] opacity-70 leading-tight mt-0.5">
            Новая версия приложения готова
          </p>
        </div>
        <button
          onClick={() => {
            void updateServiceWorker(true)
          }}
          className="shrink-0 px-3 py-2 rounded-xl text-[12px] font-bold active:opacity-80"
          style={{ background: 'white', color: 'oklch(52% 0.225 285)' }}
        >
          Обновить
        </button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center active:bg-white/10"
          aria-label="Отложить"
        >
          <X size={14} className="opacity-70" />
        </button>
      </div>
    </div>
  )
}
