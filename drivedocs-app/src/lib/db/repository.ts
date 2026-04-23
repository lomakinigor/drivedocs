/**
 * Persistence repository — typed data access layer between the Zustand store and Supabase.
 *
 * All functions return early (no-op) when Supabase is not configured.
 * Callers (store actions) apply optimistic local updates first; these functions
 * handle the backend persistence side. Errors are surfaced to the caller as thrown
 * Error instances — callers decide how to handle (store sets syncError).
 *
 * Phase 9: user_id is obtained from supabase.auth session.
 * The listByUser(userId) functions accept userId from the store, which gets it
 * from the Supabase auth user after setAuthUser() is called.
 */

import { supabase } from '../supabase'
import type {
  Workspace,
  OrganizationProfile,
  VehicleProfile,
  Trip,
  Receipt,
  WorkspaceDocument,
  DocumentStatus,
  WorkspaceEvent,
} from '@/entities/types/domain'

// ─── Row types (snake_case DB columns) ────────────────────────────────────────

interface WorkspaceRow {
  id: string
  user_id: string
  name: string
  entity_type: string
  tax_mode: string
  vehicle_usage_model: string
  is_configured: boolean
  created_at: string
}

interface OrgProfileRow {
  workspace_id: string
  entity_type: string
  inn: string | null
  ogrn: string | null
  organization_name: string | null
  owner_full_name: string | null
}

interface VehicleProfileRow {
  workspace_id: string
  make: string
  model: string
  year: number
  license_plate: string
  engine_volume: number | null
  fuel_type: string | null
  owner_full_name: string | null
}

interface TripRow {
  id: string
  workspace_id: string
  date: string
  start_location: string
  end_location: string
  distance_km: number
  purpose: string
  notes: string | null
  created_at: string
}

interface ReceiptRow {
  id: string
  workspace_id: string
  trip_id: string | null
  date: string
  amount: number
  category: string
  description: string | null
  created_at: string
}

// ─── Mappers ──────────────────────────────────────────────────────────────────

function rowToWorkspace(r: WorkspaceRow): Workspace {
  return {
    id: r.id,
    userId: r.user_id,
    name: r.name,
    entityType: r.entity_type as Workspace['entityType'],
    taxMode: r.tax_mode as Workspace['taxMode'],
    vehicleUsageModel: r.vehicle_usage_model as Workspace['vehicleUsageModel'],
    isConfigured: r.is_configured,
    createdAt: r.created_at,
  }
}

function workspaceToRow(ws: Workspace): WorkspaceRow {
  return {
    id: ws.id,
    user_id: ws.userId,
    name: ws.name,
    entity_type: ws.entityType,
    tax_mode: ws.taxMode,
    vehicle_usage_model: ws.vehicleUsageModel,
    is_configured: ws.isConfigured,
    created_at: ws.createdAt,
  }
}

function rowToOrgProfile(r: OrgProfileRow): OrganizationProfile {
  return {
    workspaceId: r.workspace_id,
    entityType: r.entity_type as OrganizationProfile['entityType'],
    inn: r.inn ?? undefined,
    ogrn: r.ogrn ?? undefined,
    organizationName: r.organization_name ?? undefined,
    ownerFullName: r.owner_full_name ?? undefined,
  }
}

function orgProfileToRow(p: OrganizationProfile): OrgProfileRow {
  return {
    workspace_id: p.workspaceId,
    entity_type: p.entityType,
    inn: p.inn ?? null,
    ogrn: p.ogrn ?? null,
    organization_name: p.organizationName ?? null,
    owner_full_name: p.ownerFullName ?? null,
  }
}

function rowToVehicleProfile(r: VehicleProfileRow): VehicleProfile {
  return {
    workspaceId: r.workspace_id,
    make: r.make,
    model: r.model,
    year: r.year,
    licensePlate: r.license_plate,
    engineVolume: r.engine_volume ?? undefined,
    fuelType: r.fuel_type as VehicleProfile['fuelType'] ?? undefined,
    ownerFullName: r.owner_full_name ?? undefined,
  }
}

function vehicleProfileToRow(p: VehicleProfile): VehicleProfileRow {
  return {
    workspace_id: p.workspaceId,
    make: p.make,
    model: p.model,
    year: p.year,
    license_plate: p.licensePlate,
    engine_volume: p.engineVolume ?? null,
    fuel_type: p.fuelType ?? null,
    owner_full_name: p.ownerFullName ?? null,
  }
}

function rowToTrip(r: TripRow): Trip {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    date: r.date,
    startLocation: r.start_location,
    endLocation: r.end_location,
    distanceKm: Number(r.distance_km),
    purpose: r.purpose,
    notes: r.notes ?? undefined,
    createdAt: r.created_at,
  }
}

