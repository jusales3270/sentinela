// Data-driven script for the cinematic hero scan simulation.
// Curated to tell the same story as the real scan page (src/components/scan/logData.ts),
// but compressed to ~12s and paired with radar coordinates.

export type Phase = 'idle' | 'booting' | 'recon' | 'exploit' | 'validate' | 'complete'

export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM'

export interface SimLog {
  agent: 'INIT' | 'RECON' | 'EXPLOIT' | 'VALIDATE'
  text: string
  tone?: 'info' | 'warn' | 'vuln' | 'success'
}

export interface SimEndpoint {
  id: string
  angle: number // degrees
  radius: number // 0..1 fraction of radar radius
}

export interface SimFinding {
  id: string
  name: string
  endpoint: string
  severity: Severity
  cvss: number
  angle: number
  radius: number
}

export type SimEvent =
  | { at: number; type: 'phase'; phase: Phase }
  | { at: number; type: 'progress'; value: number }
  | { at: number; type: 'log'; log: SimLog }
  | { at: number; type: 'endpoint'; endpoint: SimEndpoint }
  | { at: number; type: 'vuln'; finding: SimFinding }

// polar helper for scattering endpoints around the radar
const ep = (id: string, angle: number, radius: number): SimEndpoint => ({ id, angle, radius })

export const SIM_DURATION = 12 // seconds

