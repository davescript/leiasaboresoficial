import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCheckoutSession } from '@/lib/api'
import { verifyStripeSignature } from '#functions/api/webhooks/stripe'

const originalFetch = globalThis.fetch

describe('Stripe Integration', () => {
  beforeEach(() => {
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('cria checkout session válida', async () => {
    const session = { client_secret: 'cs_test' }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => session })

    const result = await createCheckoutSession('token-123')

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/checkout', {
      method: 'POST',
      headers: { Authorization: 'Bearer token-123' },
    })
    expect(result).toEqual(session)
  })

  it('verifica assinatura Stripe válida', async () => {
    const payload = JSON.stringify({ id: 'evt_test' })
    const secret = 'whsec_test'
    const timestamp = '1700000000'
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
    const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
    const signature = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')

    const ok = await verifyStripeSignature(payload, `t=${timestamp},v1=${signature}`, secret)

    expect(ok).toBe(true)
  })

  it('rejeita assinatura Stripe inválida', async () => {
    const payload = JSON.stringify({ id: 'evt_test' })

    const ok = await verifyStripeSignature(payload, 't=1,v1=fake', 'whsec_test')

    expect(ok).toBe(false)
  })
})
