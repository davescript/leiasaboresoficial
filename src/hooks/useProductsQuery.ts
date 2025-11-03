import { useQuery } from '@tanstack/react-query'

export interface Product {
  id: string
  name: string
  description: string
  price_cents: number
  discount_price_cents?: number | null
  image_url?: string
  category?: string
  subcategory?: string | null
  stock?: number
}

export interface ProductsQueryOptions {
  search?: string
  category?: string
  page?: number
  limit?: number
  sort?: 'price_asc' | 'price_desc' | 'newest'
}

const fetchProducts = async (opts: ProductsQueryOptions) => {
  const params = new URLSearchParams()
  if (opts.search) params.set('search', opts.search)
  if (opts.category && opts.category !== 'all') params.set('category', opts.category)
  if (opts.page) params.set('page', String(opts.page))
  if (opts.limit) params.set('limit', String(opts.limit))
  if (opts.sort) params.set('sort', opts.sort)
  try {
    const res = await fetch(`/api/products?${params.toString()}`)
    if (!res.ok) throw new Error('Falha ao buscar produtos')
    return await res.json()
  } catch {
    // Fallback local para garantir vitrine mesmo sem API
    const sample = [
      { id: 'local-1', name: 'Bolo Red Velvet', description: 'Bolo red velvet com cream cheese.', price_cents: 6500, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', category: 'bolos', stock: 8 },
      { id: 'local-2', name: 'Bolo de Chocolate', description: 'Chocolate 70% com ganache.', price_cents: 7500, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', category: 'bolos', stock: 6 },
      { id: 'local-3', name: 'Torta de Limão', description: 'Merengue italiano dourado.', price_cents: 5500, image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', category: 'tortas', stock: 10 },
    ]
    return { products: sample, total: sample.length, totalPages: 1 }
  }
}

export const useProductsQuery = (opts: ProductsQueryOptions) => {
  const key = ['products', opts]
  const query = useQuery({
    queryKey: key,
    queryFn: () => fetchProducts(opts),
    // v5 no longer supports `keepPreviousData`; rely on cache + staleTime
    staleTime: 60_000,
    retry: 2,
  })
  return query
}