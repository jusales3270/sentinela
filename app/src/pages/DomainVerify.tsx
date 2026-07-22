import { useState, useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Globe,
  AlertCircle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Server,
  FileCode,
  Code,
} from 'lucide-react'
import ProgressSteps from '../components/auth-flow/ProgressSteps'
import DnsVerifyTab from '../components/auth-flow/DnsVerifyTab'
import HtmlFileVerifyTab from '../components/auth-flow/HtmlFileVerifyTab'
import MetaTagVerifyTab from '../components/auth-flow/MetaTagVerifyTab'
import VerificationResult from '../components/auth-flow/VerificationResult'

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < 24; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

const stepLabels = ['Dominio', 'Metodo', 'Verificar']

type TabId = 'dns' | 'html' | 'meta'
type VerifyState = 'idle' | 'checking' | 'success' | 'failure'

const tabs: { id: TabId; label: string; Icon: typeof Server }[] = [
  { id: 'dns', label: 'Registro DNS TXT', Icon: Server },
  { id: 'html', label: 'Arquivo HTML', Icon: FileCode },
  { id: 'meta', label: 'Meta Tag', Icon: Code },
]

export default function DomainVerify() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const domainFromQuery = searchParams.get('domain') || ''

  const [domain, setDomain] = useState(domainFromQuery)
  const [token] = useState(generateToken)
  const [activeTab, setActiveTab] = useState<TabId>('dns')
  const [domainStatus, setDomainStatus] = useState<'unchecked' | 'verified' | 'not-verified' | 'error'>('unchecked')
  const [verificationState, setVerificationState] = useState<VerifyState>('idle')
  const [currentStep, setCurrentStep] = useState(0)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  const checkDomainStatus = useCallback(() => {
    if (!domain.trim()) {
      setDomainStatus('error')
      return
    }
    // Mock: simulate status check - 30% chance already verified
    const random = Math.random()
    if (random < 0.3) {
      setDomainStatus('verified')
      setCurrentStep(2)
    } else {
      setDomainStatus('not-verified')
      setCurrentStep(1)
    }
  }, [domain])

  const handleVerify = useCallback((result: 'success' | 'failure' | 'pending') => {
    if (result === 'pending') {
      setVerificationState('checking')
      setCurrentStep(2)

      // Simulate API call with 2-3 second delay
      const delay = 2000 + Math.random() * 1000
      timeoutRef.current = setTimeout(() => {
        // 50% success rate
        const success = Math.random() > 0.5
        setVerificationState(success ? 'success' : 'failure')
        if (success) {
          setDomainStatus('verified')
        }
      }, delay)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setVerificationState('idle')
  }, [])

  return (
    <div
      className="min-h-[calc(100dvh-64px)] py-12 px-4 sm:px-6"
      style={{ background: '#0a0a0f' }}
    >
      <div className="max-w-[800px] mx-auto">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
          style={{ color: '#6a6a82' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0b8' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6a6a82' }}
        >
          <ArrowLeft size={16} />
          Voltar para o Dashboard
        </motion.button>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-12"
        >
          <h1 className="font-space text-4xl md:text-5xl font-bold text-text-primary mb-3">
            Verificacao de Dominio
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="text-lg text-text-secondary max-w-[560px] mx-auto"
          >
            Antes de iniciar um teste de intrusao, precisamos confirmar que voce e o proprietario do dominio. Escolha um dos metodos abaixo para verificar.
          </motion.p>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center justify-center gap-2 mt-5"
          >
            <ShieldCheck size={16} color="#00ff88" />
            <span className="text-xs font-medium tracking-wide" style={{ color: '#6a6a82' }}>
              Esta verificacao protege contra escaneamentos nao autorizados
            </span>
          </motion.div>
        </motion.div>

        {/* Progress Steps */}
        <ProgressSteps
          steps={['domain', 'method', 'verify']}
          currentStep={currentStep}
          labels={stepLabels}
        />

        {/* Domain Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
          className="rounded-xl p-6 md:p-8 mb-6"
          style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="font-space text-xl font-semibold text-text-primary mb-5">
            Qual dominio deseja verificar?
          </h2>

          <div className="mb-4">
            <label className="block text-xs font-medium text-text-muted mb-2 tracking-wide">
              DOMINIO
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Globe
                  size={18}
                  color="#6a6a82"
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => {
                    setDomain(e.target.value)
                    setDomainStatus('unchecked')
                    setVerificationState('idle')
                    setCurrentStep(0)
                  }}
                  placeholder="exemplo.com.br"
                  className="w-full h-12 pl-11 pr-4 rounded-lg text-text-primary placeholder:text-text-muted outline-none transition-all duration-200"
                  style={{
                    background: '#12121a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    fontSize: '1rem',
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(0,240,255,0.5)'
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,240,255,0.1)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                />
              </div>
              <button
                onClick={checkDomainStatus}
                className="h-12 px-6 font-semibold rounded-lg transition-all duration-200 shrink-0"
                style={{
                  background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                  color: '#0a0a0f',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'brightness(1.1)'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
                onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
              >
                Verificar Status
              </button>
            </div>
          </div>

          {/* Domain Status */}
          <AnimatePresence>
            {domainStatus !== 'unchecked' && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="flex items-center gap-3 px-4 py-3 rounded-lg"
                style={
                  domainStatus === 'verified'
                    ? { background: 'rgba(0,255,136,0.06)', border: '1px solid rgba(0,255,136,0.15)' }
                    : domainStatus === 'not-verified'
                      ? { background: 'rgba(255,184,0,0.06)', border: '1px solid rgba(255,184,0,0.15)' }
                      : { background: 'rgba(255,0,68,0.06)', border: '1px solid rgba(255,0,68,0.15)' }
                }
              >
                {domainStatus === 'verified' ? (
                  <CheckCircle2 size={16} color="#00ff88" />
                ) : domainStatus === 'not-verified' ? (
                  <AlertCircle size={16} color="#ffb800" />
                ) : (
                  <XCircle size={16} color="#ff0044" />
                )}
                <span
                  className="text-sm flex-1"
                  style={
                    domainStatus === 'verified'
                      ? { color: '#00ff88' }
                      : domainStatus === 'not-verified'
                        ? { color: '#ffb800' }
                        : { color: '#ff0044' }
                  }
                >
                  {domainStatus === 'verified'
                    ? 'Dominio ja verificado! Voce pode iniciar escaneamentos.'
                    : domainStatus === 'not-verified'
                      ? 'Dominio nao verificado. Escolha um metodo de verificacao abaixo.'
                      : 'Por favor, insira um dominio valido.'}
                </span>
                {domainStatus === 'verified' && (
                  <button
                    onClick={() => navigate('/authorize')}
                    className="text-sm font-medium px-4 py-2 rounded-lg transition-all duration-200 shrink-0"
                    style={{
                      background: 'transparent',
                      border: '1px solid rgba(0,240,255,0.4)',
                      color: '#00f0ff',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(0,240,255,0.08)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                    }}
                  >
                    Iniciar Escaneamento
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Verification Methods */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.4 }}
        >
          {/* Tabs */}
          <div
            className="flex rounded-t-xl overflow-hidden"
            style={{ background: '#12121a', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex-1 flex items-center justify-center gap-2 py-4 px-2 text-sm font-medium transition-all duration-200"
                  style={{
                    color: isActive ? '#00f0ff' : '#6a6a82',
                    background: isActive ? 'rgba(0,240,255,0.04)' : 'transparent',
                    borderBottom: `2px solid ${isActive ? '#00f0ff' : 'transparent'}`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#a0a0b8'
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.color = '#6a6a82'
                  }}
                >
                  <tab.Icon size={20} />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content */}
          <div
            className="rounded-b-xl p-6 md:p-8"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none' }}
          >
            <AnimatePresence mode="wait">
              {activeTab === 'dns' && (
                <DnsVerifyTab
                  key="dns"
                  token={token}
                  domain={domain}
                  onVerify={handleVerify}
                  verificationState={verificationState}
                />
              )}
              {activeTab === 'html' && (
                <HtmlFileVerifyTab
                  key="html"
                  token={token}
                  domain={domain}
                  onVerify={handleVerify}
                  verificationState={verificationState}
                />
              )}
              {activeTab === 'meta' && (
                <MetaTagVerifyTab
                  key="meta"
                  token={token}
                  onVerify={handleVerify}
                  verificationState={verificationState}
                />
              )}
            </AnimatePresence>

            {/* Verification Result Banner */}
            <AnimatePresence>
              {verificationState !== 'idle' && verificationState !== 'checking' && (
                <VerificationResult
                  state={verificationState}
                  domain={domain}
                  onRetry={handleRetry}
                />
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
