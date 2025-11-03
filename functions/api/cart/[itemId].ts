import type { PagesFunction } from '@cloudflare/workers-types'
import { getAdminClient, requireUser } from '../_utils'

export const onRequestDelete: PagesFunction = async ({ env, request, params }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
  const user = await requireUser(env as any, token)
  if (!user) return new Response('Unauthorized', { status: 401 })
  const supabase = getAdminClient(env as any)
  const { data: item } = await supabase.from('cart_items').select('cart_id').eq('id', params.itemId).maybeSingle()
  await supabase.from('cart_items').delete().eq('id', params.itemId)
  if (item?.cart_id) {
    await supabase.from('carts').update({ updated_at: new Date().toISOString() }).eq('id', item.cart_id)
  }
  return new Response(JSON.stringify({ ok: true }))
}
