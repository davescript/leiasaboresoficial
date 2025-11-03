import { useState } from 'react'
import { useSupabaseAuth } from '../state/useSupabaseAuth'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'

export default function Conta() {
  const { session } = useSupabaseAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState<'signin'|'signup'>('signin')
  const [error, setError] = useState<string| null>(null)

  if (session) {
    return (
      <div className="section space-y-4">
        <h1 className="text-2xl font-semibold">Minha Conta</h1>
        <p>Você está autenticado como {session.user.email}</p>
      <Button onClick={() => { document.cookie = 'session=; Path=/; Max-Age=0; SameSite=Lax'; location.reload() }}>Sair</Button>
      </div>
    )
  }

  return (
    <div className="section max-w-md">
      <h1 className="text-2xl font-semibold">{mode==='signin' ? 'Entrar' : 'Criar conta'}</h1>
      <div className="mt-4 space-y-3">
        <Input placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
        <Input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-3">
          {mode==='signin' ? (
            <>
              <Button onClick={signIn} disabled={loading}>Entrar</Button>
              <Button onClick={magicLink} variant="secondary" disabled={loading}>Magic link</Button>
            </>
          ) : (
            <Button onClick={signUp} disabled={loading}>Criar conta</Button>
          )}
        </div>
        <button className="text-sm text-brand-700" onClick={()=> setMode(mode==='signin'?'signup':'signin')}>
          {mode==='signin' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entrar'}
        </button>
      </div>
    </div>
  )

  async function signIn() {
    setLoading(true)
    setError(null)
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  const error = res.ok ? null : { message: 'Login falhou' }
    if (error) setError(error.message)
    setLoading(false)
  }

  async function magicLink() {
    setLoading(true)
    setError(null)
  const error = null // not implemented
    if (error) setError(error.message)
    setLoading(false)
    alert('Verifique seu e-mail para o link mágico!')
  }

  async function signUp() {
    setLoading(true)
    setError(null)
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
  const error = res.ok ? null : { message: 'Registro falhou' }
    if (error) setError(error.message)
    setLoading(false)
    if (!error) alert('Conta criada! Faça login para continuar.')
  }
}