import { Route, Routes } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { Layout } from './shared/Layout'
const Home = lazy(()=>import('./pages/Home'))
const Produtos = lazy(()=>import('./pages/Produtos'))
const ProdutoDetalhe = lazy(()=>import('./pages/ProdutoDetalhe'))
const Carrinho = lazy(()=>import('./pages/Carrinho'))
const Conta = lazy(()=>import('./pages/Conta'))
const Admin = lazy(()=>import('./pages/Admin'))
import { ProtectedRoute } from './shared/ProtectedRoute'
const CheckoutPage = lazy(()=>import('./pages/Checkout'))
const Sucesso = lazy(()=>import('./pages/Sucesso'))
const Falha = lazy(()=>import('./pages/Falha'))
const Pedidos = lazy(()=>import('./pages/Pedidos'))
const PedidoDetalhe = lazy(()=>import('./pages/PedidoDetalhe'))

export const AppRoutes = () => (
  <Suspense fallback={<div className="section">Carregando...</div>}>
    <Routes>
      <Route element={<Layout />}> 
        <Route path="/" element={<Home />} />
        <Route path="/produtos" element={<Produtos />} />
        <Route path="/produto/:id" element={<ProdutoDetalhe />} />
        <Route path="/carrinho" element={<Carrinho />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/sucesso" element={<Sucesso />} />
        <Route path="/falha" element={<Falha />} />
        <Route path="/conta" element={<Conta />} />
        <Route path="/pedidos" element={<Pedidos />} />
        <Route path="/pedidos/:id" element={<PedidoDetalhe />} />
        <Route path="/admin" element={
          <ProtectedRoute roles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  </Suspense>
)