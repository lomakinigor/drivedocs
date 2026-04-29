/**
 * Billing service — client-side facade for Stripe Checkout.
 *
 * Flow:
 *   1. Client calls createCheckoutSession(workspaceId, returnBaseUrl)
 *   2. Server-side Edge Function creates a Stripe Checkout Session
 *   3. This function returns { url } — caller redirects to Stripe
 *   4. Stripe redirects back to returnBaseUrl?billing=success or ?billing=cancel
 *   5. On success, caller calls refreshSubscription(workspaceId) to sync DB state
 *
 * Security: Stripe secret key is NEVER on the client. Only Edge Function touches it.
 * Edge Function: supabase/functions/create-checkout-session/index.ts (deployed separately)
 *
 * In dev/mock mode (isBackendConfigured = false): returns { url: null, mockActivate: true }
 * so the UI can offer a "Симулировать Pro" path without hitting the network.
 */

import { supabase, isBackendConfigured } from '../supabase'

const CHECKOUT_FUNCTION = 'create-checkout-session'
const PORTAL_FUNCTION = 'create-portal-session'

export interface CheckoutResult {
  /** Stripe Checkout URL to redirect to. null = backend not configured (dev mode). */
  url: string | null
  /** true when backend is not configured — UI should offer dev simulation */
  isMockMode: boolean
  /** Russian-language error for user display. null = success */
  error: string | null
}

export async function createCheckoutSession(
  workspaceId: string,
  returnBaseUrl: string,
): Promise<CheckoutResult> {
  if (!isBackendConfigured || !supabase) {
    return { url: null, isMockMode: true, error: null }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { url: null, isMockMode: false, error: 'Необходимо войти в аккаунт.' }
  }

  const successUrl = `${returnBaseUrl}?billing=success`
  const cancelUrl = `${returnBaseUrl}?billing=cancel`

  try {
    const { data, error } = await supabase.functions.invoke(CHECKOUT_FUNCTION, {
      body: { workspaceId, successUrl, cancelUrl },
    })

    if (error) {
      console.error('[billing] Edge Function error:', error)
      return {
        url: null,
        isMockMode: false,
        error: 'Не удалось инициировать оплату. Попробуйте ещё раз.',
      }
    }

    const url = (data as { url?: string })?.url ?? null
    if (!url) {
      return {
        url: null,
        isMockMode: false,
        error: 'Сервер не вернул ссылку для оплаты. Попробуйте ещё раз.',
      }
    }

    return { url, isMockMode: false, error: null }
  } catch (err) {
    console.error('[billing] Checkout session error:', err)
    return {
      url: null,
      isMockMode: false,
      error: 'Не удалось соединиться с сервером оплаты. Проверьте интернет и попробуйте ещё раз.',
    }
  }
}

// ─── Customer Portal ──────────────────────────────────────────────────────────

export interface PortalResult {
  /** Stripe Billing Portal URL to redirect to. null on error or mock mode. */
  url: string | null
  /** true when backend is not configured — no portal available in dev mode */
  isMockMode: boolean
  /** Russian-language error for user display. null = success */
  error: string | null
}

export async function createPortalSession(
  workspaceId: string,
  returnUrl: string,
): Promise<PortalResult> {
  if (!isBackendConfigured || !supabase) {
    return { url: null, isMockMode: true, error: null }
  }

  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) {
    return { url: null, isMockMode: false, error: 'Необходимо войти в аккаунт.' }
  }

  try {
    const { data, error } = await supabase.functions.invoke(PORTAL_FUNCTION, {
      body: { workspaceId, returnUrl },
    })

    if (error) {
      console.error('[billing] Portal Edge Function error:', error)
      return {
        url: null,
        isMockMode: false,
        error: 'Не удалось открыть портал управления подпиской. Попробуйте ещё раз.',
      }
    }

    const url = (data as { url?: string })?.url ?? null
    if (!url) {
      return {
        url: null,
        isMockMode: false,
        error: (data as { error?: string })?.error ?? 'Сервер не вернул ссылку. Попробуйте ещё раз.',
      }
    }

    return { url, isMockMode: false, error: null }
  } catch (err) {
    console.error('[billing] Portal session error:', err)
    return {
      url: null,
      isMockMode: false,
      error: 'Не удалось соединиться с сервером. Проверьте интернет и попробуйте ещё раз.',
    }
  }
}
