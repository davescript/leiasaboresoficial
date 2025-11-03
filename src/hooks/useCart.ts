import useSWR, { mutate } from 'swr'
import { useEffect } from 'react'
// Cart operates with anonymous cookie fallback; no Supabase required

interface CartItem {
  id: string
  product_id: string
  quantity: number
  product: {
    id: string
    name: string
    description: string
    price: number
    image_url: string
    category: string
    stock: number
  }
}

// Fetcher function for cart data: returns array of items
const cartFetcher = async (url: string, token: string | null): Promise<CartItem[]> => {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  })
  if (!response.ok) {
    throw new Error('Failed to fetch cart')
  }
  return response.json()
}

// Main hook for cart data
export const useCart = () => {
  const token = null
  const { data, error, isLoading, mutate: mutateCart } = useSWR<CartItem[]>(
    ['/api/cart', token],
    ([url, t]) => cartFetcher(url as string, t as string | null),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 30000, // 30 seconds
      errorRetryCount: 3,
    }
  )

  // Persist snapshot to localStorage and sync across tabs
  useEffect(() => {
    if (data) {
      try { localStorage.setItem('cart_snapshot', JSON.stringify(data)) } catch {}
    }
  }, [data])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'cart_snapshot') {
        mutateCart()
      }
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [mutateCart])

  // Add item to cart with optimistic update
  const addToCart = async (productId: string, quantity: number = 1) => {
    try {
      // Optimistic update
      if (data) {
        const optimisticItems = [...data]
        const existingItem = optimisticItems.find(item => item.product_id === productId)

        if (existingItem) {
          existingItem.quantity += quantity
        } else {
          // We'd need product data for this, so we'll skip optimistic update for new items
        }

        mutateCart(optimisticItems, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(optimisticItems)) } catch {}
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ product_id: productId, quantity }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to cart')
      }

      // Revalidate and immediately sync cache with server response
      try {
        const fresh = await cartFetcher('/api/cart', token)
        mutateCart(fresh, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(fresh)) } catch {}
      } catch {
        mutateCart()
      }
      
      return await response.json()
    } catch (error) {
      // Revert optimistic update on error
      mutateCart()
      throw error
    }
  }

  // Update item quantity with optimistic update
  const updateQuantity = async (itemId: string, quantity: number) => {
    try {
      // Optimistic update
      if (data) {
        const optimisticItems = data.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
        
        mutateCart(optimisticItems, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(optimisticItems)) } catch {}
      }

      const response = await fetch(`/api/cart`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ item_id: itemId, quantity }),
      })

      if (!response.ok) {
        throw new Error('Failed to update cart item')
      }

      try {
        const fresh = await cartFetcher('/api/cart', token)
        mutateCart(fresh, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(fresh)) } catch {}
      } catch {
        mutateCart()
      }
      
      return await response.json()
    } catch (error) {
      // Revert optimistic update on error
      mutateCart()
      throw error
    }
  }

  // Remove item from cart with optimistic update
  const removeFromCart = async (itemId: string) => {
    try {
      // Optimistic update
      if (data) {
        const optimisticItems = data.filter(item => item.id !== itemId)
        mutateCart(optimisticItems, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(optimisticItems)) } catch {}
      }

      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!response.ok) {
        throw new Error('Failed to remove from cart')
      }

      try {
        const fresh = await cartFetcher('/api/cart', token)
        mutateCart(fresh, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(fresh)) } catch {}
      } catch {
        mutateCart()
      }
      
      return await response.json()
    } catch (error) {
      // Revert optimistic update on error
      mutateCart()
      throw error
    }
  }

  // Clear entire cart
  const clearCart = async () => {
    try {
      // Optimistic update
      if (data) {
        mutateCart([], false)
      }

      const response = await fetch('/api/cart', {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })

      if (!response.ok) {
        throw new Error('Failed to clear cart')
      }

      try {
        const fresh = await cartFetcher('/api/cart', token)
        mutateCart(fresh, false)
        try { localStorage.setItem('cart_snapshot', JSON.stringify(fresh)) } catch {}
      } catch {
        mutateCart()
      }
      
      return await response.json()
    } catch (error) {
      // Revert optimistic update on error
      mutateCart()
      throw error
    }
  }

  const items = data || []
  const total = items.reduce((sum, it) => sum + it.quantity * it.product.price, 0)
  const itemCount = items.reduce((sum, it) => sum + it.quantity, 0)

  return {
    items,
    total,
    itemCount,
    isLoading,
    error,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    mutate: mutateCart,
  }
}

// Global function to invalidate cart cache
export const invalidateCartCache = () => {
  mutate('/api/cart', undefined, { revalidate: true })
}