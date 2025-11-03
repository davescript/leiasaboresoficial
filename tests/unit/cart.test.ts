import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { addToCart, getCart, removeFromCart, updateCartQuantity, clearCart, calculateCartTotal } from '@/lib/api'
import { resetSupabaseMock, setSupabaseQuery } from '../setup/supabaseMock'

const originalFetch = globalThis.fetch

describe('Carrinho', () => {
  beforeEach(() => {
    resetSupabaseMock()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('adiciona item ao carrinho', async () => {
    const result = { id: 'item-1', quantity: 2 }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => result })

    const res = await addToCart('token', 'product-1', 2)

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(res.quantity).toBe(2)
  })

  it('calcula total corretamente', () => {
    const total = calculateCartTotal([
      { quantity: 2, product: { price: 1000 } },
      { quantity: 1, product: { price: 500 } },
    ])

    expect(total).toBe(2500)
  })

  it('obtém carrinho do usuário', async () => {
    const payload = { items: [] }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => payload })

    const res = await getCart('token')

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/cart', { headers: { Authorization: 'Bearer token' } })
    expect(res).toEqual(payload)
  })

  it('atualiza quantidade do item', async () => {
    const payload = { id: 'item-1', quantity: 3 }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => payload })

    const res = await updateCartQuantity('token', 'item-1', 3)

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(res.quantity).toBe(3)
  })

  it('remove item do carrinho', async () => {
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true })

    await expect(removeFromCart('token', 'item-1')).resolves.toBeUndefined()
  })

  it('limpa carrinho do usuário', async () => {
    setSupabaseQuery('carts', { data: null, error: null })

    await expect(clearCart('user-1')).resolves.toBeUndefined()
  })
})
