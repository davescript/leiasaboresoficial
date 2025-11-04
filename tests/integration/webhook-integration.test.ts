import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { verifyStripeSignature } from '#functions/api/webhooks/stripe'

const buildSignature = async (payload: string, secret: string, timestamp: string) => {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${timestamp}.${payload}`))
  const signature = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
  return `t=${timestamp},v1=${signature}`
}

describe('Webhook Stripe', () => {
  const secret = 'whsec_test'

  it('verifica assinatura válida corretamente', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } })
    const signature = await buildSignature(payload, secret, '1700000000')

    const isValid = await verifyStripeSignature(payload, signature, secret)
    
    expect(isValid).toBe(true)
  })

  it('rejeita assinatura inválida', async () => {
    const payload = JSON.stringify({ type: 'payment_intent.succeeded', data: { object: { id: 'pi_123' } } })
    
    const isValid = await verifyStripeSignature(payload, 't=1,v1=invalid', secret)
    
    expect(isValid).toBe(false)
  })

  it('rejeita payload vazio', async () => {
    const payload = ''
    const signature = await buildSignature(payload, secret, '1700000000')
    
    const isValid = await verifyStripeSignature(payload, signature, 'wrong_secret')
    
    expect(isValid).toBe(false)
  })
})
