import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { getD1, execute, queryOne } from '../_db'
import { json } from '../_jwt'

export const onRequestPost: PagesFunction = async ({ env, request }) => {
  const db = getD1(env as any)
  const body = await request.json().catch(()=>null) as any
  const email = body?.email?.trim() ?? ''
  const password = body?.password?.trim() ?? ''
  if (!email || !password) return json({ error: 'missing_fields' }, { status: 400 })
  const exists = await queryOne<any>(db, 'SELECT id FROM users WHERE email = ?', [email])
  if (exists) return json({ error: 'email_taken' }, { status: 409 })
  const id = crypto.randomUUID()
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password))
  const hashHex = Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,'0')).join('')
  await execute(db, 'INSERT INTO users (id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, datetime("now"))', [id, email, hashHex, 'user'])
  return json({ ok: true, user_id: id }, { status: 201 })
}