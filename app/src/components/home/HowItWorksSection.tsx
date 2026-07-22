import { useRef } from 'react'
import { Link2, ShieldCheck, FileSignature, FileBarChart } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap, useGSAP } from '../../lib/gsap'
import SectionHeading from './shared/SectionHeading'

interface Step {
  number: string
  icon: LucideIcon
  title: string
  description: string
  color: string
}

const steps: Step[] = [
  {
    number: '1',
    icon: Link2,
    title: 'Insira a URL',
    description:
      'Digite o endereço da aplicação web que deseja testar. Aceitamos URLs com ou sem subdomínios.',
    color: '#00f0ff',
  },
  {
    number: '2',
    icon: ShieldCheck,
    title: 'Verifique o domínio',
    description:
      'Prove que o domínio é seu via registro DNS, arquivo HTML ou meta tag. Só escaneamos alvos autorizados.',
    color: '#00f0ff',
  },
  {
    number: '3',
    icon: FileSignature,
    title: 'Autorize o teste',
    description:
      'Assine eletronicamente o Termo de Autorização de Teste de Intrusão (TATI). Ele define o escopo e protege ambas as partes.',
    color: '#00f0ff',
  },
  {
    number: '4',
    icon: FileBarChart,
    title: 'Receba o relatório',
    description:
      'Acompanhe o escaneamento em tempo real e receba um relatório completo com achados, score de risco e passos de correção.',
    color: '#00ff88',
  },
]

export default function HowItWorksSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        // Scrub the central line as the section passes the viewport.
        gsap.fromTo(
          '[data-timeline-line]',
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: '[data-timeline]',
              start: 'top 70%',
              end: 'bottom 70%',
              scrub: 1,
            },
          },
        )

        // Activate each step as the line reaches it.
        gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
          const circle = step.querySelector('[data-step-circle]')
          const content = step.querySelector('[data-step-content]')
          const tl = gsap.timeline({
            scrollTrigger: { trigger: step, start: 'top 68%', toggleActions: 'play none none reverse' },
          })
          tl.from(circle, { scale: 0, duration: 0.5, ease: 'back.out(1.7)' }).from(
            content,
            { opacity: 0, y: 24, duration: 0.5 },
            '-=0.25',
          )
        })
      })

      mm.add('(max-width: 1023px)', () => {
        gsap.utils.toArray<HTMLElement>('[data-step]').forEach((step) => {
          gsap.from(step, {
            opacity: 0,
            y: 30,
            duration: 0.5,
            scrollTrigger: { trigger: step, start: 'top 88%' },
          })
        })
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section
      id="como-funciona"
      ref={rootRef}
      className="relative py-24 bg-bg-primary"
      style={{ backgroundImage: 'radial-gradient(ellipse at center, rgba(0,240,255,0.02) 0%, transparent 70%)' }}
    >
      <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Como funciona"
          title="Quatro passos para descobrir"
          gradient="vulnerabilidades na sua aplicação"
          subtitle="Do cadastro ao relatório — um processo simples, rápido e seguro."
        />

        <div data-timeline className="relative mt-16">
          <div
            data-timeline-line
            className="absolute left-1/2 top-2 bottom-2 w-0.5 -translate-x-1/2 hidden lg:block origin-top bg-gradient-brand opacity-60"
          />

          <div className="space-y-10 lg:space-y-0">
            {steps.map((step, index) => {
              const isLeft = index % 2 === 0
              return (
                <div
                  key={step.number}
                  data-step
                  className={`relative lg:flex lg:items-center ${index > 0 ? 'lg:mt-14' : ''}`}
                >
                  <div
                    data-step-circle
                    className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10 w-14 h-14 rounded-full items-center justify-center"
                    style={{
                      background: `${step.color}1a`,
                      border: `2px solid ${step.color}`,
                      boxShadow: `0 0 24px ${step.color}40`,
                    }}
                  >
                    <span className="font-space text-xl font-semibold" style={{ color: step.color }}>
                      {step.number}
                    </span>
                  </div>

                  <div
                    data-step-content
                    className={`lg:w-5/12 ${isLeft ? 'lg:pr-20 lg:text-right' : 'lg:ml-auto lg:pl-20 lg:text-left'}`}
                  >
                    <div className={`flex items-center gap-3 mb-2 ${isLeft ? 'lg:flex-row-reverse' : ''}`}>
                      <div
                        className="lg:hidden w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${step.color}1a`, border: `2px solid ${step.color}` }}
                      >
                        <span className="font-space font-semibold" style={{ color: step.color }}>
                          {step.number}
                        </span>
                      </div>
                      <step.icon size={20} style={{ color: step.color }} />
                    </div>
                    <h3 className="font-space text-2xl font-semibold text-white" style={{ letterSpacing: '-0.01em' }}>
                      {step.title}
                    </h3>
                    <p className="mt-2 text-text-secondary" style={{ fontSize: '1rem', lineHeight: 1.6 }}>
                      {step.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
