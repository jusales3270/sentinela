import { useRef, useCallback } from 'react'
import type { ReactNode, CSSProperties } from 'react'

interface SpotlightCardProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** rgb triplet for the spotlight glow */
  glow?: string
}

/**
 * Card with a radial glow that follows the cursor. The pointer position is
 * written to CSS custom properties inside a rAF frame, so it never triggers a
 * React re-render.
 */
export default function SpotlightCard({
  children,
  className = '',
  style,
  glow = '0, 240, 255',
}: SpotlightCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const frame = useRef<number | null>(null)

  const onMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const { clientX, clientY } = e
    if (frame.current) return
    frame.current = requestAnimationFrame(() => {
      frame.current = null
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${clientX - rect.left}px`)
      el.style.setProperty('--my', `${clientY - rect.top}px`)
      el.style.setProperty('--spot-opacity', '1')
    })
  }, [])

  const onMouseLeave = useCallback(() => {
    ref.current?.style.setProperty('--spot-opacity', '0')
  }, [])

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={`group relative overflow-hidden rounded-2xl border border-white/[0.07] bg-bg-secondary/70 transition-colors duration-300 hover:border-white/[0.14] ${className}`}
      style={
        {
          '--spot-opacity': '0',
          '--glow': glow,
          ...style,
        } as CSSProperties
      }
    >
      {/* cursor spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity duration-300"
        style={{
          opacity: 'var(--spot-opacity)',
          background:
            'radial-gradient(340px circle at var(--mx) var(--my), rgba(var(--glow), 0.12), transparent 70%)',
        }}
      />
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}
