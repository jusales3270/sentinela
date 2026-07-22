import { useRef, useState, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eraser } from 'lucide-react'

interface SignaturePadProps {
  onSignatureChange: (hasSignature: boolean, dataUrl: string | null) => void
  hasError?: boolean
}

export default function SignaturePad({ onSignatureChange, hasError = false }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Set canvas resolution for high-DPI displays
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#00f0ff'
    }
  }, [])

  const getPos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0 }
    const rect = canvas.getBoundingClientRect()

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }, [])

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    setIsDrawing(true)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }, [getPos])

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!isDrawing) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    const { x, y } = getPos(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }, [isDrawing, getPos])

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    ctx.closePath()

    if (!hasDrawn) {
      setHasDrawn(true)
      const dataUrl = canvas?.toDataURL('image/png') || null
      onSignatureChange(true, dataUrl)
    }
  }, [isDrawing, hasDrawn, onSignatureChange])

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    const rect = canvas.getBoundingClientRect()
    ctx.clearRect(0, 0, rect.width, rect.height)
    setHasDrawn(false)
    onSignatureChange(false, null)
  }, [onSignatureChange])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.5 }}
      className="rounded-xl p-6 mb-6"
      style={{ background: '#12121a', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <h3 className="font-space text-xl font-medium text-text-primary mb-1">
        Assinatura Eletronica
      </h3>
      <p className="text-sm text-text-muted mb-4">
        Desenhe sua assinatura no campo abaixo usando o mouse ou touch.
      </p>

      {/* Canvas container */}
      <div className="relative w-full" style={{ maxWidth: 700 }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full rounded-lg cursor-crosshair"
          style={{
            height: 180,
            background: '#08080e',
            border: `1px solid ${hasError ? '#ff0044' : hasDrawn ? 'rgba(0,240,255,0.3)' : 'rgba(255,255,255,0.1)'}`,
            transition: 'border-color 300ms ease',
            touchAction: 'none',
          }}
        />

        {/* Placeholder text */}
        {!hasDrawn && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ color: '#1a1a2e' }}
          >
            <span className="font-space text-lg">Assine aqui</span>
          </div>
        )}

        {/* Grid lines - subtle */}
        <svg
          className="absolute inset-0 pointer-events-none w-full h-full"
          style={{ opacity: 0.03 }}
          preserveAspectRatio="none"
        >
          <line x1="50%" y1="0" x2="50%" y2="100%" stroke="white" strokeWidth="1" strokeDasharray="4" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="white" strokeWidth="1" strokeDasharray="4" />
        </svg>
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs" style={{ color: '#6a6a82' }}>
          Assinatura de: <span className="text-text-secondary">Usuario</span>
        </span>
        <button
          onClick={clearSignature}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
          style={{
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#a0a0b8',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#ffffff'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#a0a0b8'
          }}
        >
          <Eraser size={14} />
          Limpar
        </button>
      </div>
    </motion.div>
  )
}
