import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { requireUser } from './_utils'
import { getD1, queryOne, execute } from './_db'

// Helper para responder JSON com o tipo de Response do runtime Cloudflare
const jsonResponse = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

const textResponse = (text: string, init?: ResponseInit): CfResponse =>
  new Response(text, init) as unknown as CfResponse

function corsHeaders(env: any, request: any) {
  const origin = request.headers.get('Origin') || (env?.FRONTEND_URL ?? '')
  const allowed = origin && (origin.includes('localhost:5177') || origin === env?.FRONTEND_URL)
  const headers = new Headers()
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
    headers.set('Vary', 'Origin')
  }
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  return headers
}

export const onRequestOptions: PagesFunction = async ({ env, request }) => {
  const headers = corsHeaders(env as any, request)
  return new Response(null, { status: 204, headers }) as any
}

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
  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
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

  // Persist also in D1: ensure cart row and upsert cart_items row
  const cartUserId = user ? user.id : `guest:${anonId}`
  let cartRow = await queryOne<any>(db, 'SELECT id FROM carts WHERE user_id = ? AND status = ?', [cartUserId, 'open'])
  if (!cartRow) {
    const newCartId = crypto.randomUUID()
    await execute(db, 'INSERT INTO carts (id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))', [newCartId, cartUserId, 'open'])
    cartRow = { id: newCartId }
  } else {
    await execute(db, 'UPDATE carts SET updated_at = datetime("now") WHERE id = ?', [cartRow.id])
  }
  const existingItem = await queryOne<any>(db, 'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartRow.id, productId])
  if (existingItem?.id) {
    const newQty = (existingItem.quantity || 0) + quantity
    await execute(db, 'UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existingItem.id])
  } else {
    await execute(db, 'INSERT INTO cart_items (id, cart_id, product_id, quantity, created_at) VALUES (?, ?, ?, ?, datetime("now"))', [crypto.randomUUID(), cartRow.id, productId, quantity])
  }
  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
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
  // Update D1
  const db = getD1(env as any)
  const cartUserId = user ? user.id : `guest:${anonId}`
  const cartRow = await queryOne<any>(db, 'SELECT id FROM carts WHERE user_id = ? AND status = ?', [cartUserId, 'open'])
  if (cartRow?.id) {
    const existingItem = await queryOne<any>(db, 'SELECT id FROM cart_items WHERE cart_id = ? AND product_id = ?', [cartRow.id, item_id])
    if (existingItem?.id) {
      await execute(db, 'UPDATE cart_items SET quantity = ? WHERE id = ?', [qty, existingItem.id])
    }
    await execute(db, 'UPDATE carts SET updated_at = datetime("now") WHERE id = ?', [cartRow.id])
  }
  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ ok: true }), { headers }) as any
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
  // Clear D1 cart items
  const db = getD1(env as any)
  const cartUserId = user ? user.id : `guest:${anonId}`
  const cartRow = await queryOne<any>(db, 'SELECT id FROM carts WHERE user_id = ? AND status = ?', [cartUserId, 'open'])
  if (cartRow?.id) {
    await execute(db, 'DELETE FROM cart_items WHERE cart_id = ?', [cartRow.id])
    await execute(db, 'UPDATE carts SET updated_at = datetime("now") WHERE id = ?', [cartRow.id])
  }
  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ ok: true }), { headers }) as any
}
