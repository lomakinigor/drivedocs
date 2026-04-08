import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Workspace,
  User,
  OnboardingState,
  OrganizationProfile,
  Trip,
  Receipt,
  WorkspaceDocument,
  WorkspaceEvent,
  DocumentStatus,
} from '@/entities/types/domain'
import { mockWorkspaces, mockOrgProfiles } from '@/entities/mocks/workspaces'
import { mockUser } from '@/entities/mocks/user'
import { mockTrips, mockDocuments, mockEvents } from '@/entities/mocks/events'

// ─── Store interface ───────────────────────────────────────────────────────────

interface WorkspaceStore {
  // Auth (mock)
  user: User
  isAuthenticated: boolean

  // Workspaces
  workspaces: Workspace[]
  currentWorkspaceId: string | null

  // Organization profiles (one per workspace)
  orgProfiles: OrganizationProfile[]

  // Trips
  trips: Trip[]

  // Documents
  documents: WorkspaceDocument[]

  // Events
  events: WorkspaceEvent[]

  // Receipts
  receipts: Receipt[]

  // Onboarding
  onboarding: OnboardingState | null

  // Actions
  setCurrentWorkspace: (id: string) => void
  addWorkspace: (workspace: Workspace) => void
  updateWorkspace: (id: string, patch: Partial<Workspace>) => void
  addOrgProfile: (profile: OrganizationProfile) => void
  addTrip: (trip: Trip) => void
  deleteTrip: (id: string) => void
  updateDocumentStatus: (documentId: string, status: DocumentStatus) => void
  addEvent: (event: WorkspaceEvent) => void
  markEventRead: (id: string) => void
  addReceipt: (receipt: Receipt) => void
  attachReceiptToTrip: (receiptId: string, tripId: string) => void
  detachReceiptFromTrip: (receiptId: string) => void
  resetWorkspaceConfig: (workspaceId: string) => void
  setOnboarding: (state: OnboardingState | null) => void
  clearOnboarding: () => void
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set) => ({
      user: mockUser,
      isAuthenticated: true,

      workspaces: mockWorkspaces,
      currentWorkspaceId: mockWorkspaces[0]?.id ?? null,

      orgProfiles: mockOrgProfiles,

      trips: mockTrips,

      documents: mockDocuments,

      events: mockEvents,

      receipts: [],

      onboarding: null,

      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      addWorkspace: (workspace) =>
        set((state) => ({
          workspaces: [...state.workspaces, workspace],
          currentWorkspaceId: workspace.id,
        })),

      updateWorkspace: (id, patch) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === id ? { ...ws, ...patch } : ws,
          ),
        })),

      addOrgProfile: (profile) =>
        set((state) => ({
          orgProfiles: [
            ...state.orgProfiles.filter((p) => p.workspaceId !== profile.workspaceId),
            profile,
          ],
        })),

      addTrip: (trip) =>
        set((state) => ({ trips: [trip, ...state.trips] })),

      deleteTrip: (id) =>
        set((state) => ({ trips: state.trips.filter((t) => t.id !== id) })),

      addEvent: (event) =>
        set((state) => ({ events: [event, ...state.events] })),

      addReceipt: (receipt) =>
        set((state) => ({ receipts: [receipt, ...state.receipts] })),

      attachReceiptToTrip: (receiptId, tripId) =>
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === receiptId ? { ...r, tripId } : r,
          ),
        })),

      detachReceiptFromTrip: (receiptId) =>
        set((state) => ({
          receipts: state.receipts.map((r) => {
            if (r.id !== receiptId) return r
            const { tripId: _, ...rest } = r
            return rest
          }),
        })),

      markEventRead: (id) =>
        set((state) => ({
          events: state.events.map((e) =>
            e.id === id ? { ...e, isRead: true } : e,
          ),
        })),

      resetWorkspaceConfig: (workspaceId) =>
        set((state) => ({
          workspaces: state.workspaces.map((ws) =>
            ws.id === workspaceId ? { ...ws, isConfigured: false } : ws,
          ),
          // Remove org profile so it can be re-created during re-onboarding
          orgProfiles: state.orgProfiles.filter(
            (p) => p.workspaceId !== workspaceId,
          ),
        })),

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

      setOnboarding: (onboarding) => set({ onboarding }),
      clearOnboarding: () => set({ onboarding: null }),
    }),
    {
      name: 'drivedocs-workspace',
      partialize: (state) => ({
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
        orgProfiles: state.orgProfiles,
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
  useWorkspaceStore((s) =>
    s.workspaces.find((ws) => ws.id === s.currentWorkspaceId) ?? null,
  )

export const useOrgProfile = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.orgProfiles.find((p) => p.workspaceId === workspaceId) ?? null,
  )

export const useWorkspaceTrips = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.trips
      .filter((t) => t.workspaceId === workspaceId)
      .sort((a, b) => b.date.localeCompare(a.date)),
  )

export const useTodayTrips = (workspaceId: string) => {
  const today = todayISO()
  return useWorkspaceStore((s) =>
    s.trips.filter((t) => t.workspaceId === workspaceId && t.date === today),
  )
}

export const useWorkspaceDocuments = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.documents.filter((d) => d.workspaceId === workspaceId),
  )

export const useUrgentDocuments = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.documents.filter(
      (d) =>
        d.workspaceId === workspaceId &&
        (d.status === 'required' || d.status === 'overdue'),
    ),
  )

export const useWorkspaceEvents = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.events
      .filter((e) => e.workspaceId === workspaceId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  )

export const useUnreadEventsCount = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.events.filter((e) => e.workspaceId === workspaceId && !e.isRead).length,
  )

export const useUrgentEvents = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.events.filter(
      (e) =>
        e.workspaceId === workspaceId &&
        !e.isRead &&
        (e.severity === 'urgent' || e.severity === 'warning'),
    ),
  )

export const useWorkspaceReceipts = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.receipts
      .filter((r) => r.workspaceId === workspaceId)
      .sort((a, b) => b.date.localeCompare(a.date)),
  )

export const useTodayReceipts = (workspaceId: string) => {
  const today = todayISO()
  return useWorkspaceStore((s) =>
    s.receipts.filter((r) => r.workspaceId === workspaceId && r.date === today),
  )
}

export const useReceiptsByTrip = (tripId: string) =>
  useWorkspaceStore((s) => s.receipts.filter((r) => r.tripId === tripId))

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
