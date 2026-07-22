import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useInView } from 'framer-motion'
import {
  Globe,
  Play,
  ShieldCheck,
  Clock,
  FileText,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  PlayCircle,
  ChevronRight,
  Settings,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Scan {
  id: string
  target: string
  mode: string
  status: 'running' | 'completed' | 'failed' | 'pending'
  date: string
  vulns: number
  vulnsBreakdown?: string
}

interface Stats {
  totalScans: number
  totalVulns: number
  totalReports: number
  avgScanTime: string
  scansTrend: string
  vulnsTrend: string
  reportsTrend: string
  timeTrend: string
}

/* ------------------------------------------------------------------ */
/*  Mock data fallbacks                                                */
/* ------------------------------------------------------------------ */

const MOCK_STATS: Stats = {
  totalScans: 142,
  totalVulns: 38,
  totalReports: 128,
  avgScanTime: '10:24',
  scansTrend: '+12%',
  vulnsTrend: '+8%',
  reportsTrend: '+24%',
  timeTrend: '-15%',
}

const MOCK_SCANS: Scan[] = [
  {
    id: '1',
    target: 'exemplo.com.br',
    mode: 'Deep',
    status: 'running',
    date: '2025-01-15T14:32:00',
    vulns: 3,
    vulnsBreakdown: '3 encontradas',
  },
  {
    id: '2',
    target: 'api.minhaempresa.com',
    mode: 'Standard',
    status: 'completed',
    date: '2025-01-14T09:15:00',
    vulns: 7,
    vulnsBreakdown: '7 encontradas (1 Critica, 2 Altas)',
  },
  {
    id: '3',
    target: 'blog.cliente.com',
    mode: 'Quick',
    status: 'completed',
    date: '2025-01-13T16:45:00',
    vulns: 0,
    vulnsBreakdown: 'Nenhuma encontrada',
  },
  {
    id: '4',
    target: 'dashboard.startup.io',
    mode: 'Standard',
    status: 'failed',
    date: '2025-01-12T11:20:00',
    vulns: 0,
    vulnsBreakdown: '—',
  },
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const API_BASE = 'http://localhost:8000'

async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/* ------------------------------------------------------------------ */
/*  Animated counter                                                   */
/* ------------------------------------------------------------------ */

function useCountUp(end: number, duration: number = 1200, inView: boolean) {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (!inView) return
    const animate = (ts: number) => {
      if (startRef.current === null) startRef.current = ts
      const progress = Math.min((ts - startRef.current) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.floor(eased * end))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate)
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [inView, end, duration])

  return value
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StatusBadge({ status }: { status: Scan['status'] }) {
  const config = {
    running: {
      label: 'Em Andamento',
      bg: 'rgba(0,240,255,0.1)',
      color: '#00f0ff',
    },
    completed: {
      label: 'Concluido',
      bg: 'rgba(0,255,136,0.1)',
      color: '#00ff88',
    },
    failed: {
      label: 'Falhou',
      bg: 'rgba(255,0,68,0.1)',
      color: '#ff0044',
    },
    pending: {
      label: 'Pendente',
      bg: 'rgba(255,184,0,0.1)',
      color: '#ffb800',
    },
  }
  const c = config[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: c.bg, color: c.color }}
    >
      {status === 'running' && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
            style={{ background: '#00f0ff' }}
          />
          <span
            className="relative inline-flex rounded-full h-1.5 w-1.5"
            style={{ background: '#00f0ff' }}
          />
        </span>
      )}
      {status === 'completed' && <CheckCircle2 size={12} />}
      {status === 'failed' && <XCircle size={12} />}
      {status === 'pending' && <Clock size={12} />}
      {c.label}
    </span>
  )
}

