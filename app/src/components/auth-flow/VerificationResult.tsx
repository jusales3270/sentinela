import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

interface VerificationResultProps {
  state: 'idle' | 'checking' | 'success' | 'failure'
  domain: string
  onRetry: () => void
}

export default function VerificationResult({ state, domain, onRetry }: VerificationResultProps) {
  if (state === 'idle' || state === 'checking') return null

  const isSuccess = state === 'success'
  const isFailure = state === 'failure'

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      className="mt-6 overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="rounded-xl p-5"
        style={{
          background: isSuccess ? 'rgba(0,255,136,0.06)' : isFailure ? 'rgba(255,0,68,0.06)' : 'rgba(255,184,0,0.06)',
          border: `1px solid ${isSuccess ? 'rgba(0,255,136,0.2)' : isFailure ? 'rgba(255,0,68,0.2)' : 'rgba(255,184,0,0.2)'}`,
        }}
      >
        <div className="flex items-start gap-4">
          {/* Icon */}
          <motion.div
            initial={isSuccess ? { scale: 0 } : { scale: 1 }}
            animate={isSuccess ? { scale: [0, 1.2, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
            className="shrink-0"
          >
            {isSuccess ? (
              <CheckCircle2 size={28} color="#00ff88" />
            ) : isFailure ? (
              <XCircle size={28} color="#ff0044" />
            ) : (
              <Clock size={28} color="#ffb800" />
            )}
          </motion.div>

          {/* Content */}
          <div className="flex-1">
            <h4
              className="font-space text-lg font-semibold mb-1"
              style={{ color: isSuccess ? '#00ff88' : isFailure ? '#ff0044' : '#ffb800' }}
            >
              {isSuccess
                ? 'Dominio verificado com sucesso!'
                : isFailure
                  ? 'Verificacao falhou'
                  : 'Verificacao pendente'}
            </h4>
            <p className="text-sm text-text-secondary mb-4">
              {isSuccess
                ? `Voce pode agora iniciar escaneamentos em ${domain || 'seu dominio'}.`
                : isFailure
                  ? 'Nao foi possivel encontrar a verificacao no dominio. Verifique se seguiu as instrucoes corretamente.'
                  : 'A alteracao pode estar em propagacao. Aguarde alguns minutos e tente novamente.'}
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-3">
              {isSuccess ? (
                <Link
                  to="/authorize"
                  className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200"
                  style={{
                    background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                    color: '#0a0a0f',
                    padding: '12px 24px',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.filter = 'brightness(1.1)'
                    e.currentTarget.style.transform = 'scale(1.02)'
                    e.currentTarget.style.boxShadow = '0 0 20px rgba(0,240,255,0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.filter = 'none'
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = 'none'
                  }}
                >
                  Continuar para Autorizacao
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <button
                  onClick={onRetry}
                  className="inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-200"
                  style={{
                    background: 'transparent',
                    border: '1px solid rgba(0,240,255,0.4)',
                    color: '#00f0ff',
                    padding: '10px 20px',
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
                  <Clock size={16} />
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
