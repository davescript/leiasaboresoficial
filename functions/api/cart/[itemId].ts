import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { requireUser } from '../_utils'
import { getD1 } from '../_db'

const jsonResponse = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

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
  headers.set('Access-Control-Allow-Methods', 'DELETE,OPTIONS')
  return headers
}

export const onRequestOptions: PagesFunction = async ({ env, request }) => {
  const headers = corsHeaders(env as any, request)
  return new Response(null, { status: 204, headers }) as any
}

export const onRequestDelete: PagesFunction = async ({ env, request, params }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const cookie = request.headers.get('Cookie') || ''
  const match = cookie.match(/anon_id=([^;]+)/)
  const anonId = match?.[1] || ''
  const productId = params.itemId

  const db = getD1(env as any)

  // Atualiza KV
  const kv = (env as any).CART_KV as KVNamespace
  const key = user ? `cart:${user.id}` : `cart:guest:${anonId}`
  const existing = await kv.get(key)
  const items = existing ? JSON.parse(existing) as { product_id: string; quantity: number }[] : []
  const filtered = items.filter(i => i.product_id !== productId)
  await kv.put(key, JSON.stringify(filtered))

  // Atualiza D1 por product_id
  const cartUserId = user ? user.id : `guest:${anonId}`
  const cartRow = await db.prepare('SELECT id FROM carts WHERE user_id = ? AND status = ?').bind(cartUserId, 'open').first()
  if (cartRow?.id) {
    await db.prepare('DELETE FROM cart_items WHERE cart_id = ? AND product_id = ?').bind(cartRow.id, productId).run()
    await db.prepare('UPDATE carts SET updated_at = ? WHERE id = ?').bind(new Date().toISOString(), cartRow.id).run()
  }

  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ ok: true }), { headers }) as unknown as CfResponse
}
