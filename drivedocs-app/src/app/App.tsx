import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { InstallPrompt } from '@/shared/components/InstallPrompt'
import { AppErrorBoundary } from '@/shared/components/AppErrorBoundary'
import { PwaUpdatePrompt } from '@/shared/components/PwaUpdatePrompt'
import { initDevMode } from '@/lib/devMode'

initDevMode()
import { MobileLayout } from '@/shared/ui/layouts/MobileLayout'
import { HomePage } from '@/pages/HomePage'
// import { TodayPage } from '@/pages/TodayPage' // T-134: использован только редиректом на /home, компонент-файл сохраняется в codebase
import { DocumentsPage } from '@/pages/DocumentsPage'
import { TripsPage } from '@/pages/TripsPage'
// import { ReceiptsPage } from '@/pages/ReceiptsPage' // T-133: рендерится внутри TripsPage (mode=receipts), отдельного роута больше нет
// import { AnalyticsPage } from '@/pages/AnalyticsPage' // T-136: заменён на ReportsPage; файл сохраняется временно для возможного отката
import { ReportsPage } from '@/pages/ReportsPage'
import { EventsPage } from '@/pages/EventsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminPage } from '@/pages/AdminPage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { WelcomePage } from '@/pages/WelcomePage'
import { AuthPage } from '@/features/auth/AuthPage'
import { PasswordResetRequestPage } from '@/features/auth/PasswordResetRequestPage'
import { PasswordResetPage } from '@/features/auth/PasswordResetPage'
import { JoinPage } from '@/pages/JoinPage'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { subscribeToAuthChanges } from '@/lib/supabase'
import { isBackendConfigured } from '@/lib/supabase'

// ─── Root redirect ────────────────────────────────────────────────────────────

function RootRedirect() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  const isAuthenticated = useWorkspaceStore((s) => s.isAuthenticated)

  if (!workspaces.length) {
    // Залогиненный юзер без workspaces — сразу в онбординг, не на лендинг.
    // Лендинг показываем только новым (не залогиненным) посетителям.
    return <Navigate to={isAuthenticated && isBackendConfigured ? '/onboarding' : '/welcome'} replace />
  }
  const id = currentWorkspaceId ?? workspaces[0].id
  return <Navigate to={`/w/${id}/home`} replace />
}

// ─── Protected route ──────────────────────────────────────────────────────────
// Guards all workspace routes. In localStorage mode (no backend), always passes through.
// In backend mode: waits for first onAuthStateChange event, then redirects to /auth if not signed in.

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const authChecked = useWorkspaceStore((s) => s.authChecked)

  // localStorage mode: backend not configured → пропускаем сразу
  if (!isBackendConfigured) return <>{children}</>

  // Backend mode: ждём первую проверку auth-state перед рендером,
  // чтобы не было flicker'а пока узнаём кто пользователь.
  // НО НЕ редиректим неавторизованных на /auth — anonymous-first:
  // юзер может пользоваться приложением без аккаунта (данные в localStorage).
  // Cloud sync включается только после логина (см. hydrateFromBackend).
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/reset-password-request',
    element: <PasswordResetRequestPage />,
  },
  {
    path: '/reset-password',
    element: <PasswordResetPage />,
  },
  {
    // Join-flow для приглашённых водителей (B1.3). Публичный, но внутри
    // редиректит на /auth если не залогинен.
    path: '/join',
    element: <JoinPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <RootRedirect />
      </ProtectedRoute>
    ),
  },
  {
    // Лендинг — публичная страница, без auth guard. Anonymous-first стратегия:
    // посетитель должен видеть value proposition до регистрации.
    path: '/welcome',
    element: <WelcomePage />,
  },
  {
    // Онбординг — тоже публичный. Можно создать workspace без аккаунта
    // (данные в localStorage), потом залогиниться и автоматически
    // подтянуть их в облако (см. hydrateFromBackend → upload).
    path: '/onboarding',
    element: <OnboardingWizard />,
  },
  {
    path: '/w/:workspaceId',
    element: (
      <ProtectedRoute>
        <MobileLayout />
      </ProtectedRoute>
    ),
    children: [
      // T-127, T-128, T-129 · F-022 · D-023 — 4-tab IA + старые редиректы
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'reports', element: <ReportsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      // T-130 · Документы предприятия — sub-страница настроек, не в BottomNav
      { path: 'settings/documents', element: <DocumentsPage /> },
      // Центр уведомлений — не в нав, только через 🔔
      { path: 'notifications', element: <EventsPage /> },

      // Редиректы старых роутов (Phase A — оставляем минимум на 30 дней)
      { path: 'today', element: <Navigate to="../home" replace /> },
      { path: 'documents', element: <Navigate to="../settings" replace /> },
      { path: 'receipts', element: <Navigate to="../trips?mode=receipts" replace /> },
      { path: 'events', element: <Navigate to="../notifications" replace /> },
      { path: 'analytics', element: <Navigate to="../reports" replace /> },
    ],
  },
  {
    path: '/admin',
    element: <AdminPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function App() {
  const setAuthUser = useWorkspaceStore((s) => s.setAuthUser)

  useEffect(() => {
    // Subscribe to Supabase auth state changes.
    // In localStorage mode, subscribeToAuthChanges fires callback(null, null) once
    // and returns — which is a no-op because isBackendConfigured=false means store
    // starts as isAuthenticated=true and ProtectedRoute skips the guard entirely.
    return subscribeToAuthChanges(setAuthUser)
  }, [setAuthUser])

  return (
    <AppErrorBoundary>
      <RouterProvider router={router} />
      <InstallPrompt />
      <PwaUpdatePrompt />
    </AppErrorBoundary>
  )
}
