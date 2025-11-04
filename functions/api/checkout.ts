import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { requireUser } from './_utils'
import { getD1, queryOne, queryAll, execute } from './_db'

// Helper para responder JSON com o tipo de Response do runtime Cloudflare
const jsonResponse = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

interface StripePaymentIntent { id: string; client_secret?: string; status?: string }

// Allow optional fields in shipping payload (e.g., line2)
async function createPaymentIntent(secret: string, amount_cents: number, metadata: Record<string,string>, receipt_email?: string, shipping?: Record<string, string | undefined>): Promise<StripePaymentIntent> {
  const body = new URLSearchParams({
    amount: String(amount_cents),
    currency: 'eur',
    automatic_payment_methods: 'enabled',
    ...(receipt_email ? { receipt_email } : {}),
    ...Object.entries(metadata).reduce((acc,[k,v]) => { acc[`metadata[${k}]`] = v; return acc }, {} as Record<string,string>),
    ...(shipping?.name ? { 'shipping[name]': shipping.name } : {}),
    ...(shipping?.phone ? { 'shipping[phone]': shipping.phone } : {}),
    ...(shipping?.line1 ? { 'shipping[address][line1]': shipping.line1 } : {}),
    ...(shipping?.line2 ? { 'shipping[address][line2]': shipping.line2 } : {}),
    ...(shipping?.city ? { 'shipping[address][city]': shipping.city } : {}),
    ...(shipping?.state ? { 'shipping[address][state]': shipping.state } : {}),
    ...(shipping?.postal_code ? { 'shipping[address][postal_code]': shipping.postal_code } : {}),
    ...(shipping?.country ? { 'shipping[address][country]': shipping.country } : {}),
  })
  const res = await fetch('https://api.stripe.com/v1/payment_intents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const json = await res.json()
  return json as StripePaymentIntent
}

async function updatePaymentIntent(secret: string, intentId: string, amount_cents: number, metadata: Record<string,string>, shipping?: Record<string, string | undefined>): Promise<StripePaymentIntent> {
  const body = new URLSearchParams({
    amount: String(amount_cents),
    ...Object.entries(metadata).reduce((acc,[k,v]) => { acc[`metadata[${k}]`] = v; return acc }, {} as Record<string,string>),
    ...(shipping?.name ? { 'shipping[name]': shipping.name } : {}),
    ...(shipping?.phone ? { 'shipping[phone]': shipping.phone } : {}),
    ...(shipping?.line1 ? { 'shipping[address][line1]': shipping.line1 } : {}),
    ...(shipping?.line2 ? { 'shipping[address][line2]': shipping.line2 } : {}),
    ...(shipping?.city ? { 'shipping[address][city]': shipping.city } : {}),
    ...(shipping?.state ? { 'shipping[address][state]': shipping.state } : {}),
    ...(shipping?.postal_code ? { 'shipping[address][postal_code]': shipping.postal_code } : {}),
    ...(shipping?.country ? { 'shipping[address][country]': shipping.country } : {}),
  })
  const res = await fetch(`https://api.stripe.com/v1/payment_intents/${intentId}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secret}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })
  const json = await res.json()
  return json as StripePaymentIntent
}

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || (request.headers.get('Cookie') || '').match(/session=([^;]+)/)?.[1]
    || null
  const user = await requireUser(env as any, token)
  if (!user) return jsonResponse({ error: 'Unauthorized' }, { status: 401 })
  const db = getD1(env as any)
  const kv = (env as any).CART_KV as KVNamespace

  // Parse optional payload for address/shipping/email
  const raw: any = await request.json().catch(()=>null)
  const shipping_method: string | null = raw?.shipping_method ?? null
  const address: any = raw?.address ?? null
  const email: string | null = raw?.email ?? null
  const coupon_code: string | null = raw?.coupon_code ?? null
  
  const key = `cart:${user.id}`
  const stored = await kv.get(key)
  const kvItems = stored ? JSON.parse(stored) as { product_id: string; quantity: number }[] : []
  if (!kvItems.length) return jsonResponse({ error: 'Carrinho vazio' }, { status: 400 })
  const items: { quantity: number; products: { id: string; price_cents: number; name: string } }[] = []
  for (const it of kvItems) {
    const p = await queryOne<any>(db, 'SELECT id, price_cents, name FROM products WHERE id = ?', [it.product_id])
    if (p) items.push({ quantity: it.quantity, products: { id: p.id, price_cents: p.price_cents || 0, name: p.name || '' } })
  }
  if (!items.length) return jsonResponse({ error: 'Carrinho vazio' }, { status: 400 })

  const stripeSecret = (env as any).STRIPE_SECRET_KEY
  if (!stripeSecret) {
    return jsonResponse({ error: 'Stripe não configurado' }, { status: 500 })
  }

  let amount = (items ?? []).reduce((sum, it) => sum + it.quantity * (it.products?.price_cents ?? 0), 0)
  let discount_cents = 0
  if (coupon_code) {
    const coupon = await queryOne<any>(db, 'SELECT code, percent_off, amount_off_cents, expires_at, active FROM coupons WHERE code = ? AND active = 1', [coupon_code])
    if (coupon && (!coupon.expires_at || new Date(coupon.expires_at).getTime() > Date.now())) {
      const percent = typeof coupon.percent_off === 'number' ? coupon.percent_off : null
      const amountOff = typeof coupon.amount_off_cents === 'number' ? coupon.amount_off_cents : null
      if (percent && percent > 0) discount_cents += Math.floor(amount * percent / 100)
      if (amountOff && amountOff > 0) discount_cents += amountOff
      if (discount_cents > amount) discount_cents = amount
      amount = amount - discount_cents
    }
  }
  const shipping_cost = shipping_method === 'dhl' ? 495 : 0
  const total_amount = amount + shipping_cost

  const shippingRecord = address ? {
    name: `${address?.name ?? ''}`.trim(),
    email: `${address?.email ?? email ?? ''}`.trim(),
    phone: `${address?.phone ?? ''}`.trim(),
    street: `${address?.street ?? ''}`.trim(),
    number: `${address?.number ?? ''}`.trim(),
    complement: `${address?.complement ?? ''}`.trim() || null,
    neighborhood: `${address?.neighborhood ?? ''}`.trim(),
    city: `${address?.city ?? ''}`.trim(),
    state: `${address?.state ?? ''}`.trim(),
    zip: `${address?.zip ?? ''}`.trim(),
  } : null

  const shippingPayload = shippingRecord ? {
    name: shippingRecord.name,
    phone: shippingRecord.phone,
    line1: `${shippingRecord.street}${shippingRecord.number ? `, ${shippingRecord.number}` : ''}`.trim(),
    line2: shippingRecord.complement || undefined,
    city: shippingRecord.city,
    state: shippingRecord.state,
    postal_code: shippingRecord.zip,
    country: 'PT',
  } : undefined

  // Ensure an open cart row exists for metadata tracking (optional)
  let cartId: string | null = null
  const openCart = await queryOne<any>(db, 'SELECT id FROM carts WHERE user_id = ? AND status = ?', [user.id, 'open'])
  if (openCart?.id) cartId = openCart.id
  else {
    cartId = crypto.randomUUID()
    await execute(db, 'INSERT INTO carts (id, user_id, status, created_at, updated_at) VALUES (?, ?, ?, datetime("now"), datetime("now"))', [cartId, user.id, 'open'])
  }

  const metadata = {
    shipping_method: String(shipping_method ?? ''),
    shipping_cost_cents: String(shipping_cost),
    address_json: shippingRecord ? JSON.stringify(shippingRecord) : '',
    cart_id: String(cartId ?? ''),
    user_id: String(user.id),
    coupon_code: String(coupon_code ?? ''),
    discount_cents: String(discount_cents),
  }

  const existingOrder = await queryOne<any>(db, 'SELECT id, stripe_intent_id FROM orders WHERE cart_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1', [cartId, 'pending'])

  let intent: StripePaymentIntent
  if (existingOrder?.stripe_intent_id) {
    intent = await updatePaymentIntent(stripeSecret, existingOrder.stripe_intent_id, total_amount, metadata, shippingPayload)
  } else {
    intent = await createPaymentIntent(stripeSecret, total_amount, metadata, email ?? undefined, shippingPayload)
  }

  if (!intent?.id || intent?.status === 'error') {
    return jsonResponse({ error: 'Falha ao processar pagamento' }, { status: 500 })
  }

  let orderId: string | null = existingOrder?.id ?? null
  if (orderId) {
    await execute(db, 'UPDATE orders SET amount_cents = ?, stripe_intent_id = ?, shipping_json = ?, shipping_method = ? WHERE id = ?', [total_amount, intent.id, shippingRecord ? JSON.stringify(shippingRecord) : null, shipping_method ?? null, orderId])
    await execute(db, 'DELETE FROM order_items WHERE order_id = ?', [orderId])
  } else {
    orderId = crypto.randomUUID()
    await execute(db, 'INSERT INTO orders (id, user_id, cart_id, amount_cents, status, stripe_intent_id, shipping_json, shipping_method, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))', [orderId, user.id, cartId, total_amount, 'pending', intent.id, shippingRecord ? JSON.stringify(shippingRecord) : null, shipping_method ?? null])
  }

  if (orderId) {
    for (const it of items) {
      if (!it.products?.id) continue
      await execute(db, 'INSERT INTO order_items (id, order_id, product_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?, ?)', [crypto.randomUUID(), orderId, it.products.id, it.quantity, it.products.price_cents ?? 0])
    }
  }

  return jsonResponse({ client_secret: intent.client_secret, order_id: orderId, amount_cents: total_amount, shipping_cents: shipping_cost, discount_cents })
}
