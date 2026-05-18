import { useState, useEffect, useRef } from 'react'
import { X, Share, PlusSquare, MoreVertical } from 'lucide-react'

const STORAGE_KEY = 'pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'ios' | 'android-native' | 'android-manual'

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>('android-manual')
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone)
    if (isStandalone) return

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent)
    if (ios) {
      setPlatform('ios')
      setShow(true)
      return
    }

    // Android — показываем баннер сразу с инструкцией. Если Chrome пришлёт
    // beforeinstallprompt — переключим режим на нативную кнопку «Установить».
    setShow(true)

    const handler = (e: Event) => {
      e.preventDefault()
      deferredPrompt.current = e as BeforeInstallPromptEvent
      setPlatform('android-native')
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1')
    setShow(false)
  }

  const handleInstall = async () => {
    const prompt = deferredPrompt.current
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    deferredPrompt.current = null
    if (outcome === 'accepted') {
      localStorage.setItem(STORAGE_KEY, '1')
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-slate-500 active:text-slate-600"
        aria-label="Закрыть"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <img src="/pwa-64x64.png" alt="Drivedocs" className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900">Установить приложение</p>
          {platform === 'ios' && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Нажмите{' '}
              <Share size={12} className="inline align-middle" />{' '}
              в браузере, затем{' '}
              <span className="font-medium">«На экран Домой»</span>
              {' '}<PlusSquare size={12} className="inline align-middle" />
            </p>
          )}
          {platform === 'android-native' && (
            <p className="text-xs text-slate-500 mt-1">
              Быстрый доступ без браузера, оффлайн-режим
            </p>
          )}
          {platform === 'android-manual' && (
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Откройте меню браузера{' '}
              <MoreVertical size={12} className="inline align-middle" />{' '}
              → <span className="font-medium">«Добавить на главный экран»</span>{' '}
              или <span className="font-medium">«Установить приложение»</span>
            </p>
          )}
        </div>
      </div>

      {platform === 'android-native' && (
        <button
          onClick={handleInstall}
          className="mt-3 w-full py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-xl active:bg-blue-700"
        >
          Установить
        </button>
      )}
    </div>
  )
}