function StatCard({
  icon,
  iconBg,
  iconColor,
  endValue,
  isTime,
  label,
  trend,
  trendColor,
  trendIcon,
  delay,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  endValue: number
  isTime?: boolean
  label: string
  trend: string
  trendColor: string
  trendIcon: 'up' | 'down'
  delay: number
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-50px' })
  const count = useCountUp(endValue, 1200, inView)

  const TrendIcon = trendIcon === 'up' ? TrendingUp : TrendingDown

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.2 + delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      className="rounded-xl p-6 transition-all duration-200 hover:-translate-y-0.5"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      whileHover={{
        borderColor: 'rgba(0,240,255,0.1)',
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center"
        style={{ background: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="mt-4 font-space text-[2.5rem] font-bold leading-none text-text-primary">
        {isTime ? (
          <span className="font-mono text-[2rem]">
            {String(Math.floor(count / 60)).padStart(2, '0')}:
            {String(count % 60).padStart(2, '0')}
          </span>
        ) : (
          count
        )}
      </div>
      <p className="mt-1 text-sm text-text-muted">{label}</p>
      <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: trendColor }}>
        <TrendIcon size={12} />
        <span>{trend} este mes</span>
      </div>
    </motion.div>
  )
}

function QuickActionCard({
  icon,
  iconBg,
  iconColor,
  title,
  description,
  to,
  onClick,
  delay,
}: {
  icon: React.ReactNode
  iconBg: string
  iconColor: string
  title: string
  description: string
  to?: string
  onClick?: () => void
  delay: number
}) {
  const navigate = useNavigate()

  const handleClick = () => {
    if (to) navigate(to)
    else if (onClick) onClick()
  }

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.5,
        delay: 0.4 + delay,
        ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
      }}
      onClick={handleClick}
      className="w-full text-left rounded-xl p-5 flex items-center gap-4 transition-all duration-200 group"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
      whileHover={{
        borderColor: 'rgba(0,240,255,0.15)',
        background: '#1a1a2e',
        x: 4,
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
        style={{ background: iconBg }}
      >
        <span style={{ color: iconColor }}>{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-base font-medium text-text-primary">{title}</h3>
        <p className="text-sm text-text-muted mt-0.5">{description}</p>
      </div>
      <ChevronRight
        size={16}
        className="text-text-muted group-hover:text-accent-cyan transition-all duration-200 group-hover:translate-x-1 shrink-0"
      />
    </motion.button>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Dashboard                                                     */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [scanMode, setScanMode] = useState<'Quick' | 'Standard' | 'Deep'>('Standard')
  const [scans, setScans] = useState<Scan[]>(MOCK_SCANS)
  const [stats, setStats] = useState<Stats>(MOCK_STATS)
  const [, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  /* Fetch stats and scans on mount */
  useEffect(() => {
    let cancelled = false
    async function fetchData() {
      try {
        const [statsData, scansData] = await Promise.all([
          apiGet<Stats>('/api/stats').catch(() => MOCK_STATS),
          apiGet<Scan[]>('/api/scans').catch(() => MOCK_SCANS),
        ])
        if (!cancelled) {
          setStats(statsData)
          setScans(scansData)
          setError(null)
        }
      } catch {
        if (!cancelled) {
          setStats(MOCK_STATS)
          setScans(MOCK_SCANS)
        }
      }
    }
    fetchData()
    return () => { cancelled = true }
  }, [])

  const handleStartScan = useCallback(async () => {
    if (!url.trim()) return
    setStarting(true)
    try {
      const result = await apiPost<{ scanId: string }>('/api/scans', {
        target: url,
        mode: scanMode,
      })
      navigate(`/scan/${result.scanId}?url=${encodeURIComponent(url)}`)
    } catch {
      /* Fallback: navigate to scan page with URL */
      navigate(`/scan/new?url=${encodeURIComponent(url)}&mode=${scanMode}`)
    } finally {
      setStarting(false)
    }
  }, [url, scanMode, navigate])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStartScan()
  }

  const scrollToScanner = () => {
    const el = document.getElementById('url-scanner')
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  const avgMinutes = (() => {
    const [m, s] = stats.avgScanTime.split(':').map(Number)
    return m * 60 + s
  })()

  return (
    <div
      className="min-h-[calc(100dvh-64px)] pb-12"
      style={{ background: '#0a0a0f' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* ====== Section 1: Header + URL Scanner ====== */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
        >
          <h1 className="font-space text-3xl font-semibold text-text-primary tracking-tight">
            Bem-vindo ao StrixGuard
          </h1>
          <p className="mt-1 text-lg text-text-secondary">
            Pronto para escanear uma nova aplicacao hoje? &mdash;{' '}
            <span className="text-text-muted text-base">{getCurrentDate()}</span>
          </p>
        </motion.div>

        {/* URL Scanner Card */}
        <motion.div
          id="url-scanner"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.6,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="mt-6 rounded-2xl p-6 sm:p-8"
          style={{
            background: '#12121a',
            border: '1px solid rgba(0,240,255,0.15)',
            boxShadow: '0 0 40px rgba(0,240,255,0.04), inset 0 1px 0 rgba(0,240,255,0.08)',
          }}
        >
          <p className="text-base text-text-secondary mb-4">
            Insira a URL da aplicacao para iniciar o escaneamento
          </p>

          {/* Scan mode selector */}
          <div className="flex flex-wrap gap-2 mb-4">
            {(['Quick', 'Standard', 'Deep'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setScanMode(mode)}
                className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200"
                style={{
                  background:
                    scanMode === mode
                      ? 'rgba(0,240,255,0.12)'
                      : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${
                    scanMode === mode
                      ? 'rgba(0,240,255,0.4)'
                      : 'rgba(255,255,255,0.1)'
                  }`,
                  color: scanMode === mode ? '#00f0ff' : '#6a6a82',
                }}
              >
                {mode === 'Quick' && 'Rapido'}
                {mode === 'Standard' && 'Padrao'}
                {mode === 'Deep' && 'Profundo'}
              </button>
            ))}
          </div>

          {/* Input row */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex-1 flex items-center gap-3 rounded-lg px-4 transition-all duration-200 focus-within:ring-2"
              style={{
                background: '#0a0a0f',
                border: '1px solid rgba(0,240,255,0.2)',
                height: '56px',
              }}
            >
              <Globe size={20} color="#6a6a82" />
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="https://exemplo.com"
                className="flex-1 bg-transparent text-lg text-text-primary placeholder-text-muted outline-none font-inter"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartScan}
              disabled={starting || !url.trim()}
              className="h-14 px-8 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
                boxShadow: '0 0 20px rgba(0,240,255,0.2)',
              }}
            >
              {starting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Play size={16} />
              )}
              Iniciar Pentest
            </motion.button>
          </div>

          {/* Helper row */}
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1">
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <ShieldCheck size={14} /> Escaneamento seguro e autorizado
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={14} /> Duracao media: 8-15 minutos
            </span>
            <span className="flex items-center gap-1.5 text-xs text-text-muted">
              <FileText size={14} /> Relatorio completo em PDF
            </span>
          </div>
        </motion.div>

        {/* ====== Section 2: Stats Cards ====== */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Activity size={20} />}
            iconBg="rgba(0,240,255,0.08)"
            iconColor="#00f0ff"
            endValue={stats.totalScans}
            label="Total de Escaneamentos"
            trend={stats.scansTrend}
            trendColor="#00ff88"
            trendIcon="up"
            delay={0}
          />
          <StatCard
            icon={<AlertTriangle size={20} />}
            iconBg="rgba(255,0,68,0.08)"
            iconColor="#ff0044"
            endValue={stats.totalVulns}
            label="Vulnerabilidades Encontradas"
            trend={stats.vulnsTrend}
            trendColor="#ff4444"
            trendIcon="up"
            delay={0.08}
          />
          <StatCard
            icon={<FileText size={20} />}
            iconBg="rgba(0,255,136,0.08)"
            iconColor="#00ff88"
            endValue={stats.totalReports}
            label="Relatorios Gerados"
            trend={stats.reportsTrend}
            trendColor="#00ff88"
            trendIcon="up"
            delay={0.16}
          />
          <StatCard
            icon={<Clock size={20} />}
            iconBg="rgba(255,184,0,0.08)"
            iconColor="#ffb800"
            endValue={avgMinutes}
            isTime
            label="Tempo Medio de Escaneamento"
            trend={stats.timeTrend}
            trendColor="#00ff88"
            trendIcon="down"
            delay={0.24}
          />
        </div>

        {/* ====== Section 3: Recent Scans Table ====== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.5,
            delay: 0.3,
            ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
          }}
          className="mt-8"
        >
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-space text-xl font-semibold text-text-primary">
              Escaneamentos Recentes
            </h2>
            <button
              onClick={() => navigate('/reports')}
              className="text-sm text-accent-cyan hover:underline transition-all duration-200"
            >
              Ver Todos &rarr;
            </button>
          </div>

          {/* Table */}
          <div
            className="rounded-xl overflow-hidden"
            style={{
              background: '#0a0a0f',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Table header */}
            <div
              className="hidden sm:grid grid-cols-[1fr_140px_120px_180px_100px] gap-4 px-4 py-3 text-xs uppercase tracking-wider text-text-muted"
              style={{ background: '#12121a' }}
            >
              <span>Alvo</span>
              <span>Modo</span>
              <span>Status</span>
              <span>Data</span>
              <span>Vulns</span>
            </div>

            {/* Table rows */}
            <div className="max-h-[400px] overflow-y-auto">
              {scans.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <ShieldCheck size={48} color="#6a6a82" />
                  <p className="mt-4 text-base font-medium text-text-secondary">
                    Nenhum escaneamento ainda
                  </p>
                  <p className="mt-1 text-sm text-text-muted">
                    Insira uma URL acima para iniciar seu primeiro teste de intrusao.
                  </p>
                </div>
              ) : (
                scans.map((scan) => (
                  <motion.div
                    key={scan.id}
                    onClick={() => navigate(`/scan/${scan.id}`)}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_140px_120px_180px_100px] gap-2 sm:gap-4 px-4 py-3 items-center cursor-pointer transition-colors duration-150 hover:bg-bg-tertiary border-b"
                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                    whileHover={{ backgroundColor: '#1a1a2e' }}
                  >
                    {/* Alvo */}
                    <div className="flex items-center gap-2 min-w-0">
                      <Globe size={14} color="#6a6a82" className="shrink-0" />
                      <span className="text-sm text-text-primary truncate font-medium">
                        {scan.target}
                      </span>
                    </div>
                    {/* Modo */}
                    <div className="text-sm text-text-secondary">
                      {scan.mode === 'Quick' && 'Rapido'}
                      {scan.mode === 'Standard' && 'Padrao'}
                      {scan.mode === 'Deep' && 'Profundo'}
                      {!['Quick', 'Standard', 'Deep'].includes(scan.mode) && scan.mode}
                    </div>
                    {/* Status */}
                    <div>
                      <StatusBadge status={scan.status} />
                    </div>
                    {/* Data */}
                    <div className="text-sm text-text-muted">
                      {formatDate(scan.date)}
                    </div>
                    {/* Vulns */}
                    <div className="text-sm">
                      {scan.status === 'failed' ? (
                        <span className="text-text-muted">—</span>
                      ) : scan.vulns === 0 ? (
                        <span className="text-accent-green">Nenhuma</span>
                      ) : (
                        <span
                          className="font-medium"
                          style={{
                            color:
                              scan.vulns > 5
                                ? '#ff4444'
                                : scan.vulns > 2
                                ? '#ffb800'
                                : '#00ff88',
                          }}
                        >
                          {scan.vulnsBreakdown || `${scan.vulns} encontradas`}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* ====== Section 4: Quick Actions ====== */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-4">
          <QuickActionCard
            icon={<PlayCircle size={24} />}
            iconBg="rgba(0,240,255,0.08)"
            iconColor="#00f0ff"
            title="Novo Escaneamento"
            description="Iniciar um novo teste de intrusao"
            onClick={scrollToScanner}
            delay={0}
          />
          <QuickActionCard
            icon={<ShieldCheck size={24} />}
            iconBg="rgba(0,255,136,0.08)"
            iconColor="#00ff88"
            title="Verificar Dominio"
            description="Configurar verificacao de propriedade"
            to="/verify-domain"
            delay={0.1}
          />
          <QuickActionCard
            icon={<Settings size={24} />}
            iconBg="rgba(255,184,0,0.08)"
            iconColor="#ffb800"
            title="Configuracoes"
            description="Gerenciar chaves e integracoes"
            to="/settings"
            delay={0.2}
          />
        </div>
      </div>
    </div>
  )
}
