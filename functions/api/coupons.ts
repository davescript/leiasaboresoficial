import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { requireUser } from './_utils'
import { getD1 } from './_db'

const json = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim() ?? ''
  const amount = parseInt(url.searchParams.get('amount_cents') || '0', 10)
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const db = getD1(env as any)

  if (!code) return json({ error: 'Código ausente' }, { status: 400 })

  const coupon = await db
    .prepare('SELECT * FROM coupons WHERE code = ? AND active = 1')
    .bind(code)
    .first()

  if (!coupon) return json({ valid: false })
  if (coupon.expires_at && new Date(coupon.expires_at as string).getTime() <= Date.now()) return json({ valid: false })

  let discount = 0
  const percent = typeof coupon.percent_off === 'number' ? coupon.percent_off : null
  const amountOff = typeof coupon.amount_off_cents === 'number' ? coupon.amount_off_cents : null
  if (percent && percent > 0) discount += Math.floor(amount * percent / 100)
  if (amountOff && amountOff > 0) discount += amountOff
  if (discount > amount) discount = amount

  return json({ valid: true, discount_cents: discount, percent_off: coupon.percent_off ?? null, amount_off_cents: coupon.amount_off_cents ?? null })
}