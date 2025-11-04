import type { PagesFunction } from '@cloudflare/workers-types'
import { getD1, queryOne } from '../_db'
import { signJWT, json } from '../_jwt'

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const db = getD1(env as any)
  const body = await request.json().catch(()=>null) as any
  const email = body?.email?.trim() ?? ''
  const password = body?.password?.trim() ?? ''
  if (!email || !password) return json({ error: 'missing_fields' }, { status: 400 })
  const user = await queryOne<any>(db, 'SELECT id, password_hash FROM users WHERE email = ?', [email])
  if (!user) return json({ error: 'invalid_credentials' }, { status: 401 })
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hashHex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')
  if (hashHex !== user.password_hash) return json({ error: 'invalid_credentials' }, { status: 401 })
  const jti = crypto.randomUUID()
  const token = await signJWT({ sub: user.id, jti }, (env as any).JWT_SECRET, 60 * 60 * 24)
  // Optionally store jti in Durable Object if available
  try {
    // @ts-ignore
    if ((env as any).SESSION_DO) {
      // @ts-ignore
      const id = (env as any).SESSION_DO.idFromName(user.id)
      // @ts-ignore
      const stub = (env as any).SESSION_DO.get(id)
      await stub.fetch(`https://do/session?user=${user.id}&jti=${jti}`, { method: 'PUT' })
    }
  } catch {}
  const headers = new Headers({ 'Content-Type': 'application/json' })
  headers.set('Set-Cookie', `session=${token}; HttpOnly; Path=/; SameSite=Lax`)
  return new Response(JSON.stringify({ token }), { status: 200, headers }) as any
}