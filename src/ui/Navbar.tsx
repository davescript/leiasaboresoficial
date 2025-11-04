import { Link, NavLink } from 'react-router-dom'
import { ShoppingCart, UserRound, Menu, X, Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
// Supabase removed; navbar state derives from cart
import { useCart } from '../hooks/useCart'
import { MiniCart } from '../components/MiniCart'

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { items, itemCount } = useCart()
  const [isMiniCartOpen, setIsMiniCartOpen] = useState(false)
  const session = null as any
  const userProfile = null as any

  // Item count is derived from useCart and updates reactively

  // Auto-open MiniCart when product is added
  useEffect(() => {
    const handler = () => setIsMiniCartOpen(true)
    window.addEventListener('cart:added', handler as EventListener)
    return () => window.removeEventListener('cart:added', handler as EventListener)
  }, [])

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)
  const closeMenu = () => setIsMenuOpen(false)

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-pink-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="flex-shrink-0"
          >
            <Link 
              to="/" 
              className="flex items-center gap-3 group"
              onClick={closeMenu}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <span className="text-white font-bold text-lg">L</span>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent">
                  Leia Sabores
                </h1>
                <p className="text-xs text-gray-500 -mt-1">Bolos & Festas</p>
              </div>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <NavLink 
              to="/" 
              className={({isActive}) => 
                `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`
              }
            >
              {({isActive}) => (
                <>
                  Início
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full"
                      initial={false}
                    />
                  )}
                </>
              )}
            </NavLink>
            
            <NavLink 
              to="/produtos" 
              className={({isActive}) => 
                `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`
              }
            >
              {({isActive}) => (
                <>
                  Produtos
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full"
                      initial={false}
                    />
                  )}
                </>
              )}
            </NavLink>

            <NavLink 
              to="/conta" 
              className={({isActive}) => 
                `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                  isActive 
                    ? 'text-pink-600' 
                    : 'text-gray-700 hover:text-pink-600'
                }`
              }
            >
              {({isActive}) => (
                <>
                  {session ? 'Minha Conta' : 'Entrar'}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full"
                      initial={false}
                    />
                  )}
                </>
              )}
            </NavLink>

            {userProfile?.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({isActive}) => 
                  `relative px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'text-pink-600' 
                      : 'text-gray-700 hover:text-pink-600'
                  }`
                }
              >
                {({isActive}) => (
                  <>
                    Admin
                    {isActive && (
                      <motion.div
                        layoutId="navbar-indicator"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-pink-600 rounded-full"
                        initial={false}
                      />
                    )}
                  </>
                )}
              </NavLink>
            )}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Wishlist Button (Future feature) */}
            <button 
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 transition-colors duration-200 group"
              title="Lista de Desejos"
            >
              <Heart className="w-5 h-5 text-gray-600 group-hover:text-pink-600 transition-colors duration-200" />
            </button>

            {/* Cart Button with MiniCart */}
            <div className="relative">
              <button
                className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 transition-colors duration-200 group"
                title="Carrinho de Compras"
                onClick={() => setIsMiniCartOpen((prev) => !prev)}
              >
                <ShoppingCart className="w-5 h-5 text-gray-600 group-hover:text-pink-600 transition-colors duration-200" />
                {itemCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-pink-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
                  >
                    {itemCount > 99 ? '99+' : itemCount}
                  </motion.span>
                )}
              </button>
            </div>

            {/* User Account Button */}
            <Link 
              to="/conta" 
              className="hidden sm:flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 transition-colors duration-200 group"
              title={session ? 'Minha Conta' : 'Fazer Login'}
              onClick={closeMenu}
            >
              <UserRound className="w-5 h-5 text-gray-600 group-hover:text-pink-600 transition-colors duration-200" />
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-pink-50 transition-colors duration-200"
              aria-label="Menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-gray-600" />
              ) : (
                <Menu className="w-5 h-5 text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t border-pink-100 shadow-lg"
          >
            <div className="px-4 py-6 space-y-4">
              <NavLink 
                to="/" 
                onClick={closeMenu}
                className={({isActive}) => 
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-pink-50 text-pink-600 border border-pink-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                🏠 Início
              </NavLink>
              
              <NavLink 
                to="/produtos" 
                onClick={closeMenu}
                className={({isActive}) => 
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-pink-50 text-pink-600 border border-pink-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                🍰 Produtos
              </NavLink>

              <NavLink 
                to="/carrinho" 
                onClick={closeMenu}
                className={({isActive}) => 
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-pink-50 text-pink-600 border border-pink-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <div className="flex items-center justify-between">
                  <span>🛒 Carrinho</span>
                  {itemCount > 0 && (
                    <span className="bg-pink-600 text-white text-xs font-bold rounded-full px-2 py-1">
                      {itemCount}
                    </span>
                  )}
                </div>
              </NavLink>

              <NavLink 
                to="/conta" 
                onClick={closeMenu}
                className={({isActive}) => 
                  `block px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                    isActive 
                      ? 'bg-pink-50 text-pink-600 border border-pink-200' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                👤 {session ? 'Minha Conta' : 'Entrar'}
              </NavLink>

              {userProfile?.role === 'admin' && (
                <NavLink 
                  to="/admin" 
                  onClick={closeMenu}
                  className={({isActive}) => 
                    `block px-4 py-3 rounded-xl text-base font-medium transition-colors duration-200 ${
                      isActive 
                        ? 'bg-pink-50 text-pink-600 border border-pink-200' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`
                  }
                >
                  ⚙️ Admin
                </NavLink>
              )}

              {session && (
                <div className="pt-4 border-t border-gray-200">
                  <div className="px-4 py-2 text-sm text-gray-500">
                    Logado como: {session?.user?.email}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MiniCart */}
      <MiniCart 
        isOpen={isMiniCartOpen} 
        onClose={() => setIsMiniCartOpen(false)} 
      />
    </header>
  )
}