function tripToRow(t: Trip): TripRow {
  return {
    id: t.id,
    workspace_id: t.workspaceId,
    date: t.date,
    start_location: t.startLocation,
    end_location: t.endLocation,
    distance_km: t.distanceKm,
    purpose: t.purpose,
    notes: t.notes ?? null,
    created_at: t.createdAt,
  }
}

function rowToReceipt(r: ReceiptRow): Receipt {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    tripId: r.trip_id ?? undefined,
    date: r.date,
    amount: Number(r.amount),
    category: r.category as Receipt['category'],
    description: r.description ?? undefined,
    // imageUrl intentionally omitted — object URLs are ephemeral (D-009)
  }
}

function receiptToRow(r: Receipt): ReceiptRow {
  return {
    id: r.id,
    workspace_id: r.workspaceId,
    trip_id: r.tripId ?? null,
    date: r.date,
    amount: r.amount,
    category: r.category,
    description: r.description ?? null,
    created_at: new Date().toISOString(),
  }
}

// ─── Auth error guard ─────────────────────────────────────────────────────────

/** Throws an auth error if Supabase error indicates 401/403. */
function throwIfAuthError(message: string): void {
  if (
    message.includes('JWT') ||
    message.includes('Not Authenticated') ||
    message.includes('permission denied') ||
    message.includes('row-level security')
  ) {
    throw new AuthError(message)
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

// ─── Workspace repo ───────────────────────────────────────────────────────────

export const workspaceRepo = {
  async listByUser(userId: string): Promise<Workspace[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('user_id', userId)
      .order('created_at')
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as WorkspaceRow[]).map(rowToWorkspace)
  },

  async upsert(workspace: Workspace): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('workspaces')
      .upsert(workspaceToRow(workspace))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async update(id: string, patch: Partial<Workspace>): Promise<void> {
    if (!supabase) return
    const row: Partial<WorkspaceRow> = {}
    if (patch.name !== undefined) row.name = patch.name
    if (patch.entityType !== undefined) row.entity_type = patch.entityType
    if (patch.taxMode !== undefined) row.tax_mode = patch.taxMode
    if (patch.vehicleUsageModel !== undefined) row.vehicle_usage_model = patch.vehicleUsageModel
    if (patch.isConfigured !== undefined) row.is_configured = patch.isConfigured
    const { error } = await supabase.from('workspaces').update(row).eq('id', id)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── OrgProfile repo ──────────────────────────────────────────────────────────

export const orgProfileRepo = {
  async listByUser(userId: string): Promise<OrganizationProfile[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('org_profiles')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as OrgProfileRow[]).map(rowToOrgProfile)
  },

  async upsert(profile: OrganizationProfile): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('org_profiles')
      .upsert(orgProfileToRow(profile))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── VehicleProfile repo ──────────────────────────────────────────────────────

export const vehicleProfileRepo = {
  async listByUser(userId: string): Promise<VehicleProfile[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('vehicle_profiles')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as VehicleProfileRow[]).map(rowToVehicleProfile)
  },

  async upsert(profile: VehicleProfile): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('vehicle_profiles')
      .upsert(vehicleProfileToRow(profile))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async updatePartial(workspaceId: string, patch: Partial<VehicleProfile>): Promise<void> {
    if (!supabase) return
    const row: Partial<VehicleProfileRow> = {}
    if (patch.make !== undefined) row.make = patch.make
    if (patch.model !== undefined) row.model = patch.model
    if (patch.year !== undefined) row.year = patch.year
    if (patch.licensePlate !== undefined) row.license_plate = patch.licensePlate
    if (patch.engineVolume !== undefined) row.engine_volume = patch.engineVolume ?? null
    if (patch.fuelType !== undefined) row.fuel_type = patch.fuelType ?? null
    if (patch.ownerFullName !== undefined) row.owner_full_name = patch.ownerFullName ?? null
    const { error } = await supabase
      .from('vehicle_profiles')
      .update(row)
      .eq('workspace_id', workspaceId)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── Trip repo ────────────────────────────────────────────────────────────────

export const tripRepo = {
  async listByUser(userId: string): Promise<Trip[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('trips')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
      .order('date', { ascending: false })
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as TripRow[]).map(rowToTrip)
  },

  async insert(trip: Trip): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('trips').insert(tripToRow(trip))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async delete(id: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('trips').delete().eq('id', id)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── Receipt repo ─────────────────────────────────────────────────────────────

export const receiptRepo = {
  async listByUser(userId: string): Promise<Receipt[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('receipts')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
      .order('date', { ascending: false })
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as ReceiptRow[]).map(rowToReceipt)
  },

  async insert(receipt: Receipt): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('receipts').insert(receiptToRow(receipt))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async updateTripLink(receiptId: string, tripId: string | null): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('receipts')
      .update({ trip_id: tripId })
      .eq('id', receiptId)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── Document repo ────────────────────────────────────────────────────────────

interface DocumentRow {
  id: string
  workspace_id: string
  title: string
  description: string | null
  type: string
  status: string
  due_date: string | null
  completed_at: string | null
  template_key: string | null
  created_at: string
}

function rowToDocument(r: DocumentRow): WorkspaceDocument {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    title: r.title,
    description: r.description ?? undefined,
    type: r.type as WorkspaceDocument['type'],
    status: r.status as DocumentStatus,
    dueDate: r.due_date ?? undefined,
    completedAt: r.completed_at ?? undefined,
    templateKey: r.template_key ?? undefined,
  }
}

function documentToRow(d: WorkspaceDocument): DocumentRow {
  return {
    id: d.id,
    workspace_id: d.workspaceId,
    title: d.title,
    description: d.description ?? null,
    type: d.type,
    status: d.status,
    due_date: d.dueDate ?? null,
    completed_at: d.completedAt ?? null,
    template_key: d.templateKey ?? null,
    created_at: new Date().toISOString(),
  }
}

export const documentRepo = {
  async listByUser(userId: string): Promise<WorkspaceDocument[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('documents')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
      .order('created_at')
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as DocumentRow[]).map(rowToDocument)
  },

  async upsert(document: WorkspaceDocument): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('documents').upsert(documentToRow(document))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async updateStatus(id: string, status: DocumentStatus, completedAt: string | null): Promise<void> {
    if (!supabase) return
    const { error } = await supabase
      .from('documents')
      .update({ status, completed_at: completedAt })
      .eq('id', id)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async bulkUpsert(documents: WorkspaceDocument[]): Promise<void> {
    if (!supabase || documents.length === 0) return
    const { error } = await supabase.from('documents').upsert(documents.map(documentToRow))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── Event repo ───────────────────────────────────────────────────────────────

interface EventRow {
  id: string
  workspace_id: string
  type: string
  title: string
  description: string
  date: string
  is_read: boolean
  severity: string
  link_to: string | null
  created_at: string
}

function rowToEvent(r: EventRow): WorkspaceEvent {
  return {
    id: r.id,
    workspaceId: r.workspace_id,
    type: r.type as WorkspaceEvent['type'],
    title: r.title,
    description: r.description,
    date: r.date,
    isRead: r.is_read,
    severity: r.severity as WorkspaceEvent['severity'],
    linkTo: r.link_to ?? undefined,
  }
}

function eventToRow(e: WorkspaceEvent): EventRow {
  return {
    id: e.id,
    workspace_id: e.workspaceId,
    type: e.type,
    title: e.title,
    description: e.description,
    date: e.date,
    is_read: e.isRead,
    severity: e.severity,
    link_to: e.linkTo ?? null,
    created_at: new Date().toISOString(),
  }
}

export const eventRepo = {
  async listByUser(userId: string): Promise<WorkspaceEvent[]> {
    if (!supabase) return []
    const { data, error } = await supabase
      .from('events')
      .select('*, workspaces!inner(user_id)')
      .eq('workspaces.user_id', userId)
      .order('date', { ascending: false })
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
    return (data as EventRow[]).map(rowToEvent)
  },

  async insert(event: WorkspaceEvent): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('events').insert(eventToRow(event))
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },

  async markRead(id: string): Promise<void> {
    if (!supabase) return
    const { error } = await supabase.from('events').update({ is_read: true }).eq('id', id)
    if (error) {
      throwIfAuthError(error.message)
      throw new Error(error.message)
    }
  },
}

// ─── Bulk hydration ───────────────────────────────────────────────────────────

export interface HydratedUserData {
  workspaces: Workspace[]
  orgProfiles: OrganizationProfile[]
  vehicleProfiles: VehicleProfile[]
  trips: Trip[]
  receipts: Receipt[]
  documents: WorkspaceDocument[]
  events: WorkspaceEvent[]
}

export async function fetchAllUserData(userId: string): Promise<HydratedUserData> {
  const [workspaces, orgProfiles, vehicleProfiles, trips, receipts, documents, events] = await Promise.all([
    workspaceRepo.listByUser(userId),
    orgProfileRepo.listByUser(userId),
    vehicleProfileRepo.listByUser(userId),
    tripRepo.listByUser(userId),
    receiptRepo.listByUser(userId),
    documentRepo.listByUser(userId),
    eventRepo.listByUser(userId),
  ])
  return { workspaces, orgProfiles, vehicleProfiles, trips, receipts, documents, events }
}
