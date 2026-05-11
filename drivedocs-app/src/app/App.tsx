import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { InstallPrompt } from '@/shared/components/InstallPrompt'
import { MobileLayout } from '@/shared/ui/layouts/MobileLayout'
import { HomePage } from '@/pages/HomePage'
// import { TodayPage } from '@/pages/TodayPage' // T-134: использован только редиректом на /home, компонент-файл сохраняется в codebase
import { DocumentsPage } from '@/pages/DocumentsPage'
import { TripsPage } from '@/pages/TripsPage'
// import { ReceiptsPage } from '@/pages/ReceiptsPage' // T-133: рендерится внутри TripsPage (mode=receipts), отдельного роута больше нет
import { AnalyticsPage } from '@/pages/AnalyticsPage'
import { EventsPage } from '@/pages/EventsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { AdminPage } from '@/pages/AdminPage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { WelcomePage } from '@/pages/WelcomePage'
import { AuthPage } from '@/features/auth/AuthPage'
import { useWorkspaceStore } from '@/app/store/workspaceStore'
import { subscribeToAuthChanges } from '@/lib/supabase'
import { isBackendConfigured } from '@/lib/supabase'

// ─── Root redirect ────────────────────────────────────────────────────────────

function RootRedirect() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  if (!workspaces.length) {
    return <Navigate to="/welcome" replace />
  }
  const id = currentWorkspaceId ?? workspaces[0].id
  return <Navigate to={`/w/${id}/home`} replace />
}

// ─── Protected route ──────────────────────────────────────────────────────────
// Guards all workspace routes. In localStorage mode (no backend), always passes through.
// In backend mode: waits for first onAuthStateChange event, then redirects to /auth if not signed in.

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useWorkspaceStore((s) => s.isAuthenticated)
  const authChecked = useWorkspaceStore((s) => s.authChecked)

  // localStorage mode: backend not configured → always authenticated, skip guard
  if (!isBackendConfigured) return <>{children}</>

  // Backend mode: wait for auth check before rendering or redirecting
  if (!authChecked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return <>{children}</>
}

const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthPage />,
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
    path: '/welcome',
    element: (
      <ProtectedRoute>
        <WelcomePage />
      </ProtectedRoute>
    ),
  },
  {
    path: '/onboarding',
    element: (
      <ProtectedRoute>
        <OnboardingWizard />
      </ProtectedRoute>
    ),
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
      { path: 'analytics', element: <AnalyticsPage /> }, // → переименуется в Reports в Phase B
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
    <>
      <RouterProvider router={router} />
      <InstallPrompt />
    </>
  )
}
