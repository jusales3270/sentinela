import { useRef } from 'react'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap'

interface Stat {
  value: number
  suffix?: string
  prefix?: string
  label: string
  decimals?: number
}

const stats: Stat[] = [
  { value: 120, prefix: '+', label: 'verificações do OWASP Top 10' },
  { value: 3, label: 'agentes de IA especializados' },
  { value: 100, suffix: '%', label: 'dos achados validados como reais' },
  { value: 2, label: 'formatos de relatório (PDF + JSON)' },
]

export default function StatsSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const nums = gsap.utils.toArray<HTMLElement>('[data-stat-num]')
      nums.forEach((el, i) => {
        const stat = stats[i]
        if (prefersReducedMotion()) {
          el.textContent = `${stat.prefix ?? ''}${stat.value}${stat.suffix ?? ''}`
          return
        }
        const obj = { v: 0 }
        gsap.to(obj, {
          v: stat.value,
          duration: 1.8,
          ease: 'power2.out',
          snap: { v: stat.decimals ? 0.1 : 1 },
          scrollTrigger: { trigger: el, start: 'top 85%', once: true },
          onUpdate: () => {
            const n = stat.decimals ? obj.v.toFixed(stat.decimals) : Math.round(obj.v)
            el.textContent = `${stat.prefix ?? ''}${n}${stat.suffix ?? ''}`
          },
        })
      })
    },
    { scope: rootRef },
  )

  return (
    <section ref={rootRef} className="relative py-20 bg-bg-primary border-y border-white/[0.05]">
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <p
                data-stat-num
                className="font-space text-4xl lg:text-5xl font-bold text-gradient-brand"
                style={{ letterSpacing: '-0.02em' }}
              >
                {s.prefix ?? ''}0{s.suffix ?? ''}
              </p>
              <p className="mt-2 text-sm text-text-secondary max-w-[180px] mx-auto" style={{ lineHeight: 1.5 }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
