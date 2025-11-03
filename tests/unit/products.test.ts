import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { getProducts, getProductById, searchProducts, filterProducts, createProduct, updateProduct, deleteProduct } from '@/lib/api'
import { resetSupabaseMock, setSupabaseQuery } from '../setup/supabaseMock'

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

  it('searchProducts returns matching rows', async () => {
    setSupabaseQuery('products', { data: [{ id: 'p2', name: 'Bolo' }], error: null })

    const res = await searchProducts('bolo')

    expect(res).toHaveLength(1)
    expect(res[0]?.name).toBe('Bolo')
  })

  it('filterProducts applies range and category', async () => {
    setSupabaseQuery('products', { data: [{ id: 'p3', category: 'bolos' }], error: null })

    const res = await filterProducts('bolos', [10, 20])

    expect(res).toHaveLength(1)
    expect(res[0]?.category).toBe('bolos')
  })

  it('createProduct inserts payload', async () => {
    const row = { id: 'p4', name: 'Novo' }
    setSupabaseQuery('products', { data: row, error: null })

    const res = await createProduct({ name: 'Novo' })

    expect(res).toEqual(row)
  })

  it('updateProduct persists changes', async () => {
    const row = { id: 'p5', name: 'Atualizado' }
    setSupabaseQuery('products', { data: row, error: null })

    const res = await updateProduct('p5', { name: 'Atualizado' })

    expect(res).toEqual(row)
  })

  it('deleteProduct completes without error', async () => {
    setSupabaseQuery('products', { data: null, error: null })

    await expect(deleteProduct('p6')).resolves.toBeUndefined()
  })
})
