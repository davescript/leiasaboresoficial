import type { PagesFunction, Response as CfResponse, R2Bucket } from '@cloudflare/workers-types'
import { requireUser } from './_utils'

interface Env { BUCKET: R2Bucket }

// Helper to return Cloudflare-typed Response
const json = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
    const user = await requireUser(env as any, token)
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    
    // Parse form data
    const formData = await request.formData()
    const fileEntry = formData.get('file')
    const category = formData.get('category') as string || 'products'
    
    if (!fileEntry || typeof fileEntry === 'string') {
      return json({ error: 'No valid file provided' }, { status: 400 })
    }
    
    const file = fileEntry as File
    
    if (!file) return json({ error: 'No file provided' }, { status: 400 })
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return json({ error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' }, { status: 400 })
    }
    
    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) return json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${category}/${fileName}`
    
    const putResult = await (env as any).BUCKET.put(filePath, file.stream(), {
      httpMetadata: { contentType: file.type },
    })
    if (!putResult) return json({ error: 'Failed to upload file' }, { status: 500 })
    const publicUrl = `/api/assets?key=${encodeURIComponent(filePath)}`
    const getOptimizedUrl = (width: number, _quality: number = 80) => `${publicUrl}&w=${width}`
    
    const response = {
      success: true,
      data: {
        path: filePath,
        publicUrl,
        optimizedUrls: {
          thumbnail: getOptimizedUrl(150, 70),
          small: getOptimizedUrl(400, 75),
          medium: getOptimizedUrl(800, 80),
          large: getOptimizedUrl(1200, 85),
          original: getOptimizedUrl(1920, 90)
        },
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: user.id
        }
      }
    }
    
    return json(response, { status: 200 })
    
  } catch (error) {
    console.error('Upload API error:', error)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}

export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '') ?? null
    const user = await requireUser(env as any, token)
    if (!user) return json({ error: 'Unauthorized' }, { status: 401 })
    
    const body = await request.json() as { path?: string }
    const { path } = body
    
    if (!path) return json({ error: 'File path is required' }, { status: 400 })
    
    await (env as any).BUCKET.delete(path)
    
    return json({ success: true }, { status: 200 })
    
  } catch (error) {
    console.error('Delete API error:', error)
    return json({ error: 'Internal server error' }, { status: 500 })
  }
}