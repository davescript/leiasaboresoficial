import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../state/useAuth'
import { getOrderDetails, getUserOrders, formatCurrency } from '../lib/api'

export default function Sucesso() {
  const [searchParams] = useSearchParams()
  const { session } = useAuth()
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any | null>(null)
  const [paymentDetails, setPaymentDetails] = useState<{ payment_intent?: string; redirect_status?: string }>({})

  useEffect(() => {
    const payment_intent = searchParams.get('payment_intent') || undefined
    const redirect_status = searchParams.get('redirect_status') || undefined
    const order_id = searchParams.get('order_id') || undefined
    setPaymentDetails({ payment_intent, redirect_status })

    const load = async () => {
      try {
        if (order_id) {
          const o = await getOrderDetails(order_id)
          setOrder(o)
        } else if (session?.user?.id) {
          const orders = await getUserOrders()
          const latestPaid = (orders || []).find((o: any) => o.status === 'paid') || (orders || [])[0] || null
          setOrder(latestPaid)
        }
      } catch (e) {
        // ignore; we still show success shell
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchParams, session?.user?.id])

  return (
  <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Pedido confirmado!</h1>
          <p className="text-gray-600 text-center">Obrigado pela compra. Enviamos um e-mail com os detalhes.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Resumo</h3>
            <div className="text-sm text-gray-700 space-y-2">
              <div className="flex justify-between"><span>Número do pedido</span><span className="font-mono">{order?.id?.slice(0,8) || '—'}</span></div>
              <div className="flex justify-between"><span>Data</span><span>{order?.created_at ? new Date(order.created_at).toLocaleString() : '—'}</span></div>
              <div className="flex justify-between"><span>Total</span><span className="font-semibold">{formatCurrency((order?.amount_cents ?? 0)/100)}</span></div>
              {paymentDetails.payment_intent && (
                <div className="flex justify-between"><span>Pagamento</span><span className="font-mono text-xs">{paymentDetails.payment_intent}</span></div>
              )}
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Entrega</h3>
            {order?.shipping_json ? (
              <div className="text-sm text-gray-700 space-y-1">
                <div>{order.shipping_method || 'Entrega padrão'}</div>
                <div>{order.shipping_json?.name}</div>
                <div>{order.shipping_json?.street}, {order.shipping_json?.number}</div>
                <div>{order.shipping_json?.neighborhood}</div>
                <div>{order.shipping_json?.city} - {order.shipping_json?.state}, {order.shipping_json?.zip}</div>
                <div className="text-gray-500">{order.shipping_json?.email}</div>
                <div className="text-gray-500">{order.shipping_json?.phone}</div>
              </div>
            ) : (
              <p className="text-sm text-gray-600">Endereço confirmado durante o checkout.</p>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <Link to="/pedidos" className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold text-center hover:bg-pink-700 transition-colors">Ver meus pedidos</Link>
          <Link to="/produtos" className="w-full bg-gray-100 text-gray-700 py-3 px-6 rounded-lg font-semibold text-center hover:bg-gray-200 transition-colors">Continuar comprando</Link>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">Precisa de ajuda? Fale com nosso suporte.</p>
        </div>
      </div>
    </div>
  )
}
