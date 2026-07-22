import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'

const links = [
  { label: 'Funcionalidades', href: '#funcionalidades' },
  { label: 'Agentes', href: '#agentes' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Preços', href: '#precos' },
]

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80)
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(8,8,14,0.72)' : 'transparent',
        backdropFilter: scrolled ? 'blur(18px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(18px)' : 'none',
        borderBottom: scrolled
          ? '1px solid rgba(255,255,255,0.06)'
          : '1px solid transparent',
      }}
    >
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src="/logo.svg"
            alt="Soma Shield"
            className="w-8 h-8 transition-transform duration-300 group-hover:rotate-[12deg]"
          />
          <span className="font-space text-lg font-bold text-text-primary tracking-tight">
            Soma Shield
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          {links.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm text-text-secondary hover:text-text-primary transition-colors duration-200"
            >
              {item.label}
            </a>
          ))}
        </div>

        <Link
          to="/dashboard"
          className="hidden md:inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-accent-cyan border border-accent-cyan/40 transition-all duration-200 hover:bg-accent-cyan/10"
        >
          Acessar plataforma
        </Link>

        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X size={24} color="#a0a0b8" /> : <Menu size={24} color="#a0a0b8" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="absolute top-16 left-0 right-0 md:hidden py-4 px-6"
            style={{
              background: 'rgba(8,8,14,0.96)',
              backdropFilter: 'blur(18px)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {links.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="block py-2.5 text-sm text-text-secondary hover:text-text-primary"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Link
              to="/dashboard"
              className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium text-accent-cyan border border-accent-cyan/40"
              onClick={() => setMobileOpen(false)}
            >
              Acessar plataforma
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
