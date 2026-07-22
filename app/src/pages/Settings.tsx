import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  KeyRound,
  Bell,
  Users,
  CreditCard,
  Brain,
  Bot,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  FileText,
  Mail,
  Download,
  Trash2,
  UserPlus,
  Zap,
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type TabId = 'api' | 'notifications' | 'team' | 'billing'

interface TeamMember {
  id: string
  name: string
  email: string
  role: 'Admin' | 'Analista' | 'Visualizador'
  status: 'Ativo' | 'Pendente'
  initials: string
  avatarBg: string
}

interface BillingRecord {
  id: string
  date: string
  description: string
  amount: string
  status: 'Pago' | 'Pendente'
}

/* ------------------------------------------------------------------ */
/*  Mock data                                                          */
/* ------------------------------------------------------------------ */

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: 'api', label: 'API e Integracoes', icon: <KeyRound size={18} /> },
  { id: 'notifications', label: 'Notificacoes', icon: <Bell size={18} /> },
  { id: 'team', label: 'Equipe', icon: <Users size={18} /> },
  { id: 'billing', label: 'Plano e Faturamento', icon: <CreditCard size={18} /> },
]

const MOCK_TEAM: TeamMember[] = [
  {
    id: '1',
    name: 'Joao Mendes',
    email: 'joao@empresa.com',
    role: 'Admin',
    status: 'Ativo',
    initials: 'JM',
    avatarBg: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
  },
  {
    id: '2',
    name: 'Maria Silva',
    email: 'maria@empresa.com',
    role: 'Analista',
    status: 'Ativo',
    initials: 'MS',
    avatarBg: 'linear-gradient(135deg, #00ff88, #00aa55)',
  },
  {
    id: '3',
    name: 'Pedro Costa',
    email: 'pedro@empresa.com',
    role: 'Visualizador',
    status: 'Pendente',
    initials: 'PC',
    avatarBg: 'linear-gradient(135deg, #ffb800, #ff8c00)',
  },
]

const MOCK_BILLING: BillingRecord[] = [
  { id: '1', date: '15 jan 2025', description: 'Plano Profissional — Jan/2025', amount: 'R$ 497,00', status: 'Pago' },
  { id: '2', date: '15 dez 2024', description: 'Plano Profissional — Dez/2024', amount: 'R$ 497,00', status: 'Pago' },
  { id: '3', date: '15 nov 2024', description: 'Plano Profissional — Nov/2024', amount: 'R$ 497,00', status: 'Pago' },
]

const PLAN_FEATURES = [
  'Escaneamentos ilimitados',
  'Relatorio completo (PDF + JSON)',
  'Validacao real de exploits',
  'Relatorio de conformidade',
  'Suporte prioritario',
]

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function useToast() {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = (message: string, type: 'success' | 'error' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type })
    timerRef.current = setTimeout(() => setToast(null), 3000)
  }

  return { toast, show }
}

/* ------------------------------------------------------------------ */
/*  Tab 1: API e Integracoes                                           */
/* ------------------------------------------------------------------ */

