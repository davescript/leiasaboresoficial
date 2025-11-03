import type { PagesFunction, Response as CfResponse } from '@cloudflare/workers-types'
import { getD1, queryOne, queryAll, execute } from './_db'

// Helper para garantir o tipo de Response do runtime Cloudflare
const jsonResponse = (obj: unknown, init?: ResponseInit): CfResponse =>
  new Response(JSON.stringify(obj), { headers: { 'Content-Type': 'application/json' }, ...init }) as unknown as CfResponse

export const onRequestGet: PagesFunction = async ({ env, request }) => {
  const db = getD1(env as any)
  const url = new URL(request.url)
  const search = url.searchParams.get('search')?.trim() ?? ''
  const category = url.searchParams.get('category')?.trim() ?? ''
  const sort = url.searchParams.get('sort')?.trim() ?? 'newest'
  const page = Math.max(1, parseInt(url.searchParams.get('page') || '1', 10))
  const limit = Math.max(1, Math.min(50, parseInt(url.searchParams.get('limit') || '12', 10)))
  const offset = (page - 1) * limit

  // Seeding: se a tabela estiver vazia
  const countRow = await queryOne<{ cnt: number }>(db, 'SELECT COUNT(*) as cnt FROM products')
  const tableCount = countRow?.cnt ?? 0

  if (!tableCount || tableCount === 0) {
    const seed = [
      { name: 'Bolo Red Velvet Artesanal', description: 'Bolo red velvet com 3 camadas e cream cheese.', price_cents: 6500, image_url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800', category: 'bolos', stock: 8, images_json: ['https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800','https://images.unsplash.com/photo-1589061428087-2a6b203f3e91?w=800','https://images.unsplash.com/photo-1559622214-94b564c1f1a4?w=800','https://images.unsplash.com/photo-1605478638282-9285be6a7b06?w=800'] },
      { name: 'Bolo de Chocolate Belga Premium', description: 'Chocolate 70% cacau com ganache belga.', price_cents: 7500, image_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800', category: 'bolos', stock: 6, images_json: ['https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800','https://images.unsplash.com/photo-1548859455-1024f0331ec8?w=800','https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800','https://images.unsplash.com/photo-1541782810459-6c6b07b3a2d4?w=800'] },
      { name: 'Torta de Limão Siciliano', description: 'Base crocante e merengue italiano dourado.', price_cents: 5500, image_url: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800', category: 'tortas', stock: 10, images_json: ['https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=800','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','https://images.unsplash.com/photo-1513247043935-56e1aa4409f1?w=800','https://images.unsplash.com/photo-1511690743698-7f7a4a7f14a3?w=800'] },
      { name: 'Torta Banoffee', description: 'Doce de leite, bananas caramelizadas e chantilly.', price_cents: 5800, image_url: 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800', category: 'tortas', stock: 6, images_json: ['https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=800','https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=800','https://images.unsplash.com/photo-1541782810459-6c6b07b3a2d4?w=800','https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800'] },
      { name: 'Cupcake Red Velvet', description: 'Cobertura de cream cheese artesanal.', price_cents: 1200, image_url: 'https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800', category: 'cupcakes', stock: 36, images_json: ['https://images.unsplash.com/photo-1587668178277-295251f900ce?w=800','https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800','https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=800','https://images.unsplash.com/photo-1589395595558-503c1b6f87f5?w=800'] },
      { name: 'Cupcake de Chocolate Duplo', description: 'Recheio de brigadeiro e ganache.', price_cents: 1400, image_url: 'https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800', category: 'cupcakes', stock: 30, images_json: ['https://images.unsplash.com/photo-1576618148400-f54bed99fcfd?w=800','https://images.unsplash.com/photo-1549602185-02b9b8269a08?w=800','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800','https://images.unsplash.com/photo-1511689660979-5b8b41f3b4d2?w=800'] },
      { name: 'Brownie Tradicional', description: 'Chocolate meio amargo com nozes.', price_cents: 1500, image_url: 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800', category: 'brownies', stock: 20, images_json: ['https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?w=800','https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800','https://images.unsplash.com/photo-1541782810459-6c6b07b3a2d4?w=800','https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800'] },
      { name: 'Brownie Cookies & Cream', description: 'Com pedaços de Oreo e cream cheese.', price_cents: 2000, image_url: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800', category: 'brownies', stock: 12, images_json: ['https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=800','https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800','https://images.unsplash.com/photo-1513247043935-56e1aa4409f1?w=800','https://images.unsplash.com/photo-1511690743698-7f7a4a7f14a3?w=800'] },
      { name: 'Brigadeiro Gourmet (12 un.)', description: 'Sabores variados com ingredientes premium.', price_cents: 3500, image_url: 'https://images.unsplash.com/photo-1558312657-b2dead03d494?w=800', category: 'doces', stock: 25, images_json: ['https://images.unsplash.com/photo-1558312657-b2dead03d494?w=800','https://images.unsplash.com/photo-1549602185-02b9b8269a08?w=800','https://images.unsplash.com/photo-1511689660979-5b8b41f3b4d2?w=800','https://images.unsplash.com/photo-1589395595558-503c1b6f87f5?w=800'] }
    ]
    for (const s of seed) {
      await execute(db, 'INSERT INTO products (id, name, description, price_cents, image_url, category, stock, images_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime("now"))', [crypto.randomUUID(), s.name, s.description, s.price_cents, s.image_url, s.category, s.stock, JSON.stringify(s.images_json)])
    }
  }
  // Montar filtros
  const where: string[] = []
  const params: any[] = []
  if (search) { where.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${search}%`, `%${search}%`) }
  if (category && category.toLowerCase() !== 'all') { where.push('LOWER(category) = ?'); params.push(category.toLowerCase()) }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : ''
  const orderSql = sort === 'price_asc' ? 'ORDER BY price_cents ASC' : sort === 'price_desc' ? 'ORDER BY price_cents DESC' : 'ORDER BY created_at DESC'
  const countRow2 = await queryOne<{ cnt: number }>(db, `SELECT COUNT(*) as cnt FROM products ${whereSql}`, params)
  const total = countRow2?.cnt ?? 0
  const rows = await queryAll<any>(db, `SELECT id, name, description, price_cents, image_url, category, stock FROM products ${whereSql} ${orderSql} LIMIT ? OFFSET ?`, [...params, limit, offset])
  const products = rows.map(r => ({ ...r, price_cents: r.price_cents }))
  const totalPages = Math.ceil((total || 0) / limit)
  return jsonResponse({ products, total, totalPages })
}
