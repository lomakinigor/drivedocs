import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { persist } from 'zustand/middleware'
import type {
  Workspace,
  User,
  OnboardingState,
  OrganizationProfile,
  VehicleProfile,
  Trip,
  Receipt,
  WorkspaceDocument,
  WorkspaceEvent,
  DocumentStatus,
} from '@/entities/types/domain'
import { mockWorkspaces, mockOrgProfiles, mockVehicleProfiles } from '@/entities/mocks/workspaces'
import { mockUser } from '@/entities/mocks/user'
import { mockTrips, mockDocuments, mockEvents } from '@/entities/mocks/events'
import {
  workspaceRepo,
  orgProfileRepo,
  vehicleProfileRepo,
  tripRepo,
  receiptRepo,
  fetchAllUserData,
  ANON_USER_ID,
} from '@/lib/db/repository'
import { isBackendConfigured } from '@/lib/supabase'

// ─── Store interface ───────────────────────────────────────────────────────────

interface WorkspaceStore {
  // Auth (mock — Phase 9 wires real auth)
  user: User
  isAuthenticated: boolean

  // Workspaces
  workspaces: Workspace[]
  currentWorkspaceId: string | null

  // Organization profiles (one per workspace)
  orgProfiles: OrganizationProfile[]

  // Vehicle profiles (one per workspace)
  vehicleProfiles: VehicleProfile[]

  // Trips
  trips: Trip[]

  // Documents (local only — not backend-backed in Phase 8)
  documents: WorkspaceDocument[]

  // Events (local only — not backend-backed in Phase 8)
  events: WorkspaceEvent[]

  // Receipts
  receipts: Receipt[]

  // Onboarding
  onboarding: OnboardingState | null

  // Backend sync state
  isSyncing: boolean
  syncError: string | null

  // Actions
  setCurrentWorkspace: (id: string) => void
  addWorkspace: (workspace: Workspace) => Promise<void>
  updateWorkspace: (id: string, patch: Partial<Workspace>) => Promise<void>
  addOrgProfile: (profile: OrganizationProfile) => Promise<void>
  addVehicleProfile: (profile: VehicleProfile) => Promise<void>
  updateVehicleProfile: (workspaceId: string, patch: Partial<VehicleProfile>) => Promise<void>
  addTrip: (trip: Trip) => Promise<void>
  deleteTrip: (id: string) => Promise<void>
  updateDocumentStatus: (documentId: string, status: DocumentStatus) => void
  addEvent: (event: WorkspaceEvent) => void
  markEventRead: (id: string) => void
  addReceipt: (receipt: Receipt) => Promise<void>
  attachReceiptToTrip: (receiptId: string, tripId: string) => Promise<void>
  detachReceiptFromTrip: (receiptId: string) => Promise<void>
  resetWorkspaceConfig: (workspaceId: string) => void
  setOnboarding: (state: OnboardingState | null) => void
  clearOnboarding: () => void
  hydrateFromBackend: () => Promise<void>
  clearSyncError: () => void
}

// ─── Error helper ──────────────────────────────────────────────────────────────

function syncErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Не удалось синхронизировать данные'
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      user: mockUser,
      isAuthenticated: true,

      workspaces: mockWorkspaces,
      currentWorkspaceId: mockWorkspaces[0]?.id ?? null,

      orgProfiles: mockOrgProfiles,
      vehicleProfiles: mockVehicleProfiles,
      trips: mockTrips,
      documents: mockDocuments,
      events: mockEvents,
      receipts: [],
      onboarding: null,

      isSyncing: false,
      syncError: null,

      // ── Workspace actions ────────────────────────────────────────────────────

      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      addWorkspace: async (workspace) => {
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspaceId: workspace.id,
        }))
        if (isBackendConfigured) {
          try {
            await workspaceRepo.upsert(workspace)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      updateWorkspace: async (id, patch) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...patch } : ws,
          ),
        }))
        if (isBackendConfigured) {
          try {
            await workspaceRepo.update(id, patch)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      // ── Profile actions ──────────────────────────────────────────────────────

      addOrgProfile: async (profile) => {
        set((state) => ({
          orgProfiles: [
            ...state.orgProfiles.filter((p) => p.workspaceId !== profile.workspaceId),
            profile,
          ],
        }))
        if (isBackendConfigured) {
          try {
            await orgProfileRepo.upsert(profile)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      addVehicleProfile: async (profile) => {
        set((state) => ({
          vehicleProfiles: [
            ...state.vehicleProfiles.filter((p) => p.workspaceId !== profile.workspaceId),
            profile,
          ],
        }))
        if (isBackendConfigured) {
          try {
            await vehicleProfileRepo.upsert(profile)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      updateVehicleProfile: async (workspaceId, patch) => {
        set((state) => ({
          vehicleProfiles: state.vehicleProfiles.map((p) =>
            p.workspaceId === workspaceId ? { ...p, ...patch } : p,
          ),
        }))
        if (isBackendConfigured) {
          try {
            await vehicleProfileRepo.updatePartial(workspaceId, patch)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      // ── Trip actions ─────────────────────────────────────────────────────────

      addTrip: async (trip) => {
        set((state) => ({ trips: [trip, ...state.trips] }))
        if (isBackendConfigured) {
          try {
            await tripRepo.insert(trip)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      deleteTrip: async (id) => {
        set((state) => ({ trips: state.trips.filter((t) => t.id !== id) }))
        if (isBackendConfigured) {
          try {
            await tripRepo.delete(id)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      // ── Document actions (local only in Phase 8) ─────────────────────────────

      updateDocumentStatus: (documentId, status) =>
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId
              ? {
                  ...d,
                  status,
                  completedAt: status === 'completed' ? todayISO() : d.completedAt,
                }
              : d,
          ),
        })),

      // ── Event actions (local only in Phase 8) ────────────────────────────────

      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),

      markEventRead: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, isRead: true } : e,
          ),
        })),

      // ── Receipt actions ──────────────────────────────────────────────────────

      addReceipt: async (receipt) => {
        set((state) => ({ receipts: [receipt, ...state.receipts] }))
        if (isBackendConfigured) {
          try {
            await receiptRepo.insert(receipt)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      attachReceiptToTrip: async (receiptId, tripId) => {
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === receiptId ? { ...r, tripId } : r,
          ),
        }))
        if (isBackendConfigured) {
          try {
            await receiptRepo.updateTripLink(receiptId, tripId)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      detachReceiptFromTrip: async (receiptId) => {
        set((state) => ({
          receipts: state.receipts.map((r) => {
            if (r.id !== receiptId) return r
            const { tripId: _, ...rest } = r
            return rest
          }),
        }))
        if (isBackendConfigured) {
          try {
            await receiptRepo.updateTripLink(receiptId, null)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      // ── Config reset ─────────────────────────────────────────────────────────

      resetWorkspaceConfig: (workspaceId) => {
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? { ...ws, isConfigured: false } : ws,
          ),
          orgProfiles: state.orgProfiles.filter(
            (p) => p.workspaceId !== workspaceId,
          ),
        }))
        if (isBackendConfigured) {
          // Fire-and-forget update; no critical data loss if this fails
          workspaceRepo.update(workspaceId, { isConfigured: false }).catch((err) =>
            set({ syncError: syncErrorMessage(err) }),
          )
        }
      },

      // ── Onboarding ───────────────────────────────────────────────────────────

      setOnboarding: (onboarding) => set({ onboarding }),
      clearOnboarding: () => set({ onboarding: null }),

      // ── Backend hydration ────────────────────────────────────────────────────

      hydrateFromBackend: async () => {
        if (!isBackendConfigured) return
        set({ isSyncing: true, syncError: null })
        try {
          const data = await fetchAllUserData(ANON_USER_ID)
          if (data.workspaces.length > 0) {
            const currentId = get().currentWorkspaceId
            const stillValid = data.workspaces.some((ws) => ws.id === currentId)
            set({
              workspaces: data.workspaces,
              orgProfiles: data.orgProfiles,
              vehicleProfiles: data.vehicleProfiles,
              trips: data.trips,
              receipts: data.receipts,
              // Keep currentWorkspaceId if still valid; otherwise use first from backend
              currentWorkspaceId: stillValid
                ? currentId
                : (data.workspaces[0]?.id ?? null),
            })
          }
          // If backend has no workspaces yet, keep local/mock data as-is.
          // This covers first-run before any data has been synced to backend.
        } catch (err) {
          set({ syncError: syncErrorMessage(err) })
        } finally {
          set({ isSyncing: false })
        }
      },

      clearSyncError: () => set({ syncError: null }),
    }),
    {
      name: 'drivedocs-workspace',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
        orgProfiles: state.orgProfiles,
        vehicleProfiles: state.vehicleProfiles,
        trips: state.trips,
        documents: state.documents,
        events: state.events,
        receipts: state.receipts,
      }),
    },
  ),
)

// ─── Selectors ────────────────────────────────────────────────────────────────

export const useCurrentWorkspace = () =>
  useWorkspaceStore(
    useShallow((s) =>
      s.workspaces.find((ws) => ws.id === s.currentWorkspaceId) ?? null,
    ),
  )

export const useOrgProfile = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.orgProfiles.find((p) => p.workspaceId === workspaceId) ?? null,
    ),
  )

