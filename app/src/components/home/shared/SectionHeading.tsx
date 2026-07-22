import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

const easeOut = [0, 0, 0.2, 1] as [number, number, number, number]

interface SectionHeadingProps {
  eyebrow: string
  title: ReactNode
  /** Optional gradient continuation rendered on its own line */
  gradient?: ReactNode
  subtitle?: ReactNode
  align?: 'center' | 'left'
  className?: string
}

export default function SectionHeading({
  eyebrow,
  title,
  gradient,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeadingProps) {
  const isCenter = align === 'center'
  return (
    <motion.div
      className={`${isCenter ? 'text-center mx-auto' : 'text-left'} ${className}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: easeOut }}
    >
      <div
        className={`inline-flex items-center gap-2 ${isCenter ? 'justify-center' : ''}`}
      >
        <span
          className="h-px w-6"
          style={{ background: 'linear-gradient(90deg, transparent, #00f0ff)' }}
        />
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-accent-cyan">
          {eyebrow}
        </p>
        <span
          className="h-px w-6"
          style={{ background: 'linear-gradient(90deg, #00f0ff, transparent)' }}
        />
      </div>
      <h2
        className="font-space font-semibold text-white mt-4 text-3xl lg:text-[2.5rem]"
        style={{ letterSpacing: '-0.02em', lineHeight: 1.15 }}
      >
        {title}
        {gradient && (
          <>
            {' '}
            <span className="text-gradient-brand">{gradient}</span>
          </>
        )}
      </h2>
      {subtitle && (
        <p
          className={`mt-4 text-text-secondary ${isCenter ? 'mx-auto max-w-[600px]' : 'max-w-[560px]'}`}
          style={{ fontSize: '1.075rem', lineHeight: 1.65 }}
        >
          {subtitle}
        </p>
      )}
    </motion.div>
  )
}
