import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

// When env vars are absent, supabase is null and the app falls back to
// localStorage-only mode. No crash, just a console warning in development.
export const supabase: SupabaseClient | null =
  url && key ? createClient(url, key) : null

export const isBackendConfigured = Boolean(url && key)

if (!isBackendConfigured && import.meta.env.DEV) {
  console.warn(
    '[drivedocs] Supabase env vars not set — running in localStorage-only mode.\n' +
    'Copy .env.example to .env.local and fill in VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY.',
  )
}
