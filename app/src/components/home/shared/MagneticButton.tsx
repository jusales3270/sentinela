import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { useMagnetic } from '../../../hooks/useMagnetic'

interface MagneticButtonProps {
  children: ReactNode
  to?: string
  onClick?: () => void
  variant?: 'primary' | 'ghost'
  className?: string
  strength?: number
  type?: 'button' | 'submit'
}

const base =
  'relative inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition-[filter,box-shadow] duration-200 will-change-transform'

const variants = {
  primary:
    'text-bg-base bg-gradient-brand hover:brightness-110 shadow-[0_0_28px_-6px_rgba(0,240,255,0.6)]',
  ghost:
    'text-accent-cyan border border-accent-cyan/40 hover:bg-accent-cyan/10 backdrop-blur-sm',
}

export default function MagneticButton({
  children,
  to,
  onClick,
  variant = 'primary',
  className = '',
  strength = 0.4,
  type = 'button',
}: MagneticButtonProps) {
  const magnetic = useMagnetic<HTMLAnchorElement & HTMLButtonElement>(strength)
  const classes = `${base} ${variants[variant]} ${className}`

  const handlers = {
    ref: magnetic.ref,
    onMouseEnter: magnetic.onMouseEnter,
    onMouseMove: magnetic.onMouseMove,
    onMouseLeave: magnetic.onMouseLeave,
  }

  if (to) {
    return (
      <Link to={to} onClick={onClick} className={classes} {...handlers}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} onClick={onClick} className={classes} {...handlers}>
      {children}
    </button>
  )
}
