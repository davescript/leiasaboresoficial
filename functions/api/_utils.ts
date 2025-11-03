import { verifyJWT } from './_jwt'

export async function requireUser(env: Record<string, string>, token: string | null) {
  if (!token) return null
  const payload = await verifyJWT(token, (env as any).JWT_SECRET)
  if (!payload || typeof payload.sub !== 'string') return null
  return { id: payload.sub } as any
}