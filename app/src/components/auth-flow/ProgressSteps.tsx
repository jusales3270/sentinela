import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

interface ProgressStepsProps {
  steps: string[]
  currentStep: number
  labels: string[]
}

export default function ProgressSteps({ steps, currentStep, labels }: ProgressStepsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay: 0.2 }}
      className="relative w-full max-w-[500px] mx-auto mb-10"
    >
      {/* Connector line background */}
      <div className="absolute top-5 left-10 right-10 h-0.5" style={{ background: 'rgba(255,255,255,0.1)' }} />

      {/* Active connector line */}
      <motion.div
        className="absolute top-5 left-10 h-0.5"
        style={{ background: '#00f0ff' }}
        initial={{ width: '0%' }}
        animate={{ width: `${(Math.min(currentStep, steps.length - 1) / (steps.length - 1)) * 100}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }}
      />

      {/* Step circles */}
      <div className="relative flex justify-between">
        {steps.map((_, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isPending = index > currentStep

          return (
            <div key={index} className="flex flex-col items-center">
              <motion.div
                className="relative flex items-center justify-center w-10 h-10 rounded-full border-2"
                animate={
                  isCompleted
                    ? { backgroundColor: 'rgba(0,255,136,0.15)', borderColor: '#00ff88', scale: 1 }
                    : isActive
                      ? {
                          backgroundColor: '#00f0ff',
                          borderColor: '#00f0ff',
                          scale: [1, 1.05, 1],
                        }
                      : { backgroundColor: 'transparent', borderColor: 'rgba(255,255,255,0.15)', scale: 1 }
                }
                transition={
                  isActive
                    ? {
                        scale: { repeat: Infinity, duration: 2, ease: 'easeInOut' },
                        backgroundColor: { duration: 0.3 },
                        borderColor: { duration: 0.3 },
                      }
                    : { duration: 0.3 }
                }
                style={
                  isActive
                    ? { boxShadow: '0 0 15px rgba(0,240,255,0.3)' }
                    : {}
                }
              >
                {isCompleted ? (
                  <Check size={18} color="#00ff88" strokeWidth={3} />
                ) : (
                  <span
                    className="text-sm font-bold"
                    style={{ color: isActive ? '#0a0a0f' : isPending ? '#6a6a82' : '#ffffff' }}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>
              <span
                className="mt-2 text-xs font-medium"
                style={{
                  color: isCompleted ? '#00ff88' : isActive ? '#00f0ff' : '#6a6a82',
                }}
              >
                {labels[index]}
              </span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
