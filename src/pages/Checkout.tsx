import { useEffect, useMemo, useState } from 'react'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { useSupabaseAuth } from '../state/useSupabaseAuth'
import { Link } from 'react-router-dom'
import { OptimizedImage } from '../components/OptimizedImage'
import { useCart } from '../hooks/useCart'
import { formatCurrency } from '../lib/api'

export default function CheckoutPage() {
  const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
  const stripePromise = useMemo(() => publishableKey ? loadStripe(publishableKey) : null, [publishableKey])
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)
  const [shippingMethod, setShippingMethod] = useState<'fedex'|'dhl'>('fedex')
  const [shippingCents, setShippingCents] = useState(0)
  const [couponCode, setCouponCode] = useState('')
  const [discountCents, setDiscountCents] = useState(0)
  const [step, setStep] = useState<1|2>(1)
  const [isIntentLoading, setIsIntentLoading] = useState(false)
  const [intentError, setIntentError] = useState<string | null>(null)
  const [address, setAddress] = useState({
    name: '', email: '', phone: '',
    street: '', number: '', complement: '',
    neighborhood: '', city: '', state: '', zip: ''
  })
  const [errors, setErrors] = useState<Record<string,string>>({})
  const { session } = useSupabaseAuth()
  const { items, total, isLoading: cartLoading } = useCart()

  const cartFingerprint = items.map(it => `${it.id}:${it.quantity}`).join('|')

  const maskCEP = (v: string) => v.replace(/\D/g, '').slice(0,8).replace(/(\d{5})(\d{0,3})/, '$1-$2')
  const maskPhone = (v: string) => v.replace(/\D/g,'').slice(0,11).replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3')
  const validateAddress = () => {
    const e: Record<string,string> = {}
    if (!address.name.trim()) e.name = 'Informe seu nome completo'
    if (!address.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) e.email = 'E-mail inválido'
    if ((address.phone.replace(/\D/g,'').length) < 10) e.phone = 'Telefone inválido'
    if (address.zip.replace(/\D/g,'').length !== 8) e.zip = 'CEP inválido'
    if (!address.street.trim()) e.street = 'Informe a rua'
    if (!address.number.trim()) e.number = 'Informe o número'
    if (!address.city.trim()) e.city = 'Informe a cidade'
    if (!address.state.trim()) e.state = 'Informe o estado'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const loadIntent = async () => {
    if (!session?.access_token) return
    if (isIntentLoading) return
    if (items.length === 0) {
      setIntentError('Seu carrinho está vazio.')
      setClientSecret(null)
      setOrderId(null)
      return
    }
    if (!validateAddress()) {
      setStep(1)
      return
    }
    setIsIntentLoading(true)
    setIntentError(null)
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ shipping_method: shippingMethod, address, email: address.email, coupon_code: couponCode || null })
    })
    const json: any = await res.json().catch(()=>null)
    if (res.ok && json?.client_secret) {
      setClientSecret(json.client_secret)
      setShippingCents(json?.shipping_cents ?? 0)
      setDiscountCents(json?.discount_cents ?? 0)
      if (json?.order_id) setOrderId(json.order_id)
    } else {
      setIntentError((json && json.error) ? String(json.error) : 'Não foi possível preparar o pagamento.')
      setClientSecret(null)
    }
    setIsIntentLoading(false)
  }

  useEffect(() => {
    if (step !== 2) return
    if (cartLoading) return
    loadIntent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, shippingMethod, cartFingerprint, session?.access_token, cartLoading])

  if (!publishableKey) {
    return (
      <div className="section">
        <h1 className="text-2xl font-semibold">Pagamento</h1>
        <p className="mt-2 text-sm">Defina `VITE_STRIPE_PUBLISHABLE_KEY` no seu `.env` para continuar.</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="section">
        <h1 className="text-2xl font-semibold">Pagamento</h1>
        <p className="mt-2 text-sm">Faça login para finalizar sua compra.</p>
        <Link className="inline-block mt-4 px-4 py-2 rounded-lg bg-pink-600 text-white" to="/conta">Ir para Minha Conta</Link>
      </div>
    )
  }

  if (cartLoading) {
    return (
      <div className="section text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
        <p className="text-gray-600">Carregando carrinho...</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="section text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Seu carrinho está vazio</h2>
        <p className="text-gray-600 mb-6">Adicione alguns doces antes de concluir o checkout.</p>
        <Link to="/produtos" className="inline-flex items-center gap-2 bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6 py-3 font-semibold">
          Ver produtos
        </Link>
      </div>
    )
  }

  const shippingValue = shippingCents / 100
  const subtotalCurrency = formatCurrency(total)
  const shippingCurrency = formatCurrency(shippingValue)
  const totalCurrency = formatCurrency(total + shippingValue)

  return (
    <div className="section">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <div className="flex items-center gap-4 mb-6 text-sm">
        <StepBadge active={step >= 1} done={step > 1} index={1} label="Informações" />
        <div className="h-px flex-1 bg-gray-200" />
        <StepBadge active={step >= 2} done={false} index={2} label="Pagamento" />
        <div className="h-px flex-1 bg-gray-200" />
        <StepBadge active={false} done={false} index={3} label="Concluir pedido" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Resumo do Pedido</h2>
            <div className="space-y-4 max-h-64 overflow-y-auto">
              {cartLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-14 bg-gray-100 rounded-xl" />
                  <div className="h-14 bg-gray-100 rounded-xl" />
                </div>
              ) : (
                items.map(it => (
                  <div key={it.id} className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-100">
                      {it.product?.image_url && (
                        <OptimizedImage src={it.product.image_url} alt={it.product.name} className="w-full h-full object-cover" width={56} height={56} sizes="56px" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{it.product?.name}</div>
                      <div className="text-xs text-gray-500">Qtd: {it.quantity}</div>
                    </div>
                    <div className="text-sm font-semibold">{formatCurrency((it.product?.price ?? 0))}</div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{subtotalCurrency}</span></div>
              <div className="flex justify-between"><span>Entrega</span><span>{shippingCurrency}</span></div>
              <div className="flex justify-between font-semibold text-lg"><span>Total</span><span>{totalCurrency}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Método de Envio</h2>
            <div className="space-y-3">
              <ShippingOption
                active={shippingMethod === 'fedex'}
                title="Fedex Delivery"
                subtitle="2–3 dias úteis"
                price="Grátis"
                onSelect={() => setShippingMethod('fedex')}
              />
              <ShippingOption
                active={shippingMethod === 'dhl'}
                title="DHL Delivery"
                subtitle="1–3 dias úteis"
                price="R$ 12,00"
                onSelect={() => setShippingMethod('dhl')}
              />
            </div>
            {/* Cupom */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Cupom promocional</label>
              <div className="flex gap-2">
                <input
                  value={couponCode}
                  onChange={(e)=>setCouponCode(e.target.value)}
                  placeholder="Digite seu cupom"
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
                <button
                  onClick={async ()=>{
                    try {
                      const params = new URLSearchParams({ code: couponCode, amount_cents: String(Math.round(total*100)) })
                      const res = await fetch(`/api/coupons?${params.toString()}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined })
                      const j: any = await res.json()
                      if (j && j.valid) {
                        setDiscountCents(j.discount_cents ?? 0)
                      } else {
                        setDiscountCents(0)
                      }
                    } catch {}
                  }}
                  className="px-4 py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700"
                >
                  Aplicar
                </button>
              </div>
            </div>
            {/* Resumo */}
            <div className="mt-6 space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(total)}</span></div>
              <div className="flex justify-between"><span>Entrega</span><span>{formatCurrency(shippingCents/100)}</span></div>
              {discountCents>0 && (<div className="flex justify-between"><span>Cupom</span><span className="text-green-600">− {formatCurrency(discountCents/100)}</span></div>)}
              <div className="flex justify-between font-semibold text-lg pt-2 border-t"><span>Total</span><span>{formatCurrency(Math.max(0, total + shippingCents/100 - discountCents/100))}</span></div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Endereço de Cobrança</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Nome completo" value={address.name} onChange={e=>setAddress(a=>({ ...a, name: e.target.value }))} />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="E-mail" value={address.email} onChange={e=>setAddress(a=>({ ...a, email: e.target.value }))} />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Telefone" value={address.phone} onChange={e=>setAddress(a=>({ ...a, phone: maskPhone(e.target.value) }))} />
                  {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="CEP" value={address.zip} onChange={e=>setAddress(a=>({ ...a, zip: maskCEP(e.target.value) }))} />
                  {errors.zip && <p className="text-xs text-red-600 mt-1">{errors.zip}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Rua" value={address.street} onChange={e=>setAddress(a=>({ ...a, street: e.target.value }))} />
                  {errors.street && <p className="text-xs text-red-600 mt-1">{errors.street}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Número" value={address.number} onChange={e=>setAddress(a=>({ ...a, number: e.target.value }))} />
                  {errors.number && <p className="text-xs text-red-600 mt-1">{errors.number}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Complemento" value={address.complement} onChange={e=>setAddress(a=>({ ...a, complement: e.target.value }))} />
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Bairro" value={address.neighborhood} onChange={e=>setAddress(a=>({ ...a, neighborhood: e.target.value }))} />
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Cidade" value={address.city} onChange={e=>setAddress(a=>({ ...a, city: e.target.value }))} />
                  {errors.city && <p className="text-xs text-red-600 mt-1">{errors.city}</p>}
                </div>
                <div>
                  <input className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pink-500" placeholder="Estado" value={address.state} onChange={e=>setAddress(a=>({ ...a, state: e.target.value }))} />
                  {errors.state && <p className="text-xs text-red-600 mt-1">{errors.state}</p>}
                </div>
              </div>
              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <button onClick={() => { if (validateAddress()) setStep(2) }} className="w-full sm:w-auto bg-pink-600 hover:bg-pink-700 text-white rounded-lg px-6 py-3 font-semibold">
                  Continuar para pagamento
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold">Pagamento</h2>
                  <button
                    className="text-sm text-pink-600"
                    onClick={() => {
                      setStep(1)
                      setClientSecret(null)
                      setOrderId(null)
                      setIntentError(null)
                    }}
                  >
                    Editar endereço
                  </button>
                </div>
                <div className="bg-pink-50 border border-pink-100 rounded-xl p-4 text-sm text-pink-900 mb-4">
                  <p className="font-semibold mb-1">Entrega para:</p>
                  <div>{address.name}</div>
                  <div>{address.street}, {address.number}{address.complement ? ` • ${address.complement}` : ''}</div>
                  <div>{address.neighborhood}</div>
                  <div>{address.city} - {address.state} • {address.zip}</div>
                  <div>{address.email} • {address.phone}</div>
                </div>
                {isIntentLoading ? (
                  <div className="py-16 text-center text-sm text-gray-500">Preparando métodos de pagamento...</div>
                ) : intentError ? (
                  <div className="py-16 text-center text-sm text-red-600">{intentError}</div>
                ) : !clientSecret ? (
                  <div className="py-16 text-center text-sm text-gray-500">Não foi possível carregar os métodos de pagamento.</div>
                ) : (
                  <Elements stripe={stripePromise as Promise<Stripe>} options={{ clientSecret, appearance: { theme: 'flat', variables: { colorPrimary: '#db2777', borderRadius: '8px' } } }}>
                    <CheckoutForm orderId={orderId} />
                  </Elements>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function CheckoutForm({ orderId }: { orderId: string | null }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) return
    setLoading(true)
    setMessage(null)
    const successUrl = orderId ? `${window.location.origin}/sucesso?order_id=${orderId}` : `${window.location.origin}/sucesso`
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: successUrl,
      },
      redirect: 'if_required',
    })
    if (error) {
      setMessage(error.message ?? 'Falha ao confirmar pagamento')
    } else {
      window.location.assign(successUrl)
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <PaymentElement options={{ layout: 'tabs' }} />
      {message && <p className="text-sm text-red-600">{message}</p>}
      <button type="submit" disabled={loading || !stripe || !elements} className="w-full bg-pink-600 hover:bg-pink-700 text-white rounded-lg py-3 font-semibold">
        {loading ? 'Processando...' : 'Finalizar pagamento'}
      </button>
    </form>
  )
}

function StepBadge({ active, done, index, label }: { active: boolean; done: boolean; index: number; label: string }) {
  const stateClass = done ? 'bg-green-500' : active ? 'bg-pink-600' : 'bg-gray-300'
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-gray-900' : 'text-gray-400'}`}>
      <span className={`w-6 h-6 rounded-full text-white text-xs flex items-center justify-center ${stateClass}`}>{done ? '✓' : index}</span>
      <span>{label}</span>
    </div>
  )
}

function ShippingOption({ active, title, subtitle, price, onSelect }: { active: boolean; title: string; subtitle: string; price: string; onSelect: () => void }) {
  return (
    <button type="button" onClick={onSelect} className={`w-full text-left p-4 rounded-xl border transition-colors ${active ? 'border-pink-600 bg-pink-50 shadow-sm' : 'border-gray-200 hover:border-pink-300'}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-xs text-gray-500">{subtitle}</div>
        </div>
        <div className="text-sm font-semibold text-pink-600">{price}</div>
      </div>
    </button>
  )
}