function APISettings({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const handleTest = async () => {
    setTesting(true)
    setTestResult(null)
    // Simulate API test
    await new Promise((r) => setTimeout(r, 1500))
    setTesting(false)
    setTestResult('success')
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    showToast('Chave de API salva com sucesso!')
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-8">
      {/* LLM Provider */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-xl font-medium text-text-primary mb-1">Provedor de IA</h3>
        <p className="text-sm text-text-muted mb-4">
          Configure a chave de API do provedor de inteligencia artificial usado pelos agentes de pentest.
        </p>

        {/* Provider selection */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Anthropic */}
          <button
            onClick={() => setProvider('anthropic')}
            className="flex-1 flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-left"
            style={{
              background: '#12121a',
              border: `1px solid ${provider === 'anthropic' ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: provider === 'anthropic' ? '#00f0ff' : 'rgba(255,255,255,0.2)',
              }}
            >
              {provider === 'anthropic' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#00f0ff' }}
                />
              )}
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,184,0,0.08)' }}
            >
              <Brain size={18} color="#ffb800" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">Anthropic (Claude)</p>
              <p className="text-xs text-accent-green">Recomendado</p>
            </div>
          </button>

          {/* OpenAI */}
          <button
            onClick={() => setProvider('openai')}
            className="flex-1 flex items-center gap-3 p-4 rounded-xl transition-all duration-200 text-left"
            style={{
              background: '#12121a',
              border: `1px solid ${provider === 'openai' ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.06)'}`,
            }}
          >
            <div
              className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
              style={{
                borderColor: provider === 'openai' ? '#00f0ff' : 'rgba(255,255,255,0.2)',
              }}
            >
              {provider === 'openai' && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: '#00f0ff' }}
                />
              )}
            </div>
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: 'rgba(0,255,136,0.08)' }}
            >
              <Bot size={18} color="#00ff88" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">OpenAI (GPT)</p>
            </div>
          </button>
        </div>

        {/* API Key Input */}
        <div className="mt-6">
          <label className="block text-xs text-text-muted mb-2">Chave de API</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <div
              className="flex-1 flex items-center rounded-lg px-4"
              style={{
                background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)',
                height: '44px',
              }}
            >
              <input
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={provider === 'anthropic' ? 'sk-ant-api03-...' : 'sk-...'}
                className="flex-1 bg-transparent text-sm text-text-primary placeholder-text-muted outline-none font-mono"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="ml-2 text-text-muted hover:text-text-primary transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <motion.button
              whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSave}
              disabled={saving || saved || !apiKey.trim()}
              className="h-11 px-6 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
              }}
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
              {saved ? 'Salvo!' : 'Salvar'}
            </motion.button>
          </div>
          <p className="mt-2 flex items-center gap-1 text-xs text-text-muted">
            <Lock size={12} />
            Sua chave e armazenada de forma criptografada e nunca e compartilhada.
          </p>
        </div>

        {/* Connection test */}
        <div className="mt-4">
          <button
            onClick={handleTest}
            disabled={testing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50"
            style={{
              background: 'transparent',
              border: '1px solid rgba(0,240,255,0.4)',
              color: '#00f0ff',
            }}
          >
            {testing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Testar Conexao
          </button>

          <AnimatePresence>
            {testResult === 'success' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: 'rgba(0,255,136,0.06)',
                  border: '1px solid rgba(0,255,136,0.15)',
                  color: '#00ff88',
                }}
              >
                <CheckCircle2 size={14} />
                Conexao bem-sucedida! Modelo: claude-sonnet-4-20250514
              </motion.div>
            )}
            {testResult === 'error' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm"
                style={{
                  background: 'rgba(255,0,68,0.06)',
                  border: '1px solid rgba(255,0,68,0.15)',
                  color: '#ff0044',
                }}
              >
                <XCircle size={14} />
                Falha na conexao. Verifique sua chave de API.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Webhooks */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <h3 className="text-xl font-medium text-text-primary mb-1">Webhooks</h3>
        <p className="text-sm text-text-muted mb-4">
          Receba notificacoes em endpoints externos quando escaneamentos forem concluidos.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-muted mb-2">URL do Webhook</label>
            <input
              type="url"
              placeholder="https://suaempresa.com/api/webhooks/strixguard"
              className="w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:ring-2"
              style={{
                background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <p className="mt-1 text-xs text-text-muted">
              Enviaremos um POST com o resumo do escaneamento.
            </p>
          </div>

          <div>
            <label className="block text-xs text-text-muted mb-2">Secret (para verificacao HMAC)</label>
            <input
              type="password"
              placeholder="whsec_..."
              className="w-full rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:ring-2"
              style={{
                background: '#0a0a0f',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            />
            <p className="mt-1 text-xs text-text-muted">
              Usado para assinar o payload do webhook.
            </p>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 h-10 px-5 rounded-lg font-semibold text-sm inline-flex items-center gap-2 transition-all"
          style={{
            background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
            color: '#0a0a0f',
          }}
        >
          Salvar Configuracoes
        </motion.button>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab 2: Notificacoes                                                */
/* ------------------------------------------------------------------ */

function NotificationSettings({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [toggles, setToggles] = useState({
    scanComplete: true,
    scanFailed: true,
    criticalVuln: true,
    weeklyReport: false,
    platformUpdates: false,
  })
  const [email, setEmail] = useState('usuario@empresa.com')
  const [saved, setSaved] = useState(false)

  const toggle = (key: keyof typeof toggles) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = () => {
    setSaved(true)
    showToast('Preferencias salvas com sucesso!')
    setTimeout(() => setSaved(false), 2000)
  }

  const items = [
    {
      key: 'scanComplete' as const,
      icon: <CheckCircle2 size={18} />,
      iconBg: 'rgba(0,255,136,0.08)',
      iconColor: '#00ff88',
      title: 'Escaneamento Concluido',
      desc: 'Receba um email quando um escaneamento for finalizado com sucesso.',
    },
    {
      key: 'scanFailed' as const,
      icon: <XCircle size={18} />,
      iconBg: 'rgba(255,0,68,0.08)',
      iconColor: '#ff0044',
      title: 'Escaneamento Falhou',
      desc: 'Notificacao quando um escaneamento falhar ou for interrompido.',
    },
    {
      key: 'criticalVuln' as const,
      icon: <AlertTriangle size={18} />,
      iconBg: 'rgba(255,0,68,0.08)',
      iconColor: '#ff0044',
      title: 'Vulnerabilidade Critica Encontrada',
      desc: 'Alerta imediato por email quando uma vulnerabilidade critica e descoberta.',
    },
    {
      key: 'weeklyReport' as const,
      icon: <FileText size={18} />,
      iconBg: 'rgba(0,240,255,0.08)',
      iconColor: '#00f0ff',
      title: 'Resumo Semanal',
      desc: 'Receba um resumo semanal com todas as atividades da plataforma.',
    },
    {
      key: 'platformUpdates' as const,
      icon: <Mail size={18} />,
      iconBg: 'rgba(185,103,255,0.08)',
      iconColor: '#b967ff',
      title: 'Novidades da Plataforma',
      desc: 'Atualizacoes sobre novos recursos e melhorias na StrixGuard.',
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h3 className="text-xl font-medium text-text-primary px-6 pt-6 pb-2">
          Preferencias de Notificacao
        </h3>

        {/* Toggle items */}
        <div>
          {items.map((item, idx) => (
            <motion.div
              key={item.key}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: idx * 0.06 }}
              className="flex items-center gap-4 px-6 py-5 border-b"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: item.iconBg }}
              >
                <span style={{ color: item.iconColor }}>{item.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary">{item.title}</p>
                <p className="text-xs text-text-muted mt-0.5">{item.desc}</p>
              </div>
              {/* Toggle Switch */}
              <button
                onClick={() => toggle(item.key)}
                className="relative w-11 h-6 rounded-full transition-all duration-200 shrink-0"
                style={{
                  background: toggles[item.key] ? '#00f0ff' : '#1a1a2e',
                  border: toggles[item.key] ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <motion.div
                  animate={{
                    x: toggles[item.key] ? 20 : 2,
                    backgroundColor: toggles[item.key] ? '#0a0a0f' : '#6a6a82',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full"
                />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Email section */}
        <div
          className="px-6 py-5 border-t"
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}
        >
          <label className="block text-xs text-text-muted mb-2">
            Endereco de Email para Notificacoes
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: '#0a0a0f',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <p className="mt-1 text-xs text-text-muted">
            Este e o email onde voce recebera todas as notificacoes.
          </p>
        </div>

        {/* Save button */}
        <div className="px-6 pb-6 pt-2">
          <motion.button
            whileHover={{ scale: 1.01, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.99 }}
            onClick={handleSave}
            className="w-full h-11 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
              color: '#0a0a0f',
            }}
          >
            {saved ? <CheckCircle2 size={14} /> : null}
            {saved ? 'Salvo!' : 'Salvar Preferencias'}
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab 3: Equipe                                                      */
/* ------------------------------------------------------------------ */

function TeamSettings({ showToast }: { showToast: (msg: string, type?: 'success' | 'error') => void }) {
  const [members, setMembers] = useState<TeamMember[]>(MOCK_TEAM)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState<'Admin' | 'Analista' | 'Visualizador'>('Analista')
  const [, setInviteOpen] = useState(false)

  const handleInvite = () => {
    if (!inviteEmail.trim()) return
    const newMember: TeamMember = {
      id: Date.now().toString(),
      name: inviteEmail.split('@')[0],
      email: inviteEmail,
      role: inviteRole,
      status: 'Pendente',
      initials: inviteEmail.slice(0, 2).toUpperCase(),
      avatarBg: 'linear-gradient(135deg, #b967ff, #7c3aed)',
    }
    setMembers((prev) => [...prev, newMember])
    setInviteEmail('')
    setInviteOpen(false)
    showToast(`Convite enviado para ${newMember.email}`)
  }

  const handleRemove = (id: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== id))
    showToast('Membro removido com sucesso')
  }

  const roleBadge = (role: TeamMember['role']) => {
    const config = {
      Admin: { bg: 'rgba(0,240,255,0.1)', color: '#00f0ff' },
      Analista: { bg: 'rgba(0,255,136,0.1)', color: '#00ff88' },
      Visualizador: { bg: 'rgba(255,255,255,0.05)', color: '#a0a0b8' },
    }
    const c = config[role]
    return (
      <span
        className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium"
        style={{ background: c.bg, color: c.color }}
      >
        {role}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h3 className="text-xl font-medium text-text-primary">Membros da Equipe</h3>
        <p className="text-sm text-text-muted mt-1">
          Gerencie quem tem acesso a plataforma e seus niveis de permissao.
        </p>
      </motion.div>

      {/* Invite Form */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="rounded-xl p-6"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 className="text-base font-medium text-text-primary mb-4">Convidar Membro</h4>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="email@colaborador.com"
            onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
            className="flex-1 rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted outline-none transition-all duration-200 focus:ring-2"
            style={{
              background: '#0a0a0f',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as TeamMember['role'])}
            className="rounded-lg px-4 py-2.5 text-sm text-text-primary outline-none transition-all cursor-pointer"
            style={{
              background: '#0a0a0f',
              border: '1px solid rgba(255,255,255,0.1)',
              minWidth: '140px',
            }}
          >
            <option value="Admin">Administrador</option>
            <option value="Analista">Analista</option>
            <option value="Visualizador">Visualizador</option>
          </select>
          <motion.button
            whileHover={{ scale: 1.02, filter: 'brightness(1.1)' }}
            whileTap={{ scale: 0.98 }}
            onClick={handleInvite}
            disabled={!inviteEmail.trim()}
            className="h-10 px-5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
              color: '#0a0a0f',
            }}
          >
            <UserPlus size={14} />
            Convidar
          </motion.button>
        </div>
        <p className="mt-2 text-xs text-text-muted">
          O convidado recebera um email com link para aceitar o convite.
        </p>
      </motion.div>

      {/* Members List */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* List header */}
        <div
          className="hidden sm:grid grid-cols-[1fr_100px_80px_60px] gap-4 px-6 py-3 text-xs uppercase tracking-wider text-text-muted"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Membro</span>
          <span>Funcao</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Member rows */}
        <AnimatePresence>
          {members.map((member, idx) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4, delay: idx * 0.08 }}
              className="grid grid-cols-1 sm:grid-cols-[1fr_100px_80px_60px] gap-2 sm:gap-4 px-6 py-4 items-center border-b"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}
            >
              {/* Member info */}
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{ background: member.avatarBg }}
                >
                  {member.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">
                    {member.name}
                    {member.id === '1' && (
                      <span className="ml-2 text-xs text-accent-cyan">(voce)</span>
                    )}
                  </p>
                  <p className="text-xs text-text-muted">{member.email}</p>
                </div>
              </div>
              {/* Role */}
              <div>{roleBadge(member.role)}</div>
              {/* Status */}
              <div
                className="text-xs font-medium"
                style={{ color: member.status === 'Ativo' ? '#00ff88' : '#ffb800' }}
              >
                {member.status}
              </div>
              {/* Actions */}
              <div className="flex items-center justify-end">
                {member.id !== '1' && (
                  <button
                    onClick={() => handleRemove(member.id)}
                    className="p-1.5 rounded-lg transition-colors duration-200 hover:bg-bg-hover text-text-muted hover:text-severity-critical"
                    title="Remover membro"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Tab 4: Plano e Faturamento                                         */
/* ------------------------------------------------------------------ */

function BillingSettings() {
  const [usageBars, setUsageBars] = useState([0, 0, 0])

  useEffect(() => {
    const timers = [
      setTimeout(() => setUsageBars((p) => [100, p[1], p[2]]), 300),
      setTimeout(() => setUsageBars((p) => [p[0], 100, p[2]]), 450),
      setTimeout(() => setUsageBars((p) => [p[0], p[1], 30]), 600),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="space-y-4">
      {/* Current Plan */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-xl p-6"
        style={{
          background: '#12121a',
          border: '1px solid rgba(0,240,255,0.15)',
          boxShadow: 'inset 0 1px 0 rgba(0,240,255,0.08)',
        }}
      >
        <span
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: '#00f0ff' }}
        >
          PLANO ATUAL
        </span>
        <h3
          className="mt-2 text-[2.5rem] font-bold leading-none"
          style={{
            fontFamily: 'Space Grotesk, system-ui, sans-serif',
            background: 'linear-gradient(135deg, #00f0ff, #00ff88)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Profissional
        </h3>
        <p className="mt-3 text-lg text-text-secondary">R$ 497/mes</p>
        <p className="mt-1 text-sm text-text-muted">
          Proxima cobranca: 15 de fevereiro de 2025
        </p>

        <div
          className="my-5 h-px"
          style={{ background: 'rgba(255,255,255,0.06)' }}
        />

        {/* Features */}
        <div className="space-y-2.5">
          {PLAN_FEATURES.map((f) => (
            <div key={f} className="flex items-center gap-2.5 text-sm text-text-secondary">
              <CheckCircle2 size={16} color="#00ff88" />
              {f}
            </div>
          ))}
        </div>

        <button
          className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-bg-hover"
          style={{
            background: 'transparent',
            border: '1px solid rgba(0,240,255,0.4)',
            color: '#00f0ff',
          }}
        >
          <Zap size={14} />
          Alterar Plano
        </button>
      </motion.div>

      {/* Usage Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="rounded-xl p-6"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 className="text-base font-medium text-text-primary mb-5">Uso do Mes</h4>

        <div className="space-y-4">
          {[
            { label: 'Escaneamentos', value: '12 / ilimitado', width: 100, color: '#00f0ff' },
            { label: 'Relatorios Gerados', value: '12 / ilimitado', width: 100, color: '#00f0ff' },
            { label: 'Membros da Equipe', value: '3 / 10', width: 30, color: '#00ff88' },
          ].map((bar, idx) => (
            <div key={bar.label}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-text-secondary">{bar.label}</span>
                <span className="text-xs text-text-primary font-medium">{bar.value}</span>
              </div>
              <div
                className="h-1.5 rounded-full overflow-hidden"
                style={{ background: '#1a1a2e' }}
              >
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${usageBars[idx]}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full"
                  style={{ background: bar.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Billing History */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-xl overflow-hidden"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 className="text-base font-medium text-text-primary px-6 pt-6 pb-4">
          Historico de Faturamento
        </h4>

        {/* Header */}
        <div
          className="hidden sm:grid grid-cols-[100px_1fr_100px_80px_60px] gap-4 px-6 py-2.5 text-xs uppercase tracking-wider text-text-muted"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <span>Data</span>
          <span>Descricao</span>
          <span>Valor</span>
          <span>Status</span>
          <span></span>
        </div>

        {/* Rows */}
        {MOCK_BILLING.map((bill, idx) => (
          <motion.div
            key={bill.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 + idx * 0.08 }}
            className="grid grid-cols-1 sm:grid-cols-[100px_1fr_100px_80px_60px] gap-2 sm:gap-4 px-6 py-3 items-center border-b hover:bg-bg-tertiary transition-colors duration-150"
            style={{ borderColor: 'rgba(255,255,255,0.04)' }}
          >
            <span className="text-sm text-text-secondary">{bill.date}</span>
            <span className="text-sm text-text-primary">{bill.description}</span>
            <span className="text-sm font-mono text-text-primary">{bill.amount}</span>
            <span
              className="inline-flex items-center gap-1 text-xs font-medium"
              style={{ color: '#00ff88' }}
            >
              <CheckCircle2 size={12} />
              {bill.status}
            </span>
            <div className="flex justify-end">
              <button
                className="p-1.5 rounded-lg transition-colors duration-150 hover:text-accent-cyan text-text-muted"
                title="Baixar recibo"
              >
                <Download size={14} />
              </button>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Payment Method */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-xl p-6"
        style={{
          background: '#12121a',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <h4 className="text-base font-medium text-text-primary mb-4">Metodo de Pagamento</h4>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ background: '#1a1a2e' }}
          >
            <CreditCard size={18} color="#a0a0b8" />
          </div>
          <div>
            <p className="text-sm font-mono text-text-primary">**** **** **** 4242</p>
            <p className="text-xs text-text-muted">Expira 12/2026</p>
          </div>
        </div>
        <button
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:bg-bg-hover"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a0a0b8',
          }}
        >
          Atualizar
        </button>
      </motion.div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Settings Page                                                 */
/* ------------------------------------------------------------------ */

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId) || 'api'
  const [activeTab, setActiveTab] = useState<TabId>(initialTab)
  const { toast, show } = useToast()

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }

  return (
    <div
      className="min-h-[calc(100dvh-64px)] pb-12"
      style={{ background: '#0a0a0f' }}
    >
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Page title */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="font-space text-3xl font-semibold text-text-primary tracking-tight">
            Configuracoes
          </h1>
          <p className="mt-1 text-text-secondary">
            Gerencie suas preferencias, API keys, equipe e faturamento.
          </p>
        </motion.div>

        {/* Two-column layout: sidebar + content */}
        <div className="mt-8 flex flex-col md:flex-row gap-8">
          {/* Sidebar tabs - desktop */}
          <motion.nav
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="hidden md:flex flex-col gap-1 w-[200px] shrink-0"
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-all duration-200 text-left"
                style={{
                  background: activeTab === tab.id ? 'rgba(0,240,255,0.08)' : 'transparent',
                  color: activeTab === tab.id ? '#00f0ff' : '#6a6a82',
                  borderLeft: activeTab === tab.id ? '3px solid #00f0ff' : '3px solid transparent',
                }}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </motion.nav>

          {/* Mobile tab bar */}
          <div
            className="md:hidden flex gap-1 overflow-x-auto pb-2 -mx-1 px-1"
            style={{ scrollbarWidth: 'none' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0"
                style={{
                  background: activeTab === tab.id ? 'rgba(0,240,255,0.08)' : 'transparent',
                  color: activeTab === tab.id ? '#00f0ff' : '#6a6a82',
                  borderBottom: activeTab === tab.id ? '2px solid #00f0ff' : '2px solid transparent',
                }}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === 'api' && <APISettings showToast={show} />}
                {activeTab === 'notifications' && <NotificationSettings showToast={show} />}
                {activeTab === 'team' && <TeamSettings showToast={show} />}
                {activeTab === 'billing' && <BillingSettings />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 left-1/2 z-50 px-4 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
            style={{
              background: '#12121a',
              border: `1px solid ${toast.type === 'error' ? 'rgba(255,0,68,0.3)' : 'rgba(0,240,255,0.3)'}`,
              color: toast.type === 'error' ? '#ff0044' : '#00f0ff',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
