import React from 'react'

interface State {
  hasError: boolean
  error: Error | null
}

// Глобальный error boundary. Ловит крах рендера (часто — несовместимый
// localStorage после деплоя) и даёт пользователю быстрый recovery-путь:
// очистить данные приложения и перезагрузиться, без танцев с DevTools.

export class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[AppErrorBoundary]', error, info)
  }

  handleReset = async () => {
    try { localStorage.clear() } catch { /* ignore */ }
    try { sessionStorage.clear() } catch { /* ignore */ }
    if ('serviceWorker' in navigator) {
      try {
        const regs = await navigator.serviceWorker.getRegistrations()
        await Promise.all(regs.map((r) => r.unregister()))
      } catch { /* ignore */ }
    }
    if ('caches' in window) {
      try {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
      } catch { /* ignore */ }
    }
    window.location.href = '/welcome'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-sm w-full bg-white rounded-2xl shadow-xl p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-600">Ошибка приложения</p>
            <h1 className="text-lg font-bold text-slate-900">Что-то пошло не так</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Чаще всего это случается после обновления приложения, если в браузере остались
              старые данные. Сброс всё починит — поездки и документы локального тестового
              workspace будут удалены.
            </p>
          </div>
          {this.state.error?.message && (
            <pre className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3 whitespace-pre-wrap break-all max-h-32 overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReset}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-white bg-blue-600 active:bg-blue-700"
            >
              Сбросить и перезагрузить
            </button>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 rounded-2xl text-sm font-medium text-slate-600 active:bg-slate-50"
            >
              Просто перезагрузить
            </button>
          </div>
        </div>
      </div>
    )
  }
}
