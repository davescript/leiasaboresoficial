import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'

const text = (body: string, init?: ResponseInit): CfResponse =>
  new Response(body, init) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ request, env }) => {
  const url = new URL(request.url)
  const key = url.searchParams.get('key') || ''
  if (!key) return text('Missing key', { status: 400 })
  const obj = await (env as any).BUCKET.get(key)
  if (!obj) return text('Not found', { status: 404 })
  const headers = new Headers()
  if (obj.httpMetadata?.contentType) headers.set('Content-Type', obj.httpMetadata.contentType)
  headers.set('Cache-Control', 'public, max-age=3600')
  return (new Response(obj.body, { headers }) as unknown) as CfResponse
}