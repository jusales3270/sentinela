import { useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import { Radar, Crosshair, ShieldCheck } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { gsap, useGSAP, ScrollTrigger } from '../../lib/gsap'

interface AgentDef {
  key: string
  index: string
  name: string
  role: string
  color: string
  icon: LucideIcon
  description: string
  bullets: string[]
}

const agents: AgentDef[] = [
  {
    key: 'recon',
    index: '01',
    name: 'Recon',
    role: 'Reconhecimento',
    color: '#00f0ff',
    icon: Radar,
    description:
      'Mapeia a superfície de ataque: subdomínios, portas, endpoints e tecnologias expostas.',
    bullets: ['DNS e enumeração de subdomínios', 'Fingerprint de stack e versões', 'Descoberta de endpoints e parâmetros'],
  },
  {
    key: 'exploit',
    index: '02',
    name: 'Exploit',
    role: 'Exploração',
    color: '#ffb800',
    icon: Crosshair,
    description:
      'Executa exploits reais em ambiente controlado — sem os falsos positivos de scanners tradicionais.',
    bullets: ['Injeção SQL, XSS, SSRF e IDOR', 'Bypass de autenticação e JWT', 'Falhas de lógica de negócio'],
  },
  {
    key: 'validate',
    index: '03',
    name: 'Validate',
    role: 'Validação',
    color: '#00ff88',
    icon: ShieldCheck,
    description:
      'Confirma cada falha, calcula o CVSS e anexa evidências auditáveis ao relatório.',
    bullets: ['Prova de conceito reproduzível', 'Cálculo de score CVSS 3.1', 'Evidências e passos de correção'],
  },
]

export default function AgentsSection() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduceMotion = useReducedMotion()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      // Desktop: pin the section and cross-fade the three agent panels.
      mm.add('(min-width: 1024px) and (prefers-reduced-motion: no-preference)', () => {
        const panels = gsap.utils.toArray<HTMLElement>('[data-agent-panel]')
        const rails = gsap.utils.toArray<HTMLElement>('[data-agent-rail]')
        gsap.set(panels, { autoAlpha: 0, y: 40 })
        gsap.set(panels[0], { autoAlpha: 1, y: 0 })

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top top',
            end: '+=260%',
            scrub: 1,
            pin: '[data-agent-pin]',
            anticipatePin: 1,
          },
        })

        panels.forEach((panel, i) => {
          if (i === 0) return
          tl.to(panels[i - 1], { autoAlpha: 0, y: -40, duration: 0.4 }, `+=0.6`)
          tl.to(panel, { autoAlpha: 1, y: 0, duration: 0.4 }, '<')
        })

        // progress rail highlight
        ScrollTrigger.create({
          trigger: rootRef.current,
          start: 'top top',
          end: '+=260%',
          scrub: true,
          onUpdate: (self) => {
            const active = Math.min(agents.length - 1, Math.floor(self.progress * agents.length))
            rails.forEach((rail, i) => {
              gsap.to(rail, { opacity: i === active ? 1 : 0.25, duration: 0.2 })
            })
          },
        })
      })

      // Mobile / reduced motion: simple stacked reveals.
      mm.add('(max-width: 1023px)', () => {
        const cards = gsap.utils.toArray<HTMLElement>('[data-agent-card]')
        cards.forEach((card) => {
          gsap.from(card, {
            opacity: 0,
            y: 40,
            duration: 0.6,
            scrollTrigger: { trigger: card, start: 'top 85%' },
          })
        })
      })

      return () => mm.revert()
    },
    { scope: rootRef },
  )

  return (
    <section id="agentes" ref={rootRef} className="relative bg-bg-primary">
      {/* Desktop pinned experience (skipped under reduced motion — panels are stacked) */}
      <div data-agent-pin className={`${reduceMotion ? 'hidden' : 'hidden lg:flex'} min-h-[100dvh] items-center`}>
        <div className="max-w-[1180px] mx-auto w-full px-8 grid grid-cols-[0.9fr_1.1fr] gap-16 items-center">
          {/* left: intro + rail */}
          <div>
            <div className="inline-flex items-center gap-2">
              <span className="h-px w-6 bg-gradient-brand" />
              <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-cyan">
                Os agentes
              </p>
            </div>
            <h2
              className="font-space font-semibold text-white mt-4"
              style={{ fontSize: 'clamp(2rem,3vw,2.8rem)', letterSpacing: '-0.02em', lineHeight: 1.1 }}
            >
              Um esquadrão de IA no seu lado do firewall.
            </h2>
            <p className="mt-4 text-text-secondary max-w-[420px]" style={{ lineHeight: 1.65 }}>
              Três agentes especializados trabalham em sequência — cada um com uma missão
              distinta no ciclo de teste de intrusão.
            </p>

            <div className="mt-10 space-y-4">
              {agents.map((a) => (
                <div key={a.key} data-agent-rail className="flex items-center gap-4" style={{ opacity: 0.25 }}>
                  <span className="font-mono text-sm w-6" style={{ color: a.color }}>
                    {a.index}
                  </span>
                  <span
                    className="h-9 w-9 rounded-lg flex items-center justify-center"
                    style={{ background: `${a.color}1a`, border: `1px solid ${a.color}40` }}
                  >
                    <a.icon size={17} style={{ color: a.color }} />
                  </span>
                  <div>
                    <p className="font-space font-semibold text-white leading-tight">{a.name}</p>
                    <p className="text-xs text-text-muted">{a.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* right: stacked panels */}
          <div className="relative h-[420px]">
            {agents.map((a) => (
              <div
                key={a.key}
                data-agent-panel
                className="absolute inset-0 rounded-3xl border border-white/[0.08] p-10 flex flex-col justify-center"
                style={{
                  background: `radial-gradient(120% 100% at 100% 0%, ${a.color}12 0%, transparent 55%), #12121a`,
                }}
              >
                <span
                  className="h-16 w-16 rounded-2xl flex items-center justify-center mb-6"
                  style={{ background: `${a.color}18`, border: `1px solid ${a.color}44` }}
                >
                  <a.icon size={30} style={{ color: a.color }} />
                </span>
                <h3 className="font-space text-3xl font-semibold text-white">{a.name}</h3>
                <p className="mt-3 text-text-secondary text-lg" style={{ lineHeight: 1.6 }}>
                  {a.description}
                </p>
                <ul className="mt-6 space-y-2.5">
                  {a.bullets.map((b) => (
                    <li key={b} className="flex items-center gap-3 text-sm text-text-secondary">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color }} />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stacked version — mobile always, plus desktop under reduced motion */}
      <div className={`${reduceMotion ? 'block' : 'lg:hidden'} max-w-[820px] mx-auto px-4 sm:px-6 py-20`}>
        <div className="inline-flex items-center gap-2">
          <span className="h-px w-6 bg-gradient-brand" />
          <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-cyan">Os agentes</p>
        </div>
        <h2 className="font-space text-3xl font-semibold text-white mt-4" style={{ letterSpacing: '-0.02em' }}>
          Um esquadrão de IA no seu lado do firewall.
        </h2>
        <div className="mt-10 space-y-5">
          {agents.map((a) => (
            <div
              key={a.key}
              data-agent-card
              className="rounded-2xl border border-white/[0.08] p-6"
              style={{ background: `radial-gradient(120% 100% at 100% 0%, ${a.color}12 0%, transparent 55%), #12121a` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="h-11 w-11 rounded-xl flex items-center justify-center"
                  style={{ background: `${a.color}18`, border: `1px solid ${a.color}44` }}
                >
                  <a.icon size={20} style={{ color: a.color }} />
                </span>
                <div>
                  <h3 className="font-space text-xl font-semibold text-white leading-tight">{a.name}</h3>
                  <p className="text-xs text-text-muted">{a.role}</p>
                </div>
              </div>
              <p className="mt-4 text-text-secondary" style={{ lineHeight: 1.6 }}>
                {a.description}
              </p>
              <ul className="mt-4 space-y-2">
                {a.bullets.map((b) => (
                  <li key={b} className="flex items-center gap-3 text-sm text-text-secondary">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ background: a.color }} />
                    {b}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
