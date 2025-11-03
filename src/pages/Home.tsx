import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Cake, PartyPopper, Gift } from 'lucide-react'

export default function Home() {
  return (
    <div className="section space-y-14">
      {/* Hero com overlay e CTA */}
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/60 via-amber-100 to-white" />
        <div className="relative grid md:grid-cols-2 gap-10 items-center px-6 py-10 md:p-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Celebre com Sabor e Estilo</h1>
            <p className="mt-3 text-zinc-700 max-w-lg">Bolos artísticos, doces finos e kits completos para festas infantis e casamentos. Personalizamos cada detalhe para o seu grande momento.</p>
            <div className="mt-6 flex gap-3">
              <Button asChild variant="primary"><Link to="/produtos">Ver produtos</Link></Button>
              <Button asChild variant="secondary"><Link to="#destaques">Solicitar orçamento</Link></Button>
            </div>
          </div>
          <Card className="p-0">
            <div className="aspect-video rounded-xl bg-amber-100 grid place-items-center">
              <span className="text-amber-700">Imagem hero — bolos & decoração</span>
            </div>
          </Card>
        </div>
      </motion.section>

      {/* Vantagens */}
      <section className="grid md:grid-cols-3 gap-6" id="destaques">
        {[
          { icon: Cake, title: 'Bolos Personalizados', text: 'Modelos exclusivos para casamentos e festas infantis.' },
          { icon: PartyPopper, title: 'Kits para Festa', text: 'Doces, toppers e decoração seguindo o seu tema.' },
          { icon: Gift, title: 'Entrega e Montagem', text: 'Opção de entrega com montagem no local do evento.' }
        ].map(({ icon: Icon, title, text }, i) => (
          <motion.div key={title} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
            <Card className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-amber-100 p-2 text-brand-700"><Icon className="w-6 h-6" /></div>
                <h3 className="font-medium">{title}</h3>
              </div>
              <p className="text-sm text-zinc-600 mt-2">{text}</p>
            </Card>
          </motion.div>
        ))}
      </section>

      {/* Galeria de destaques */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Coleções em destaque</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
          {[
            { t: 'Bolos de Casamento', d: 'Elegância para o seu grande dia.' },
            { t: 'Festa Infantil', d: 'Temas lúdicos e coloridos.' },
            { t: 'Doces Finos', d: 'Seleção gourmet para encantar.' }
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <Card className="overflow-hidden">
                <div className="aspect-[4/3] bg-amber-100" />
                <div className="p-4">
                  <h3 className="font-medium">{item.t}</h3>
                  <p className="text-sm text-zinc-600">{item.d}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}