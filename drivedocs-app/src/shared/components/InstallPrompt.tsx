import { useState, useEffect } from 'react'
import { X, Share, PlusSquare } from 'lucide-react'

const STORAGE_KEY = 'pwa-install-dismissed'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (dismissed) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone)

    if (isStandalone) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    setIsIOS(ios)

    // On iOS show immediately since there's no beforeinstallprompt
    if (ios) {
      setShow(true)
      return
    }

    // On Android/Chrome listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-slate-400 active:text-slate-600"
        aria-label="Закрыть"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <img src="/pwa-64x64.png" alt="Drivedocs" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900">Добавить на экран</p>
          {isIOS ? (
            <p className="text-xs text-slate-500 mt-1">
              Нажмите{' '}
              <Share size={12} className="inline align-middle" />{' '}
              в браузере, затем{' '}
              <span className="font-medium">«На экран Домой»</span>
              {' '}<PlusSquare size={12} className="inline align-middle" />
            </p>
          ) : (
            <p className="text-xs text-slate-500 mt-1">
              Установите Drivedocs как приложение — быстрый доступ без браузера
            </p>
          )}
        </div>
      </div>

      {!isIOS && (
        <button
          onClick={dismiss}
          className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700"
        >
          Установить
        </button>
      )}
    </div>
  )
}
