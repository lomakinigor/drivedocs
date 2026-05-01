import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'
import { persist } from 'zustand/middleware'
import type {
  Workspace,
  User,
  OnboardingState,
  OrganizationProfile,
  VehicleProfile,
  Driver,
  Trip,
  Receipt,
  WorkspaceDocument,
  WorkspaceEvent,
  DocumentStatus,
  WorkspaceSubscription,
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
  documentRepo,
  eventRepo,
  subscriptionRepo,
  fetchAllUserData,
  AuthError,
} from '@/lib/db/repository'
import { supabase, isBackendConfigured, type SupabaseUser } from '@/lib/supabase'

// ─── Auth result type ─────────────────────────────────────────────────────────

export interface AuthResult {
  error: string | null
}

// ─── Supabase auth error → Russian message ────────────────────────────────────

function mapAuthErrorMessage(msg: string): string {
  if (msg.includes('Invalid login credentials')) return 'Неверный email или пароль'
  if (msg.includes('Email not confirmed')) return 'Подтвердите email — проверьте входящие письма'
  if (msg.includes('User already registered')) return 'Этот email уже зарегистрирован. Войдите в аккаунт.'
  if (msg.includes('Password should be at least')) return 'Пароль должен содержать не менее 6 символов'
  if (msg.includes('invalid format')) return 'Неверный формат email'
  if (msg.includes('Signup is disabled')) return 'Регистрация временно недоступна'
  if (msg.includes('rate limit')) return 'Слишком много попыток. Подождите немного.'
  if (msg.includes('Email rate limit')) return 'Слишком много попыток. Подождите немного.'
  return msg
}

// ─── Store interface ───────────────────────────────────────────────────────────

interface WorkspaceStore {
  // Auth
  user: User
  isAuthenticated: boolean
  authUserId: string | null    // Supabase auth.uid(); null = not signed in
  authChecked: boolean         // true once onAuthStateChange has fired at least once

  // Workspaces
  workspaces: Workspace[]
  currentWorkspaceId: string | null

  // Organization profiles (one per workspace)
  orgProfiles: OrganizationProfile[]

  // Vehicle profiles (one per workspace)
  vehicleProfiles: VehicleProfile[]

  // Drivers (multiple per workspace)
  drivers: Driver[]

  // Trips
  trips: Trip[]

  // Documents (local only — not backend-backed in Phase 9)
  documents: WorkspaceDocument[]

  // Events (local only — not backend-backed in Phase 9)
  events: WorkspaceEvent[]

  // Receipts
  receipts: Receipt[]

  // Subscriptions (billing, F-020)
  subscriptions: WorkspaceSubscription[]

  // Onboarding
  onboarding: OnboardingState | null

  // Tour
  hasSeenTour: boolean

  // Backend sync state
  isSyncing: boolean
  syncError: string | null

  // Auth actions
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  setAuthUser: (userId: string | null, supabaseUser: SupabaseUser | null) => Promise<void>

  // Workspace / data actions
  setCurrentWorkspace: (id: string) => void
  addWorkspace: (workspace: Workspace) => Promise<void>
  updateWorkspace: (id: string, patch: Partial<Workspace>) => Promise<void>
  addOrgProfile: (profile: OrganizationProfile) => Promise<void>
  addVehicleProfile: (profile: VehicleProfile) => Promise<void>
  updateVehicleProfile: (workspaceId: string, patch: Partial<VehicleProfile>) => Promise<void>
  addDriver: (driver: Driver) => void
  updateDriver: (id: string, patch: Partial<Driver>) => void
  deleteDriver: (id: string) => void
  addTrip: (trip: Trip) => Promise<void>
  deleteTrip: (id: string) => Promise<void>
  initWorkspaceDocuments: (workspaceId: string, docs: WorkspaceDocument[]) => Promise<void>
  updateDocumentStatus: (documentId: string, status: DocumentStatus) => void
  addEvent: (event: WorkspaceEvent) => void
  markEventRead: (id: string) => void
  addReceipt: (receipt: Receipt) => Promise<void>
  updateReceiptImage: (receiptId: string, imageUrl: string | undefined) => void
  attachReceiptToTrip: (receiptId: string, tripId: string) => Promise<void>
  detachReceiptFromTrip: (receiptId: string) => Promise<void>
  updateDocumentImage: (documentId: string, imageUrl: string | undefined) => void
  resetWorkspaceConfig: (workspaceId: string) => void
  setOnboarding: (state: OnboardingState | null) => void
  clearOnboarding: () => void
  completeTour: () => void
  resetTour: () => void
  hydrateFromBackend: () => Promise<void>
  clearSyncError: () => void

