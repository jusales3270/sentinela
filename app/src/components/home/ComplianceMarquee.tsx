import { ShieldCheck } from 'lucide-react'

const badges = [
  'OWASP Top 10',
  'LGPD',
  'PCI DSS',
  'CWE',
  'CVSS 3.1',
  'Verificação DNS',
  'TATI assinado',
  'CVE',
]

function Track() {
  return (
    <div className="flex items-center gap-10 pr-10 shrink-0">
      {badges.map((b) => (
        <span key={b} className="flex items-center gap-2 text-sm font-space font-medium text-text-secondary whitespace-nowrap">
          <ShieldCheck size={15} className="text-accent-cyan/70" />
          {b}
        </span>
      ))}
    </div>
  )
}

export default function ComplianceMarquee() {
  return (
    <div className="relative bg-bg-base py-8 border-y border-white/[0.05] overflow-hidden lp-motion">
      <p className="text-center text-xs tracking-[0.15em] uppercase text-text-muted mb-6">
        Cobertura alinhada aos padrões da indústria
      </p>
      <div
        className="group relative flex overflow-hidden"
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 12%, #000 88%, transparent)' }}
      >
        <div className="flex animate-marquee group-hover:[animation-play-state:paused]">
          <Track />
          <Track />
        </div>
      </div>
    </div>
  )
}
