// POST /api/invite-consume — водитель принимает приглашение и вступает в workspace.
// Body: { code, driver: { full_name, license_number, license_issued_at, birth_date, phone? } }
// Auth: Bearer <access_token>
// Response: { workspace_id, workspace_name }

export const config = { runtime: 'edge' }

interface DriverData {
  full_name?: string
  license_number?: string
  license_issued_at?: string    // YYYY-MM-DD
  birth_date?: string           // YYYY-MM-DD
  phone?: string
}

interface RequestBody {
  code?: string
  driver?: DriverData
}

function cors(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}

interface InviteRow {
  id: string
  workspace_id: string
  role: string
  expires_at: string
  used_by: string | null
  workspaces: { name: string } | { name: string }[]
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !anonKey || !serviceKey) return json(503, { error: 'backend_not_configured' })

  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : ''
  if (!token) return json(401, { error: 'missing_token' })

  const userResp = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
  })
  if (!userResp.ok) return json(401, { error: 'invalid_token' })
  const userData = (await userResp.json().catch(() => null)) as { id?: string } | null
  const userId = userData?.id
  if (!userId) return json(401, { error: 'invalid_token' })

  let payload: RequestBody
  try {
    payload = (await req.json()) as RequestBody
  } catch {
    return json(400, { error: 'invalid_json' })
  }
  const code = (payload.code ?? '').trim().toUpperCase()
  const driver = payload.driver ?? {}
  if (!/^[A-Z0-9]{6}$/.test(code)) return json(400, { error: 'invalid_code_format' })
  if (!driver.full_name || driver.full_name.trim().length < 3) {
    return json(400, { error: 'driver_data_required', field: 'full_name' })
  }

  // 1. Найти invite и провалидировать
  const invResp = await fetch(
    `${url}/rest/v1/workspace_invites?code=eq.${encodeURIComponent(code)}&select=id,workspace_id,role,expires_at,used_by,workspaces(name)&limit=1`,
    {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    },
  )
  if (!invResp.ok) return json(500, { error: 'lookup_failed' })
  const rows = (await invResp.json().catch(() => [])) as InviteRow[]
  const invite = rows[0]
  if (!invite) return json(404, { error: 'not_found' })
  if (invite.used_by) return json(410, { error: 'already_used' })
  if (new Date(invite.expires_at).getTime() < Date.now()) return json(410, { error: 'expired' })

  // 2. Атомарно: пометить invite как использованный + вставить workspace_member.
  // Для простоты — 2 отдельных запроса; при collision повторный consume вернёт 410.
  const claimResp = await fetch(
    `${url}/rest/v1/workspace_invites?id=eq.${invite.id}&used_by=is.null`,
    {
      method: 'PATCH',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ used_by: userId, used_at: new Date().toISOString() }),
    },
  )
  if (!claimResp.ok) return json(500, { error: 'claim_failed' })
  const claimed = (await claimResp.json().catch(() => [])) as unknown[]
  if (claimed.length === 0) return json(410, { error: 'race_condition_already_used' })

  // 3. Вставить/обновить workspace_member
  const memberResp = await fetch(`${url}/rest/v1/workspace_members`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify({
      workspace_id: invite.workspace_id,
      user_id: userId,
      role: invite.role,
      is_active_driver: true,
      driver_full_name: driver.full_name.trim(),
      driver_license_number: driver.license_number?.trim() || null,
      driver_license_issued_at: driver.license_issued_at || null,
      driver_birth_date: driver.birth_date || null,
      driver_phone: driver.phone?.trim() || null,
    }),
  })
  if (!memberResp.ok) {
    const detail = await memberResp.text().catch(() => '')
    return json(500, { error: 'member_insert_failed', detail: detail.slice(0, 300) })
  }

  const wsName = Array.isArray(invite.workspaces)
    ? invite.workspaces[0]?.name
    : invite.workspaces?.name
  return json(200, { workspace_id: invite.workspace_id, workspace_name: wsName ?? '—' })
}
