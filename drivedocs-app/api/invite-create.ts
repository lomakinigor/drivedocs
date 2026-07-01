// POST /api/invite-create — owner создаёт invite-код для водителя.
// Body: {} (workspace_id берётся из активного workspace owner'а)
// Auth: Bearer <access_token>
// Response: { code, expires_at, workspace_name }

export const config = { runtime: 'edge' }

interface ResponsePayload {
  code: string
  expires_at: string
  workspace_name: string
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

// 6-значный alphanumeric код без похожих символов (без 0/O, 1/I/l).
function generateCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const bytes = new Uint8Array(6)
  crypto.getRandomValues(bytes)
  let code = ''
  for (let i = 0; i < 6; i++) code += alphabet[bytes[i] % alphabet.length]
  return code
}

interface WorkspaceRow {
  id: string
  name: string
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() })
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' })

  const url = process.env.SUPABASE_URL
  const anonKey = process.env.SUPABASE_ANON_KEY
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey || !serviceKey) {
    return json(503, { error: 'backend_not_configured' })
  }

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

  // Читаем workspace для этого юзера (owner-only) через service_role.
  const wsResp = await fetch(
    `${url}/rest/v1/workspaces?user_id=eq.${encodeURIComponent(userId)}&select=id,name&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  )
  if (!wsResp.ok) return json(500, { error: 'workspace_fetch_failed' })
  const wsList = (await wsResp.json().catch(() => [])) as WorkspaceRow[]
  const workspace = wsList[0]
  if (!workspace) return json(404, { error: 'no_workspace' })

  const code = generateCode()
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()

  const insertResp = await fetch(`${url}/rest/v1/workspace_invites`, {
    method: 'POST',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify({
      workspace_id: workspace.id,
      code,
      role: 'driver',
      expires_at: expiresAt,
      created_by: userId,
    }),
  })
  if (!insertResp.ok) {
    const detail = await insertResp.text().catch(() => '')
    return json(500, { error: 'insert_failed', detail: detail.slice(0, 200) })
  }

  const payload: ResponsePayload = {
    code,
    expires_at: expiresAt,
    workspace_name: workspace.name,
  }
  return json(200, payload)
}
