import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Bell, ChevronDown, Menu, X } from 'lucide-react'

const navLinks = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Scans', path: '/scan/demo' },
  { label: 'Relatorios', path: '/reports' },
  { label: 'Configuracoes', path: '/settings' },
]

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center"
      style={{
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.svg" alt="Soma Shield" className="w-8 h-8" />
          <span className="font-space text-xl font-bold text-text-primary">
            Soma Shield
          </span>
        </Link>

        {/* Center: Nav links - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                className="relative px-4 py-2 text-sm font-medium transition-colors duration-200"
                style={{
                  color: isActive ? '#00f0ff' : '#a0a0b8',
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-4 right-4 h-0.5"
                    style={{ background: '#00f0ff' }}
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Right: Notification + Avatar */}
        <div className="hidden md:flex items-center gap-3">
          <button
            className="relative p-2 rounded-lg transition-colors duration-200 hover:bg-bg-secondary"
            aria-label="Notificacoes"
          >
            <Bell size={20} color="#a0a0b8" />
            <span
              className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
              style={{ background: '#ff0044' }}
            />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1.5 rounded-lg transition-colors duration-200 hover:bg-bg-secondary"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold"
                style={{ background: 'rgba(0,240,255,0.15)', color: '#00f0ff' }}
              >
                US
              </div>
              <ChevronDown size={14} color="#6a6a82" />
            </button>

            {userMenuOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-48 rounded-xl overflow-hidden"
                style={{
                  background: '#12121a',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
                }}
              >
                <div className="px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <p className="text-sm font-medium text-text-primary">Usuario</p>
                  <p className="text-xs text-text-muted">usuario@email.com</p>
                </div>
                <Link
                  to="/settings"
                  className="block px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Configuracoes
                </Link>
                <button className="w-full text-left px-4 py-2 text-sm text-severity-critical hover:bg-bg-hover transition-colors">
                  Sair
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={24} color="#a0a0b8" /> : <Menu size={24} color="#a0a0b8" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div
          className="absolute top-16 left-0 right-0 md:hidden"
          style={{
            background: 'rgba(10,10,15,0.95)',
            backdropFilter: 'blur(16px)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {navLinks.map((link) => {
            const isActive = location.pathname.startsWith(link.path)
            return (
              <Link
                key={link.path}
                to={link.path}
                className="block px-6 py-3 text-sm font-medium transition-colors"
                style={{ color: isActive ? '#00f0ff' : '#a0a0b8' }}
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      )}
    </nav>
  )
}
