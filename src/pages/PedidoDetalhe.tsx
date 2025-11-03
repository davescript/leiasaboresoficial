import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useToast } from '../state/ToastContext'
import { getOrderDetails, formatCurrency } from '../lib/api'

interface Order {
  id: string
  status: string
  amount_cents: number
  created_at: string
  stripe_intent_id?: string
  shipping_method?: string | null
  shipping_json?: {
    name?: string
    email?: string
    phone?: string
    street?: string
    number?: string
    complement?: string | null
    neighborhood?: string
    city?: string
    state?: string
    zip?: string
  } | null
  order_items?: {
    quantity: number
    unit_price_cents: number
    products?: {
      name?: string
      image_url?: string
    } | null
  }[] | null
}

export default function PedidoDetalhe() {
  const { id } = useParams()
  const { showToast } = useToast()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (!id) return
        const data = await getOrderDetails(id)
        setOrder(data as Order)
      } catch (e) {
        showToast('Não foi possível carregar o pedido', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  if (loading) return <div className="section">Carregando...</div>
  if (!order) return <div className="section">Pedido não encontrado.</div>

  return (
    <div className="section space-y-6">
      <Link to="/pedidos" className="text-pink-600 hover:underline">← Voltar para pedidos</Link>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Pedido #{order.id.slice(0,8)}</h1>
        <span className={`px-3 py-1 rounded-full text-sm ${order.status==='paid'?'bg-green-100 text-green-700':order.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{order.status}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="text-gray-500">Criado em</div>
          <div className="font-medium">{new Date(order.created_at).toLocaleString()}</div>
          <div className="text-gray-500">Total</div>
          <div className="text-2xl font-bold">{formatCurrency((order.amount_cents||0)/100)}</div>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          <div className="text-gray-500">Pagamento</div>
          <div className="font-medium">Intent: {order.stripe_intent_id || '—'}</div>
          <div className="text-gray-500">Status</div>
          <div className="font-medium">{order.status}</div>
        </div>
      </div>
    </div>
  )
}