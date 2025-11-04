import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { createCheckoutSession } from '@/lib/api'
import { resetSupabaseMock } from '../setup/supabaseMock'

describe('Fluxo de Checkout', () => {
  beforeEach(() => {
    resetSupabaseMock()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cria sessão de checkout com Stripe', async () => {
    const mockResponse = { 
      clientSecret: 'pi_test_123',
      paymentIntentId: 'pi_123',
      status: 'requires_payment_method'
    }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ 
      ok: true, 
      json: async () => mockResponse 
    })

    const session = await createCheckoutSession('token')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(session.status).toBe('requires_payment_method')
  })
})
