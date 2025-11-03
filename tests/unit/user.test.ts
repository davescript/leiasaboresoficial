import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { signIn, signUp, updateUserProfile, getCurrentUser, signOut } from '@/lib/api'
import { resetSupabaseMock, setSupabaseQuery, setSupabaseAuthUser, setSupabaseAuthSignIn, setSupabaseAuthSignUp } from '../setup/supabaseMock'

describe('Perfil do usuário', () => {
  beforeEach(() => {
    resetSupabaseMock()
  })

  afterEach(() => {
    resetSupabaseMock()
  })

  it('atualiza nome e telefone', async () => {
    setSupabaseQuery('profiles', { data: { id: 'user-1', name: 'João', phone: '+351912345678' }, error: null })

    await expect(updateUserProfile('user-1', { name: 'João', phone: '+351912345678' })).resolves.toBeUndefined()
  })

  it('signUp cria usuário', async () => {
    setSupabaseAuthSignUp({ user: { id: 'user-1' } })

    const { data } = await signUp('test@example.com', '123456')

    expect(data).toBeDefined()
  })

  it('signIn autentica usuário', async () => {
    setSupabaseAuthSignIn({ user: { id: 'user-1' } })

    const { data } = await signIn('test@example.com', '123456')

    expect(data).toBeDefined()
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
