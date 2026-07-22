import { useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Copy, Check, RefreshCw, Loader2, Download } from 'lucide-react'

interface HtmlFileVerifyTabProps {
  token: string
  domain: string
  onVerify: (result: 'success' | 'failure' | 'pending') => void
  verificationState: 'idle' | 'checking' | 'success' | 'failure'
}

export default function HtmlFileVerifyTab({ token, domain, onVerify, verificationState }: HtmlFileVerifyTabProps) {
  const [copiedFilename, setCopiedFilename] = useState(false)
  const [copiedContent, setCopiedContent] = useState(false)

  const filename = `strixguard_${token.substring(0, 8)}.html`
  const fileContent = `<html>\n  <body>strixguard-verify:${token}</body>\n</html>`
  const expectedUrl = `https://${domain || 'exemplo.com.br'}/${filename}`

  const handleCopyFilename = useCallback(() => {
    navigator.clipboard.writeText(filename).catch(() => {})
    setCopiedFilename(true)
    setTimeout(() => setCopiedFilename(false), 2000)
  }, [filename])

  const handleCopyContent = useCallback(() => {
    navigator.clipboard.writeText(fileContent).catch(() => {})
    setCopiedContent(true)
    setTimeout(() => setCopiedContent(false), 2000)
  }, [fileContent])

  const handleDownloadFile = useCallback(() => {
    const blob = new Blob([fileContent], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [fileContent, filename])

  const isChecking = verificationState === 'checking'

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="font-space text-xl font-medium text-text-primary mb-4">
        Faca upload de um arquivo HTML
      </h3>

      {/* Filename Display */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-2 tracking-wide">
          NOME DO ARQUIVO
        </label>
        <div className="flex items-center gap-2">
          <div
            className="flex-1 font-mono text-sm rounded-lg px-4 py-3 overflow-x-auto"
            style={{ background: '#08080e', color: '#00ff88' }}
          >
            {filename}
          </div>
          <button
            onClick={handleCopyFilename}
            className="p-3 rounded-lg transition-all duration-200 shrink-0"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#00f0ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            {copiedFilename ? <Check size={16} color="#00ff88" /> : <Copy size={16} color="#6a6a82" />}
          </button>
        </div>
      </div>

      {/* File Content */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-muted mb-2 tracking-wide">
          CONTEUDO DO ARQUIVO
        </label>
        <div className="relative">
          <div
            className="font-mono text-sm rounded-lg p-4 overflow-x-auto"
            style={{ background: '#08080e', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <pre className="text-text-muted">
              <span>{`<html>`}</span>{'\n'}
              <span>{`  <body>`}</span>
              <span style={{ color: '#00ff88' }}>strixguard-verify:{token}</span>
              <span>{`</body>`}</span>{'\n'}
              <span>{`</html>`}</span>
            </pre>
          </div>
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              onClick={handleCopyContent}
              className="p-2 rounded-md transition-all duration-200"
              style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.1)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#00f0ff' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
              title="Copiar conteudo"
            >
              {copiedContent ? <Check size={14} color="#00ff88" /> : <Copy size={14} color="#6a6a82" />}
            </button>
          </div>
        </div>
      </div>

      {/* Download Button */}
      <button
        onClick={handleDownloadFile}
        className="w-full mb-5 font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        style={{
          background: 'transparent',
          border: '1px solid rgba(0,240,255,0.4)',
          color: '#00f0ff',
          padding: '12px 24px',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,240,255,0.08)'
          e.currentTarget.style.borderColor = '#00f0ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)'
        }}
      >
        <Download size={16} />
        Baixar Arquivo
      </button>

      {/* Upload Instructions */}
      <div className="mb-5">
        <label className="block text-xs font-medium text-text-muted mb-3 tracking-wide">
          INSTRUCOES
        </label>
        <ol className="space-y-3 text-sm text-text-secondary">
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>1</span>
            <span>Crie um arquivo com o nome e conteudo exatos acima</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>2</span>
            <span>Faca o upload para o diretorio raiz do seu servidor web</span>
          </li>
          <li className="flex gap-3">
            <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium" style={{ background: 'rgba(0,240,255,0.1)', color: '#00f0ff' }}>3</span>
            <span>O arquivo deve estar acessivel em:</span>
          </li>
        </ol>
        <div
          className="mt-2 font-mono text-sm rounded-lg px-4 py-3 overflow-x-auto"
          style={{ background: '#08080e', color: '#00f0ff' }}
        >
          {expectedUrl}
        </div>
        <p className="mt-3 text-sm text-text-secondary">
          Clique em &quot;Verificar&quot; para confirmar
        </p>
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
