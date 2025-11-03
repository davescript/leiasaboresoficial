import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { requireUser } from './_utils'
import { getD1, queryOne } from './_db'

// Helper para responder JSON com o tipo de Response do runtime Cloudflare
const jsonResponse = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

const textResponse = (text: string, init?: ResponseInit): CfResponse =>
  new Response(text, init) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const kv = (env as any).CART_KV as KVNamespace
  const db = getD1(env as any)
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/anon_id=([^;]+)/)
  let anonId = match?.[1] || ''
  let setCookie: string | null = null
  if (!user && !anonId) {
    anonId = crypto.randomUUID()
    setCookie = `anon_id=${anonId}; Path=/; Max-Age=2592000; SameSite=Lax`
  }
  const key = user ? `cart:${user.id}` : `cart:guest:${anonId}`
  const stored = await kv.get(key)
  const cartItems = stored ? JSON.parse(stored) as { product_id: string; quantity: number }[] : []
  const items = [] as any[]
  for (const it of cartItems) {
    const p = await queryOne<any>(db, 'SELECT id, name, description, price_cents, image_url, category, stock FROM products WHERE id = ?', [it.product_id])
    if (!p) continue
    items.push({
      id: it.product_id,
      product_id: it.product_id,
      quantity: it.quantity,
      product: {
        id: p.id,
        name: p.name,
        description: p.description || '',
        price: (p.price_cents || 0) / 100,
        image_url: p.image_url || '',
        category: p.category || 'doces',
        stock: p.stock || 0,
      }
    })
  }
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(JSON.stringify(items), { headers }) as any
}

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const db = getD1(env as any)
  const kv = (env as any).CART_KV as KVNamespace
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/anon_id=([^;]+)/)
  let anonId = match?.[1] || ''
  let setCookie: string | null = null
  if (!user && !anonId) {
    anonId = crypto.randomUUID()
    setCookie = `anon_id=${anonId}; Path=/; Max-Age=2592000; SameSite=Lax`
  }
  const raw: any = await request.json().catch(() => null)
  const productId: string | null = raw?.productId ?? raw?.product_id ?? null
  const quantity: number | null = typeof raw?.quantity === 'number' ? raw.quantity : 1
  if (!productId || !quantity || quantity < 1) {
    return jsonResponse({ error: 'Parâmetros inválidos' }, { status: 400 })
  }
  const productRow = await queryOne<any>(db, 'SELECT id FROM products WHERE id = ?', [productId])
  if (!productRow) return jsonResponse({ error: 'Produto não encontrado' }, { status: 404 })
  const key = user ? `cart:${user.id}` : `cart:guest:${anonId}`
  const existing = await kv.get(key)
  const items = existing ? JSON.parse(existing) as { product_id: string; quantity: number }[] : []
  const found = items.find(i => i.product_id === productId)
  if (found) found.quantity += quantity
  else items.push({ product_id: productId, quantity })
  await kv.put(key, JSON.stringify(items))
  const headers = new Headers({ 'Content-Type': 'application/json' })
  if (setCookie) headers.set('Set-Cookie', setCookie)
  return new Response(JSON.stringify({ ok: true, item_id: productId }), { headers }) as any
}

export const onRequestPut: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const kv = (env as any).CART_KV as KVNamespace
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/anon_id=([^;]+)/)
  const anonId = match?.[1] || ''
  const raw: any = await request.json().catch(() => null)
  const item_id: string | null = raw?.item_id ?? null
  const qty: number | null = typeof raw?.quantity === 'number' ? raw.quantity : null
  if (!item_id || !qty || qty < 1) {
    return jsonResponse({ error: 'Parâmetros inválidos' }, { status: 400 })
  }
  const key = user ? `cart:${user.id}` : `cart:guest:${anonId}`
  const existing = await kv.get(key)
  const items = existing ? JSON.parse(existing) as { product_id: string; quantity: number }[] : []
  const found = items.find(i => i.product_id === item_id)
  if (!found) return jsonResponse({ error: 'Item não encontrado' }, { status: 404 })
  found.quantity = qty
  await kv.put(key, JSON.stringify(items))
  return jsonResponse({ ok: true })
}

export const onRequestDelete: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const kv = (env as any).CART_KV as KVNamespace
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/anon_id=([^;]+)/)
  const anonId = match?.[1] || ''
  const key = user ? `cart:${user.id}` : `cart:guest:${anonId}`
  await kv.delete(key)
  return jsonResponse({ ok: true })
}
