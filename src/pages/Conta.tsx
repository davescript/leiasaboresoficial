import { useState, useContext } from 'react'
import { AuthContext } from '../state/AuthContext'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Link } from 'react-router-dom'

export default function Conta() {
  const { session } = useContext(AuthContext)
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
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{mode==='signin' ? 'Entrar' : 'Criar conta'}</h1>
        <p className="text-sm text-gray-600 mb-6">Acesse sua conta para acompanhar pedidos e finalizar compras.</p>

        <div className="space-y-4">
          <div className="space-y-3">
            <Input placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} />
            <Input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          <Button onClick={mode==='signin' ? signIn : signUp} disabled={loading} className="w-full">
            {mode==='signin' ? 'Entrar' : 'Criar conta'}
          </Button>

          <div className="flex items-center gap-2 my-2">
            <div className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-500">ou</span>
            <div className="h-px bg-gray-200 flex-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={()=>alert('Login com Google: em breve')}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 hover:bg-gray-50 flex items-center justify-center gap-2">
              <img src="https://www.gstatic.com/images/branding/product/2x/google_g_48dp.png" alt="Google" className="w-5 h-5"/>
              <span className="text-sm">Google</span>
            </button>
            <button onClick={()=>alert('Login com Apple: em breve')}
              className="w-full border border-gray-300 rounded-lg py-2 px-3 hover:bg-gray-50 flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M16.365 1.43c0 1.14-.474 2.266-1.25 3.086-.787.83-1.86 1.433-3.002 1.35-.127-1.1.435-2.266 1.164-3.053.776-.842 2.072-1.47 3.088-1.383zM20.9 17.137c-.567 1.316-1.284 2.52-2.27 3.834-.8 1.013-1.735 2.147-2.95 2.16-1.27.026-1.671-.832-3.103-.832-1.432 0-1.882.806-3.126.858-1.238.052-2.177-1.1-2.982-2.106-1.629-2.04-2.887-5.758-1.2-8.285.862-1.31 2.35-2.146 4.005-2.173 1.237-.025 2.4.878 3.1.878.7 0 2.138-1.083 3.6-.924.614.025 2.347.25 3.459 1.887-.09.053-2.044 1.2-1.934 3.503.113 2.492 2.16 3.298 2.3 3.3z"/></svg>
              <span className="text-sm">Apple</span>
            </button>
          </div>

          <div className="text-sm text-gray-600 mt-4">
            {mode==='signin' ? (
              <button className="text-pink-600" onClick={()=> setMode('signup')}>Não tem conta? Cadastre-se</button>
            ) : (
              <button className="text-pink-600" onClick={()=> setMode('signin')}>Já tem conta? Entrar</button>
            )}
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            <Link to="/">Voltar para a loja</Link>
          </div>
        </div>
      </div>
    </div>
  )

  async function signIn() {
    setLoading(true)
    setError(null)
  const res = await fetch('/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ email, password }) })
    if (!res.ok) setError('Login falhou')
    setLoading(false)
    if (res.ok) location.href = '/'
  }

  async function magicLink() {
    setLoading(true)
    setError(null)
    setError('Login por link mágico ainda não está disponível')
    setLoading(false)
    alert('Verifique seu e-mail para o link mágico!')
  }

  async function signUp() {
    setLoading(true)
    setError(null)
  const res = await fetch('/api/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) })
    if (!res.ok) setError('Registro falhou')
    setLoading(false)
    if (res.ok) { alert('Conta criada! Faça login para continuar.'); setMode('signin') }
}
}