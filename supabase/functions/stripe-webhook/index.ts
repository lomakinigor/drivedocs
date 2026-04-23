/**
 * stripe-webhook — Supabase Edge Function
 *
 * Handles Stripe webhook events and keeps the `subscriptions` table in sync.
 *
 * Handled events:
 *   checkout.session.completed       → upgrade workspace to Pro
 *   customer.subscription.updated    → sync status, period end
 *   customer.subscription.deleted    → mark subscription as canceled
 *
 * Required secrets (set via `supabase secrets set`):
 *   STRIPE_SECRET_KEY
 *   STRIPE_WEBHOOK_SECRET
 *
 * Auto-available Supabase secrets:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Security:
 *   - Every incoming request is validated against the Stripe webhook signature.
 *   - Requests with invalid signatures are rejected with 400 (no retry from Stripe).
 *   - DB writes use the service role key (server-only, never exposed to clients).
 *
 * Local testing:
 *   stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook
 */

import { createClient } from 'npm:@supabase/supabase-js@2'
import Stripe from 'npm:stripe@15'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // ── 1. Read raw body (required for signature validation) ─────────────────
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    console.warn('[webhook] Missing stripe-signature header')
    return new Response('Missing stripe-signature', { status: 400 })
  }

  // ── 2. Validate webhook signature ────────────────────────────────────────
  const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
  const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')

  if (!stripeSecretKey || !webhookSecret) {
    console.error('[webhook] Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET')
    return new Response('Server configuration error', { status: 500 })
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: '2024-06-20' })

  let event: Stripe.Event
  try {
    event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret)
  } catch (err) {
    // Invalid signature — Stripe should not retry this
    console.warn('[webhook] Invalid signature:', err instanceof Error ? err.message : err)
    return new Response('Invalid signature', { status: 400 })
  }

  // ── 3. Admin Supabase client ──────────────────────────────────────────────
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  // ── 4. Dispatch by event type ─────────────────────────────────────────────
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabaseAdmin, event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(supabaseAdmin, event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(supabaseAdmin, event.data.object as Stripe.Subscription)
        break

      default:
        // Ignore unhandled event types silently
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }
  } catch (err) {
    // Return 500 so Stripe retries the webhook
    console.error(`[webhook] Handler error for ${event.type}:`, err)
    return new Response('Handler error', { status: 500 })
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})

// ─── Event handlers ───────────────────────────────────────────────────────────

async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createClient>,
  session: Stripe.Checkout.Session,
): Promise<void> {
  const workspaceId = session.metadata?.workspaceId
  if (!workspaceId) {
    console.warn('[webhook] checkout.session.completed: missing workspaceId in metadata')
    return
  }

  const customerId = typeof session.customer === 'string'
    ? session.customer
    : session.customer?.id ?? null

  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id ?? null

  // Resolve period end from the subscription object if available
  let currentPeriodEnd: string | null = null
  if (subscriptionId) {
    try {
      const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, { apiVersion: '2024-06-20' })
      const sub = await stripe.subscriptions.retrieve(subscriptionId)
      currentPeriodEnd = new Date(sub.current_period_end * 1000).toISOString()
    } catch (err) {
      console.warn('[webhook] Could not retrieve subscription for period end:', err)
    }
  }

  await upsertSubscription(supabase, {
    workspaceId,
    planCode: 'pro',
    status: 'active',
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscriptionId,
    currentPeriodEnd,
  })

  console.log(`[webhook] checkout.session.completed: workspace ${workspaceId} upgraded to Pro`)
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, workspace_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.warn(`[webhook] subscription.updated: no row found for stripe_subscription_id=${subscription.id}`)
    return
  }

  const status = mapStripeStatus(subscription.status)
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()

  await supabase
    .from('subscriptions')
    .update({
      status,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  console.log(`[webhook] subscription.updated: workspace ${existing.workspace_id} status=${status}`)
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription,
): Promise<void> {
  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id, workspace_id')
    .eq('stripe_subscription_id', subscription.id)
    .maybeSingle()

  if (!existing) {
    console.warn(`[webhook] subscription.deleted: no row found for stripe_subscription_id=${subscription.id}`)
    return
  }

  await supabase
    .from('subscriptions')
    .update({
      plan_code: 'free',
      status: 'canceled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)

  console.log(`[webhook] subscription.deleted: workspace ${existing.workspace_id} downgraded to Free`)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

interface SubscriptionUpsertData {
  workspaceId: string
  planCode: 'free' | 'pro'
  status: string
  stripeCustomerId: string | null
  stripeSubscriptionId: string | null
  currentPeriodEnd: string | null
}

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  data: SubscriptionUpsertData,
): Promise<void> {
  const now = new Date().toISOString()

  const { data: existing } = await supabase
    .from('subscriptions')
    .select('id')
    .eq('workspace_id', data.workspaceId)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('subscriptions')
      .update({
        plan_code: data.planCode,
        status: data.status,
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.stripeSubscriptionId,
        current_period_end: data.currentPeriodEnd,
        updated_at: now,
      })
      .eq('id', existing.id)
  } else {
    await supabase
      .from('subscriptions')
      .insert({
        id: crypto.randomUUID(),
        workspace_id: data.workspaceId,
        plan_code: data.planCode,
        status: data.status,
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.stripeSubscriptionId,
        current_period_end: data.currentPeriodEnd,
        created_at: now,
        updated_at: now,
      })
  }
}

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'canceled':
      return 'canceled'
    case 'past_due':
      return 'past_due'
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete'
    default:
      return 'canceled'
  }
}
