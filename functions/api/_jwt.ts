import type { Response as CfResponse } from '@cloudflare/workers-types'

export async function signJWT(payload: Record<string, any>, secret: string, expiresInSeconds = 60 * 60) {
  const header = { alg: 'HS256', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const exp = now + expiresInSeconds
  const body = { ...payload, iat: now, exp }
  const b64 = (obj: any) => btoa(JSON.stringify(obj)).replace(/=+$/,'').replace(/\+/g,'-').replace(/\//g,'_')
  const unsigned = `${b64(header)}.${b64(body)}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(unsigned))
  const signature = Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
  return `${unsigned}.${signature}`
}

export async function verifyJWT(token: string, secret: string) {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [h, b, s] = parts
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${h}.${b}`))
  const expSig = Array.from(new Uint8Array(sig)).map(b=>b.toString(16).padStart(2,'0')).join('')
  if (expSig !== s) return null
  const payload = JSON.parse(atob(b.replace(/-/g,'+').replace(/_/g,'/')))
  if (payload.exp && Math.floor(Date.now()/1000) > payload.exp) return null
  return payload
}

export const json = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse