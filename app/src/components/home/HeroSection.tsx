import { useState, useRef, Suspense, lazy } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Globe, Play, ChevronDown } from 'lucide-react'
import { gsap, useGSAP, SplitText, prefersReducedMotion } from '../../lib/gsap'
import ScanSimulation from './ScanSimulation'

const HeroScene = lazy(() => import('./HeroScene'))

export default function HeroSection() {
  const [urlInput, setUrlInput] = useState('')
  const [simUrl, setSimUrl] = useState<string | null>(null)
  const scopeRef = useRef<HTMLDivElement>(null)

  const startSim = (url: string) => setSimUrl(url)
  const handleScan = () => startSim(urlInput.trim() || 'https://demo.somashield.com.br')

  // Cinematic intro: gradient headline + supporting lines rise in sequence.
  useGSAP(
    () => {
      const reduced = prefersReducedMotion()
      const targets = gsap.utils.toArray<HTMLElement>('[data-hero-reveal]')
      const h1 = scopeRef.current?.querySelector<HTMLElement>('[data-hero-split]') ?? null

      if (reduced) {
        gsap.set(h1 ? [...targets, h1] : targets, { opacity: 1, y: 0 })
        return
      }

      // Hide before paint so waiting for fonts never flashes content in.
      gsap.set(targets, { opacity: 0, y: 26 })
      if (h1) gsap.set(h1, { opacity: 0 })

      // Reveal is guaranteed and never gated on anything that can fail.
      const revealBase = () => {
        gsap.to(targets, { opacity: 1, y: 0, duration: 0.7, stagger: 0.12, ease: 'power3.out' })
      }

      // SplitText headline is a pure enhancement — if it throws, show the h1 plainly.
      const revealHeadline = () => {
        try {
          if (!h1) return
          // words-only (no line divs) so the headline wraps naturally on any width
          const split = new SplitText(h1, { type: 'words' })
          gsap.set(h1, { opacity: 1 })
          gsap.from(split.words, { yPercent: 60, opacity: 0, duration: 0.7, stagger: 0.035, ease: 'power3.out' })
        } catch {
          if (h1) gsap.set(h1, { opacity: 1 })
        }
      }

      let started = false
      const start = () => {
        if (started) return
        started = true
        revealHeadline()
        revealBase()
      }
      if (document.fonts?.ready) document.fonts.ready.then(start)
      // Fallback: run regardless after a short beat (fonts blocked / promise never settles).
      gsap.delayedCall(0.6, start)
    },
    { scope: scopeRef },
  )

  return (
    <section
      ref={scopeRef}
      className="lp-motion relative min-h-[100dvh] w-full flex flex-col overflow-hidden bg-bg-base"
    >
      {/* 3D scene (lazy; text paints first) */}
      <div className="absolute inset-0 z-0 opacity-90">
        <Suspense fallback={null}>
          <HeroScene />
        </Suspense>
      </div>

      {/* radial + vignette wash */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 50% at 50% 42%, rgba(0,240,255,0.06) 0%, transparent 70%), linear-gradient(180deg, rgba(5,5,7,0.35) 0%, rgba(5,5,7,0) 28%, rgba(5,5,7,0) 62%, rgba(5,5,7,0.97) 100%)',
        }}
      />

      <div className="relative z-20 flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pt-24 pb-20">
        <AnimatePresence mode="wait">
          {simUrl ? (
            <ScanSimulation key="sim" url={simUrl} onClose={() => setSimUrl(null)} />
          ) : (
            <motion.div
              key="intro"
              className="relative w-full max-w-[820px] mx-auto text-center"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, transition: { duration: 0.35 } }}
            >
              {/* readability backdrop behind text, over the 3D sphere */}
              <div
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[170%] h-[165%] -z-10 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(58% 52% at 50% 47%, rgba(5,5,7,0.95) 0%, rgba(5,5,7,0.85) 42%, rgba(5,5,7,0.35) 68%, transparent 85%)',
                }}
              />

              {/* eyebrow badge */}
              <div
                data-hero-reveal
                className="inline-flex items-center gap-2 max-w-full rounded-full border border-accent-cyan/20 bg-accent-cyan/[0.06] px-3.5 py-1.5 mb-7"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-green" />
                </span>
                <span className="text-[11px] sm:text-xs font-medium tracking-wide text-text-secondary whitespace-nowrap">
                  Pentest autônomo · OWASP Top 10 · LGPD · PCI DSS
                </span>
              </div>

              {/* headline */}
              <h1
                data-hero-split
                className="font-space font-bold text-white opacity-0 px-1"
                style={{
                  fontSize: 'clamp(1.85rem, 7vw, 4.6rem)',
                  letterSpacing: '-0.03em',
                  lineHeight: 1.06,
                }}
              >
                Descubra suas falhas antes que alguém as explore.
              </h1>

              <p
                data-hero-reveal
                className="font-space font-semibold mt-3 text-gradient-brand"
                style={{
                  fontSize: 'clamp(1.4rem, 3.4vw, 2.6rem)',
                  letterSpacing: '-0.025em',
                  lineHeight: 1.1,
                  backgroundSize: '200% 200%',
                  animation: prefersReducedMotion()
                    ? 'none'
                    : 'gradientShimmer 5s linear infinite',
                }}
              >
                Pentest autônomo com IA
              </p>

              <p
                data-hero-reveal
                className="mt-6 mx-auto max-w-[600px] text-text-secondary"
                style={{ fontSize: '1.125rem', lineHeight: 1.65 }}
              >
                O Soma Shield mapeia, explora e valida vulnerabilidades reais na sua
                aplicação web — com autorização assinada eletronicamente e relatório
                de conformidade em minutos.
              </p>

              {/* URL input */}
              <div data-hero-reveal className="mt-9 mx-auto max-w-[600px]">
                <div
                  className="flex items-center gap-3 rounded-2xl bg-bg-secondary/80 backdrop-blur-md transition-all duration-300 focus-within:border-accent-cyan/60 focus-within:shadow-[0_0_32px_-8px_rgba(0,240,255,0.5)]"
                  style={{
                    border: '1px solid rgba(0,240,255,0.25)',
                    height: '64px',
                    padding: '4px 4px 4px 18px',
                  }}
                >
                  <Globe size={20} className="text-text-muted shrink-0" />
                  <input
                    type="url"
                    inputMode="url"
                    placeholder="https://seusite.com"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleScan()}
                    className="flex-1 min-w-0 bg-transparent text-white text-lg placeholder-text-muted outline-none font-inter"
                    aria-label="URL para escanear"
                  />
                  <button
                    onClick={handleScan}
                    className="inline-flex items-center gap-2 px-4 sm:px-5 py-3 rounded-xl font-semibold text-[13px] sm:text-sm whitespace-nowrap bg-gradient-brand text-bg-base transition-all duration-200 hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] shrink-0"
                  >
                    Iniciar simulação
                  </button>
                </div>
                <button
                  onClick={() => startSim('https://demo.somashield.com.br')}
                  className="group mt-4 inline-flex items-center gap-2 text-sm text-text-secondary hover:text-white transition-colors"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/15 group-hover:border-accent-cyan/50 transition-colors">
                    <Play size={12} className="ml-0.5 fill-current" />
                  </span>
                  Ver demonstração ao vivo
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* scroll cue */}
      {!simUrl && (
        <motion.div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 text-text-muted"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 8, 0] }}
          transition={{ opacity: { delay: 1.6 }, y: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }}
          aria-hidden
        >
          <ChevronDown size={22} />
        </motion.div>
      )}
    </section>
  )
}
