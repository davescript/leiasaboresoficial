import { vi } from 'vitest'

type QueryResult<T = any> = { data: T; error: any; [key: string]: any }

type QueryQueue = Map<string, QueryResponse[]>

type QueryResponse<T = any> = Promise<QueryResult<T>>

type SupabaseMock = {
  auth: {
    signUp: ReturnType<typeof vi.fn>
    signInWithPassword: ReturnType<typeof vi.fn>
    signOut: ReturnType<typeof vi.fn>
    getUser: ReturnType<typeof vi.fn>
  }
  from: ReturnType<typeof vi.fn>
  __queues: QueryQueue
}

const defaultResponse = Promise.resolve({ data: null, error: null })

const getNextResponse = (queues: QueryQueue, table: string) => {
  const queue = queues.get(table)
  if (!queue || queue.length === 0) return defaultResponse
  return queue.shift()! as QueryResponse
}

const createBuilder = (queues: QueryQueue, table: string) => {
  const next = () => getNextResponse(queues, table)
  const chain = () => builder
  const builder: any = {}
  builder.select = vi.fn(chain)
  builder.insert = vi.fn(chain)
  builder.update = vi.fn(chain)
  builder.delete = vi.fn(chain)
  builder.eq = vi.fn(chain)
  builder.ilike = vi.fn(chain)
  builder.gte = vi.fn(chain)
  builder.lte = vi.fn(chain)
  builder.limit = vi.fn(chain)
  builder.order = vi.fn(chain)
  builder.returns = vi.fn(() => next())
  builder.range = vi.fn(() => next())
  builder.single = vi.fn(() => next())
  builder.maybeSingle = vi.fn(() => next())
  builder.then = vi.fn((resolve: any, reject: any) => next().then(resolve, reject))
  return builder
}

const createSupabaseMock = (): SupabaseMock => {
  const queues: QueryQueue = new Map()
  const fromImpl = vi.fn((table: string) => createBuilder(queues, table))
  return {
    auth: {
      signUp: vi.fn(async () => ({ data: {}, error: null })),
      signInWithPassword: vi.fn(async () => ({ data: {}, error: null })),
      signOut: vi.fn(async () => ({})),
      getUser: vi.fn(async () => ({ data: { user: null } })),
    },
    from: fromImpl,
    __queues: queues,
  }
}

export const supabaseMock = createSupabaseMock()

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => supabaseMock),
}))

;(globalThis as any).__SUPABASE_TEST_CLIENT__ = supabaseMock

export const setSupabaseQuery = <T = any>(table: string, result: QueryResult<T>) => {
  if (!supabaseMock.__queues.has(table)) supabaseMock.__queues.set(table, [])
  supabaseMock.__queues.get(table)!.push(Promise.resolve(result))
}

export const setSupabaseAuthUser = (user: any) => {
  ;(supabaseMock.auth.getUser as any).mockResolvedValue({ data: { user } })
}

export const setSupabaseAuthSignIn = (data: any) => {
  ;(supabaseMock.auth.signInWithPassword as any).mockResolvedValue({ data, error: null })
}

export const setSupabaseAuthSignUp = (data: any) => {
  ;(supabaseMock.auth.signUp as any).mockResolvedValue({ data, error: null })
}

export const resetSupabaseMock = () => {
  supabaseMock.__queues.clear()
  Object.values(supabaseMock.auth).forEach(fn => (fn as any).mockReset())
  supabaseMock.auth.signUp.mockResolvedValue({ data: {}, error: null })
  supabaseMock.auth.signInWithPassword.mockResolvedValue({ data: {}, error: null })
  supabaseMock.auth.signOut.mockResolvedValue({})
  supabaseMock.auth.getUser.mockResolvedValue({ data: { user: null } })
  supabaseMock.from.mockReset()
  supabaseMock.from.mockImplementation((table: string) => createBuilder(supabaseMock.__queues, table))
  ;(globalThis as any).__SUPABASE_TEST_CLIENT__ = supabaseMock
}
