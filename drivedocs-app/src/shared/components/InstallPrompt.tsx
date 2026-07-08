import { useState, useEffect, useRef } from 'react'
import { X, Share, PlusSquare, MoreVertical, Smartphone } from 'lucide-react'
import { supabase, isBackendConfigured } from '@/lib/supabase'
import { recordMetric } from '@/lib/metrics/featureMetrics'

const STORAGE_KEY = 'pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Platform = 'ios' | 'android-native' | 'android-manual'

// Анонимный write-only лог установок (см. supabase/migrations/20260708210000_install_events.sql).
// iOS не даёт API для отслеживания самой установки — только intent (открытие инструкции).
type InstallEventPlatform = 'android_installed' | 'desktop_installed' | 'ios_guide_opened'

function logInstallEvent(platform: InstallEventPlatform) {
  recordMetric(`install.${platform}`)
  if (!isBackendConfigured || !supabase) return
  void supabase.from('install_events').insert({ platform }).then(() => {})
}

// Маршруты, где баннер «Установить» перекрывает primary CTA внизу экрана —
// /welcome, /onboarding, /auth имеют sticky-кнопку и не используют BottomNav.
const HIDDEN_ROUTES = ['/welcome', '/onboarding', '/auth']

function usePathname(): string {
  const [pathname, setPathname] = useState(() => (typeof window !== 'undefined' ? window.location.pathname : '/'))
  useEffect(() => {
    const update = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', update)
    // react-router использует history.pushState — патчим, чтобы слышать переходы
    const origPush = history.pushState
    const origReplace = history.replaceState
    history.pushState = function (...args) {
      origPush.apply(this, args)
      update()
    }
    history.replaceState = function (...args) {
      origReplace.apply(this, args)
      update()
    }
    return () => {
      window.removeEventListener('popstate', update)
      history.pushState = origPush
      history.replaceState = origReplace
    }
  }, [])
  return pathname
}

export function InstallPrompt() {
  const [show, setShow] = useState(false)
  const [platform, setPlatform] = useState<Platform>('android-manual')
  const [iosGuideOpen, setIosGuideOpen] = useState(false)
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const pathname = usePathname()

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

  // appinstalled — единственное надёжное подтверждение реальной установки
  // (срабатывает и после нативного prompt'а, и после ручного «Добавить на
  // главный экран» через меню браузера — Chrome/Edge на Android и десктопе).
  useEffect(() => {
    const onInstalled = () => {
      const isAndroid = /android/i.test(navigator.userAgent)
      logInstallEvent(isAndroid ? 'android_installed' : 'desktop_installed')
      localStorage.setItem(STORAGE_KEY, '1')
      setShow(false)
    }
    window.addEventListener('appinstalled', onInstalled)
    return () => window.removeEventListener('appinstalled', onInstalled)
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
  if (HIDDEN_ROUTES.some((r) => pathname === r || pathname.startsWith(r + '/'))) return null

  return (
    <>
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-4">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 p-3 text-slate-500 active:text-slate-600"
        aria-label="Закрыть"
      >
        <X size={18} />
      </button>

      <div className="flex items-start gap-3">
        <img src="/pwa-64x64.png" alt="Drivedocs" width={48} height={48} className="w-12 h-12 rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm font-semibold text-slate-900">Установить приложение</p>
          {platform === 'ios' && (
            <>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Нажмите{' '}
                <Share size={12} className="inline align-middle" />{' '}
                в браузере, затем{' '}
                <span className="font-medium">«На экран Домой»</span>
                {' '}<PlusSquare size={12} className="inline align-middle" />
              </p>
              <button
                type="button"
                onClick={() => {
                  logInstallEvent('ios_guide_opened')
                  setIosGuideOpen(true)
                }}
                className="text-xs font-semibold text-blue-600 active:text-blue-800 mt-1"
              >
                Показать по шагам →
              </button>
            </>
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

    {iosGuideOpen && <IosInstallGuideSheet onClose={() => setIosGuideOpen(false)} />}
    </>
  )
}

// S3 — пошаговая инструкция установки на iOS (Safari не поддерживает
// beforeinstallprompt, единственный путь — Share → «На экран Домой»).
const IOS_STEPS = [
  {
    icon: Share,
    title: 'Нажмите «Поделиться»',
    desc: 'Кнопка внизу экрана в Safari (квадрат со стрелкой вверх)',
  },
  {
    icon: PlusSquare,
    title: '«На экран Домой»',
    desc: 'Пролистайте список действий вниз и найдите этот пункт',
  },
  {
    icon: Smartphone,
    title: 'Готово',
    desc: 'Иконка Drivedocs появится на главном экране — открывается как обычное приложение',
  },
]

function IosInstallGuideSheet({ onClose }: { onClose: () => void }) {
  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl safe-bottom animate-slide-up">
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>
        <div className="flex items-center justify-between px-5 pt-1 pb-3">
          <h2 className="text-base font-semibold text-slate-900">Установка на iPhone</h2>
          <button onClick={onClose} className="p-3 -mr-1 rounded-xl text-slate-500 active:bg-slate-100" aria-label="Закрыть">
            <X size={20} />
          </button>
        </div>
        <div className="px-5 pb-8 space-y-4">
          {IOS_STEPS.map((step, i) => (
            <div key={step.title} className="flex items-start gap-3">
              <div className="shrink-0 w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-sm font-bold text-blue-600">
                {i + 1}
              </div>
              <div className="flex-1 min-w-0 pt-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <step.icon size={14} className="text-slate-500" />
                  <p className="text-sm font-semibold text-slate-900">{step.title}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
