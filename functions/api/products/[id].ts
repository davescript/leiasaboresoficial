import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { getD1, queryOne } from '../_db'

const json = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ env, params }) => {
  const db = getD1(env as any)
  const id = (params as any)?.id as string
  if (!id) return json({ error: 'missing id' }, { status: 400 })
  const p = await queryOne<any>(db, 'SELECT id, name, description, price_cents, image_url, category, stock, images_json FROM products WHERE id = ?', [id])
  if (!p) return json({ error: 'not_found' }, { status: 404 })
  const images = p.images_json ? JSON.parse(p.images_json) as string[] : []
  return json({
    id: p.id,
    name: p.name,
    description: p.description,
    price_cents: p.price_cents,
    image_url: p.image_url,
    images,
    category: p.category,
    stock: p.stock,
  })
}