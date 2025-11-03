export function getD1(env: Record<string, any>) {
  return (env as any).DB as D1Database
}

export async function ensureId(id?: string) {
  return id ?? crypto.randomUUID()
}

export async function queryOne<T = any>(db: D1Database, sql: string, params: any[] = []) {
  const stmt = db.prepare(sql).bind(...params)
  const res = await stmt.first<T>()
  return res as T | null
}

export async function queryAll<T = any>(db: D1Database, sql: string, params: any[] = []) {
  const stmt = db.prepare(sql).bind(...params)
  const res = await stmt.all<T>()
  return (res?.results ?? []) as T[]
}

export async function execute(db: D1Database, sql: string, params: any[] = []) {
  const stmt = db.prepare(sql).bind(...params)
  return await stmt.run()
}