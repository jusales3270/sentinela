import { useRef, useCallback } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/**
 * Magnetic hover: the element eases toward the cursor while hovered and
 * springs back on leave. Disabled on coarse pointers and reduced motion.
 */
export function useMagnetic<T extends HTMLElement = HTMLElement>(strength = 0.35) {
  const ref = useRef<T>(null)
  const quickX = useRef<ReturnType<typeof gsap.quickTo> | null>(null)
  const quickY = useRef<ReturnType<typeof gsap.quickTo> | null>(null)

  const enabled = useCallback(() => {
    if (typeof window === 'undefined') return false
    if (prefersReducedMotion()) return false
    return window.matchMedia('(hover: hover) and (pointer: fine)').matches
  }, [])

  const onMouseEnter = useCallback(() => {
    if (!ref.current || !enabled()) return
    quickX.current = gsap.quickTo(ref.current, 'x', { duration: 0.4, ease: 'power3' })
    quickY.current = gsap.quickTo(ref.current, 'y', { duration: 0.4, ease: 'power3' })
  }, [enabled])

  const onMouseMove = useCallback(
    (e: React.MouseEvent<T>) => {
      if (!ref.current || !quickX.current || !quickY.current) return
      const rect = ref.current.getBoundingClientRect()
      const relX = e.clientX - (rect.left + rect.width / 2)
      const relY = e.clientY - (rect.top + rect.height / 2)
      quickX.current(relX * strength)
      quickY.current(relY * strength)
    },
    [strength],
  )

  const onMouseLeave = useCallback(() => {
    if (!ref.current) return
    gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
  }, [])

  return { ref, onMouseEnter, onMouseMove, onMouseLeave }
}