export const useVehicleProfile = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.vehicleProfiles.find((p) => p.workspaceId === workspaceId) ?? null,
    ),
  )

export const useWorkspaceTrips = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.trips
        .filter((t) => t.workspaceId === workspaceId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    ),
  )

export const useTodayTrips = (workspaceId: string) => {
  const today = todayISO()
  return useWorkspaceStore(
    useShallow((s) =>
      s.trips.filter((t) => t.workspaceId === workspaceId && t.date === today),
    ),
  )
}

export const useWorkspaceDocuments = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.documents.filter((d) => d.workspaceId === workspaceId),
    ),
  )

export const useUrgentDocuments = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.documents.filter(
        (d) =>
          d.workspaceId === workspaceId &&
          (d.status === 'required' || d.status === 'overdue'),
      ),
    ),
  )

export const useWorkspaceEvents = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.events
        .filter((e) => e.workspaceId === workspaceId)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    ),
  )

export const useUnreadEventsCount = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.events.filter((e) => e.workspaceId === workspaceId && !e.isRead).length,
  )

export const useUrgentEvents = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.events.filter(
        (e) =>
          e.workspaceId === workspaceId &&
          !e.isRead &&
          (e.severity === 'urgent' || e.severity === 'warning'),
      ),
    ),
  )

export const useWorkspaceReceipts = (workspaceId: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.receipts
        .filter((r) => r.workspaceId === workspaceId)
        .sort((a, b) => b.date.localeCompare(a.date)),
    ),
  )

export const useTodayReceipts = (workspaceId: string) => {
  const today = todayISO()
  return useWorkspaceStore(
    useShallow((s) =>
      s.receipts.filter((r) => r.workspaceId === workspaceId && r.date === today),
    ),
  )
}

export const useReceiptsByTrip = (tripId: string) =>
  useWorkspaceStore(
    useShallow((s) => s.receipts.filter((r) => r.tripId === tripId)),
  )

export const useReceiptsForPeriod = (workspaceId: string, fromDate: string, toDate: string) =>
  useWorkspaceStore(
    useShallow((s) =>
      s.receipts
        .filter((r) => r.workspaceId === workspaceId && r.date >= fromDate && r.date <= toDate)
        .sort((a, b) => b.date.localeCompare(a.date)),
    ),
  )

export const useSyncError = () => useWorkspaceStore((s) => s.syncError)
export const useIsSyncing = () => useWorkspaceStore((s) => s.isSyncing)

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
