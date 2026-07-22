import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'

interface DnsVerifyTabProps {
  token: string
  domain: string
  onVerify: (result: 'success' | 'failure' | 'pending') => void
  verificationState: 'idle' | 'checking' | 'success' | 'failure'
}

export default function DnsVerifyTab({ token, domain, onVerify, verificationState }: DnsVerifyTabProps) {
  const [copiedToken, setCopiedToken] = useState(false)

  const handleCopyToken = useCallback(() => {
    navigator.clipboard.writeText(`strixguard-verify=${token}`).catch(() => {})
    setCopiedToken(true)
    setTimeout(() => setCopiedToken(false), 2000)
  }, [token])

  const isChecking = verificationState === 'checking'

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-space text-xl font-medium text-text-primary mb-4">
        Adicione um registro TXT ao seu DNS
      </h3>

      {/* Token Display */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-muted mb-2 tracking-wide">
          SEU TOKEN DE VERIFICACAO
        </label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 font-mono text-sm rounded-lg px-4 py-3 overflow-x-auto"
            style={{ background: '#08080e', color: '#00ff88' }}
          >
            strixguard-verify={token}
          </div>
          <button
            onClick={handleCopyToken}
            className="p-3 rounded-lg transition-all duration-200 shrink-0"
            style={{
              background: '#12121a',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f0ff'
              e.currentTarget.style.color = '#00f0ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              e.currentTarget.style.color = '#6a6a82'
            }}
          >
            {copiedToken ? <Check size={16} color="#00ff88" /> : <Copy size={16} color="#6a6a82" />}
          </button>
        </div>
        <AnimatePresence>
          {copiedToken && (
            <motion.span
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-xs mt-1 block"
              style={{ color: '#00ff88' }}
            >
              Copiado!
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* DNS Setup Instructions */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-muted mb-3 tracking-wide">
          CONFIGURACAO DNS
        </label>
        <ol className="space-y-3 text-sm text-text-secondary">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>1</span>
            <span>Acesse o painel de controle do seu provedor de DNS</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>2</span>
            <span>Adicione um novo registro TXT com as seguintes configuracoes:</span>
          </li>
        </ol>

        {/* DNS Record Table */}
        <div
          className="mt-3 rounded-lg overflow-hidden"
          style={{ background: '#0a0a0f', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          {[
            { label: 'Tipo', value: 'TXT' },
            { label: 'Nome/Host', value: `@  (ou ${domain || 'seudominio.com'})` },
            { label: 'Valor', value: `strixguard-verify=${token}`, isCode: true },
            { label: 'TTL', value: '3600 (ou padrao)' },
          ].map((row, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: i < 3 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
            >
              <span className="text-xs font-medium tracking-wide" style={{ color: '#6a6a82' }}>{row.label}</span>
              <span
                className={`text-sm ${row.isCode ? 'font-mono' : ''}`}
                style={{ color: row.isCode ? '#00ff88' : '#ffffff' }}
              >
                {row.value}
              </span>
            </div>
          ))}
        </div>

        <ol className="space-y-3 mt-3 text-sm text-text-secondary" start={3}>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>3</span>
            <span>Aguarde a propagacao do DNS (pode levar ate 24 horas, geralmente 5-30 minutos)</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>4</span>
            <span>Clique em &quot;Verificar&quot; abaixo</span>
          </li>
        </ol>
      </div>

      {/* Verify Button */}
      <button
        onClick={() => onVerify('pending')}
        disabled={isChecking}
        className="w-full max-w-[400px] mx-auto block font-semibold rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
          color: '#0a0a0f',
          padding: '14px 24px',
          fontSize: '1rem',
        }}
        onMouseEnter={(e) => {
          if (!isChecking) {
            e.currentTarget.style.filter = 'brightness(1.1)'
            e.currentTarget.style.transform = 'scale(1.02)'
            e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none'
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = 'none'
        }}
        onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.98)' }}
        onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1.02)' }}
      >
        <span className="flex items-center justify-center gap-2">
          {isChecking ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verificando...
            </>
          ) : (
            <>
              <RefreshCw size={16} />
              Verificar Dominio
            </>
          )}
        </span>
      </button>
    </motion.div>
  )
}
