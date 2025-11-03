import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useToast } from '../state/ToastContext'
import { OptimizedImage } from '../components/OptimizedImage'
import { useCart } from '../hooks/useCart'

interface ProductDetail {
  id: string
  name: string
  description: string
  price_cents: number
  image_url: string
  images?: string[]
  category?: string
  stock?: number
}

export default function ProdutoDetalhe() {
  const { id } = useParams()
  const { showToast } = useToast()
  const { addToCart } = useCart()
  const [product, setProduct] = useState<ProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`/api/products/${id}`)
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Falha ao carregar produto')
        setProduct(json as ProductDetail)
      } catch (e: any) {
        setError(String(e?.message || 'Erro inesperado'))
        showToast('Não foi possível carregar o produto.', 'error')
      } finally { setLoading(false) }
    }
    run()
  }, [id])

  if (loading) {
    return (
      <div className="section max-w-6xl mx-auto px-4">
        <div className="animate-pulse grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-200 h-96 rounded-2xl" />
          <div className="space-y-4">
            <div className="bg-gray-200 h-8 w-2/3 rounded" />
            <div className="bg-gray-100 h-24 rounded" />
            <div className="bg-gray-200 h-10 w-48 rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="section max-w-6xl mx-auto px-4">
        <h1 className="text-2xl font-semibold">Produto</h1>
        <p className="text-sm text-red-600 mt-2">{error || 'Produto não encontrado.'}</p>
      </div>
    )
  }

  const price = (product.price_cents || 0) / 100
  const images = (product.images && product.images.length > 0)
    ? product.images
    : [product.image_url]

  return (
    <div className="section max-w-6xl mx-auto px-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <div className="overflow-hidden rounded-2xl bg-white shadow">
            <OptimizedImage
              src={images[selectedIndex]}
              alt={product.name}
              className="w-full h-96 object-cover"
              width={800}
              height={384}
              sizes="(max-width:768px) 100vw, 50vw"
            />
          </div>
          {images.length > 1 && (
            <div className="mt-4 grid grid-cols-5 gap-2">
              {images.slice(0,5).map((img, i) => (
                <button key={i} onClick={()=>setSelectedIndex(i)} className={`rounded overflow-hidden border ${selectedIndex===i?'border-pink-600':'border-gray-200'}`}>
                  <img src={img} alt={`${product.name} ${i+1}`} className="w-full h-20 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-gray-600 mb-4">{product.description}</p>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl font-semibold text-pink-600">R$ {price.toFixed(2)}</span>
            {product.stock !== undefined && (
              <span className={`text-sm ${product.stock>0?'text-green-600':'text-red-600'}`}>{product.stock>0?'Em estoque':'Esgotado'}</span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={async ()=>{
                try { await addToCart(product.id, 1); showToast('Produto adicionado ao carrinho', 'success') }
                catch { showToast('Falha ao adicionar ao carrinho', 'error') }
              }}
              disabled={product.stock===0}
              className={`px-5 py-3 rounded-xl font-semibold ${product.stock===0?'bg-gray-300 text-gray-500':'bg-pink-600 text-white hover:bg-pink-700'}`}
            >
              Adicionar ao carrinho
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}