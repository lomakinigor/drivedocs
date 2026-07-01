// GET /api/invite-validate?code=XXXXXX — валидация invite-кода перед join.
// Публичный (не требует auth), т.к. используется на экране «Введите код».
// Response: { valid, workspace_name?, expired?, error? }

export const config = { runtime: 'edge' }

function cors(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors() },
  })
}

interface InviteRow {
  workspace_id: string
  expires_at: string
  used_by: string | null
  workspaces: { name: string } | { name: string }[]
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors() })
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' })

  const url = process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return json(503, { error: 'backend_not_configured' })

  const codeRaw = new URL(req.url).searchParams.get('code') ?? ''
  const code = codeRaw.trim().toUpperCase()
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    return json(200, { valid: false, error: 'invalid_format' })
  }

  const resp = await fetch(
    `${url}/rest/v1/workspace_invites?code=eq.${encodeURIComponent(code)}&select=workspace_id,expires_at,used_by,workspaces(name)&limit=1`,
    {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    },
  )
  if (!resp.ok) return json(500, { error: 'lookup_failed' })
  const rows = (await resp.json().catch(() => [])) as InviteRow[]
  const invite = rows[0]
  if (!invite) return json(200, { valid: false, error: 'not_found' })
  if (invite.used_by) return json(200, { valid: false, error: 'already_used' })
  if (new Date(invite.expires_at).getTime() < Date.now()) {
    return json(200, { valid: false, error: 'expired' })
  }

  const wsName = Array.isArray(invite.workspaces)
    ? invite.workspaces[0]?.name
    : invite.workspaces?.name
  return json(200, { valid: true, workspace_name: wsName ?? '—' })
}
