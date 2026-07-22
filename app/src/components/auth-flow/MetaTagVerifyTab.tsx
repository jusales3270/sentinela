import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, Loader2 } from 'lucide-react'

interface MetaTagVerifyTabProps {
  token: string
  onVerify: (result: 'success' | 'failure' | 'pending') => void
  verificationState: 'idle' | 'checking' | 'success' | 'failure'
}

export default function MetaTagVerifyTab({ token, onVerify, verificationState }: MetaTagVerifyTabProps) {
  const [copiedTag, setCopiedTag] = useState(false)

  const metaTag = `<meta name="strixguard-verify" content="${token}" />`

  const handleCopyTag = useCallback(() => {
    navigator.clipboard.writeText(metaTag).catch(() => {})
    setCopiedTag(true)
    setTimeout(() => setCopiedTag(false), 2000)
  }, [metaTag])

  const isChecking = verificationState === 'checking'

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-space text-xl font-medium text-text-primary mb-4">
        Adicione uma meta tag ao HTML
      </h3>

      {/* Meta Tag Code */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-muted mb-2 tracking-wide">
          ADICIONE ESTA TAG DENTRO DA SECAO &lt;head&gt; DA SUA PAGINA PRINCIPAL
        </label>
        <div className="relative">
          <div
            className="font-mono text-sm rounded-lg p-4 overflow-x-auto"
            style={{ background: '#08080e', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <pre>
              <span style={{ color: '#6a6a82' }}>&lt;meta </span>
              <span style={{ color: '#b967ff' }}>name</span>
              <span style={{ color: '#6a6a82' }}>=</span>
              <span style={{ color: '#00ff88' }}>&quot;strixguard-verify&quot;</span>
              <span style={{ color: '#6a6a82' }}> </span>
              <span style={{ color: '#b967ff' }}>content</span>
              <span style={{ color: '#6a6a82' }}>=</span>
              <span style={{ color: '#00ff88' }}>&quot;{token}&quot;</span>
              <span style={{ color: '#6a6a82' }}> /&gt;</span>
            </pre>
          </div>
          <button
            onClick={handleCopyTag}
            className="absolute top-2 right-2 p-2 rounded-md transition-all duration-200"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00f0ff' }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
            title="Copiar meta tag"
          >
            {copiedTag ? <Check size={14} color="#00ff88" /> : <Copy size={14} color="#6a6a82" />}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-muted mb-3 tracking-wide">
          INSTRUCOES
        </label>
        <ol className="space-y-3 text-sm text-text-secondary">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>1</span>
            <span>Acesse o codigo-fonte da sua pagina principal (geralmente index.html)</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>2</span>
            <span>Adicione a meta tag acima dentro da secao <code className="px-1.5 py-0.5 rounded font-mono text-xs" style={{ background: '#1a1a2e', color: '#00f0ff' }}>&lt;head&gt;...&lt;/head&gt;</code></span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>3</span>
            <span>Salve o arquivo e faca o deploy (se necessario)</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>4</span>
            <span>Clique em &quot;Verificar&quot; para confirmar</span>
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
