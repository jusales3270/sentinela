import { useState, useCallback, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  FileSignature,
  Loader2,
  Shield,
  ArrowRight,
} from 'lucide-react'
import ProgressSteps from '../components/auth-flow/ProgressSteps'
import SignaturePad from '../components/auth-flow/SignaturePad'

function formatDate(): string {
  const now = new Date()
  return now.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function formatShortDate(): string {
  const now = new Date()
  return now.toISOString().split('T')[0].replace(/-/g, '')
}

function generateDocId(): string {
  return `STR-${formatShortDate()}-${String(Math.floor(Math.random() * 999)).padStart(3, '0')}`
}

const checkboxItems = [
  {
    id: 'owner',
    label: 'Declaro que sou o proprietario legal do dominio',
    highlight: 'proprietario legal',
  },
  {
    id: 'scope',
    label: 'Confirmo que o escopo do teste esta limitado ao dominio e subdominios autorizados,',
    highlight: 'excluindo sistemas de terceiros',
    suffix: 'e infraestrutura nao relacionada.',
  },
  {
    id: 'downtime',
    label: 'Entendo que os testes podem causar',
    highlight: 'indisponibilidade temporaria',
    suffix: 'de servicos e que tomarei as precaucoes necessarias (ex: backup, comunicacao interna).',
  },
  {
    id: 'terms',
    label: 'Li e concordo com todas as clausulas do Termo de Autorizacao acima, incluindo as disposicoes sobre',
    highlight: 'confidencialidade',
    highlight2: 'limitacao de responsabilidade',
    suffix: '.',
  },
]

const stepLabels = ['Verificar Dominio', 'Autorizar']

export default function AuthTerms() {
  const navigate = useNavigate()
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({
    owner: false,
    scope: false,
    downtime: false,
    terms: false,
  })
  const [hasSignature, setHasSignature] = useState(false)
  const [, setSignatureData] = useState<string | null>(null)
  const [showValidationError, setShowValidationError] = useState(false)
  const [signatureError, setSignatureError] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const docId = useMemo(() => generateDocId(), [])
  const currentDate = useMemo(() => formatDate(), [])
  const endDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }, [])
  const shakeRef = useRef<HTMLDivElement>(null)

  const allChecked = Object.values(checkedItems).every(Boolean)

  const handleCheckboxToggle = useCallback((id: string) => {
    setCheckedItems((prev) => ({ ...prev, [id]: !prev[id] }))
    setShowValidationError(false)
  }, [])

  const handleSignatureChange = useCallback((hasSig: boolean, dataUrl: string | null) => {
    setHasSignature(hasSig)
    setSignatureData(dataUrl)
    setSignatureError(false)
  }, [])

  const handleSubmit = useCallback(() => {
    let hasError = false

    if (!allChecked) {
      setShowValidationError(true)
      hasError = true

      // Shake animation
      if (shakeRef.current) {
        shakeRef.current.style.animation = 'none'
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        shakeRef.current.offsetHeight
        shakeRef.current.style.animation = 'shake 0.4s ease'
      }
    }

    if (!hasSignature) {
      setSignatureError(true)
      hasError = true
    }

    if (hasError) return

    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSuccess(true)
    }, 2000)
  }, [allChecked, hasSignature])

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-[calc(100dvh-64px)] py-12 px-4 sm:px-6 flex items-center justify-center" style={{ background: '#0a0a0f' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="max-w-[500px] w-full text-center"
        >
          {/* Success glow background */}
          <div
            className="mx-auto mb-6 w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(0,255,136,0.15) 0%, transparent 70%)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 }}
            >
              <CheckCircle2 size={56} color="#00ff88" strokeWidth={1.5} />
            </motion.div>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-space text-2xl md:text-3xl font-bold text-text-primary mb-3"
          >
            Termo assinado com sucesso!
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-text-secondary mb-2"
          >
            Sua autorizacao foi registrada e esta pronta para uso.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="rounded-lg p-4 mb-6 text-left"
            style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} color="#00f0ff" />
              <span className="text-sm font-medium" style={{ color: '#00f0ff' }}>Resumo da Autorizacao</span>
            </div>
            <p className="text-sm text-text-secondary">
              Documento: <span className="font-mono text-text-primary">{docId}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Data: <span className="text-text-primary">{currentDate}</span>
            </p>
            <p className="text-sm text-text-secondary">
              Validade: <span className="text-text-primary">7 dias</span>
            </p>
            <p className="text-sm text-text-secondary">
              Ttecnicas: <span className="text-text-primary">Varredura, injecao, controle de acesso, logica de negocio</span>
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <button
              onClick={() => navigate('/scan/demo')}
              className="inline-flex items-center gap-2 font-semibold rounded-lg transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
                padding: '14px 32px',
                fontSize: '1rem',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.filter = 'brightness(1.1)'
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0,240,255,0.3)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.filter = 'none'
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              Iniciar Pentest
              <ArrowRight size={18} />
            </button>

            <button
              onClick={() => navigate('/dashboard')}
              className="block mx-auto mt-4 text-sm transition-colors duration-200"
              style={{ color: '#6a6a82', background: 'none', border: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0b8' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#6a6a82' }}
            >
              Voltar para o Dashboard
            </button>
          </motion.div>
        </motion.div>
      </div>
    )
  }

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
          onClick={() => navigate('/verify-domain')}
          className="flex items-center gap-2 text-sm mb-8 transition-colors duration-200"
          style={{ color: '#6a6a82' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0b8' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#6a6a82' }}
        >
          <ArrowLeft size={16} />
          Voltar para Verificacao de Dominio
        </motion.button>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
          className="text-center mb-10"
        >
          {/* Document Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-block px-4 py-1.5 rounded-full text-xs font-medium tracking-widest mb-4"
            style={{
              background: 'rgba(255,184,0,0.1)',
              border: '1px solid rgba(255,184,0,0.2)',
              color: '#ffb800',
            }}
          >
            DOCUMENTO LEGAL
          </motion.div>

          <h1 className="font-space text-3xl md:text-4xl font-bold text-text-primary mb-3">
            Termo de Autorizacao para Teste de Intrusao
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-text-secondary max-w-[600px] mx-auto"
          >
            Este documento autoriza a StrixGuard a realizar testes de seguranca no dominio especificado abaixo. Leia atentamente antes de assinar.
          </motion.p>

          {/* Target Domain Display */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 inline-block"
          >
            <span className="block text-xs font-medium tracking-wide mb-1" style={{ color: '#6a6a82' }}>
              DOMINIO AUTORIZADO
            </span>
            <div
              className="font-mono text-lg px-6 py-3 rounded-lg inline-block"
              style={{
                background: '#12121a',
                border: '1px solid rgba(0,240,255,0.15)',
                color: '#00f0ff',
              }}
            >
              exemplo.com.br
            </div>
          </motion.div>
        </motion.div>

        {/* Progress Steps */}
        <ProgressSteps
          steps={['verify', 'authorize']}
          currentStep={1}
          labels={stepLabels}
        />

        {/* Legal Document */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.3 }}
          className="rounded-xl overflow-hidden mb-6"
          style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          {/* Document Header */}
          <div
            className="px-6 py-5 text-center"
            style={{
              background: '#12121a',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <h2 className="text-xs font-semibold tracking-widest uppercase" style={{ color: '#a0a0b8' }}>
              TERMO DE AUTORIZACAO PARA REALIZACAO DE TESTE DE INTRUSAO (TATI)
            </h2>
            <p className="text-xs mt-1" style={{ color: '#4a4a5e' }}>
              Documento N {docId}
            </p>
          </div>

          {/* Document Body - Scrollable */}
          <div
            className="px-6 py-6 overflow-y-auto custom-scrollbar"
            style={{ maxHeight: 400, background: '#0a0a0f' }}
          >
            <div className="font-inter text-[0.9375rem] leading-7" style={{ color: '#a0a0b8' }}>
              <p className="mb-4">
                Pelo presente Termo, o <strong className="text-text-primary">AUTORIZADOR</strong> concede a{' '}
                <strong className="text-text-primary">StrixGuard Tecnologia Ltda.</strong> (doravante denominada{' '}
                <strong className="text-text-primary">CONTRATADA</strong>) permissao para realizar testes de intrusao
                (penetration testing) na aplicacao web e infraestrutura associada ao dominio acima especificado.
              </p>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 1 - Objeto
              </h3>
              <p className="mb-4">
                1.1. <strong className="text-text-primary">CONTRATANTE:</strong> Usuario, doravante denominado
                &quot;CLIENTE&quot;, proprietario legal do(s) dominio(s) e sistema(s) listados neste documento.
                <br />
                1.2. <strong className="text-text-primary">CONTRATADA:</strong> StrixGuard Platform, doravante
                denominada &quot;CONTRATADA&quot;, especialista em testes de seguranca.
              </p>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 2 - Do Objeto
              </h3>
              <p className="mb-4">
                2.1. O presente termo autoriza a CONTRATADA a realizar testes de intrusao (pentest) nos seguintes sistemas:
              </p>
              <ul className="list-disc list-inside mb-4 space-y-1 ml-2">
                <li>
                  URL/Dominio: <span className="font-mono text-accent-cyan">exemplo.com.br</span>
                </li>
                <li>Escopo: Aplicacao web e APIs REST</li>
                <li>
                  Periodo: <span className="text-text-primary">{currentDate}</span> ate{' '}
                  <span className="text-text-primary">{endDate}</span>
                </li>
              </ul>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 3 - Das Tecnicas Autorizadas
              </h3>
              <p className="mb-2">3.1. Estao autorizadas as seguintes tecnicas de teste:</p>
              <ul className="list-[lower-alpha] list-inside mb-4 space-y-1 ml-2">
                <li>Varredura de portas e servicos</li>
                <li>Enumeracao de diretorios e endpoints</li>
                <li>Testes de injecao (SQL, NoSQL, XSS, Command)</li>
                <li>Testes de controle de acesso (IDOR, bypass)</li>
                <li>Testes de logica de negocio</li>
                <li>Testes de autenticacao e sessao</li>
                <li>Analise de configuracoes seguras</li>
              </ul>
              <p className="mb-2">3.2. <strong className="text-severity-critical">TECNICAS PROIBIDAS:</strong></p>
              <ul className="list-[lower-alpha] list-inside mb-4 space-y-1 ml-2">
                <li>Negacao de servico (DoS/DDoS)</li>
                <li>Exclusao ou modificacao de dados sem autorizacao previa</li>
                <li>Uso de dados encontrados para fins nao relacionados ao teste</li>
              </ul>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 4 - Da Responsabilidade
              </h3>
              <p className="mb-4">
                4.1. O CLIENTE declara ser o proprietario legal ou ter autorizacao expressa para testar o(s) sistema(s) listados.
              </p>
              <p className="mb-2">4.2. A CONTRATADA se compromete a:</p>
              <ul className="list-[lower-alpha] list-inside mb-4 space-y-1 ml-2">
                <li>Minimizar impactos na disponibilidade dos sistemas</li>
                <li>Nao divulgar informacoes encontradas a terceiros</li>
                <li>Destruir todos os dados coletados apos entrega do relatorio</li>
                <li>Reportar imediatamente vulnerabilidades criticas encontradas</li>
              </ul>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 5 - Do Tratamento de Dados (LGPD)
              </h3>
              <p className="mb-4">
                5.1. Os dados pessoais eventualmente acessados durante o teste serao tratados conforme a Lei 13.709/2018 (LGPD).
              </p>
              <p className="mb-4">
                5.2. A CONTRATADA atua como <strong className="text-text-primary">OPERADORA</strong> de dados, processando informacoes em nome do CLIENTE (<strong className="text-text-primary">CONTROLADOR</strong>).
              </p>
              <p className="mb-4">
                5.3. Base legal: execucao de contrato (Art. 7, V, LGPD).
              </p>
              <p className="mb-4">
                5.4. Os dados serao mantidos pelo periodo minimo necessario e depois descartados de forma segura.
              </p>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 6 - Do Prazo
              </h3>
              <p className="mb-4">
                6.1. O presente termo e valido pelo prazo de <strong className="text-text-primary">7 (sete) dias</strong> a partir da assinatura.
              </p>
              <p className="mb-4">
                6.2. O CLIENTE pode revogar esta autorizacao a qualquer momento mediante notificacao por escrito.
              </p>

              <h3 className="font-space text-lg font-medium text-text-primary mt-6 mb-3">
                Clausula 7 - Disposicoes Gerais
              </h3>
              <p className="mb-4">
                7.1. Este termo e regido pelas leis da Republica Federativa do Brasil.
              </p>
              <p className="mb-4">
                7.2. O CLIENTE isenta a CONTRATADA de responsabilidade por danos decorrentes de vulnerabilidades pre-existentes, desde que a CONTRATADA tenha agido conforme as praticas razoaveis do mercado.
              </p>
              <p className="mb-4">
                7.3. Fica eleito o foro da comarca de <strong className="text-text-primary">Sao Paulo/SP</strong> para dirimir quaisquer controversias.
              </p>
            </div>
          </div>

          {/* Document Footer */}
          <div
            className="px-6 py-4 text-right"
            style={{
              background: '#12121a',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <p className="text-sm" style={{ color: '#6a6a82' }}>
              Sao Paulo, {currentDate}
            </p>
          </div>
        </motion.div>

        {/* Scope Confirmation Checkboxes */}
        <motion.div
          ref={shakeRef}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.4 }}
          className="rounded-xl p-6 mb-6"
          style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h3 className="font-space text-xl font-semibold text-text-primary mb-5">
            Confirmacao de Escopo e Termos
          </h3>

          <div className="space-y-4">
            {checkboxItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="flex items-start gap-3"
              >
                <button
                  onClick={() => handleCheckboxToggle(item.id)}
                  className="shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center mt-0.5 transition-all duration-200"
                  style={{
                    background: checkedItems[item.id] ? '#00f0ff' : '#12121a',
                    borderColor: showValidationError && !checkedItems[item.id]
                      ? '#ff0044'
                      : checkedItems[item.id]
                        ? '#00f0ff'
                        : 'rgba(255,255,255,0.15)',
                  }}
                  onMouseEnter={(e) => {
                    if (!checkedItems[item.id] && !(showValidationError && !checkedItems[item.id])) {
                      e.currentTarget.style.borderColor = 'rgba(0,240,255,0.4)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!checkedItems[item.id] && !(showValidationError && !checkedItems[item.id])) {
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                    }
                  }}
                >
                  <AnimatePresence>
                    {checkedItems[item.id] && (
                      <motion.svg
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                      >
                        <path
                          d="M2.5 6L5 8.5L9.5 3.5"
                          stroke="#0a0a0f"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </motion.svg>
                    )}
                  </AnimatePresence>
                </button>
                <label className="text-sm leading-relaxed cursor-pointer select-none" style={{ color: '#a0a0b8' }}>
                  {item.label}{' '}
                  <strong className="text-text-primary font-medium">{item.highlight}</strong>
                  {item.highlight2 && (
                    <>
                      {' '}e <strong className="text-text-primary font-medium">{item.highlight2}</strong>
                    </>
                  )}
                  {item.suffix && <span> {item.suffix}</span>}
                </label>
              </motion.div>
            ))}
          </div>

          <AnimatePresence>
            {showValidationError && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 mt-3"
              >
                <AlertCircle size={14} color="#ff0044" />
                <span className="text-sm" style={{ color: '#ff0044' }}>
                  Por favor, confirme todos os termos acima para continuar.
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Signature Pad */}
        <SignaturePad
          onSignatureChange={handleSignatureChange}
          hasError={signatureError}
        />

        {/* Submit Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="max-w-[500px] mx-auto text-center"
        >
          {/* Legal Disclaimer */}
          <p className="text-xs leading-relaxed mb-5" style={{ color: '#4a4a5e' }}>
            Ao clicar em &quot;Autorizar Teste&quot;, voce concorda que esta assinatura eletronica tem o mesmo valor legal que uma assinatura manuscrita, nos termos da Lei 14.063/2017 (Medida Provisoria 2.200-2/2001).
          </p>

          {/* Submit Button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full max-w-[500px] font-semibold rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
              color: '#0a0a0f',
              padding: '16px 48px',
              fontSize: '1rem',
            }}
            onMouseEnter={(e) => {
              if (!isSubmitting) {
                e.currentTarget.style.filter = 'brightness(1.1)'
                e.currentTarget.style.transform = 'scale(1.02)'
                e.currentTarget.style.boxShadow = '0 0 25px rgba(0,240,255,0.25)'
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
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Processando...
                </>
              ) : (
                <>
                  <FileSignature size={18} />
                  Autorizar Teste
                </>
              )}
            </span>
          </motion.button>

          {/* Cancel Link */}
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-4 text-sm transition-colors duration-200"
            style={{ color: '#6a6a82', background: 'none', border: 'none' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#a0a0b8' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#6a6a82' }}
          >
            Voltar para o Dashboard
          </button>
        </motion.div>
      </div>
    </div>
  )
}
