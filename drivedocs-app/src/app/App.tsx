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

// Default workspace redirect — uses the first workspace from the mock
const DEFAULT_WORKSPACE_ID = 'ws-1'

const router = createBrowserRouter([
  // Root redirect
  {
    path: '/',
    element: <Navigate to={`/w/${DEFAULT_WORKSPACE_ID}/home`} replace />,
  },

  // Onboarding (full-screen, outside shell)
  {
    path: '/onboarding',
    element: <OnboardingWizard />,
  },

  // Main app shell with workspace routing
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

  // Catch-all
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function App() {
  return <RouterProvider router={router} />
}
