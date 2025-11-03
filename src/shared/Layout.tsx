import { Outlet, Link, useLocation } from 'react-router-dom'
import { Navbar } from '../ui/Navbar'
import { motion } from 'framer-motion'
import { ToastProvider } from '../state/ToastContext'

export const Layout = () => {
  const location = useLocation()
  return (
    <ToastProvider>
      <div>
        <Navbar />
        <motion.main className="container" key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
          <Outlet />
        </motion.main>
        <footer className="mt-20 bg-amber-100/60">
        <div className="container py-10 grid gap-6 md:grid-cols-3">
          <div>
            <h3 className="font-semibold">Leia Sabores</h3>
            <p className="text-sm mt-2">Bolos artísticos, doces finos e tudo para sua festa.</p>
          </div>
          <div>
            <h3 className="font-semibold">Links</h3>
            <ul className="mt-2 text-sm space-y-1">
              <li><Link to="/produtos">Produtos</Link></li>
              <li><Link to="/carrinho">Carrinho</Link></li>
              <li><Link to="/conta">Minha conta</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold">Newsletter</h3>
            <p className="text-sm mt-2">Receba inspiração doce diretamente no seu e-mail.</p>
            <form className="mt-3 flex gap-2">
              <input className="flex-1 rounded-md border p-2" placeholder="Seu e-mail" />
              <button className="rounded-md bg-brand-600 px-4 py-2 text-white">Assinar</button>
            </form>
          </div>
        </div>
        </footer>
      </div>
    </ToastProvider>
  )
}