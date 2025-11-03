import { describe, it, expect } from 'vitest'
import { verifyStripeSignature } from '#functions/api/webhooks/stripe'

const payload = JSON.stringify({ type: 'payment_intent.succeeded' })

describe('Stripe webhook signature', () => {
  it('fails when timestamp missing', async () => {
    const ok = await verifyStripeSignature(payload, 'v1=fake', 'whsec_test')

    expect(ok).toBe(false)
  })

  it('fails when secret mismatches', async () => {
    const timestamp = '1700000000'
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode('whsec_real'), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
    const signature = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

    const ok = await verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, 'whsec_other')

    expect(ok).toBe(false)
  })
})
