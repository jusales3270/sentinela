import { Github, Linkedin, Twitter } from 'lucide-react'
import { Link } from 'react-router-dom'

const productLinks = [
  { label: 'Funcionalidades', href: '/#funcionalidades' },
  { label: 'Agentes', href: '/#agentes' },
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Preços', href: '/#precos' },
]

const companyLinks = [
  { label: 'Sobre', href: '#' },
  { label: 'Blog', href: '#' },
  { label: 'Contato', href: '#' },
]

const legalLinks = [
  { label: 'Termos de Serviço', href: '#' },
  { label: 'Privacidade', href: '#' },
  { label: 'LGPD', href: '#' },
]

export default function Footer() {
  return (
    <footer
      style={{
        background: '#050507',
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo.svg" alt="Soma Shield" className="w-8 h-8" />
              <span className="font-space text-xl font-bold text-text-primary">
                Soma Shield
              </span>
            </Link>
            <p className="mt-2 text-sm text-text-muted">
              Plataforma Autônoma de Pentest com IA
            </p>
            <div className="flex items-center gap-4 mt-5">
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors duration-200 hover:scale-110 transform">
                <Github size={20} />
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors duration-200 hover:scale-110 transform">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-text-muted hover:text-text-primary transition-colors duration-200 hover:scale-110 transform">
                <Twitter size={20} />
              </a>
            </div>
          </div>

          {/* Produto */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Produto
            </h4>
            <ul className="space-y-3">
              {productLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Empresa */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Empresa
            </h4>
            <ul className="space-y-3">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-text-primary mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              {legalLinks.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs text-text-muted">
            &copy; 2025 Soma Shield. Todos os direitos reservados.
          </p>
          <p className="text-xs text-text-muted">
            Feito no Brasil
          </p>
        </div>
      </div>
    </footer>
  )
}
