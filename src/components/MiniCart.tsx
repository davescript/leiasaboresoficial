import { Link } from 'react-router-dom'
import { Sheet, SheetContent } from './ui/Sheet'
import { ShoppingCart, Trash2, Plus, Minus } from 'lucide-react'
import { formatCurrency } from '../lib/api'
import { useCart } from '../hooks/useCart'

interface MiniCartProps {
  isOpen: boolean
  onClose: () => void
}

export const MiniCart = ({ isOpen, onClose }: MiniCartProps) => {
  const { items: cartItems, isLoading: loading, updateQuantity, removeFromCart } = useCart()

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.quantity * (item.product?.price ?? 0),
    0
  )

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <Sheet open={isOpen} onOpenChange={(o)=>{ if (!o) onClose() }}>
      <SheetContent side="right" className="z-50 w-96 h-full border-l border-gray-200">
        <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <Plus className="w-5 h-5 rotate-45 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600"></div>
                  </div>
                ) : cartItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                    <ShoppingCart className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium">Carrinho vazio</p>
                    <p className="text-sm">Adicione produtos para começar</p>
                  </div>
                ) : (
                  <div className="p-4 space-y-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        {/* Product Image */}
                        <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                          {item.product?.image_url ? (
                            <img
                              src={item.product.image_url}
                              alt={item.product?.name || 'Produto'}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                              <ShoppingCart className="w-6 h-6" />
                            </div>
                          )}
                        </div>
                        {/* Thumbnails (defensive cast to support optional images array) */}
                        {(() => {
                          const thumbs = Array.isArray((item as any)?.product?.images)
                            ? (((item as any).product.images as string[]) ?? [])
                            : []
                          if (thumbs.length > 1) {
                            return (
                              <div className="ml-2 grid grid-cols-4 gap-1">
                                {thumbs.slice(0,4).map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img}
                                    alt={`${item.product?.name || 'Produto'} ${idx + 1}`}
                                    className="w-7 h-7 rounded object-cover border border-gray-200"
                                  />
                                ))}
                              </div>
                            )
                          }
                          return null
                        })()}

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.product?.name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(item.product?.price ?? 0)}
                          </p>
                          
                          {/* Quantity Controls */}
                          <div className="flex items-center gap-2 mt-2">
                            <button
                              onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                              className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 flex items-center justify-center bg-white border border-gray-300 rounded hover:bg-gray-50"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {cartItems.length > 0 && (
                <div className="border-t border-gray-200 p-4 space-y-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total:</span>
                    <span className="text-pink-600">{formatCurrency(totalAmount)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Link
                      to="/carrinho"
                      onClick={onClose}
                      className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium text-center hover:bg-gray-200 transition-colors"
                    >
                      Ver Carrinho
                    </Link>
                    <Link
                      to="/checkout"
                      onClick={onClose}
                      className="block w-full bg-pink-600 text-white py-3 px-4 rounded-lg font-medium text-center hover:bg-pink-700 transition-colors"
                    >
                      Finalizar Compra
                    </Link>
                  </div>
                </div>
              )}
        </div>
      </SheetContent>
    </Sheet>
  )
}