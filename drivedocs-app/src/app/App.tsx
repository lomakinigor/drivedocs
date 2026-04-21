import { useEffect } from 'react'
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom'
import { MobileLayout } from '@/shared/ui/layouts/MobileLayout'
import { HomePage } from '@/pages/HomePage'
import { TodayPage } from '@/pages/TodayPage'
import { DocumentsPage } from '@/pages/DocumentsPage'
import { TripsPage } from '@/pages/TripsPage'
import { ReceiptsPage } from '@/pages/ReceiptsPage'
import { EventsPage } from '@/pages/EventsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { OnboardingWizard } from '@/features/onboarding/OnboardingWizard'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

// ─── Root redirect ────────────────────────────────────────────────────────────
// Uses live store state so it works after backend hydration replaces mock IDs.

function RootRedirect() {
  const workspaces = useWorkspaceStore((s) => s.workspaces)
  const currentWorkspaceId = useWorkspaceStore((s) => s.currentWorkspaceId)
  if (!workspaces.length) {
    return <Navigate to="/onboarding" replace />
  }
  const id = currentWorkspaceId ?? workspaces[0].id
  return <Navigate to={`/w/${id}/home`} replace />
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <RootRedirect />,
  },
  {
    path: '/onboarding',
    element: <OnboardingWizard />,
  },
  {
    path: '/w/:workspaceId',
    element: <MobileLayout />,
    children: [
      { index: true, element: <Navigate to="home" replace /> },
      { path: 'home', element: <HomePage /> },
      { path: 'today', element: <TodayPage /> },
      { path: 'documents', element: <DocumentsPage /> },
      { path: 'trips', element: <TripsPage /> },
      { path: 'receipts', element: <ReceiptsPage /> },
      { path: 'events', element: <EventsPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function App() {
  const hydrateFromBackend = useWorkspaceStore((s) => s.hydrateFromBackend)

  useEffect(() => {
    hydrateFromBackend()
  }, [hydrateFromBackend])

  return <RouterProvider router={router} />
}
