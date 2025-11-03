import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createOrder } from '@/lib/api'
import { resetSupabaseMock, setSupabaseQuery } from '../setup/supabaseMock'

describe('Fluxo de Checkout', () => {
  beforeEach(() => {
    resetSupabaseMock()
  })

  afterEach(() => {
    resetSupabaseMock()
  })

  it('cria pedido após pagamento confirmado', async () => {
    setSupabaseQuery('orders', { data: { id: 'order-1', status: 'paid' }, error: null })

    const order = await createOrder('user-1', { id: 'cart-1', amount_cents: 2999 }, 'pi_123')

    expect(order.status).toBe('paid')
    expect(order.id).toBe('order-1')
  })
})
