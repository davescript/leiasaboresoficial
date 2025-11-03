import useSWR, { mutate } from 'swr'

interface Product {
  id: string
  name: string
  description: string
  price: number
  image_url: string
  category: string
  stock: number
  images?: string[]
}

interface ProductsResponse {
  products: Product[]
  total: number
  totalPages: number
}

interface UseProductsOptions {
  search?: string
  category?: string
  page?: number
  limit?: number
}

// Fetcher function for SWR
const fetcher = async (url: string): Promise<ProductsResponse> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }
  return response.json()
}

// Fetcher for single product
const productFetcher = async (url: string): Promise<Product> => {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }
  return response.json()
}

// Build query string from options
const buildQueryString = (options: UseProductsOptions = {}) => {
  const params = new URLSearchParams()
  
  if (options.search) params.append('search', options.search)
  if (options.category && options.category !== 'all') params.append('category', options.category)
  if (options.page) params.append('page', options.page.toString())
  if (options.limit) params.append('limit', options.limit.toString())
  
  return params.toString()
}

// Main hook for fetching products
export const useProducts = (options: UseProductsOptions = {}) => {
  const queryString = buildQueryString(options)
  const key = `/api/products${queryString ? `?${queryString}` : ''}`
  
  const { data, error, isLoading, mutate } = useSWR<ProductsResponse>(
    key,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      errorRetryCount: 3,
      errorRetryInterval: 1000,
    }
  )

  return {
    products: data?.products || [],
    total: data?.total || 0,
    totalPages: data?.totalPages || 1,
    isLoading,
    error,
    mutate, // For manual revalidation
  }
}

// Hook for fetching a single product
export const useProduct = (productId: string | null) => {
  const { data, error, isLoading, mutate } = useSWR<Product>(
    productId ? `/api/products/${productId}` : null,
    productFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 300000, // 5 minutes for individual products
    }
  )

  return {
    product: data,
    isLoading,
    error,
    mutate,
  }
}

// Hook for prefetching products (useful for pagination)
export const usePrefetchProducts = () => {
  const prefetch = (options: UseProductsOptions) => {
    const queryString = buildQueryString(options)
    const key = `/api/products${queryString ? `?${queryString}` : ''}`
    
    // Prefetch the data
    mutate(key, fetcher(key), { revalidate: false })
  }

  return { prefetch }
}

// Hook for optimistic updates (useful for cart operations)
export const useOptimisticProducts = () => {
  const updateProductStock = (productId: string, newStock: number) => {
    // Update all cached product lists
    const updateProduct = (data: ProductsResponse | undefined) => {
      if (!data) return data
      
      return {
        ...data,
        products: data.products.map(product =>
          product.id === productId
            ? { ...product, stock: newStock }
            : product
        )
      }
    }

    // Update all possible cache keys
    const cacheKeys = [
      '/api/products',
      '/api/products?category=bolos',
      '/api/products?category=tortas',
      '/api/products?category=cupcakes',
      '/api/products?category=brownies',
      '/api/products?category=doces',
    ]

    cacheKeys.forEach(key => {
      mutate(key, updateProduct, false)
    })

    // Also update individual product cache
    mutate(`/api/products/${productId}`, (product: Product | undefined) => 
      product ? { ...product, stock: newStock } : product, false
    )
  }

  return { updateProductStock }
}

// Global mutate function for cache invalidation
export const invalidateProductsCache = () => {
  // Invalidate all product-related cache
  mutate(
    key => typeof key === 'string' && key.startsWith('/api/products'),
    undefined,
    { revalidate: true }
  )
}