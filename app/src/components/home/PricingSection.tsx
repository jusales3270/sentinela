import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { Link } from 'react-router-dom'
import SectionHeading from './shared/SectionHeading'
import SpotlightCard from './shared/SpotlightCard'
import MagneticButton from './shared/MagneticButton'

interface Plan {
  name: string
  featured: boolean
  price: string
  period: string
  description: string
  badge?: string
  features: string[]
  cta: string
  ctaStyle: 'primary' | 'secondary' | 'ghost'
  link: string
}

const plans: Plan[] = [
  {
    name: 'Iniciante',
    featured: false,
    price: 'R$ 0',
    period: '/mês',
    description: 'Para desenvolvedores individuais e pequenos projetos.',
    features: [
      '3 escaneamentos por mês',
      'Relatório básico em PDF',
      'Verificação de domínio',
      'Termo de autorização digital',
      'Suporte por email',
    ],
    cta: 'Começar grátis',
    ctaStyle: 'ghost',
    link: '/verify-domain',
  },
  {
    name: 'Profissional',
    featured: true,
    price: 'R$ 497',
    period: '/mês',
    description: 'Para empresas que precisam de testes regulares de segurança.',
    badge: 'MAIS POPULAR',
    features: [
      'Escaneamentos ilimitados',
      'Relatório completo (PDF + JSON)',
      'Validação real de exploits',
      'Relatório de conformidade (OWASP/LGPD)',
      'Score de risco detalhado',
      'Suporte prioritário',
    ],
    cta: 'Assinar Profissional',
    ctaStyle: 'primary',
    link: '/dashboard',
  },
  {
    name: 'Empresarial',
    featured: false,
    price: 'Personalizado',
    period: '',
    description: 'Para grandes organizações com necessidades específicas.',
    features: [
      'Tudo do Profissional',
      'API completa para integração',
      'Múltiplos usuários e equipes',
      'Relatórios white-label',
      'SLA garantido',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com vendas',
    ctaStyle: 'secondary',
    link: '/dashboard',
  },
]

const easeOut = [0, 0, 0.2, 1] as [number, number, number, number]

const cardVariants = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <>
      {plan.badge && (
        <span
          className="inline-block px-3 py-1 rounded-full text-xs font-medium tracking-wide mb-4"
          style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}
        >
          {plan.badge}
        </span>
      )}
      <h3 className="font-space text-xl font-semibold text-white">{plan.name}</h3>
      <div className="flex items-baseline gap-1 mt-3">
        <span
          className={`font-space text-3xl font-semibold ${plan.featured ? 'text-gradient-brand' : 'text-white'}`}
        >
          {plan.price}
        </span>
        {plan.period && <span className="text-base text-text-muted">{plan.period}</span>}
      </div>
      <p className="mt-2 text-sm text-text-secondary">{plan.description}</p>
      <div className="my-5 h-px bg-white/[0.06]" />
      <ul className="space-y-3">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-start gap-3">
            <Check size={16} className="text-accent-green shrink-0 mt-0.5" />
            <span className="text-sm text-text-secondary">{feature}</span>
          </li>
        ))}
      </ul>
      <div className="mt-7">
        {plan.ctaStyle === 'primary' ? (
          <MagneticButton to={plan.link} variant="primary" className="w-full">
            {plan.cta}
          </MagneticButton>
        ) : (
          <Link
            to={plan.link}
            className={`block w-full text-center py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
              plan.ctaStyle === 'secondary'
                ? 'border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan/10'
                : 'border border-white/10 text-text-secondary hover:bg-white/[0.05]'
            }`}
          >
            {plan.cta}
          </Link>
        )}
      </div>
    </>
  )
}

export default function PricingSection() {
  return (
    <section id="precos" className="relative py-24 bg-bg-primary">
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Preços"
          title="Escolha o plano ideal para"
          gradient="a sua operação de segurança"
          subtitle="Comece grátis e evolua conforme a necessidade. Todos os planos incluem verificação de domínio e assinatura eletrônica."
        />

        <motion.div
          className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }}
        >
          {plans.map((plan) =>
            plan.featured ? (
              <motion.div key={plan.name} variants={cardVariants} className="lg:-mt-3">
                <SpotlightCard
                  className="p-6"
                  style={{
                    borderTop: '2px solid rgba(0,240,255,0.5)',
                    backgroundImage:
                      'radial-gradient(ellipse at top, rgba(0,240,255,0.08) 0%, transparent 60%)',
                  }}
                >
                  <PlanCard plan={plan} />
                </SpotlightCard>
              </motion.div>
            ) : (
              <motion.div
                key={plan.name}
                variants={cardVariants}
                whileHover={{ y: -4 }}
                className="rounded-2xl border border-white/[0.07] bg-bg-secondary/70 p-6"
              >
                <PlanCard plan={plan} />
              </motion.div>
            ),
          )}
        </motion.div>
      </div>
    </section>
  )
}
