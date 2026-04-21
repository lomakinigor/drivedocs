import { createClient, type SupabaseClient, type User as SupabaseUser } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// When env vars are absent, supabase is null and the app falls back to
// localStorage-only mode (no auth required, mock data). No crash.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export const isBackendConfigured = Boolean(url && key)

if (!isBackendConfigured && import.meta.env.DEV) {
  console.warn(
    '[drivedocs] Supabase env vars not set — running in localStorage-only mode.\n' +
    'Copy .env.example to .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.',
  )
}

// ─── Auth helpers ─────────────────────────────────────────────────────────────

export type { SupabaseUser }

/**
 * Subscribes to Supabase auth state changes.
 * Callback fires immediately with current session state, then on every change.
 * Returns an unsubscribe function for cleanup.
 *
 * When supabase is null (localStorage mode), fires callback with null once and returns a no-op.
 */
export function subscribeToAuthChanges(
  callback: (userId: string | null, user: SupabaseUser | null) => void,
): () => void {
  if (!supabase) {
    callback(null, null)
    return () => {}
  }
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user?.id ?? null, session?.user ?? null)
  })
  return () => subscription.unsubscribe()
}

/**
 * Returns current authenticated user id synchronously from cached session,
 * or null if not authenticated / backend not configured.
 */
export function getCurrentUserId(): string | null {
  // supabase-js v2 stores session in localStorage and getSession() is async,
  // but getUser() / session cached in client is accessible synchronously-ish.
  // For Phase 9, user id is obtained via onAuthStateChange subscription in store.
  return null  // use subscribeToAuthChanges for reliable access
}
