import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { onRequestPost } from '#functions/api/webhooks/stripe'
import { setSupabaseQuery, resetSupabaseMock } from '../setup/supabaseMock'

const buildSignature = async (payload: string, secret: string, timestamp: string) => {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  const signature = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `t=${timestamp},v1=${signature}`
}

describe('Webhook Stripe', () => {
  const env = {
    STRIPE_WEBHOOK_SECRET: 'whsec_test',
    SUPABASE_URL: 'https://example.supabase.co',
    SUPABASE_SERVICE_ROLE_KEY: 'srv',
  }

  beforeEach(() => {
    resetSupabaseMock()
  })

  afterEach(() => {
    resetSupabaseMock()
  })

  it('atualiza pedido para paid quando payment_intent.succeeded', async () => {
    setSupabaseQuery('orders', { data: { cart_id: 'cart-1', id: 'order-1' }, error: null })
    setSupabaseQuery('cart_items', { data: [{ product_id: 'prod-1', quantity: 1, products: { price_cents: 1000 } }], error: null })
    setSupabaseQuery('order_items', { data: null, error: null })
    setSupabaseQuery('products', { data: { stock: 5 }, error: null })
    setSupabaseQuery('products', { data: null, error: null })
    setSupabaseQuery('order_status_history', { data: null, error: null })
    setSupabaseQuery('shipments', { data: null, error: null })
    setSupabaseQuery('cart_items', { data: null, error: null })
    setSupabaseQuery('carts', { data: null, error: null })

    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } })
    const signature = await buildSignature(payload, env.STRIPE_WEBHOOK_SECRET, '1700000000')

    const response = await onRequestPost({
      request: new Request('https://local', {
        method: 'POST',
        headers: { 'stripe-signature': signature },
        body: payload,
      }),
      env,
      waitUntil: () => {},
      next: () => {},
      data: {},
    } as any)

    expect(response.status).toBe(200)
  })

  it('rejeita assinatura inválida', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } })

    const response = await onRequestPost({
      request: new Request('https://local', {
        method: 'POST',
        headers: { 'stripe-signature': 't=1,v1=fake' },
        body: payload,
      }),
      env,
      waitUntil: () => {},
      next: () => {},
      data: {},
    } as any)

    expect(response.status).toBe(400)
  })
})
