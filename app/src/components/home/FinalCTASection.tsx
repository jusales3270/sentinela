import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Globe, ArrowRight } from 'lucide-react'
import MagneticButton from './shared/MagneticButton'

export default function FinalCTASection() {
  const [urlInput, setUrlInput] = useState('')
  const navigate = useNavigate()

  const handleScan = () => {
    // Send the visitor into the real funnel; the URL primes their intent.
    navigate('/verify-domain')
  }

  return (
    <section className="relative py-28 bg-bg-base overflow-hidden">
      {/* horizon glow */}
      <div
        className="absolute inset-x-0 bottom-0 h-[60%] pointer-events-none"
        style={{
          background:
            'radial-gradient(60% 100% at 50% 100%, rgba(0,240,255,0.16) 0%, rgba(0,255,136,0.06) 35%, transparent 70%)',
        }}
      />
      <div className="relative max-w-[760px] mx-auto px-4 sm:px-6 text-center">
        <motion.h2
          className="font-space font-semibold text-white"
          style={{ fontSize: 'clamp(2rem, 5vw, 3.4rem)', letterSpacing: '-0.03em', lineHeight: 1.08 }}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        >
          Seu próximo relatório de segurança
          <br />
          <span className="text-gradient-brand">começa com uma URL.</span>
        </motion.h2>

        <motion.p
          className="mt-5 text-text-secondary mx-auto max-w-[520px]"
          style={{ fontSize: '1.075rem', lineHeight: 1.65 }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0, 0, 0.2, 1] }}
        >
          Verifique o domínio, assine a autorização e deixe os agentes trabalharem.
          O primeiro relatório sai em minutos.
        </motion.p>

        <motion.div
          className="mt-10 mx-auto max-w-[560px]"
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div
            className="flex items-center gap-3 rounded-2xl bg-bg-secondary/80 backdrop-blur-md focus-within:border-accent-cyan/60 transition-all duration-300"
            style={{ border: '1px solid rgba(0,240,255,0.25)', height: '60px', padding: '4px 4px 4px 18px' }}
          >
            <Globe size={19} className="text-text-muted shrink-0" />
            <input
              type="url"
              inputMode="url"
              placeholder="https://seusite.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleScan()}
              className="flex-1 min-w-0 bg-transparent text-white outline-none font-inter"
              aria-label="URL para verificar"
            />
            <MagneticButton onClick={handleScan} className="shrink-0">
              Começar <ArrowRight size={15} />
            </MagneticButton>
          </div>
          <p className="mt-4 text-xs text-text-muted">
            Grátis para começar · sem cartão de crédito · verificação de domínio obrigatória
          </p>
        </motion.div>
      </div>
    </section>
  )
}
