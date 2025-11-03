import type { PagesFunction } from '@cloudflare/workers-types'
import { verifyJWT, json } from '../_jwt'
import { getD1, queryOne } from '../_db'

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || (request.headers.get('Cookie') || '').match(/session=([^;]+)/)?.[1]
  if (!token) return json({ user: null }, { status: 200 })
  const payload = await verifyJWT(token, (env as any).JWT_SECRET)
  if (!payload) return json({ user: null }, { status: 200 })
  const db = getD1(env as any)
  const user = await queryOne<any>(db, 'SELECT id, email, role, created_at FROM users WHERE id = ?', [payload.sub])
  return json({ user })
}