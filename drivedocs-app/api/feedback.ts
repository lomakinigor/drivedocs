// Vercel Edge Function — приём фидбэка с фронта и форвард в Telegram.
// POST /api/feedback с JSON-телом { kind, text, contact?, meta? }.
// Секреты живут в Vercel env vars: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID.
// MAX добавим позже — поле delivered.max сейчас false.

export const config = { runtime: 'edge' }

interface FeedbackPayload {
  kind: 'love' | 'bug' | 'idea' | 'question'
  text: string
  contact?: string
  meta?: Record<string, unknown>
}

const KIND_EMOJI: Record<FeedbackPayload['kind'], string> = {
  love: '❤️',
  bug: '🐞',
  idea: '💡',
  question: '❓',
}

const KIND_LABEL: Record<FeedbackPayload['kind'], string> = {
  love: 'Нравится',
  bug: 'Баг',
  idea: 'Идея',
  question: 'Вопрос',
}

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] ?? c))
}

function buildMessage(p: FeedbackPayload): string {
  const lines: string[] = [
    `${KIND_EMOJI[p.kind]} <b>DriveDocs · ${KIND_LABEL[p.kind]}</b>`,
    '',
    escapeHtml(p.text.trim()),
  ]
  if (p.contact?.trim()) {
    lines.push('', `<b>Контакт:</b> ${escapeHtml(p.contact.trim())}`)
  }
  if (p.meta && Object.keys(p.meta).length > 0) {
    const metaLines = Object.entries(p.meta)
      .map(([k, v]) => `${escapeHtml(k)}: ${escapeHtml(String(v))}`)
      .join('\n')
    if (metaLines) {
      lines.push('', '<pre>' + metaLines + '</pre>')
    }
  }
  return lines.join('\n')
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method_not_allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    return new Response(JSON.stringify({ error: 'backend_not_configured' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  let payload: FeedbackPayload
  try {
    payload = (await req.json()) as FeedbackPayload
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  if (!payload?.kind || !payload?.text || payload.text.trim().length < 3) {
    return new Response(JSON.stringify({ error: 'invalid_payload' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  const tgResp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: buildMessage(payload),
      parse_mode: 'HTML',
      disable_web_page_preview: true,
    }),
  })

  if (!tgResp.ok) {
    const errText = await tgResp.text().catch(() => '')
    return new Response(JSON.stringify({ error: 'telegram_failed', detail: errText.slice(0, 300) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  return new Response(JSON.stringify({ delivered: { telegram: true, max: false } }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}
