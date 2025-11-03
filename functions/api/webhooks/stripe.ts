import type { PagesFunction } from '@cloudflare/workers-types'
import { getAdminClient } from '../_utils'

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
  if (!ok) return new Response('Bad signature', { status: 400 })

  const event = JSON.parse(raw)
  const supabase = getAdminClient(env as any)

  if (event.type === 'payment_intent.succeeded') {
    const intentId = event.data.object.id
    
    // Update order status to paid
    const { data: order } = await supabase
      .from('orders')
      .update({ status: 'paid' })
      .eq('stripe_intent_id', intentId)
      .select('cart_id, id')
      .single()
    
    // Create order_items and decrement stock
    if (order?.id && order?.cart_id) {
      const { data: items } = await supabase
        .from('cart_items')
        .select('product_id, quantity, products(price_cents)')
        .eq('cart_id', order.cart_id)

      for (const it of (items ?? [])) {
        const unitPrice = typeof it.products?.price_cents === 'number' ? it.products.price_cents : 0
        await supabase.from('order_items').insert({ order_id: order.id, product_id: it.product_id, quantity: it.quantity, unit_price_cents: unitPrice })
        // decrement stock
        const { data: prod } = await supabase.from('products').select('stock').eq('id', it.product_id).single()
        const newStock = Math.max(0, (prod?.stock ?? 0) - it.quantity)
        await supabase.from('products').update({ stock: newStock }).eq('id', it.product_id)
      }
      await supabase.from('order_status_history').insert({ order_id: order.id, status: 'paid' })
      await supabase.from('shipments').insert({ order_id: order.id, status: 'pending' })
    }
    
    // Clear cart after successful payment
    if (order?.cart_id) {
      // Delete cart items
      await supabase.from('cart_items').delete().eq('cart_id', order.cart_id)
      // Close the cart
      await supabase.from('carts').update({ status: 'converted' }).eq('id', order.cart_id)
    }
  }
  if (event.type === 'payment_intent.payment_failed') {
    const intentId = event.data.object.id
    await supabase.from('orders').update({ status: 'failed' }).eq('stripe_intent_id', intentId)
  }
  return new Response('ok')
}
