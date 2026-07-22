import { motion } from 'framer-motion'
import { Brain, Terminal, FileCheck, Globe, FileSignature } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import SectionHeading from './shared/SectionHeading'
import SpotlightCard from './shared/SpotlightCard'

const easeOut = [0, 0, 0.2, 1] as [number, number, number, number]

interface Feature {
  icon: LucideIcon
  title: string
  description: string
  color: string
  glow: string
  span: string
  visual: 'graph' | 'terminal' | 'report' | 'domain' | 'signature'
}

const features: Feature[] = [
  {
    icon: Brain,
    title: 'Três agentes de IA em conjunto',
    description:
      'Recon mapeia, Exploit ataca e Validate confirma — um pipeline autônomo que raciocina sobre a sua aplicação como um time de red team.',
    color: '#00f0ff',
    glow: '0, 240, 255',
    span: 'lg:col-span-2 lg:row-span-2',
    visual: 'graph',
  },
  {
    icon: Terminal,
    title: 'Validação real de exploits',
    description:
      'Diferente de scanners tradicionais, os agentes exploram as falhas de forma segura e eliminam falsos positivos.',
    color: '#00ff88',
    glow: '0, 255, 136',
    span: 'lg:col-span-2',
    visual: 'terminal',
  },
  {
    icon: FileCheck,
    title: 'Relatórios de conformidade',
    description:
      'Mapeamento para OWASP Top 10, LGPD e PCI DSS. Exporte em PDF e JSON com evidências e score de risco.',
    color: '#ffb800',
    glow: '255, 184, 0',
    span: '',
    visual: 'report',
  },
  {
    icon: Globe,
    title: 'Verificação de domínio',
    description: 'DNS, arquivo HTML ou meta tag. Só escaneamos alvos que você comprova ser seus.',
    color: '#00f0ff',
    glow: '0, 240, 255',
    span: '',
    visual: 'domain',
  },
  {
    icon: FileSignature,
    title: 'Autorização com validade jurídica',
    description:
      'Assine eletronicamente o Termo de Autorização de Teste de Intrusão (TATI) e proteja ambas as partes.',
    color: '#b967ff',
    glow: '185, 103, 255',
    span: 'lg:col-span-2',
    visual: 'signature',
  },
]

function Visual({ type, color }: { type: Feature['visual']; color: string }) {
  if (type === 'graph') {
    return (
      <svg viewBox="0 0 260 140" className="w-full h-auto">
        {[
          [40, 40, 130, 30],
          [40, 40, 120, 90],
          [130, 30, 210, 55],
          [120, 90, 210, 100],
          [130, 30, 120, 90],
          [210, 55, 210, 100],
        ].map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeOpacity="0.3" strokeWidth="1">
            <animate attributeName="stroke-opacity" values="0.1;0.5;0.1" dur="3s" begin={`${i * 0.4}s`} repeatCount="indefinite" />
          </line>
        ))}
        {[
          [40, 40, 5],
          [130, 30, 4],
          [120, 90, 4],
          [210, 55, 3.5],
          [210, 100, 3.5],
        ].map(([cx, cy, r], i) => (
          <circle key={i} cx={cx} cy={cy} r={r} fill={color}>
            <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" begin={`${i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    )
  }
  if (type === 'terminal') {
    return (
      <div className="font-mono text-[10.5px] leading-relaxed rounded-lg bg-bg-terminal/80 border border-white/5 p-3 space-y-1">
        <p style={{ color: '#00ff88' }}>$ exploit --confirm</p>
        <p className="text-text-muted">→ payload enviado...</p>
        <p style={{ color: '#ff4466' }}>✓ SQLi confirmada · CVSS 9.8</p>
        <p style={{ color: '#00ff88' }}>✓ 0 falsos positivos</p>
      </div>
    )
  }
  if (type === 'report') {
    return (
      <div className="space-y-2">
        {['OWASP Top 10', 'LGPD', 'PCI DSS'].map((f, i) => (
          <div key={f} className="flex items-center gap-2 text-xs text-text-secondary">
            <FileCheck size={13} style={{ color }} />
            <span className="flex-1">{f}</span>
            <div className="h-1 w-16 rounded-full bg-white/[0.06] overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${90 - i * 12}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>
    )
  }
  if (type === 'domain') {
    return (
      <div className="font-mono text-[10.5px] rounded-lg bg-bg-terminal/80 border border-white/5 p-3">
        <p className="text-text-muted">TXT _somashield</p>
        <p style={{ color }}>verify=8f3a…c21</p>
        <p style={{ color: '#00ff88' }} className="mt-1">✓ propriedade confirmada</p>
      </div>
    )
  }
  // signature
  return (
    <svg viewBox="0 0 220 44" className="w-full h-auto">
      <path
        d="M8 30 Q 24 6 38 28 T 70 26 Q 86 10 104 30 T 150 24 Q 168 8 190 30"
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeDasharray="400"
        strokeDashoffset="400"
      >
        <animate attributeName="stroke-dashoffset" from="400" to="0" dur="2.4s" repeatCount="indefinite" />
      </path>
    </svg>
  )
}

export default function FeaturesSection() {
  return (
    <section id="funcionalidades" className="relative py-24 bg-bg-primary">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Recursos"
          title="Tudo o que você precisa para"
          gradient="testar a segurança da sua aplicação"
          subtitle="Do reconhecimento aos relatórios de conformidade — a plataforma automatiza todo o processo de teste de intrusão."
        />

        <motion.div
          className="mt-14 grid grid-cols-1 lg:grid-cols-4 auto-rows-[minmax(180px,auto)] gap-5"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.1 } } }}
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              className={f.span}
              variants={{
                hidden: { opacity: 0, y: 40 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: easeOut } },
              }}
            >
              <SpotlightCard glow={f.glow} className="h-full p-6 flex flex-col">
                <span
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${f.color}18`, border: `1px solid ${f.color}40` }}
                >
                  <f.icon size={20} style={{ color: f.color }} />
                </span>
                <h3 className="font-space text-lg font-semibold text-white mt-4">{f.title}</h3>
                <p className="mt-2 text-sm text-text-secondary" style={{ lineHeight: 1.6 }}>
                  {f.description}
                </p>
                <div className="mt-auto pt-5">
                  <Visual type={f.visual} color={f.color} />
                </div>
              </SpotlightCard>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
