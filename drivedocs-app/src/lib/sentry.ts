import * as Sentry from '@sentry/react'

// S7 — мониторинг ошибок в production.
// Без VITE_SENTRY_DSN — no-op (как isBackendConfigured для Supabase),
// приложение работает как раньше, просто без отправки ошибок.

const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined

export const isSentryConfigured = Boolean(dsn)

export function initSentry(): void {
  if (!dsn) {
    if (import.meta.env.DEV) {
      console.warn(
        '[drivedocs] VITE_SENTRY_DSN не задан — ошибки не отправляются в Sentry.',
      )
    }
    return
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: __APP_VERSION__,
    // Free tier — 5k events/month, поэтому не шлём performance-трейсы, только ошибки.
    tracesSampleRate: 0,
    ignoreErrors: [
      // Шум браузерных расширений и известные безвредные ошибки resize-loop.
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Non-Error promise rejection captured',
    ],
    beforeSend(event, hint) {
      const error = hint.originalException
      const stack = error instanceof Error ? error.stack ?? '' : ''
      // Ошибки из расширений браузера (chrome-extension://, moz-extension://)
      // не относятся к нашему коду — не засоряем квоту.
      if (/chrome-extension:\/\/|moz-extension:\/\//.test(stack)) {
        return null
      }
      return event
    },
  })
}

/** Обновляет контекст пользователя в Sentry — вызывается при смене auth/workspace. */
export function setSentryUser(params: { userId: string | null; email: string | null; workspaceId: string | null }): void {
  if (!dsn) return
  if (!params.userId) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({
    id: params.userId,
    email: params.email ?? undefined,
    workspace_id: params.workspaceId ?? undefined,
  })
}

export function captureAppError(error: Error, info?: { componentStack?: string | null }): void {
  if (!dsn) return
  Sentry.captureException(error, {
    contexts: info?.componentStack ? { react: { componentStack: info.componentStack } } : undefined,
  })
}
