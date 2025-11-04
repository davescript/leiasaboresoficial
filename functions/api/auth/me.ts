import type { PagesFunction } from '@cloudflare/workers-types'
import { verifyJWT, json } from '../_jwt'
import { getD1, queryOne } from '../_db'

function corsHeaders(env: any, request: any) {
  const origin = request.headers.get('Origin') || (env?.FRONTEND_URL ?? '')
  const allowed = origin && (origin.includes('localhost:5177') || origin === env?.FRONTEND_URL)
  const headers = new Headers()
  if (allowed) {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Access-Control-Allow-Credentials', 'true')
    headers.set('Vary', 'Origin')
  }
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS')
  return headers
}

export const onRequestOptions: PagesFunction = async ({ env, request }) => {
  const headers = corsHeaders(env as any, request)
  return new Response(null, { status: 204, headers }) as any
}

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    || (request.headers.get('Cookie') || '').match(/session=([^;]+)/)?.[1]
  if (!token) {
    const headers = corsHeaders(env as any, request)
    headers.set('Content-Type', 'application/json')
    return new Response(JSON.stringify({ user: null }), { status: 200, headers }) as any
  }
  const payload = await verifyJWT(token, (env as any).JWT_SECRET)
  if (!payload) {
    const headers = corsHeaders(env as any, request)
    headers.set('Content-Type', 'application/json')
    return new Response(JSON.stringify({ user: null }), { status: 200, headers }) as any
  }
  const db = getD1(env as any)
  const user = await queryOne<any>(db, 'SELECT id, email, role, created_at FROM users WHERE id = ?', [payload.sub])
  const headers = corsHeaders(env as any, request)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify({ user }), { headers }) as any
}