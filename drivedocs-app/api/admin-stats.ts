// Vercel Edge Function — счётчики для админ-дашборда.
// GET /api/admin-stats с Authorization: Bearer <access_token>.
// Сервер валидирует токен через Supabase Auth, проверяет email vs allowlist,
// затем считает строки через service_role (минуя RLS).
//
// Env vars: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS (csv).

export const config = { runtime: 'edge' }

interface Counts {
  registered_users: number
  workspaces: number
  trips: number
  receipts: number
  documents: number
  events: number
  installs: number
  ios_guide_opens: number
}

interface ReferralRow {
  name: string
  referral_code: string | null
  referred_by_code: string | null
  created_at: string
}

function cors(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}

async function countRows(
  url: string,
  serviceKey: string,
  table: string,
): Promise<number> {
  const resp = await fetch(`${url}/rest/v1/${table}?select=id`, {
    method: 'HEAD',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })
  const range = resp.headers.get('content-range') ?? '*/0'
  const total = range.split('/')[1] ?? '0'
  return Number.parseInt(total, 10) || 0
}

async function countRowsWhere(
  url: string,
  serviceKey: string,
  table: string,
  filter: string,
): Promise<number> {
  const resp = await fetch(`${url}/rest/v1/${table}?select=id&${filter}`, {
    method: 'HEAD',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      Prefer: 'count=exact',
      Range: '0-0',
    },
  })
  const range = resp.headers.get('content-range') ?? '*/0'
  const total = range.split('/')[1] ?? '0'
  return Number.parseInt(total, 10) || 0
}

async function fetchReferrals(url: string, serviceKey: string): Promise<ReferralRow[]> {
  // drivedocs-671 — сырые строки (не агрегат): нужно видеть кто кого привёл,
  // чтобы вручную проследить цепочки (A привёл B, B передал код C).
  const resp = await fetch(
    `${url}/rest/v1/workspaces?select=name,referral_code,referred_by_code,created_at&order=created_at.desc&limit=500`,
    { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
  )
  if (!resp.ok) return []
  return ((await resp.json().catch(() => [])) as ReferralRow[]) ?? []
}

async function countAuthUsers(url: string, serviceKey: string): Promise<number> {
  // GoTrue Admin API — листинг пользователей. Берём 1 на странице, total — из заголовка.
  const resp = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1`, {
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    },
  })
  if (!resp.ok) return 0
  const data = (await resp.json().catch(() => null)) as { total?: number } | null
  return data?.total ?? 0
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors() })
  }
  if (req.method !== 'GET') {
    return json(405, { error: 'method_not_allowed' })
  }

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)

  if (!url || !anonKey || !serviceKey || adminEmails.length === 0) {
    return json(503, { error: 'backend_not_configured' })
  }

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return json(401, { error: 'missing_token' })

  // Валидация токена + получение email через Supabase Auth.
  const userResp = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  if (!userResp.ok) return json(401, { error: 'invalid_token' })
  const userData = (await userResp.json().catch(() => null)) as { email?: string } | null
  const email = (userData?.email ?? '').toLowerCase()
  if (!email || !adminEmails.includes(email)) {
    return json(403, { error: 'forbidden' })
  }

  // Параллельно считаем все таблицы + auth users.
  const [registered, workspaces, trips, receipts, documents, events, installs, iosGuideOpens, referrals] =
    await Promise.all([
      countAuthUsers(url, serviceKey),
      countRows(url, serviceKey, 'workspaces'),
      countRows(url, serviceKey, 'trips'),
      countRows(url, serviceKey, 'receipts'),
      countRows(url, serviceKey, 'documents'),
      countRows(url, serviceKey, 'events'),
      countRowsWhere(url, serviceKey, 'install_events', 'platform=in.(android_installed,desktop_installed)'),
      countRowsWhere(url, serviceKey, 'install_events', 'platform=eq.ios_guide_opened'),
      fetchReferrals(url, serviceKey),
    ])

  const counts: Counts = {
    registered_users: registered,
    workspaces,
    trips,
    receipts,
    documents,
    events,
    installs,
    ios_guide_opens: iosGuideOpens,
  }

  return json(200, { counts, referrals, generated_at: new Date().toISOString() })
}
