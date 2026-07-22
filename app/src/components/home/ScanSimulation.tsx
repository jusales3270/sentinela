import { useReducer, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, SkipForward, ShieldCheck, LayoutDashboard, Radar } from 'lucide-react'
import { gsap, useGSAP, prefersReducedMotion } from '../../lib/gsap'
import {
  scanScript,
  SIM_DURATION,
  type SimEvent,
  type Phase,
  type SimLog,
  type SimEndpoint,
  type SimFinding,
} from './scanScript'

interface SimState {
  phase: Phase
  progress: number
  logs: SimLog[]
  endpoints: SimEndpoint[]
  findings: SimFinding[]
}

const initialState: SimState = {
  phase: 'idle',
  progress: 0,
  logs: [],
  endpoints: [],
  findings: [],
}

type Action = { type: 'apply'; event: SimEvent } | { type: 'reset' } | { type: 'finalizeAll' }

function reducer(state: SimState, action: Action): SimState {
  switch (action.type) {
    case 'reset':
      return initialState
    case 'finalizeAll': {
      // Collapse the entire script to its end state (used for "skip"/reduced motion)
      const logs: SimLog[] = []
      const endpoints: SimEndpoint[] = []
      const findings: SimFinding[] = []
      for (const e of scanScript) {
        if (e.type === 'log') logs.push(e.log)
        else if (e.type === 'endpoint') endpoints.push(e.endpoint)
        else if (e.type === 'vuln') findings.push(e.finding)
      }
      return { phase: 'complete', progress: 100, logs, endpoints, findings }
    }
    case 'apply': {
      const e = action.event
      switch (e.type) {
        case 'phase':
          return { ...state, phase: e.phase }
        case 'progress':
          return { ...state, progress: e.value }
        case 'log':
          return { ...state, logs: [...state.logs, e.log] }
        case 'endpoint':
          return { ...state, endpoints: [...state.endpoints, e.endpoint] }
        case 'vuln':
          return { ...state, findings: [...state.findings, e.finding] }
        default:
          return state
      }
    }
    default:
      return state
  }
}

const phaseMeta: Record<Exclude<Phase, 'idle'>, { label: string; color: string }> = {
  booting: { label: 'Inicializando', color: '#a0a0b8' },
  recon: { label: 'Recon', color: '#00f0ff' },
  exploit: { label: 'Exploit', color: '#ffb800' },
  validate: { label: 'Validate', color: '#00ff88' },
  complete: { label: 'Concluído', color: '#00ff88' },
}

const agentColor: Record<SimLog['agent'], string> = {
  INIT: '#a0a0b8',
  RECON: '#00f0ff',
  EXPLOIT: '#ffb800',
  VALIDATE: '#00ff88',
}

const toneColor: Record<NonNullable<SimLog['tone']>, string> = {
  info: '#c8c8d8',
  warn: '#ffb800',
  vuln: '#ff4466',
  success: '#00ff88',
}

const severityColor: Record<SimFinding['severity'], string> = {
  CRITICAL: '#ff0044',
  HIGH: '#ff4444',
  MEDIUM: '#ffb800',
}

const RADAR = 150 // svg viewbox half-size

function polar(angle: number, radius: number) {
  const rad = (angle * Math.PI) / 180
  return { x: RADAR + Math.cos(rad) * radius * RADAR * 0.92, y: RADAR + Math.sin(rad) * radius * RADAR * 0.92 }
}

interface ScanSimulationProps {
  url: string
  onClose: () => void
}

