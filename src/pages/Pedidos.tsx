import { useEffect, useState } from 'react'
import { useSupabaseAuth } from '../state/useSupabaseAuth'
import { useToast } from '../state/ToastContext'
import { getUserOrders, formatCurrency } from '../lib/api'
import { Link } from 'react-router-dom'

interface Order {
  id: string
  status: string
  amount_cents: number
  created_at: string
  shipping_method?: string | null
  shipping_json?: {
    name?: string
    city?: string
    state?: string
    zip?: string
  } | null
}

export default function Pedidos() {
  const { session } = useSupabaseAuth()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        if (!session?.user?.id) return
        const data = await getUserOrders(session.user.id)
        setOrders(data as Order[])
      } catch (e) {
        showToast('Não foi possível carregar pedidos', 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [session?.user?.id])

  return (
    <div className="section">
      <h1 className="text-3xl font-bold mb-2">Meus Pedidos</h1>
      <p className="text-gray-600 mb-6">Acompanhe seus pedidos e detalhes.</p>

      {loading ? (
        <div className="text-gray-500">Carregando...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-6 shadow">Nenhum pedido encontrado.</div>
      ) : (
        <div className="bg-white rounded-xl p-2 shadow divide-y">
          {orders.map(o => (
            <div key={o.id} className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 p-4">
              <div>
                <div className="font-semibold">Pedido #{o.id.slice(0, 8)}</div>
                <div className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {o.shipping_method ? `Envio: ${o.shipping_method === 'dhl' ? 'DHL Express' : 'Fedex Standard'}` : 'Envio não informado'}
                  {o.shipping_json?.city && (
                    <span className="block">Entrega para {o.shipping_json.city}{o.shipping_json.state ? `, ${o.shipping_json.state}` : ''}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm ${o.status==='paid'?'bg-green-100 text-green-700':o.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                <span className="font-medium">{formatCurrency((o.amount_cents || 0)/100)}</span>
                <Link to={`/pedidos/${o.id}`} className="px-3 py-2 rounded-lg bg-pink-600 text-white hover:bg-pink-700">Ver detalhes</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}