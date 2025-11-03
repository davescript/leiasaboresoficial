// Cloudflare-first API helpers

// Utils
export const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`
export const logEvent = (name: string, details?: Record<string, unknown>) => {
  if (import.meta.env.DEV) console.log(`[event] ${name}`, details || {})
}
export const handleError = (error: unknown, context?: string) => {
  const msg = (error as any)?.message || 'Erro inesperado'
  if (import.meta.env.DEV) console.error(`[error] ${context || ''}`, error)
  return msg
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!res.ok) throw new Error('Falha ao registrar')
  return res.json()
}
export async function signIn(email: string, password: string) {
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  if (!res.ok) throw new Error('Credenciais inválidas')
  return res.json()
}
export async function signOut() { document.cookie = 'session=; Path=/; Max-Age=0; SameSite=Lax' }
export async function getCurrentUser() {
  const res = await fetch('/api/auth/me')
  if (!res.ok) return null
  const j: any = await res.json()
  return (j && (j as any).user) ? (j as any).user : null
}

// Products
export async function getProducts() {
  const res = await fetch('/api/products')
  if (!res.ok) throw new Error('Falha ao carregar produtos')
  return res.json()
}
export async function getProductById(id: string) {
  const res = await fetch(`/api/products/${id}`)
  if (!res.ok) throw new Error('Produto não encontrado')
  return res.json()
}
export async function searchProducts(query: string, category?: string) {
  const params = new URLSearchParams()
  if (query) params.set('search', query)
  if (category) params.set('category', category)
  const res = await fetch(`/api/products?${params.toString()}`)
  if (!res.ok) throw new Error('Falha na busca de produtos')
  const j: any = await res.json()
  return Array.isArray((j as any)?.products) ? (j as any).products : []
}

// Cart
export async function getCart(token: string) {
  const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Falha ao obter carrinho')
  return res.json()
}
export async function addToCart(token: string, productId: string, quantity = 1) {
  const res = await fetch('/api/cart', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ productId, quantity }),
  })
  if (!res.ok) throw new Error('Falha ao adicionar ao carrinho')
  return res.json()
}
export async function removeFromCart(token: string, itemId: string) {
  const res = await fetch(`/api/cart/${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Falha ao remover do carrinho')
}
export async function updateCartQuantity(token: string, itemId: string, newQty: number) {
  const res = await fetch('/api/cart', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ item_id: itemId, quantity: newQty }),
  })
  if (!res.ok) throw new Error('Falha ao atualizar quantidade')
  return res.json()
}
export function calculateCartTotal(items: { quantity: number; product: { price: number } }[]) {
  return items.reduce((sum, it) => sum + it.quantity * it.product.price, 0)
}
export async function clearCart(_userId?: string) { await fetch('/api/cart', { method: 'DELETE' }) }

// Stripe / Checkout
export async function createCheckoutSession(token: string) {
  // Maps to PaymentIntent creation and returns client_secret
  const res = await fetch('/api/checkout', { method: 'POST', headers: { Authorization: `Bearer ${token}` } })
  if (!res.ok) throw new Error('Falha ao iniciar checkout')
  return res.json()
}
export function redirectToCheckout() {
  // With Elements we keep user in-site; redirection is handled by confirmPayment
  // Stub kept for API parity
}
export async function handleStripeSuccess(event: any) { logEvent('stripe_success', event) }
export async function handleStripeCancel(event: any) { logEvent('stripe_cancel', event) }
export async function verifyStripeSignature(_req: Request, _sig: string) { /* Verified in Worker webhook */ }

// Orders
export async function getUserOrders() { const res = await fetch('/api/orders'); return res.ok ? res.json() : [] }
export async function getOrderDetails(orderId: string) { const res = await fetch(`/api/orders/${orderId}`); return res.ok ? res.json() : null }
export async function updateOrderStatus(orderId: string, status: string) { const res = await fetch(`/api/orders/${orderId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); return res.ok ? res.json() : null }

// Admin
export async function adminGetAllOrders() { const res = await fetch('/api/orders?all=1'); return res.ok ? res.json() : [] }
export async function adminUpdateProductStock(productId: string, qty: number) { const res = await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: productId, stock: qty }) }); return res.ok ? res.json() : null }
export async function adminDashboardStats() { const orders = await adminGetAllOrders(); const total = orders?.length || 0; const paid = orders?.filter((o: any) => o.status === 'paid').length || 0; return { total_orders: total, paid_orders: paid } }
// Make adminDashboardStats resilient to unknown response shapes
// Override above export to ensure type safety
export async function adminDashboardStatsSafe() {
  const raw = await adminGetAllOrders()
  const orders: any[] = Array.isArray(raw) ? raw as any[] : []
  const total = orders.length
  const paid = orders.filter((o) => o && o.status === 'paid').length
  return { total_orders: total, paid_orders: paid }
}