export default function ScanSimulation({ url, onClose }: ScanSimulationProps) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const rootRef = useRef<HTMLDivElement>(null)
  const logScrollRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const displayUrl = useMemo(() => url.replace(/^https?:\/\//, '') || 'demo.somashield.com.br', [url])

  // Build & play the master timeline. Reduced motion jumps straight to the end.
  useGSAP(
    () => {
      if (prefersReducedMotion()) {
        dispatch({ type: 'finalizeAll' })
        return
      }
      const tl = gsap.timeline()
      scanScript.forEach((event) => {
        tl.call(() => dispatch({ type: 'apply', event }), undefined, event.at)
      })
      tl.to({}, { duration: 0.01 }, SIM_DURATION)
      return () => tl.kill()
    },
    { scope: rootRef },
  )

  // Escape closes
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Auto-scroll the log pane
  useEffect(() => {
    const el = logScrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [state.logs])

  const handleSkip = () => dispatch({ type: 'finalizeAll' })

  const criticalCount = state.findings.filter((f) => f.severity === 'CRITICAL').length
  const highCount = state.findings.filter((f) => f.severity === 'HIGH').length
  const mediumCount = state.findings.filter((f) => f.severity === 'MEDIUM').length
  const isComplete = state.phase === 'complete'

  return (
    <motion.div
      ref={rootRef}
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.98 }}
      transition={{ duration: 0.45, ease: [0, 0, 0.2, 1] }}
      className="relative w-full max-w-[880px] mx-auto overflow-hidden rounded-2xl border border-accent-cyan/20 bg-bg-terminal/95 backdrop-blur-xl text-left shadow-[0_40px_120px_-30px_rgba(0,240,255,0.35)]"
    >
      {/* header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-severity-critical/80" />
            <span className="w-3 h-3 rounded-full bg-accent-amber/80" />
            <span className="w-3 h-3 rounded-full bg-accent-green/80" />
          </span>
          <span className="ml-2 font-mono text-xs text-text-muted truncate">
            somashield scan — {displayUrl}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {!isComplete && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs text-text-secondary hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <SkipForward size={13} /> Pular
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-muted hover:text-white hover:bg-white/[0.06] transition-colors"
            aria-label="Fechar simulação"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px]">
        {/* terminal */}
        <div className="order-2 lg:order-1 border-t lg:border-t-0 lg:border-r border-white/[0.06]">
          <div
            ref={logScrollRef}
            role="log"
            aria-live="polite"
            className="custom-scrollbar h-[240px] lg:h-[300px] overflow-y-auto px-4 py-3 font-mono text-[12.5px] leading-relaxed"
          >
            {state.logs.map((log, i) => (
              <div key={i} className="flex gap-2 py-0.5">
                <span style={{ color: agentColor[log.agent] }} className="shrink-0 font-semibold">
                  [{log.agent}]
                </span>
                <span style={{ color: log.tone ? toneColor[log.tone] : '#c8c8d8' }}>
                  {log.text}
                </span>
              </div>
            ))}
            {!isComplete && (
              <span className="inline-block w-2 h-4 align-middle bg-accent-green animate-caret-blink" />
            )}
          </div>
        </div>

        {/* radar */}
        <div className="order-1 lg:order-2 p-4 flex flex-col items-center justify-center gap-3">
          <div className="relative w-[200px] h-[200px] lg:w-[240px] lg:h-[240px]">
            {/* rotating sweep */}
            {!isComplete && (
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    'conic-gradient(from 0deg, rgba(0,240,255,0.28), transparent 32%, transparent 100%)',
                  animation: 'radarSweep 3.2s linear infinite',
                }}
              />
            )}
            <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full">
              {[0.35, 0.62, 0.9].map((r) => (
                <circle
                  key={r}
                  cx={RADAR}
                  cy={RADAR}
                  r={r * RADAR * 0.92}
                  fill="none"
                  stroke="rgba(0,240,255,0.14)"
                  strokeWidth="1"
                />
              ))}
              <line x1={RADAR} y1="12" x2={RADAR} y2="288" stroke="rgba(0,240,255,0.08)" strokeWidth="1" />
              <line x1="12" y1={RADAR} x2="288" y2={RADAR} stroke="rgba(0,240,255,0.08)" strokeWidth="1" />

              {/* endpoint dots */}
              <AnimatePresence>
                {state.endpoints.map((e) => {
                  const { x, y } = polar(e.angle, e.radius)
                  return (
                    <motion.circle
                      key={e.id}
                      cx={x}
                      cy={y}
                      r="3"
                      fill="#6a9aa8"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 0.9 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    />
                  )
                })}
              </AnimatePresence>

              {/* vuln pulses */}
              {state.findings.map((f) => {
                const { x, y } = polar(f.angle, f.radius)
                return (
                  <g key={f.id}>
                    <circle cx={x} cy={y} r="10" fill="none" stroke={severityColor[f.severity]} strokeWidth="1.5" opacity="0.5">
                      <animate attributeName="r" from="4" to="16" dur="1.4s" repeatCount="indefinite" />
                      <animate attributeName="opacity" from="0.6" to="0" dur="1.4s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={x} cy={y} r="4.5" fill={severityColor[f.severity]} />
                  </g>
                )
              })}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              {isComplete ? (
                <ShieldCheck size={30} className="text-accent-green" />
              ) : (
                <Radar size={26} className="text-accent-cyan/70" />
              )}
            </div>
          </div>

          {/* phase chips */}
          <div className="flex items-center gap-1.5">
            {(['recon', 'exploit', 'validate'] as const).map((p) => {
              const order: Phase[] = ['booting', 'recon', 'exploit', 'validate', 'complete']
              const active =
                order.indexOf(state.phase) >= order.indexOf(p) && state.phase !== 'idle'
              return (
                <span
                  key={p}
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all duration-300"
                  style={{
                    color: active ? '#08080e' : '#6a6a82',
                    background: active ? phaseMeta[p].color : 'rgba(255,255,255,0.05)',
                  }}
                >
                  {phaseMeta[p].label}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* progress + counters */}
      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center gap-4">
        <div className="flex-1">
          <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <motion.div
              className="h-full bg-gradient-brand rounded-full"
              animate={{ width: `${state.progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
        </div>
        <div className="flex items-center gap-4 font-mono text-xs shrink-0">
          <span className="text-text-secondary">
            <span className="text-accent-cyan font-semibold">{state.endpoints.length}</span> endpoints
          </span>
          <span className="text-text-secondary">
            <span className="text-severity-critical font-semibold">{state.findings.length}</span> vulns
          </span>
          <span className="text-text-muted w-9 text-right">{state.progress}%</span>
        </div>
      </div>

      {/* completion summary */}
      <AnimatePresence>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="border-t border-white/[0.06] overflow-hidden"
          >
            <div className="p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                <div>
                  <p className="font-space font-semibold text-white">
                    Simulação concluída — {state.endpoints.length} endpoints, {state.findings.length} vulnerabilidades
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    {criticalCount} crítica · {highCount} alta · {mediumCount} média · demonstração ilustrativa
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <button
                    onClick={() => navigate('/verify-domain')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-brand text-bg-base text-sm font-semibold hover:brightness-110 transition-all"
                  >
                    <ShieldCheck size={15} /> Verificar meu domínio
                  </button>
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 text-text-secondary text-sm font-medium hover:bg-white/[0.05] transition-all"
                  >
                    <LayoutDashboard size={15} /> Explorar o painel
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-text-muted mt-3 leading-relaxed">
                Resultados reais exigem verificação de propriedade do domínio e autorização
                assinada eletronicamente (TATI) antes de qualquer teste.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