  // Billing actions (F-020)
  setSubscription: (sub: WorkspaceSubscription) => void
  refreshSubscription: (workspaceId: string) => Promise<void>
  /** Dev-only: simulate Pro activation without real Stripe payment */
  activateDevProSubscription: (workspaceId: string) => void
}

// ─── Error helpers ────────────────────────────────────────────────────────────

function syncErrorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Не удалось синхронизировать данные'
}

function isAuthError(err: unknown): boolean {
  return err instanceof AuthError
}

// ─── Empty workspace state (used on logout) ───────────────────────────────────

const EMPTY_WORKSPACE_STATE = {
  workspaces: [] as Workspace[],
  currentWorkspaceId: null,
  orgProfiles: [] as OrganizationProfile[],
  vehicleProfiles: [] as VehicleProfile[],
  trips: [] as Trip[],
  receipts: [] as Receipt[],
  documents: [] as WorkspaceDocument[],
  events: [] as WorkspaceEvent[],
  subscriptions: [] as WorkspaceSubscription[],
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => ({
      // Auth — initial values depend on whether backend is configured:
      // - no backend: permanently authenticated with mock user (Phase 8 behavior preserved)
      // - backend: unknown until onAuthStateChange fires (authChecked = false)
      user: mockUser,
      isAuthenticated: !isBackendConfigured,
      authUserId: null,
      authChecked: !isBackendConfigured,

      workspaces: mockWorkspaces,
      currentWorkspaceId: mockWorkspaces[0]?.id ?? null,

      orgProfiles: mockOrgProfiles,
      vehicleProfiles: mockVehicleProfiles,
      drivers: [],
      trips: mockTrips,
      documents: mockDocuments,
      events: mockEvents,
      receipts: [],
      subscriptions: [],
      onboarding: null,
      hasSeenTour: false,

      isSyncing: false,
      syncError: null,

      // ── Auth actions ─────────────────────────────────────────────────────────

      signIn: async (email, password) => {
        if (!supabase) return { error: 'Backend не подключён' }
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) return { error: mapAuthErrorMessage(error.message) }
        // onAuthStateChange will fire → setAuthUser → hydrateFromBackend
        return { error: null }
      },

      signUp: async (email, password) => {
        if (!supabase) return { error: 'Backend не подключён' }
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) return { error: mapAuthErrorMessage(error.message) }
        // Supabase sends confirmation email; session may be active immediately
        // depending on project email confirmation settings.
        return { error: null }
      },

      signOut: async () => {
        if (supabase) {
          await supabase.auth.signOut()
        }
        set({
          authUserId: null,
          authChecked: true,
          isAuthenticated: false,
          user: mockUser,
          ...EMPTY_WORKSPACE_STATE,
        })
      },

      /**
       * Called by App.tsx onAuthStateChange subscription.
       * Updates auth state and triggers hydration (or reset) accordingly.
       */
      setAuthUser: async (userId, supabaseUser) => {
        if (!userId) {
          // Signed out or no session
          set({
            authUserId: null,
            authChecked: true,
            isAuthenticated: false,
          })
          return
        }

        // Map Supabase user to domain User (email from auth, name from metadata or email prefix)
        const email = supabaseUser?.email ?? ''
        const name =
          (supabaseUser?.user_metadata?.['name'] as string | undefined) ??
          email.split('@')[0] ??
          'Пользователь'

        const authUser: User = {
          id: userId,
          email,
          name,
          subscriptionStatus: 'trial',   // Phase 10: replace with real billing status
          subscriptionExpiresAt: undefined,
          createdAt: supabaseUser?.created_at ?? new Date().toISOString(),
        }

        set({
          authUserId: userId,
          authChecked: true,
          isAuthenticated: true,
          user: authUser,
        })

        // Hydrate workspace data for this user
        await get().hydrateFromBackend()
      },

      // ── Backend hydration ────────────────────────────────────────────────────

      hydrateFromBackend: async () => {
        if (!isBackendConfigured) return
        const userId = get().authUserId
        if (!userId) return   // not authenticated; nothing to load

        set({ isSyncing: true, syncError: null })
        try {
          const data = await fetchAllUserData(userId)
          if (data.workspaces.length > 0) {
            const currentId = get().currentWorkspaceId
            const stillValid = data.workspaces.some((ws) => ws.id === currentId)
            set({
              workspaces: data.workspaces,
              orgProfiles: data.orgProfiles,
              vehicleProfiles: data.vehicleProfiles,
              trips: data.trips,
              receipts: data.receipts,
              documents: data.documents,
              events: data.events,
              subscriptions: data.subscriptions,
              currentWorkspaceId: stillValid
                ? currentId
                : (data.workspaces[0]?.id ?? null),
            })
          }
          // If backend has no workspaces yet, keep local/mock data as-is (first-run).
        } catch (err) {
          if (isAuthError(err)) {
            // Auth error during hydration → force sign-out
            console.error('[drivedocs] Auth error during hydration — signing out', err)
            await get().signOut()
          } else {
            set({ syncError: syncErrorMessage(err) })
          }
        } finally {
          set({ isSyncing: false })
        }
      },

      // ── Workspace actions ────────────────────────────────────────────────────

      setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),

      addWorkspace: async (workspace) => {
        // Ensure workspace.userId reflects the authenticated user, not mock
        const authUserId = get().authUserId
        const workspaceWithAuth = authUserId
          ? { ...workspace, userId: authUserId }
          : workspace
        const now = new Date().toISOString()
        const freeSub: WorkspaceSubscription = {
          id: crypto.randomUUID(),
          workspaceId: workspaceWithAuth.id,
          planCode: 'free',
          status: 'active',
          createdAt: now,
          updatedAt: now,
        }
        set((state) => ({
          workspaces: [...state.workspaces, workspaceWithAuth],
          currentWorkspaceId: workspaceWithAuth.id,
          subscriptions: [
            ...state.subscriptions.filter((s) => s.workspaceId !== workspaceWithAuth.id),
            freeSub,
          ],
        }))
        if (isBackendConfigured) {
          try {
            await workspaceRepo.upsert(workspaceWithAuth)
            // DB trigger auto-creates the free row; upsert here is a safety fallback
            // in case the trigger is not yet applied to the Supabase instance.
            await subscriptionRepo.upsert(freeSub)
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

      // ── Driver actions ───────────────────────────────────────────────────────

      addDriver: (driver) =>
        set((state) => ({ drivers: [...state.drivers, driver] })),

      updateDriver: (id, patch) =>
        set((state) => ({
          drivers: state.drivers.map((d) => (d.id === id ? { ...d, ...patch } : d)),
        })),

      deleteDriver: (id) =>
        set((state) => ({ drivers: state.drivers.filter((d) => d.id !== id) })),

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

      // ── Document actions ──────────────────────────────────────────────────────

      initWorkspaceDocuments: async (workspaceId, docs) => {
        set((state) => ({
          documents: [
            ...state.documents.filter((d) => d.workspaceId !== workspaceId),
            ...docs,
          ],
        }))
        if (isBackendConfigured) {
          try {
            await documentRepo.bulkUpsert(docs)
          } catch (err) {
            set({ syncError: syncErrorMessage(err) })
          }
        }
      },

      updateDocumentStatus: (documentId, status) => {
        const completedAt = status === 'completed' ? todayISO() : undefined
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId ? { ...d, status, completedAt } : d,
          ),
        }))
        if (isBackendConfigured) {
          documentRepo
            .updateStatus(documentId, status, completedAt ?? null)
            .catch((err) => set({ syncError: syncErrorMessage(err) }))
        }
      },

      // ── Event actions ─────────────────────────────────────────────────────────

      addEvent: (event) => {
        set((state) => ({ events: [event, ...state.events] }))
        if (isBackendConfigured) {
          eventRepo
            .insert(event)
            .catch((err) => set({ syncError: syncErrorMessage(err) }))
        }
      },

      markEventRead: (id) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, isRead: true } : e)),
        }))
        if (isBackendConfigured) {
          eventRepo
            .markRead(id)
            .catch((err) => set({ syncError: syncErrorMessage(err) }))
        }
      },

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

      updateReceiptImage: (receiptId, imageUrl) => {
        set((state) => ({
          receipts: state.receipts.map((r) =>
            r.id === receiptId ? { ...r, imageUrl } : r,
          ),
        }))
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

      updateDocumentImage: (documentId, imageUrl) => {
        set((state) => ({
          documents: state.documents.map((d) =>
            d.id === documentId ? { ...d, imageUrl } : d,
          ),
        }))
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
          workspaceRepo.update(workspaceId, { isConfigured: false }).catch((err) =>
            set({ syncError: syncErrorMessage(err) }),
          )
        }
      },

      // ── Onboarding ───────────────────────────────────────────────────────────

      setOnboarding: (onboarding) => set({ onboarding }),
      clearOnboarding: () => set({ onboarding: null }),

      completeTour: () => set({ hasSeenTour: true }),
      resetTour: () => set({ hasSeenTour: false }),

      clearSyncError: () => set({ syncError: null }),

      // ── Billing actions (F-020) ───────────────────────────────────────────────

      setSubscription: (sub) =>
        set((state) => ({
          subscriptions: [
            ...state.subscriptions.filter((s) => s.workspaceId !== sub.workspaceId),
            sub,
          ],
        })),

      refreshSubscription: async (workspaceId) => {
        if (!isBackendConfigured) return
        try {
          const sub = await subscriptionRepo.getByWorkspace(workspaceId)
          if (sub) {
            set((state) => ({
              subscriptions: [
                ...state.subscriptions.filter((s) => s.workspaceId !== workspaceId),
                sub,
              ],
            }))
          }
        } catch (err) {
          set({ syncError: syncErrorMessage(err) })
        }
      },

      activateDevProSubscription: (workspaceId) => {
        const devSub: WorkspaceSubscription = {
          id: `dev-sub-${workspaceId}`,
          workspaceId,
          planCode: 'pro',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({
          subscriptions: [
            ...state.subscriptions.filter((s) => s.workspaceId !== workspaceId),
            devSub,
          ],
        }))
      },
    }),
    {
      name: 'drivedocs-workspace',
      version: 1,
      // v1: strip base64 imageUrl from receipts/documents before persisting
      //     to prevent localStorage quota overflow (~5 MB limit).
      //     Images are session-only; user re-attaches if needed.
      partialize: (state) => ({
        // Auth state is NOT persisted — Supabase manages its own session in localStorage.
        currentWorkspaceId: state.currentWorkspaceId,
        workspaces: state.workspaces,
        orgProfiles: state.orgProfiles,
        vehicleProfiles: state.vehicleProfiles,
        drivers: state.drivers,
        trips: state.trips,
        documents: state.documents.map((d) => ({ ...d, imageUrl: undefined })),
        events: state.events,
        receipts: state.receipts.map((r) => ({ ...r, imageUrl: undefined })),
        subscriptions: state.subscriptions,
        hasSeenTour: state.hasSeenTour,
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

// ─── Billing selectors (F-020) ────────────────────────────────────────────────

export const useWorkspaceSubscription = (workspaceId: string) =>
  useWorkspaceStore((s) =>
    s.subscriptions.find((sub) => sub.workspaceId === workspaceId) ?? null,
  )

/** Beta: все пользователи получают Pro-доступ без ограничений */
export const useIsProWorkspace = (_workspaceId: string) => true

export const useDrivers = (workspaceId: string) =>
  useWorkspaceStore((s) => s.drivers.filter((d) => d.workspaceId === workspaceId))

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function todayISO(): string {
  return new Date().toISOString().split('T')[0]
}
