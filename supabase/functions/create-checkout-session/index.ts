/**
 * create-checkout-session — Supabase Edge Function
 *
 * Creates a Stripe Checkout Session for a Pro subscription.
 *
 * POST body: { workspaceId: string, successUrl: string, cancelUrl: string }
 * Returns:   { url: string } — Stripe Checkout URL to redirect to
 *
 * Required secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRICE_PRO_MONTHLY
 *
 * Auto-available Supabase secrets:
 *   SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
 *
 * Security:
 *   - Stripe secret key never leaves the server.
 *   - Auth is verified via JWT from the Authorization header.
 *   - Workspace ownership is verified before creating a session.
 */

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@15'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // ── 1. Verify auth ──────────────────────────────────────────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonError('Необходима авторизация.', 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Verify user's JWT by creating a client scoped to the user's token
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser()

    if (authError || !user) {
      console.error('[checkout] Auth error:', authError?.message)
      return jsonError('Недействительная сессия. Войдите заново.', 401)
    }

    // ── 2. Parse and validate request body ─────────────────────────────────
    let workspaceId: string
    let successUrl: string
    let cancelUrl: string
    try {
      const body = await req.json() as { workspaceId?: string; successUrl?: string; cancelUrl?: string }
      workspaceId = body.workspaceId ?? ''
      successUrl = body.successUrl ?? ''
      cancelUrl = body.cancelUrl ?? ''
    } catch {
      return jsonError('Некорректный формат запроса.', 400)
    }

    if (!workspaceId || !successUrl || !cancelUrl) {
      return jsonError('Отсутствуют обязательные параметры: workspaceId, successUrl, cancelUrl.', 400)
    }

    // ── 3. Admin client for DB operations ──────────────────────────────────
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // ── 4. Verify workspace ownership ──────────────────────────────────────
    const { data: workspace, error: wsError } = await supabaseAdmin
      .from('workspaces')
      .select('id, user_id')
      .eq('id', workspaceId)
      .maybeSingle()

    if (wsError || !workspace) {
      console.error('[checkout] Workspace lookup error:', wsError?.message)
      return jsonError('Рабочее пространство не найдено.', 404)
    }

    if (workspace.user_id !== user.id) {
      return jsonError('Доступ запрещён.', 403)
    }

    // ── 5. Check for existing active Pro subscription ───────────────────────
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('id, plan_code, status, stripe_customer_id')
      .eq('workspace_id', workspaceId)
      .maybeSingle()

    if (existingSub?.plan_code === 'pro' && existingSub?.status === 'active') {
      return json({ alreadyPro: true }, 200)
    }

    // ── 6. Stripe: create or reuse Customer ────────────────────────────────
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      console.error('[checkout] STRIPE_SECRET_KEY is not set')
      return jsonError('Сервис оплаты временно недоступен.', 503)
    }

    const priceId = Deno.env.get('STRIPE_PRICE_PRO_MONTHLY')
    if (!priceId) {
      console.error('[checkout] STRIPE_PRICE_PRO_MONTHLY is not set')
      return jsonError('Сервис оплаты временно недоступен.', 503)
    }

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

    let customerId: string | null = existingSub?.stripe_customer_id ?? null

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          workspaceId,
          userId: user.id,
        },
      })
      customerId = customer.id
    }

    // ── 7. Create Stripe Checkout Session ──────────────────────────────────
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        workspaceId,
        userId: user.id,
        planCode: 'pro',
      },
    })

    if (!session.url) {
      console.error('[checkout] Stripe returned session without URL')
      return jsonError('Не удалось получить ссылку для оплаты. Попробуйте ещё раз.', 500)
    }

    // ── 8. Pre-save stripe_customer_id so webhook has context ──────────────
    const now = new Date().toISOString()
    if (existingSub) {
      await supabaseAdmin
        .from('subscriptions')
        .update({ stripe_customer_id: customerId, updated_at: now })
        .eq('workspace_id', workspaceId)
    } else {
      await supabaseAdmin
        .from('subscriptions')
        .insert({
          id: crypto.randomUUID(),
          workspace_id: workspaceId,
          plan_code: 'free',
          status: 'active',
          stripe_customer_id: customerId,
          created_at: now,
          updated_at: now,
        })
    }

    return json({ url: session.url }, 200)
  } catch (err) {
    console.error('[checkout] Unexpected error:', err)
    return jsonError('Внутренняя ошибка сервера. Попробуйте ещё раз.', 500)
  }
})

// ─── Helpers ─────────────────────────────────────────────────────────────────

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function jsonError(message: string, status: number): Response {
  return json({ error: message }, status)
}
