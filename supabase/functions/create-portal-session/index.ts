/**
 * create-portal-session — Supabase Edge Function
 *
 * Creates a Stripe Billing Portal session so the user can manage their
 * subscription (cancel, update payment method, view invoices) via Stripe's
 * hosted UI.
 *
 * Request (POST, with Authorization header):
 *   { workspaceId: string, returnUrl: string }
 *
 * Response:
 *   { url: string }         — redirect user here
 *   { error: string }       — Russian-language error (4xx / 5xx)
 *
 * Required secrets:
 *   STRIPE_SECRET_KEY       — set via `supabase secrets set`
 *
 * Auto-available Supabase secrets:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@15'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── 1. Auth verification ──────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return json({ error: 'Необходимо войти в аккаунт.' }, 401)
  }

  const supabaseUser = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } },
  )

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser()
  if (authError || !user) {
    return json({ error: 'Необходимо войти в аккаунт.' }, 401)
  }

  // ── 2. Parse body ─────────────────────────────────────────────────────────
  let workspaceId: string
  let returnUrl: string
  try {
    const body = await req.json()
    workspaceId = body.workspaceId
    returnUrl = body.returnUrl
  } catch {
    return json({ error: 'Неверный формат запроса.' }, 400)
  }

  if (!workspaceId || !returnUrl) {
    return json({ error: 'Неверный формат запроса.' }, 400)
  }

  // ── 3. Verify workspace ownership ─────────────────────────────────────────
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const { data: workspace, error: wsError } = await supabaseAdmin
    .from('workspaces')
    .select('id')
    .eq('id', workspaceId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (wsError || !workspace) {
    return json({ error: 'Доступ запрещён.' }, 403)
  }

  // ── 4. Fetch stripe_customer_id from subscriptions ────────────────────────
  const { data: sub, error: subError } = await supabaseAdmin
    .from('subscriptions')
    .select('stripe_customer_id, plan_code, status')
    .eq('workspace_id', workspaceId)
    .maybeSingle()

  if (subError) {
    console.error('[portal] DB error fetching subscription:', subError)
    return json({ error: 'Ошибка при получении данных подписки.' }, 500)
  }

  if (!sub?.stripe_customer_id) {
    return json({ error: 'Активная подписка Stripe не найдена.' }, 404)
  }

  if (sub.plan_code !== 'pro' || sub.status !== 'active') {
    return json({ error: 'Управление подпиской доступно только для активных Pro-подписок.' }, 400)
  }

  // ── 5. Create Stripe Billing Portal session ───────────────────────────────
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  if (!stripeSecretKey) {
    console.error('[portal] Missing STRIPE_SECRET_KEY')
    return json({ error: 'Ошибка конфигурации сервера.' }, 500)
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripe_customer_id,
      return_url: returnUrl,
    })

    console.log(`[portal] Portal session created for workspace ${workspaceId}`)
    return json({ url: session.url }, 200)
  } catch (err) {
    console.error('[portal] Stripe error:', err)
    return json({ error: 'Не удалось открыть портал управления подпиской. Попробуйте ещё раз.' }, 500)
  }
})

// ─── Helper ───────────────────────────────────────────────────────────────────

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
