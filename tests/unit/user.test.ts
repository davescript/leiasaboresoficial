import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { signIn, signUp, getCurrentUser, signOut } from '@/lib/api'
import { resetSupabaseMock, setSupabaseAuthUser, setSupabaseAuthSignIn, setSupabaseAuthSignUp } from '../setup/supabaseMock'

describe('Perfil do usuário', () => {
  beforeEach(() => {
    resetSupabaseMock()
  })

  afterEach(() => {
    resetSupabaseMock()
  })

  it('signUp cria usuário', async () => {
    setSupabaseAuthSignUp({ user: { id: 'user-1' } })

    const result = await signUp('test@example.com', '123456')

    expect(result).toBeDefined()
  })

  it('signIn autentica usuário', async () => {
    setSupabaseAuthSignIn({ user: { id: 'user-1' } })

    const result = await signIn('test@example.com', '123456')

    expect(result).toBeDefined()
  })

  it('getCurrentUser retorna usuário logado', async () => {
    const user = { id: 'user-1', email: 'a@b.com' }
    setSupabaseAuthUser(user)

    const res = await getCurrentUser()

    expect(res).toEqual(user)
  })

  it('signOut finaliza sessão', async () => {
    await expect(signOut()).resolves.toBeUndefined()
  })
})
