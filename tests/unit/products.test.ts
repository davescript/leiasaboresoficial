import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getProducts, getProductById, searchProducts } from '@/lib/api'
import { resetSupabaseMock } from '../setup/supabaseMock'

const originalFetch = globalThis.fetch

describe('Products API', () => {
  beforeEach(() => {
    resetSupabaseMock()
    globalThis.fetch = vi.fn()
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('getProducts returns full list', async () => {
    const payload = [{ id: 'p1', name: 'Produto 1' }]
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => payload })

    const res = await getProducts()

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/products')
    expect(res).toEqual(payload)
  })

  it('getProductById returns requested product', async () => {
    const product = { id: 'uuid-test', name: 'Produto Teste' }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => product })

    const res = await getProductById('uuid-test')

    expect(globalThis.fetch).toHaveBeenCalledWith('/api/products/uuid-test')
    expect(res).toEqual(product)
  })

  it('searchProducts searches by query', async () => {
    const payload = { products: [{ id: 'p2', name: 'Bolo de Chocolate' }] }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => payload })

    const res = await searchProducts('bolo')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })

  it('searchProducts filters by category', async () => {
    const payload = { products: [{ id: 'p3', name: 'Bolo de Chocolate', category: 'bolos' }] }
    ;(globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, json: async () => payload })

    const res = await searchProducts('bolo', 'bolos')

    expect(globalThis.fetch).toHaveBeenCalled()
    expect(res).toHaveLength(1)
  })
})
