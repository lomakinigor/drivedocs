import { useState, useEffect } from 'react'
import { Outlet, useParams, useNavigate } from 'react-router-dom'
import { MobileHeader } from '../navigation/MobileHeader'
import { BottomNav } from '../navigation/BottomNav'
import { WorkspaceSwitcher } from '@/features/workspace/WorkspaceSwitcher'
import { NotificationsSheet } from '@/features/events/NotificationsSheet'
import { AddTripSheet } from '@/features/trips/AddTripSheet'
import { QuickTripProvider } from '@/features/trips/QuickTripContext'
import { GeoTripProvider, type GeoTripResult } from '@/features/trips/GeoTripContext'
import { GeoTripTracker } from '@/features/trips/GeoTripTracker'
import { useWorkspaceStore } from '@/app/store/workspaceStore'

export function MobileLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const id = workspaceId ?? ''
  const navigate = useNavigate()
  const setCurrentWorkspace = useWorkspaceStore((s) => s.setCurrentWorkspace)

  const [switcherOpen, setSwitcherOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [addTripOpen, setAddTripOpen] = useState(false)
  const [geoTripResult, setGeoTripResult] = useState<GeoTripResult | null>(null)

  const handleGeoTripFinished = (result: GeoTripResult) => {
    setGeoTripResult(result)
    setAddTripOpen(true)
  }

  const handleAddTripClose = () => {
    setAddTripOpen(false)
    setGeoTripResult(null)
  }

// Sync URL workspaceId → store on mount/change
useEffect(() => {
  if (workspaceId) {
    setCurrentWorkspace(workspaceId)
  }
}, [workspaceId, setCurrentWorkspace])

  const handleSelectWorkspace = (wsId: string) => {
    setCurrentWorkspace(wsId)
    setSwitcherOpen(false)
    navigate(`/w/${wsId}/home`)
  }

  const handleAddWorkspace = () => {
    setSwitcherOpen(false)
    navigate('/onboarding')
  }

  return (
    <GeoTripProvider>
    <div className="flex flex-col h-full bg-slate-50">
      <MobileHeader
        onOpenSwitcher={() => setSwitcherOpen(true)}
        onOpenNotifications={() => setNotifOpen(true)}
        onOpenQuickTrip={() => setAddTripOpen(true)}
      />

      {/* Scrollable main content */}
      <main className="flex-1 overflow-y-auto pb-[72px]">
        <QuickTripProvider value={() => setAddTripOpen(true)}>
          <Outlet />
        </QuickTripProvider>
      </main>

      <GeoTripTracker onFinished={handleGeoTripFinished} />

      <BottomNav />

      {/* Workspace switcher bottom sheet */}
      {switcherOpen && (
        <WorkspaceSwitcher
          onSelect={handleSelectWorkspace}
          onClose={() => setSwitcherOpen(false)}
          onAddWorkspace={handleAddWorkspace}
        />
      )}

      {/* Notifications bottom sheet */}
      {notifOpen && (
        <NotificationsSheet
          workspaceId={id}
          onClose={() => setNotifOpen(false)}
        />
      )}

      {/* Quick add trip sheet */}
      {addTripOpen && (
        <AddTripSheet
          workspaceId={id}
          prefill={
            geoTripResult
              ? {
                  from: geoTripResult.startAddress,
                  to: geoTripResult.endAddress,
                  distanceKm: geoTripResult.distanceKm,
                }
              : undefined
          }
          onClose={handleAddTripClose}
          onSaved={handleAddTripClose}
        />
      )}
    </div>
    </GeoTripProvider>
  )
}
