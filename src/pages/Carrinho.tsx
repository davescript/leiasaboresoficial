import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../state/ToastContext';
import { OptimizedImage } from '../components/OptimizedImage';

  interface Item {
    id: string;
    product_id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      description: string;
      price: number;
      image_url: string;
      images?: string[];
      category: string;
      stock: number;
    };
  }

export default function Carrinho() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const session = null as any;
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState('');
  const [discountCents, setDiscountCents] = useState(0);
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  useEffect(() => {
    if (session) {
      refresh();
    } else {
      setLoading(false);
    }
  }, [session]);

  const refresh = async () => {
    if (!session) return;
    
    try {
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (response.ok) {
        const data: unknown = await response.json();
        if (Array.isArray(data)) {
          setItems(data);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar carrinho:', error);
      showToast('Erro ao carregar carrinho', 'error');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (!session || newQuantity < 1) return;

    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ item_id: itemId, quantity: newQuantity }),
      });

      if (response.ok) {
        refresh();
      }
    } catch (error) {
      console.error('Erro ao atualizar quantidade:', error);
      showToast('Erro ao atualizar quantidade', 'error');
    }
  };

  const removeItem = async (itemId: string) => {
    if (!session) return;

    try {
      const response = await fetch(`/api/cart/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        refresh();
      }
    } catch (error) {
      console.error('Erro ao remover item:', error);
      showToast('Erro ao remover item', 'error');
    }
  };

  const checkout = async () => {
    if (!session) {
      showToast('Faça login para finalizar a compra', 'info');
      return;
    }

    setCheckoutLoading(true);
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ coupon_code: couponCode || null })
      });

      if (response.ok) {
        // A página de Checkout busca/gera o client_secret; navegamos sempre.
        navigate('/checkout');
        return;
      } else {
        const errorData: unknown = await response.json();
        if (errorData && typeof errorData === 'object' && 'error' in errorData) {
          showToast((errorData as { error: string }).error, 'error');
        } else {
          showToast('Erro ao iniciar pagamento', 'error');
        }
      }
    } catch (error) {
      console.error('Erro no checkout:', error);
      showToast('Erro ao processar pagamento', 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const grandTotal = Math.max(0, total - discountCents/100);

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Faça Login</h2>
          <p className="text-gray-600 mb-6">
            Você precisa estar logado para ver seu carrinho de compras.
          </p>
          <button
            onClick={() => navigate('/conta')}
            className="w-full bg-pink-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-pink-700 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Carregando seu carrinho...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Meu Carrinho</h1>
              <p className="text-lg text-gray-600 mt-2">
                {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'itens'} no seu carrinho` : 'Seu carrinho está vazio'}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Total</div>
              <div className="text-3xl font-bold text-pink-600">
                R$ {total.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {items.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              Seu carrinho está vazio
            </h3>
            <p className="text-gray-600 mb-8">
              Que tal adicionar alguns doces deliciosos ao seu carrinho?
            </p>
            <button
              onClick={() => navigate('/produtos')}
              className="bg-pink-600 text-white py-3 px-8 rounded-xl font-semibold hover:bg-pink-700 transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              Continuar Comprando
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Itens */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center gap-6">
                    {/* Imagem do Produto */}
                    <div className="flex-shrink-0">
                      <OptimizedImage
                        src={item.product.image_url}
                        alt={item.product.name}
                        className="w-24 h-24 object-cover rounded-xl"
                        width={96}
                        height={96}
                        sizes="96px"
                      />
                      {item.product.images && item.product.images.length > 1 && (
                        <div className="mt-2 grid grid-cols-4 gap-1 w-24">
                          {item.product.images.slice(0,4).map((img, idx)=> (
                            <img key={idx} src={img} alt={`${item.product.name} ${idx+1}`} className="w-6 h-6 object-cover rounded" />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Informações do Produto */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {item.product.name}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2 line-clamp-2">
                        {item.product.description}
                      </p>
                      <div className="text-lg font-semibold text-pink-600">
                        R$ {item.product.price.toFixed(2)}
                      </div>
                    </div>

                    {/* Controles de Quantidade */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>
                      
                      <span className="w-12 text-center font-semibold text-lg">
                        {item.quantity}
                      </span>
                      
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 flex items-center justify-center transition-colors"
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </button>
                    </div>

                    {/* Subtotal e Remover */}
                    <div className="text-right">
                      <div className="text-xl font-bold text-gray-900 mb-2">
                        R$ {(item.product.price * item.quantity).toFixed(2)}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Remover
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumo do Pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Resumo do Pedido
                </h3>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'itens'})</span>
                    <span>R$ {total.toFixed(2)}</span>
                  </div>
                  {discountCents > 0 && (
                    <div className="flex justify-between text-gray-600">
                      <span>Cupom</span>
                      <span className="text-green-600">− R$ {(discountCents/100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Entrega</span>
                    <span className="text-green-600 font-medium">Grátis</span>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between text-xl font-bold text-gray-900">
                      <span>Total</span>
                      <span className="text-pink-600">R$ {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Campo de Cupom */}
                <div className="mb-6">
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
                        if (!couponCode) { setDiscountCents(0); return }
                        setApplyingCoupon(true)
                        try {
                          const params = new URLSearchParams({ code: couponCode, amount_cents: String(Math.round(total*100)) })
                          const res = await fetch(`/api/coupons?${params.toString()}`, { headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined })
                          const j: any = await res.json()
                          if (j && j.valid) {
                            setDiscountCents(j.discount_cents ?? 0)
                            showToast('Cupom aplicado!', 'success')
                          } else {
                            setDiscountCents(0)
                            showToast('Cupom inválido', 'error')
                          }
                        } catch { showToast('Erro ao validar cupom', 'error') }
                        setApplyingCoupon(false)
                      }}
                      className="px-4 py-3 rounded-xl bg-pink-600 text-white font-semibold hover:bg-pink-700"
                      disabled={applyingCoupon}
                    >
                      {applyingCoupon ? 'Aplicando...' : 'Aplicar'}
                    </button>
                  </div>
                </div>

                <button
                  onClick={checkout}
                  disabled={checkoutLoading || items.length === 0}
                  className="w-full bg-pink-600 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-3"
                >
                  {checkoutLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Processando...
                    </>
                  ) : (
                    <>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                      Finalizar Compra
                    </>
                  )}
                </button>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Pagamento 100% seguro
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Entrega gratuita
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Garantia de qualidade
                  </div>
                </div>

                <button
                  onClick={() => navigate('/produtos')}
                  className="w-full mt-4 bg-gray-100 text-gray-700 py-3 px-6 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                  </svg>
                  Continuar Comprando
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}