import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  FileText,
  Download,
  ShieldCheck,
  ChevronDown,
  X,
  Calendar,
  Clock,
  Zap,
  Layers,
  Radio,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VulnCounts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

interface Report {
  id: string
  target_url: string
  scan_date: string
  status: 'completed' | 'running' | 'failed'
  scan_mode: 'quick' | 'standard' | 'deep'
  risk_score: number
  vulns: VulnCounts
  duration?: string
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const mockReports: Report[] = [
  {
    id: '1',
    target_url: 'https://demo-app.strixguard.com',
    scan_date: '2025-07-10T14:30:00Z',
    status: 'completed',
    scan_mode: 'standard',
    risk_score: 8.5,
    vulns: { critical: 2, high: 3, medium: 4, low: 2, info: 5 },
    duration: '12m 34s',
  },
  {
    id: '2',
    target_url: 'https://api.ecommerce-client.com',
    scan_date: '2025-07-08T10:15:00Z',
    status: 'completed',
    scan_mode: 'deep',
    risk_score: 6.2,
    vulns: { critical: 0, high: 2, medium: 5, low: 8, info: 3 },
    duration: '8m 12s',
  },
  {
    id: '3',
    target_url: 'https://blog.cliente.com',
    scan_date: '2025-07-05T16:45:00Z',
    status: 'completed',
    scan_mode: 'quick',
    risk_score: 0.0,
    vulns: { critical: 0, high: 0, medium: 0, low: 0, info: 3 },
    duration: '6m 45s',
  },
  {
    id: '4',
    target_url: 'https://dashboard.startup.io',
    scan_date: '2025-07-03T11:20:00Z',
    status: 'failed',
    scan_mode: 'standard',
    risk_score: 0,
    vulns: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  },
  {
    id: '5',
    target_url: 'https://api.fintech-brasil.com.br',
    scan_date: '2025-07-01T09:00:00Z',
    status: 'completed',
    scan_mode: 'deep',
    risk_score: 9.1,
    vulns: { critical: 3, high: 4, medium: 2, low: 1, info: 4 },
    duration: '18m 22s',
  },
  {
    id: '6',
    target_url: 'https://app.saas-company.com',
    scan_date: '2025-06-28T13:10:00Z',
    status: 'completed',
    scan_mode: 'standard',
    risk_score: 4.3,
    vulns: { critical: 0, high: 1, medium: 3, low: 6, info: 2 },
    duration: '10m 05s',
  },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM yyyy, HH:mm", { locale: ptBR })
}

function severityLabel(score: number): { label: string; color: string } {
  if (score >= 8) return { label: 'Alto', color: '#ff4444' }
  if (score >= 4) return { label: 'Medio', color: '#ffb800' }
  if (score > 0) return { label: 'Baixo', color: '#00ff88' }
  return { label: 'Seguro', color: '#00ff88' }
}

function statusConfig(status: Report['status']) {
  switch (status) {
    case 'completed':
      return {
        label: 'Concluido',
        bg: 'rgba(0,255,136,0.1)',
        color: '#00ff88',
        dot: '#00ff88',
      }
    case 'running':
      return {
        label: 'Em Andamento',
        bg: 'rgba(0,240,255,0.1)',
        color: '#00f0ff',
        dot: '#00f0ff',
      }
    case 'failed':
      return {
        label: 'Falhou',
        bg: 'rgba(255,0,68,0.1)',
        color: '#ff0044',
        dot: '#ff0044',
      }
  }
}

function scanModeConfig(mode: Report['scan_mode']) {
  switch (mode) {
    case 'quick':
      return { label: 'Quick', icon: Zap, color: '#00f0ff', bg: 'rgba(0,240,255,0.1)' }
    case 'standard':
      return { label: 'Standard', icon: Layers, color: '#b967ff', bg: 'rgba(185,103,255,0.1)' }
    case 'deep':
      return { label: 'Deep', icon: Radio, color: '#ff3d77', bg: 'rgba(255,61,119,0.1)' }
  }
}

const severityColors = {
  critical: '#ff0044',
  high: '#ff4444',
  medium: '#ffb800',
  low: '#00ff88',
  info: '#00f0ff',
}

const severityLabels = {
  critical: 'Critica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baixa',
  info: 'Info',
}

// ─── Mini Risk Gauge (SVG Arc) ─────────────────────────────────────────────

function MiniRiskGauge({ score }: { score: number }) {
  const radius = 20
  const stroke = 4
  const normalized = Math.min(score / 10, 1)
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const dashOffset = arcLength * (1 - normalized)

  let color = '#00ff88'
  if (score >= 8) color = '#ff4444'
  else if (score >= 4) color = '#ffb800'

  const label = severityLabel(score)

  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: 48, height: 48 }}>
        <svg width="48" height="48" viewBox="0 0 48 48" className="-rotate-[135deg]">
          {/* Track */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={0}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-dashOffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-[11px] font-bold" style={{ color }}>
            {score.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-medium" style={{ color: '#6a6a82' }}>
          Score de Risco
        </p>
        <p className="text-xs font-semibold" style={{ color: label.color }}>
          {label.label}
        </p>
      </div>
    </div>
  )
}

