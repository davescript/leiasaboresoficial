import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { getAdminClient, requireUser } from './_utils'

const json = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')?.trim() ?? ''
  const amount = parseInt(url.searchParams.get('amount_cents') || '0', 10)
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  const supabase = getAdminClient(env as any)

  if (!code) return json({ error: 'Código ausente' }, { status: 400 })

  const { data: coupon } = await supabase
    .from('coupons')
    .select('*')
    .eq('code', code)
    .eq('active', true)
    .maybeSingle()

  if (!coupon) return json({ valid: false })
  if (coupon.expires_at && new Date(coupon.expires_at).getTime() <= Date.now()) return json({ valid: false })

  let discount = 0
  const percent = typeof coupon.percent_off === 'number' ? coupon.percent_off : null
  const amountOff = typeof coupon.amount_off_cents === 'number' ? coupon.amount_off_cents : null
  if (percent && percent > 0) discount += Math.floor(amount * percent / 100)
  if (amountOff && amountOff > 0) discount += amountOff
  if (discount > amount) discount = amount

  return json({ valid: true, discount_cents: discount, percent_off: coupon.percent_off ?? null, amount_off_cents: coupon.amount_off_cents ?? null })
}