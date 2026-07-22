import { useRef, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap'
import SectionHeading from './shared/SectionHeading'

interface Line {
  time: string
  agent: 'SYSTEM' | 'RECON' | 'EXPLOIT' | 'VALIDATE'
  text: string
  tone?: 'vuln' | 'success' | 'warn'
}

// Curated slice mirroring the real scan log (src/components/scan/logData.ts), with accents.
const lines: Line[] = [
  { time: '14:32:01', agent: 'SYSTEM', text: 'Iniciando escaneamento: https://exemplo.com' },
  { time: '14:32:02', agent: 'RECON', text: 'Agente de reconhecimento iniciado' },
  { time: '14:32:05', agent: 'RECON', text: 'Portas abertas: 80, 443, 8080' },
  { time: '14:32:12', agent: 'RECON', text: '47 endpoints REST identificados' },
  { time: '14:32:16', agent: 'RECON', text: 'Headers X-Frame-Options e CSP ausentes', tone: 'warn' },
  { time: '14:32:18', agent: 'EXPLOIT', text: 'Agente de exploit iniciado — testando injeção SQL' },
  { time: '14:32:25', agent: 'EXPLOIT', text: 'Vulnerabilidade encontrada: SQL Injection (CVSS 9.8)', tone: 'vuln' },
  { time: '14:32:31', agent: 'EXPLOIT', text: 'Bypass de JWT (alg=none) detectado (CVSS 9.1)', tone: 'vuln' },
  { time: '14:32:38', agent: 'EXPLOIT', text: 'XSS refletido em /search (CVSS 7.5)', tone: 'vuln' },
  { time: '14:32:44', agent: 'VALIDATE', text: 'Agente de validação iniciado' },
  { time: '14:32:51', agent: 'VALIDATE', text: 'PoC SQLi: credenciais de admin extraídas', tone: 'success' },
  { time: '14:32:58', agent: 'VALIDATE', text: '4/4 vulnerabilidades confirmadas exploráveis', tone: 'success' },
  { time: '14:33:04', agent: 'SYSTEM', text: 'Score de risco geral: 8.7/10 · relatório gerado', tone: 'success' },
]

const agentColor: Record<Line['agent'], string> = {
  SYSTEM: '#a0a0b8',
  RECON: '#00f0ff',
  EXPLOIT: '#ffb800',
  VALIDATE: '#00ff88',
}
const toneColor: Record<NonNullable<Line['tone']>, string> = {
  vuln: '#ff4466',
  success: '#00ff88',
  warn: '#ffb800',
}

export default function TerminalSection() {
  const rootRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [replayKey, setReplayKey] = useState(0)

  useGSAP(
    () => {
      const rows = gsap.utils.toArray<HTMLElement>('[data-log-row]')
      if (prefersReducedMotion()) {
        gsap.set(rows, { opacity: 1, y: 0 })
        return
      }
      gsap.set(rows, { opacity: 0, y: 8 })
      gsap.to(rows, {
        opacity: 1,
        y: 0,
        stagger: 0.28,
        ease: 'power1.out',
        duration: 0.25,
        scrollTrigger: { trigger: bodyRef.current, start: 'top 75%', once: replayKey === 0 },
        onUpdate: () => {
          if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
        },
      })
    },
    { scope: rootRef, dependencies: [replayKey] },
  )

  return (
    <section ref={rootRef} className="relative py-24 bg-bg-base">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Transparência total"
          title="Acompanhe cada comando,"
          gradient="em tempo real"
          subtitle="Veja os agentes de IA trabalhando com logs detalhados de cada fase do teste de intrusão."
        />

        <div className="mt-12 rounded-2xl overflow-hidden border border-white/[0.08] bg-bg-terminal shadow-[0_40px_120px_-40px_rgba(0,240,255,0.25)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
            <div className="flex items-center gap-2">
              <span className="flex gap-1.5">
                <span className="w-3 h-3 rounded-full bg-severity-critical/80" />
                <span className="w-3 h-3 rounded-full bg-accent-amber/80" />
                <span className="w-3 h-3 rounded-full bg-accent-green/80" />
              </span>
              <span className="ml-2 font-mono text-xs text-text-muted">
                somashield scan — https://exemplo.com
              </span>
            </div>
            <button
              onClick={() => setReplayKey((k) => k + 1)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <RotateCcw size={13} /> Repetir
            </button>
          </div>

          <div ref={bodyRef} className="custom-scrollbar h-[320px] overflow-y-auto px-4 py-4 font-mono text-[13px] leading-relaxed">
            {lines.map((l, i) => (
              <div key={`${replayKey}-${i}`} data-log-row className="flex flex-wrap gap-x-2 py-0.5">
                <span className="text-text-muted shrink-0">[{l.time}]</span>
                <span className="font-semibold shrink-0" style={{ color: agentColor[l.agent] }}>
                  [{l.agent}]
                </span>
                <span style={{ color: l.tone ? toneColor[l.tone] : '#c8c8d8' }}>{l.text}</span>
              </div>
            ))}
            {!prefersReducedMotion() && (
              <span className="inline-block w-2 h-4 align-middle bg-accent-green animate-caret-blink" />
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