export const scanScript: SimEvent[] = [
  // --- BOOTING ---
  { at: 0.0, type: 'phase', phase: 'booting' },
  { at: 0.1, type: 'log', log: { agent: 'INIT', text: 'Soma Shield v1.0 · inicializando agentes...' } },
  { at: 0.5, type: 'log', log: { agent: 'INIT', text: 'Recon · Exploit · Validate → PRONTOS', tone: 'success' } },
  { at: 0.9, type: 'log', log: { agent: 'INIT', text: 'Ambiente sandbox: ATIVO' } },
  { at: 1.3, type: 'progress', value: 8 },

  // --- RECON ---
  { at: 1.5, type: 'phase', phase: 'recon' },
  { at: 1.6, type: 'log', log: { agent: 'RECON', text: 'Iniciando reconhecimento da superfície de ataque...' } },
  { at: 1.9, type: 'log', log: { agent: 'RECON', text: 'Portas abertas: 80, 443, 8080' } },
  { at: 2.0, type: 'endpoint', endpoint: ep('e1', 20, 0.5) },
  { at: 2.2, type: 'log', log: { agent: 'RECON', text: 'Stack: nginx/1.24 · React · Node 20 · PostgreSQL 15' } },
  { at: 2.3, type: 'endpoint', endpoint: ep('e2', 65, 0.7) },
  { at: 2.5, type: 'endpoint', endpoint: ep('e3', 110, 0.42) },
  { at: 2.6, type: 'log', log: { agent: 'RECON', text: '3 subdomínios encontrados: api · admin · dev' } },
  { at: 2.7, type: 'endpoint', endpoint: ep('e4', 150, 0.78) },
  { at: 2.9, type: 'endpoint', endpoint: ep('e5', 190, 0.55) },
  { at: 3.0, type: 'log', log: { agent: 'RECON', text: 'X-Frame-Options e CSP ausentes', tone: 'warn' } },
  { at: 3.1, type: 'endpoint', endpoint: ep('e6', 225, 0.68) },
  { at: 3.2, type: 'endpoint', endpoint: ep('e7', 260, 0.38) },
  { at: 3.3, type: 'progress', value: 26 },
  { at: 3.4, type: 'endpoint', endpoint: ep('e8', 300, 0.72) },
  { at: 3.6, type: 'endpoint', endpoint: ep('e9', 335, 0.5) },
  { at: 3.7, type: 'log', log: { agent: 'RECON', text: 'Crawling do sitemap... superfície de ataque mapeada' } },
  { at: 3.9, type: 'endpoint', endpoint: ep('e10', 45, 0.85) },
  { at: 4.1, type: 'endpoint', endpoint: ep('e11', 130, 0.62) },
  { at: 4.3, type: 'endpoint', endpoint: ep('e12', 280, 0.58) },
  { at: 4.5, type: 'progress', value: 42 },

  // --- EXPLOIT ---
  { at: 4.8, type: 'phase', phase: 'exploit' },
  { at: 4.9, type: 'log', log: { agent: 'EXPLOIT', text: 'Executando exploits em ambiente controlado...' } },
  { at: 5.3, type: 'log', log: { agent: 'EXPLOIT', text: "Testando injeção SQL em /api/users?id=..." } },
  {
    at: 5.7,
    type: 'vuln',
    finding: { id: 'v1', name: 'SQL Injection', endpoint: '/api/users', severity: 'CRITICAL', cvss: 9.8, angle: 20, radius: 0.5 },
  },
  { at: 5.8, type: 'log', log: { agent: 'EXPLOIT', text: 'SQL Injection (UNION-based) confirmada — CVSS 9.8', tone: 'vuln' } },
  { at: 6.1, type: 'progress', value: 58 },
  { at: 6.3, type: 'log', log: { agent: 'EXPLOIT', text: 'Analisando token JWT no endpoint de login...' } },
  {
    at: 6.7,
    type: 'vuln',
    finding: { id: 'v2', name: 'JWT alg=none', endpoint: '/api/auth/login', severity: 'CRITICAL', cvss: 9.1, angle: 150, radius: 0.78 },
  },
  { at: 6.8, type: 'log', log: { agent: 'EXPLOIT', text: 'Bypass de autenticação via alg=none — CVSS 9.1', tone: 'vuln' } },
  { at: 7.2, type: 'log', log: { agent: 'EXPLOIT', text: 'Testando XSS refletido em /search?q=...' } },
  {
    at: 7.5,
    type: 'vuln',
    finding: { id: 'v3', name: 'XSS Refletido', endpoint: '/search', severity: 'HIGH', cvss: 7.5, angle: 260, radius: 0.38 },
  },
  { at: 7.6, type: 'log', log: { agent: 'EXPLOIT', text: 'XSS refletido sem sanitização — CVSS 7.5', tone: 'vuln' } },
  { at: 7.9, type: 'progress', value: 72 },
  { at: 8.1, type: 'log', log: { agent: 'EXPLOIT', text: 'Testando SSRF em /api/fetch...' } },
  {
    at: 8.4,
    type: 'vuln',
    finding: { id: 'v4', name: 'SSRF', endpoint: '/api/fetch', severity: 'MEDIUM', cvss: 6.8, angle: 300, radius: 0.72 },
  },
  { at: 8.5, type: 'log', log: { agent: 'EXPLOIT', text: 'SSRF → metadata interna acessível — CVSS 6.8', tone: 'vuln' } },
  { at: 8.8, type: 'progress', value: 82 },

  // --- VALIDATE ---
  { at: 9.0, type: 'phase', phase: 'validate' },
  { at: 9.1, type: 'log', log: { agent: 'VALIDATE', text: 'Confirmando exploração de cada achado...' } },
  { at: 9.5, type: 'log', log: { agent: 'VALIDATE', text: 'PoC SQLi: credenciais de admin extraídas', tone: 'success' } },
  { at: 9.9, type: 'log', log: { agent: 'VALIDATE', text: 'PoC JWT: token de admin forjado e aceito', tone: 'success' } },
  { at: 10.3, type: 'progress', value: 91 },
  { at: 10.5, type: 'log', log: { agent: 'VALIDATE', text: 'PoC XSS: cookie de sessão exfiltrado', tone: 'success' } },
  { at: 10.9, type: 'log', log: { agent: 'VALIDATE', text: '4/4 vulnerabilidades confirmadas exploráveis', tone: 'success' } },
  { at: 11.3, type: 'log', log: { agent: 'VALIDATE', text: 'Score de risco geral: 8.7/10 (ALTO)' } },
  { at: 11.6, type: 'progress', value: 100 },
  { at: 11.9, type: 'log', log: { agent: 'INIT', text: 'Relatório gerado. Pronto para exportação (PDF + JSON).', tone: 'success' } },
  { at: 12.0, type: 'phase', phase: 'complete' },
]
