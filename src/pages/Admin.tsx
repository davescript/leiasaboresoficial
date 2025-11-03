import { useEffect, useState } from 'react'
import { DataTable, Column } from '../components/ui/DataTable'
// Supabase removed

type Product = { id: string; name: string; price_cents: number; stock: number; category?: string }
type Order = { id: string; amount_cents: number; status: string; created_at: string }

export default function Admin() {
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [statusFilter, setStatusFilter] = useState<'all'|'pending'|'paid'|'failed'>('all')

  useEffect(() => { fetch('/api/products').then(r=>r.json()).then(setProducts) }, [])
  useEffect(() => {
    fetch('/api/orders?all=1').then(r=>r.json()).then((data)=> setOrders(data || [])).catch(()=> setOrders([]))
  }, [])

  const productCols: Column<Product>[] = [
    { header: 'Nome', accessor: (r)=> r.name },
    { header: 'Categoria', accessor: (r)=> r.category || '—' },
    { header: 'Preço', accessor: (r)=> `R$ ${(r.price_cents/100).toFixed(2)}` },
    { header: 'Estoque', accessor: (r)=> r.stock, render: (r)=> (
      <div className="flex items-center gap-2">
        <input type="number" defaultValue={r.stock} className="w-24 px-2 py-1 border rounded" onBlur={async (e)=>{
          const val = parseInt(e.currentTarget.value||'0',10)
          await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, stock: val }) })
        }} />
        <button className="px-2 py-1 rounded bg-pink-600 text-white" onClick={async ()=>{
          const valEl = (document.activeElement as HTMLInputElement)
          const val = valEl && valEl.value ? parseInt(valEl.value,10) : r.stock
          await fetch('/api/products', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: r.id, stock: val }) })
        }}>Salvar</button>
      </div>
    ) },
  ]

  const filteredOrders = statusFilter==='all' ? orders : orders.filter(o=>o.status===statusFilter)

  return (
    <div className="section space-y-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">Admin • Produtos</h1>
        <div className="bg-white rounded-xl shadow p-4">
          <DataTable rows={products} columns={productCols} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Pedidos</h2>
          <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value as any)} className="px-3 py-2 border rounded">
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="paid">Pagos</option>
            <option value="failed">Falhos</option>
          </select>
        </div>
        <div className="bg-white rounded-xl shadow divide-y">
          {filteredOrders.map(o=> (
            <div key={o.id} className="flex items-center justify-between p-3">
              <div>
                <div className="font-medium">#{o.id.slice(0,8)}</div>
                <div className="text-sm text-gray-500">{new Date(o.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm ${o.status==='paid'?'bg-green-100 text-green-700':o.status==='pending'?'bg-yellow-100 text-yellow-700':'bg-gray-100 text-gray-700'}`}>{o.status}</span>
                <span>R$ {(o.amount_cents/100).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}