// ─── Vulnerability Bar ───────────────────────────────────────────────────────

function VulnBar({ vulns }: { vulns: VulnCounts }) {
  const total = vulns.critical + vulns.high + vulns.medium + vulns.low + vulns.info

  if (total === 0) {
    return (
      <div className="mt-1">
        <div className="h-2 rounded-full" style={{ background: '#1a1a2e' }} />
        <p className="text-xs mt-2" style={{ color: '#4a4a5e' }}>
          Nenhuma vulnerabilidade detectada
        </p>
      </div>
    )
  }

  const segments = [
    { key: 'critical' as const, count: vulns.critical, color: severityColors.critical },
    { key: 'high' as const, count: vulns.high, color: severityColors.high },
    { key: 'medium' as const, count: vulns.medium, color: severityColors.medium },
    { key: 'low' as const, count: vulns.low, color: severityColors.low },
    { key: 'info' as const, count: vulns.info, color: severityColors.info },
  ]

  return (
    <div className="mt-1">
      {/* Bar */}
      <div className="h-2 rounded-full flex overflow-hidden" style={{ background: '#1a1a2e' }}>
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <motion.div
                key={seg.key}
                initial={{ width: 0 }}
                animate={{ width: `${(seg.count / total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
                className="h-full"
                style={{ background: seg.color }}
                title={`${seg.count} ${severityLabels[seg.key]}`}
              />
            )
        )}
      </div>
      {/* Counts */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className="inline-flex items-center gap-1 text-[11px] font-medium"
            style={{ color: seg.count > 0 ? seg.color : '#4a4a5e' }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ background: seg.count > 0 ? seg.color : '#4a4a5e' }}
            />
            {seg.count} {severityLabels[seg.key]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Report Card ─────────────────────────────────────────────────────────────

function ReportCard({
  report,
  index,
}: {
  report: Report
  index: number
}) {
  const navigate = useNavigate()
  const sConfig = statusConfig(report.status)
  const mConfig = scanModeConfig(report.scan_mode)
  const ModeIcon = mConfig.icon

  const handleCardClick = useCallback(() => {
    if (report.status !== 'failed') {
      navigate(`/reports/${report.id}`)
    }
  }, [navigate, report.status, report.id])

  const handleDownload = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation()
      // Trigger download toast
      alert('Download do PDF iniciado')
    },
    []
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        ease: [0, 0, 0.2, 1] as [number, number, number, number],
        delay: index * 0.08,
      }}
      onClick={handleCardClick}
      className="rounded-xl overflow-hidden cursor-pointer group"
      style={{
        background: '#12121a',
        border: '1px solid rgba(255,255,255,0.06)',
        transition: 'all 300ms ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(-4px)'
        el.style.borderColor = 'rgba(0,240,255,0.15)'
        el.style.boxShadow = '0 8px 32px rgba(0,240,255,0.08)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget
        el.style.transform = 'translateY(0)'
        el.style.borderColor = 'rgba(255,255,255,0.06)'
        el.style.boxShadow = 'none'
      }}
    >
      {/* Card Header */}
      <div className="px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-space text-sm font-semibold text-text-primary truncate flex-1">
            {report.target_url.replace(/^https?:\/\//, '')}
          </h3>
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium shrink-0"
            style={{ background: sConfig.bg, color: sConfig.color }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: sConfig.dot,
                animation: report.status === 'running' ? 'pulse 2s infinite' : undefined,
              }}
            />
            {sConfig.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-1.5">
          <Calendar size={11} color="#6a6a82" />
          <span className="text-[11px]" style={{ color: '#6a6a82' }}>
            {formatDate(report.scan_date)}
          </span>
        </div>
        {report.duration && (
          <div className="flex items-center gap-2 mt-0.5">
            <Clock size={11} color="#4a4a5e" />
            <span className="text-[11px]" style={{ color: '#4a4a5e' }}>
              Duracao: {report.duration}
            </span>
          </div>
        )}
      </div>

      {/* Scan Mode Badge */}
      <div className="px-5 pt-3">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium"
          style={{ background: mConfig.bg, color: mConfig.color }}
        >
          <ModeIcon size={10} />
          {mConfig.label}
        </span>
      </div>

      {/* Card Body - Vulnerabilities */}
      {report.status !== 'failed' && (
        <div className="px-5 py-3">
          <p className="text-[11px] font-medium mb-2" style={{ color: '#6a6a82' }}>
            Vulnerabilidades
          </p>
          <VulnBar vulns={report.vulns} />
        </div>
      )}

      {/* Risk Score */}
      {report.status !== 'failed' && (
        <div
          className="px-5 py-3"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
          <MiniRiskGauge score={report.risk_score} />
        </div>
      )}

      {/* Card Footer */}
      <div
        className="px-5 py-3"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        {report.status === 'failed' ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate('/dashboard')
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
              color: '#0a0a0f',
            }}
          >
            <Zap size={14} />
            Tentar Novamente
          </button>
        ) : (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/reports/${report.id}`)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
              }}
            >
              <FileText size={14} />
              Ver Relatorio
            </button>
            <button
              onClick={handleDownload}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-xs font-medium mt-2 transition-all duration-200 hover:bg-white/5"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0b8',
              }}
            >
              <Download size={14} />
              Baixar PDF
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({ onAction }: { onAction: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-24"
    >
      <ShieldCheck size={64} color="#6a6a82" strokeWidth={1.2} />
      <h3 className="font-space text-lg font-medium mt-6" style={{ color: '#a0a0b8' }}>
        Nenhum relatorio encontrado
      </h3>
      <p className="text-sm mt-2 text-center max-w-xs" style={{ color: '#6a6a82' }}>
        Os relatorios aparecerao aqui apos a conclusao dos escaneamentos.
      </p>
      <button
        onClick={onAction}
        className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 hover:bg-[rgba(0,240,255,0.08)] hover:border-[#00f0ff]"
        style={{
          background: 'transparent',
          border: '1px solid rgba(0,240,255,0.4)',
          color: '#00f0ff',
        }}
      >
        <Zap size={16} />
        Iniciar Primeiro Scan
      </button>
    </motion.div>
  )
}

// ─── Main Reports Page ───────────────────────────────────────────────────────

export default function Reports() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [visibleCount, setVisibleCount] = useState(6)

  const clearFilters = useCallback(() => {
    setSearch('')
    setSeverityFilter('all')
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
  }, [])

  const filtered = useMemo(() => {
    return mockReports.filter((r) => {
      // Search
      if (search && !r.target_url.toLowerCase().includes(search.toLowerCase())) return false
      // Severity (filter by max severity present)
      if (severityFilter !== 'all') {
        const sevMap: Record<string, keyof VulnCounts> = {
          critical: 'critical',
          high: 'high',
          medium: 'medium',
          low: 'low',
        }
        const key = sevMap[severityFilter]
        if (key && r.vulns[key] === 0) return false
      }
      // Status
      if (statusFilter !== 'all' && r.status !== statusFilter) return false
      // Date range
      if (dateFrom && new Date(r.scan_date) < new Date(dateFrom)) return false
      if (dateTo && new Date(r.scan_date) > new Date(`${dateTo}T23:59:59`)) return false
      return true
    })
  }, [search, severityFilter, statusFilter, dateFrom, dateTo])

  const visible = filtered.slice(0, visibleCount)
  const hasMore = visibleCount < filtered.length

  const hasActiveFilters = search || severityFilter !== 'all' || statusFilter !== 'all' || dateFrom || dateTo

  return (
    <div
      className="min-h-[calc(100dvh-64px)]"
      style={{ background: '#0a0a0f' }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* ─── Page Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-3">
            <h1 className="font-space text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
              Relatorios de Seguranca
            </h1>
            <span
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: '#12121a',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0b8',
              }}
            >
              {filtered.length} relatorios
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search
                size={16}
                color="#6a6a82"
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Buscar por URL..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-[260px] h-10 pl-9 pr-4 rounded-lg text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:border-[rgba(0,240,255,0.5)]"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
              style={{
                background: 'transparent',
                border: filtersOpen ? '1px solid rgba(0,240,255,0.4)' : '1px solid rgba(255,255,255,0.1)',
                color: filtersOpen ? '#00f0ff' : '#a0a0b8',
              }}
            >
              <Filter size={14} />
              Filtros
              {hasActiveFilters && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: '#00f0ff' }}
                />
              )}
            </button>

            {/* Novo Scan */}
            <button
              onClick={() => navigate('/dashboard')}
              className="hidden sm:inline-flex items-center gap-2 h-10 px-5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
              }}
            >
              <Zap size={14} />
              Novo Scan
            </button>
          </div>
        </motion.div>

        {/* ─── Filters Panel ───────────────────────────────────────── */}
        <AnimatePresence>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden mb-6"
            >
              <div
                className="p-5 rounded-xl"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Date From */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6a6a82' }}>
                      De
                    </label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm text-text-primary outline-none transition-all duration-200"
                      style={{
                        background: '#0a0a0f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                  {/* Date To */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6a6a82' }}>
                      Ate
                    </label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg text-sm text-text-primary outline-none transition-all duration-200"
                      style={{
                        background: '#0a0a0f',
                        border: '1px solid rgba(255,255,255,0.1)',
                        colorScheme: 'dark',
                      }}
                    />
                  </div>
                  {/* Severity */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6a6a82' }}>
                      Severidade Minima
                    </label>
                    <div className="relative">
                      <select
                        value={severityFilter}
                        onChange={(e) => setSeverityFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 rounded-lg text-sm text-text-primary outline-none appearance-none transition-all duration-200"
                        style={{
                          background: '#0a0a0f',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <option value="all">Todas</option>
                        <option value="critical">Critica</option>
                        <option value="high">Alta</option>
                        <option value="medium">Media</option>
                        <option value="low">Baixa</option>
                      </select>
                      <ChevronDown
                        size={14}
                        color="#6a6a82"
                        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </div>
                  {/* Status */}
                  <div>
                    <label className="block text-[11px] font-medium mb-1.5" style={{ color: '#6a6a82' }}>
                      Status
                    </label>
                    <div className="relative">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full h-10 px-3 pr-8 rounded-lg text-sm text-text-primary outline-none appearance-none transition-all duration-200"
                        style={{
                          background: '#0a0a0f',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        <option value="all">Todos</option>
                        <option value="completed">Concluido</option>
                        <option value="running">Em Andamento</option>
                        <option value="failed">Falhou</option>
                      </select>
                      <ChevronDown
                        size={14}
                        color="#6a6a82"
                        className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center gap-3 mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-white/5"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.1)',
                      color: '#a0a0b8',
                    }}
                  >
                    <X size={12} />
                    Limpar Filtros
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── Reports Grid ────────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <EmptyState onAction={() => navigate('/dashboard')} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visible.map((report, i) => (
                <ReportCard key={report.id} report={report} index={i} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-10">
                <button
                  onClick={() => setVisibleCount((c) => c + 3)}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,240,255,0.08)] hover:border-[#00f0ff]"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0,240,255,0.4)',
                    color: '#00f0ff',
                  }}
                >
                  <ChevronDown size={16} />
                  Carregar mais
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
