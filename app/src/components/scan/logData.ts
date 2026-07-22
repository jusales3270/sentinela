// Mock log data simulating a realistic StrixGuard pentest scan
// All logs are in Portuguese as per design requirements

export interface LogEntry {
  timestamp: string;
  agent: 'INIT' | 'RECON' | 'EXPLOIT' | 'VALIDATE' | 'SYSTEM' | 'ERROR' | 'WARN';
  level: 'INFO' | 'WARN' | 'ERROR' | 'VULN' | 'SUCCESS';
  message: string;
  severity?: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  vulnName?: string;
  endpoint?: string;
}

export interface VulnerabilityFinding {
  id: string;
  name: string;
  endpoint: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  cvss: number;
  description: string;
  poc?: string;
  remediation?: string;
}

export const mockLogs: LogEntry[] = [
  // === INITIALIZATION (1-10) ===
  { timestamp: '14:32:01', agent: 'INIT', level: 'INFO', message: 'StrixGuard v1.0.0 inicializando...' },
  { timestamp: '14:32:02', agent: 'INIT', level: 'INFO', message: 'Carregando agentes de IA... OK' },
  { timestamp: '14:32:03', agent: 'INIT', level: 'INFO', message: 'Agente Recon: PRONTO' },
  { timestamp: '14:32:03', agent: 'INIT', level: 'INFO', message: 'Agente Exploit: PRONTO' },
  { timestamp: '14:32:03', agent: 'INIT', level: 'INFO', message: 'Agente Validate: PRONTO' },
  { timestamp: '14:32:04', agent: 'INIT', level: 'INFO', message: 'Alvo: https://demo-app.strixguard.com' },
  { timestamp: '14:32:04', agent: 'INIT', level: 'INFO', message: 'Modo: padrao' },
  { timestamp: '14:32:05', agent: 'INIT', level: 'INFO', message: 'Ambiente sandbox: ATIVO' },
  { timestamp: '14:32:06', agent: 'INIT', level: 'INFO', message: 'Configurando proxy de interceptacao... OK' },
  { timestamp: '14:32:08', agent: 'INIT', level: 'INFO', message: 'Iniciando escaneamento #SCAN-001' },

  // === RECON PHASE (11-40) ===
  { timestamp: '14:32:10', agent: 'RECON', level: 'INFO', message: 'Iniciando fase de reconhecimento...' },
  { timestamp: '14:32:12', agent: 'RECON', level: 'INFO', message: 'DNS lookup: demo-app.strixguard.com -> 192.168.1.100' },
  { timestamp: '14:32:15', agent: 'RECON', level: 'INFO', message: 'Port scan: 80/open, 443/open, 8080/open' },
  { timestamp: '14:32:18', agent: 'RECON', level: 'INFO', message: 'Fingerprinting de tecnologias:' },
  { timestamp: '14:32:18', agent: 'RECON', level: 'INFO', message: '  Servidor: nginx/1.24.0' },
  { timestamp: '14:32:19', agent: 'RECON', level: 'INFO', message: '  Framework: React 18.2.0 / Node.js 20.0' },
  { timestamp: '14:32:20', agent: 'RECON', level: 'INFO', message: '  Banco de dados: PostgreSQL 15 (detectado via pagina de erro)' },
  { timestamp: '14:32:22', agent: 'RECON', level: 'INFO', message: 'Verificando headers de seguranca...' },
  { timestamp: '14:32:23', agent: 'RECON', level: 'WARN', message: 'Header X-Frame-Options ausente' },
  { timestamp: '14:32:24', agent: 'RECON', level: 'WARN', message: 'Header Content-Security-Policy ausente' },
  { timestamp: '14:32:25', agent: 'RECON', level: 'INFO', message: 'Enumeracao de subdominios: 3 subdominios encontrados' },
  { timestamp: '14:32:28', agent: 'RECON', level: 'INFO', message: '  - api.demo-app.strixguard.com' },
  { timestamp: '14:32:29', agent: 'RECON', level: 'INFO', message: '  - admin.demo-app.strixguard.com' },
  { timestamp: '14:32:30', agent: 'RECON', level: 'INFO', message: '  - dev.demo-app.strixguard.com' },
  { timestamp: '14:32:35', agent: 'RECON', level: 'INFO', message: 'Crawling do sitemap... 47 endpoints descobertos' },
  { timestamp: '14:32:38', agent: 'RECON', level: 'INFO', message: 'Endpoints da API: /api/auth/login, /api/users, /api/orders, /api/payments' },
  { timestamp: '14:32:40', agent: 'RECON', level: 'INFO', message: 'robots.txt encontrado: /admin, /backup, /api/debug' },
  { timestamp: '14:32:42', agent: 'RECON', level: 'WARN', message: 'Endpoint exposto: /api/debug sem autenticacao' },
  { timestamp: '14:32:44', agent: 'RECON', level: 'INFO', message: 'Analisando parametros em endpoints...' },
  { timestamp: '14:32:45', agent: 'RECON', level: 'INFO', message: '  /api/users - parametro: id (GET)' },
  { timestamp: '14:32:46', agent: 'RECON', level: 'INFO', message: '  /api/orders - parametros: qty, product_id (POST)' },
  { timestamp: '14:32:47', agent: 'RECON', level: 'INFO', message: '  /api/payments - parametro: amount, currency (POST)' },
  { timestamp: '14:32:48', agent: 'RECON', level: 'INFO', message: '  /search - parametro: q (GET)' },
  { timestamp: '14:32:49', agent: 'RECON', level: 'INFO', message: '  /api/fetch - parametro: url (GET)' },
  { timestamp: '14:32:50', agent: 'RECON', level: 'INFO', message: '  /upload - metodo: POST, aceita: .jpg, .png' },
  { timestamp: '14:32:52', agent: 'RECON', level: 'INFO', message: 'Detectando WAF... nenhum WAF ativo' },
  { timestamp: '14:32:55', agent: 'RECON', level: 'INFO', message: 'Verificando certificado SSL... valido ate 12/2025' },
  { timestamp: '14:32:58', agent: 'RECON', level: 'INFO', message: 'Coletando comentarios HTML... 2 comentarios potencialmente sensiveis' },
  { timestamp: '14:33:00', agent: 'RECON', level: 'INFO', message: 'Fase de reconhecimento concluida. 47 endpoints mapeados.' },

  // === EXPLOITATION PHASE (41-80) ===
  { timestamp: '14:33:01', agent: 'EXPLOIT', level: 'INFO', message: 'Iniciando fase de exploit...' },
  { timestamp: '14:33:05', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Broken Access Control' },
  { timestamp: '14:33:08', agent: 'EXPLOIT', level: 'INFO', message: '  /admin/acessivel sem autenticacao -> 200 OK' },
  { timestamp: '14:33:10', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Injection Attacks' },
  { timestamp: '14:33:15', agent: 'EXPLOIT', level: 'INFO', message: 'Teste de SQL injection em /api/users?id=...' },
  { timestamp: '14:33:18', agent: 'EXPLOIT', level: 'VULN', message: 'SQL Injection detectado em /api/users?id=1\' OR \'1\'=\'1', severity: 'CRITICAL', vulnName: 'SQL Injection', endpoint: '/api/users' },
  { timestamp: '14:33:18', agent: 'EXPLOIT', level: 'VULN', message: '  Payload: 1\' UNION SELECT username,password FROM admin--', severity: 'CRITICAL' },
  { timestamp: '14:33:19', agent: 'EXPLOIT', level: 'INFO', message: '  Banco: PostgreSQL, tecnica: UNION-based, 12 colunas' },
  { timestamp: '14:33:20', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: XSS no parametro de busca' },
  { timestamp: '14:33:25', agent: 'EXPLOIT', level: 'VULN', message: 'XSS Refletido em /search?q=<script>alert(1)</script>', severity: 'HIGH', vulnName: 'XSS Refletido', endpoint: '/search' },
  { timestamp: '14:33:25', agent: 'EXPLOIT', level: 'VULN', message: '  Payload refletido sem sanitizacao', severity: 'HIGH' },
  { timestamp: '14:33:26', agent: 'EXPLOIT', level: 'INFO', message: '  Tipo: Reflected XSS, contexto: HTML' },
  { timestamp: '14:33:30', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Authentication bypass' },
  { timestamp: '14:33:35', agent: 'EXPLOIT', level: 'INFO', message: 'Analise de token JWT: alg=none encontrado no endpoint de teste' },
  { timestamp: '14:33:38', agent: 'EXPLOIT', level: 'VULN', message: 'JWT None Algorithm bypass possivel', severity: 'CRITICAL', vulnName: 'JWT None Algorithm', endpoint: '/api/auth/login' },
  { timestamp: '14:33:38', agent: 'EXPLOIT', level: 'VULN', message: '  E possivel forjar tokens com "alg": "none"', severity: 'CRITICAL' },
  { timestamp: '14:33:39', agent: 'EXPLOIT', level: 'INFO', message: '  Payload: {"alg":"none","typ":"JWT"}.{"role":"admin"}.' },
  { timestamp: '14:33:42', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: IDOR em /api/orders/{id}' },
  { timestamp: '14:33:44', agent: 'EXPLOIT', level: 'INFO', message: '  Acesso a pedidos de outros usuarios: confirmado' },
  { timestamp: '14:33:45', agent: 'EXPLOIT', level: 'VULN', message: 'IDOR - Acesso indevido a dados de outros usuarios', severity: 'HIGH', vulnName: 'IDOR', endpoint: '/api/orders' },
  { timestamp: '14:33:48', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: SSRF em /api/fetch' },
  { timestamp: '14:33:50', agent: 'EXPLOIT', level: 'VULN', message: 'SSRF - acesso a servicos internos via parametro url', severity: 'HIGH', vulnName: 'SSRF', endpoint: '/api/fetch' },
  { timestamp: '14:33:50', agent: 'EXPLOIT', level: 'VULN', message: '  IP interno 169.254.169.254 (metadata) acessivel', severity: 'HIGH' },
  { timestamp: '14:33:51', agent: 'EXPLOIT', level: 'INFO', message: '  Resposta: {"ami-id": "i-12345", "region": "us-east-1"}' },
  { timestamp: '14:34:00', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Business Logic' },
  { timestamp: '14:34:05', agent: 'EXPLOIT', level: 'INFO', message: 'Fluxo de pedidos: teste de quantidade negativa' },
  { timestamp: '14:34:10', agent: 'EXPLOIT', level: 'INFO', message: '  POST /api/orders com qty=-1 aceito pelo servidor' },
  { timestamp: '14:34:15', agent: 'EXPLOIT', level: 'VULN', message: 'Manipulacao de preco via quantidade negativa no carrinho', severity: 'HIGH', vulnName: 'Manipulacao de Preco', endpoint: '/api/orders' },
  { timestamp: '14:34:15', agent: 'EXPLOIT', level: 'VULN', message: '  POST /api/orders com qty=-1 reduz o total', severity: 'HIGH' },
  { timestamp: '14:34:16', agent: 'EXPLOIT', level: 'INFO', message: '  Total do pedido: R$ -150,00' },
  { timestamp: '14:34:20', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: File Upload' },
  { timestamp: '14:34:22', agent: 'EXPLOIT', level: 'INFO', message: '  /upload aceita .jpg mas validacao apenas por MIME type' },
  { timestamp: '14:34:24', agent: 'EXPLOIT', level: 'INFO', message: '  Bypass com shell.php renomeado para shell.jpg' },
  { timestamp: '14:34:25', agent: 'EXPLOIT', level: 'VULN', message: 'Upload arbitrario de arquivo possivel', severity: 'MEDIUM', vulnName: 'File Upload', endpoint: '/upload' },
  { timestamp: '14:34:28', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Rate Limiting' },
  { timestamp: '14:34:30', agent: 'EXPLOIT', level: 'WARN', message: '  Sem limitacao de taxa no endpoint /api/auth/login' },
  { timestamp: '14:34:35', agent: 'EXPLOIT', level: 'INFO', message: '  1000 requisicoes em 10s - nenhum bloqueio' },
  { timestamp: '14:34:40', agent: 'EXPLOIT', level: 'INFO', message: 'Testando: Sensitive Data Exposure' },
  { timestamp: '14:34:42', agent: 'EXPLOIT', level: 'INFO', message: '  /api/debug expoe variaveis de ambiente' },
  { timestamp: '14:34:43', agent: 'EXPLOIT', level: 'WARN', message: '  Chave AWS_ACCESS_KEY_ID encontrada em resposta' },
  { timestamp: '14:34:45', agent: 'EXPLOIT', level: 'INFO', message: 'Fase de exploit concluida. 6 vulnerabilidades encontradas.' },

  // === VALIDATION PHASE (81-100) ===
  { timestamp: '14:35:01', agent: 'VALIDATE', level: 'INFO', message: 'Iniciando fase de validacao...' },
  { timestamp: '14:35:05', agent: 'VALIDATE', level: 'INFO', message: 'Validando SQL Injection (CRITICA)...' },
  { timestamp: '14:35:08', agent: 'VALIDATE', level: 'INFO', message: '  Enviando payload de validacao...' },
  { timestamp: '14:35:10', agent: 'VALIDATE', level: 'INFO', message: 'Proof of Concept: credenciais de admin extraidas com sucesso' },
  { timestamp: '14:35:12', agent: 'VALIDATE', level: 'INFO', message: '  admin:$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' },
  { timestamp: '14:35:13', agent: 'VALIDATE', level: 'INFO', message: '  Tabelas encontradas: users, orders, payments, admin' },
  { timestamp: '14:35:15', agent: 'VALIDATE', level: 'INFO', message: 'Validando XSS (ALTA)...' },
  { timestamp: '14:35:18', agent: 'VALIDATE', level: 'INFO', message: 'Proof of Concept: payload de roubo de cookie executado' },
  { timestamp: '14:35:19', agent: 'VALIDATE', level: 'INFO', message: '  Cookie de sessao exfiltrado: session_id=abc123...' },
  { timestamp: '14:35:20', agent: 'VALIDATE', level: 'INFO', message: 'Validando JWT bypass (CRITICA)...' },
  { timestamp: '14:35:23', agent: 'VALIDATE', level: 'INFO', message: '  Forjando token com alg=none...' },
  { timestamp: '14:35:25', agent: 'VALIDATE', level: 'INFO', message: 'Proof of Concept: token forjado de admin aceito' },
  { timestamp: '14:35:26', agent: 'VALIDATE', level: 'INFO', message: '  Acesso ao painel administrativo concedido' },
  { timestamp: '14:35:30', agent: 'VALIDATE', level: 'INFO', message: 'Validando SSRF (ALTA)...' },
  { timestamp: '14:35:33', agent: 'VALIDATE', level: 'INFO', message: '  Acessando metadata AWS...' },
  { timestamp: '14:35:35', agent: 'VALIDATE', level: 'INFO', message: 'Proof of Concept: metadata AWS recuperado' },
  { timestamp: '14:35:36', agent: 'VALIDATE', level: 'INFO', message: '  {"accountId": "123456789", "instanceId": "i-abc123"}' },
  { timestamp: '14:35:40', agent: 'VALIDATE', level: 'INFO', message: 'Validando Manipulacao de Preco (ALTA)...' },
  { timestamp: '14:35:43', agent: 'VALIDATE', level: 'INFO', message: '  Criando pedido com quantidade negativa...' },
  { timestamp: '14:35:45', agent: 'VALIDATE', level: 'INFO', message: 'Proof of Concept: total do pedido reduzido para R$ -150,00' },
  { timestamp: '14:35:46', agent: 'VALIDATE', level: 'INFO', message: '  Saldo negativo confirmado no banco de dados' },
  { timestamp: '14:35:50', agent: 'VALIDATE', level: 'INFO', message: 'Todas as validacoes concluidas. 6/6 confirmadas exploraveis.' },
  { timestamp: '14:35:55', agent: 'VALIDATE', level: 'INFO', message: 'Calculando scores CVSS...' },
  { timestamp: '14:35:58', agent: 'VALIDATE', level: 'INFO', message: '  SQL Injection: CVSS 9.8 (CRITICA)' },
  { timestamp: '14:35:59', agent: 'VALIDATE', level: 'INFO', message: '  JWT Bypass: CVSS 9.1 (CRITICA)' },
  { timestamp: '14:36:00', agent: 'VALIDATE', level: 'INFO', message: '  XSS Refletido: CVSS 7.5 (ALTA)' },
  { timestamp: '14:36:01', agent: 'VALIDATE', level: 'INFO', message: '  SSRF: CVSS 7.2 (ALTA)' },
  { timestamp: '14:36:02', agent: 'VALIDATE', level: 'INFO', message: '  IDOR: CVSS 6.5 (ALTA)' },
  { timestamp: '14:36:03', agent: 'VALIDATE', level: 'INFO', message: '  Manipulacao de Preco: CVSS 6.1 (ALTA)' },
  { timestamp: '14:36:05', agent: 'INIT', level: 'SUCCESS', message: 'Escaneamento concluido! Relatorio salvo em /reports/scan-001' },
  { timestamp: '14:36:06', agent: 'INIT', level: 'INFO', message: 'Tempo total: 4min 5seg' },
  { timestamp: '14:36:07', agent: 'INIT', level: 'INFO', message: 'Score de risco geral: 8.7/10 (ALTO)' },
];

export const vulnerabilityFindings: VulnerabilityFinding[] = [
  {
    id: 'vuln-001',
    name: 'SQL Injection',
    endpoint: 'GET /api/users?id=1',
    severity: 'CRITICAL',
    cvss: 9.8,
    description: 'Injecao SQL UNION-based detectada no parametro "id". Permite extracao completa do banco de dados.',
    poc: "1' UNION SELECT username,password FROM admin--",
    remediation: 'Utilize prepared statements/parameterized queries. Valide e sanitize todas as entradas do usuario.',
  },
  {
    id: 'vuln-002',
    name: 'XSS Refletido',
    endpoint: 'GET /search?q=test',
    severity: 'HIGH',
    cvss: 7.5,
    description: 'Cross-site scripting refletido no parametro de busca. Payload e refletido sem sanitizacao.',
    poc: '<script>alert(document.cookie)</script>',
    remediation: 'Escape todas as saidas HTML. Implemente Content-Security-Policy. Use bibliotecas como DOMPurify.',
  },
  {
    id: 'vuln-003',
    name: 'JWT None Algorithm',
    endpoint: 'POST /api/auth/login',
    severity: 'CRITICAL',
    cvss: 9.1,
    description: 'O servidor aceita tokens JWT com algoritmo "none", permitindo forjamento de tokens arbitrarios.',
    poc: '{"alg":"none","typ":"JWT"}.{"role":"admin","user":"attacker"}.',
    remediation: 'Rejeite tokens com alg=none. Verifique o algoritmo contra uma whitelist no servidor.',
  },
  {
    id: 'vuln-004',
    name: 'IDOR',
    endpoint: 'GET /api/orders/{id}',
    severity: 'HIGH',
    cvss: 6.5,
    description: 'Referencia direta a objeto insegura permite acesso a pedidos de outros usuarios.',
    poc: 'GET /api/orders/12345 (pedido de outro usuario)',
    remediation: 'Verifique se o usuario autenticado tem permissao para acessar o recurso solicitado.',
  },
  {
    id: 'vuln-005',
    name: 'SSRF',
    endpoint: 'GET /api/fetch?url=...',
    severity: 'HIGH',
    cvss: 7.2,
    description: 'Server-Side Request Forgery permite acesso a servicos internos via parametro url.',
    poc: 'GET /api/fetch?url=http://169.254.169.254/latest/meta-data/',
    remediation: 'Valide e restrinja URLs permitidas. Use whitelist de dominios. Desabilite esquemas perigosos.',
  },
  {
    id: 'vuln-006',
    name: 'Manipulacao de Preco',
    endpoint: 'POST /api/orders',
    severity: 'HIGH',
    cvss: 6.1,
    description: 'Quantidade negativa aceita no carrinho reduz o valor total do pedido.',
    poc: '{"product_id": 1, "qty": -1}',
    remediation: 'Valide que a quantidade seja positiva no servidor. Recalcule precos no backend.',
  },
];

// Calculate progress percentage based on log index
export function getProgressForLogIndex(index: number): number {
  if (index <= 9) return Math.round((index / 9) * 10); // Init: 0-10%
  if (index <= 39) return 10 + Math.round(((index - 9) / 30) * 35); // Recon: 10-45%
  if (index <= 79) return 45 + Math.round(((index - 39) / 40) * 40); // Exploit: 45-85%
  return 85 + Math.round(((index - 79) / 21) * 15); // Validate: 85-100%
}

// Get agent status based on log index
export function getAgentStatus(index: number) {
  const reconStatus = index < 10 ? 'pending' : index < 39 ? 'running' : 'complete';
  const exploitStatus = index < 39 ? 'pending' : index < 79 ? 'running' : 'complete';
  const validateStatus = index < 79 ? 'pending' : index < 104 ? 'running' : 'complete';

  const reconProgress = reconStatus === 'complete' ? 100 : reconStatus === 'running'
    ? Math.round(((index - 9) / 30) * 100) : 0;
  const exploitProgress = exploitStatus === 'complete' ? 100 : exploitStatus === 'running'
    ? Math.round(((index - 39) / 40) * 100) : 0;
  const validateProgress = validateStatus === 'complete' ? 100 : validateStatus === 'running'
    ? Math.round(((index - 79) / 21) * 100) : 0;

  return {
    recon: { status: reconStatus, progress: reconProgress, phase: getReconPhase(index) },
    exploit: { status: exploitStatus, progress: exploitProgress, phase: getExploitPhase(index) },
    validate: { status: validateStatus, progress: validateProgress, phase: getValidatePhase(index) },
  };
}

function getReconPhase(index: number): string {
  if (index < 10) return 'Aguardando...';
  if (index < 15) return 'DNS lookup';
  if (index < 20) return 'Port scan';
  if (index < 28) return 'Fingerprinting';
  if (index < 32) return 'Subdominios';
  if (index < 39) return 'Crawling';
  return 'Concluido';
}

function getExploitPhase(index: number): string {
  if (index < 39) return 'Aguardando...';
  if (index < 45) return 'Broken Access Control';
  if (index < 55) return 'SQL Injection / XSS';
  if (index < 60) return 'JWT Bypass';
  if (index < 65) return 'IDOR / SSRF';
  if (index < 75) return 'Business Logic';
  if (index < 79) return 'File Upload';
  return 'Concluido';
}

function getValidatePhase(index: number): string {
  if (index < 79) return 'Aguardando...';
  if (index < 85) return 'SQL Injection';
  if (index < 88) return 'XSS';
  if (index < 92) return 'JWT Bypass';
  if (index < 96) return 'SSRF';
  if (index < 100) return 'Price Manipulation';
  return 'Concluido';
}

// Get scan statistics based on log index
export function getScanStats(index: number) {
  const elapsed = Math.min(245, Math.round((index / 104) * 245));
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const endpointsTested = index < 10 ? 0 : index < 39 ? Math.round(((index - 9) / 30) * 47) : 47;
  const payloadsSent = Math.round(index * 12.5);
  const currentAgent = index < 10 ? 'INIT' : index < 39 ? 'RECON' : index < 79 ? 'EXPLOIT' : 'VALIDATE';

  return {
    elapsed: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
    endpointsTested: `${endpointsTested}/47`,
    payloadsSent: payloadsSent.toLocaleString(),
    currentAgent,
  };
}
