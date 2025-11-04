import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { getD1, queryOne, queryAll, execute } from '../_db'

// Typed helpers to satisfy Cloudflare's Response type
const text = (body: string, init?: ResponseInit): CfResponse =>
  new Response(body, init) as unknown as CfResponse

export async function verifyStripeSignature(payload: string, signature: string, secret: string) {
  const parts = Object.fromEntries(signature.split(',').map(kv => kv.split('='))) as any
  const t = parts.t
  const v1 = parts.v1
  if (!t || !v1) return false
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signed = await crypto.subtle.sign('HMAC', key, encoder.encode(`${t}.${payload}`))
  const computed = Array.from(new Uint8Array(signed)).map(b => b.toString(16).padStart(2, '0')).join('')
  return computed === v1
}

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  const raw = await request.text()
  const sig = request.headers.get('stripe-signature') || ''
  const ok = await verifyStripeSignature(raw, sig, (env as any).STRIPE_WEBHOOK_SECRET)
  if (!ok) return text('Bad signature', { status: 400 })

  const event = JSON.parse(raw)
  const db = getD1(env as any)

  if (event.type === 'payment_intent.succeeded') {
    const intentId = event.data.object.id
    const order = await queryOne<any>(db, 'SELECT id, cart_id FROM orders WHERE stripe_intent_id = ?', [intentId])
    if (order?.id) {
      await execute(db, 'UPDATE orders SET status = ? WHERE id = ?', ['paid', order.id])
      await execute(db, 'INSERT INTO order_status_history (id, order_id, status, created_at) VALUES (?, ?, ?, datetime("now"))', [crypto.randomUUID(), order.id, 'paid'])
      // Decrement stock based on existing order_items
      const res = await db.prepare('SELECT product_id, quantity FROM order_items WHERE order_id = ?').bind(order.id).all<any>()
      for (const it of (res?.results ?? [])) {
        const prod = await queryOne<any>(db, 'SELECT stock FROM products WHERE id = ?', [it.product_id])
        const newStock = Math.max(0, (prod?.stock ?? 0) - (it?.quantity ?? 0))
        await execute(db, 'UPDATE products SET stock = ? WHERE id = ?', [newStock, it.product_id])
      }
      await execute(db, 'INSERT INTO shipments (id, order_id, status, created_at) VALUES (?, ?, ?, datetime("now"))', [crypto.randomUUID(), order.id, 'pending'])
      // Close cart if exists
      if (order.cart_id) {
        await execute(db, 'UPDATE carts SET status = ?, updated_at = datetime("now") WHERE id = ?', ['converted', order.cart_id])
        await execute(db, 'DELETE FROM cart_items WHERE cart_id = ?', [order.cart_id])
      }
    }
  }
  if (event.type === 'payment_intent.payment_failed') {
    const intentId = event.data.object.id
    await execute(db, 'UPDATE orders SET status = ? WHERE stripe_intent_id = ?', ['failed', intentId])
  }
  return text('ok')
}
