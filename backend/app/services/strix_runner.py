"""
StrixGuard - Strix CLI Runner Service

Orchestrates the Strix CLI tool for penetration testing.
When Strix is not available (MOCK_MODE=true), simulates realistic pentest output.

Features:
- Real Strix CLI execution with async subprocess
- Realistic mock mode with multi-agent simulation
- WebSocket-compatible async generator for log streaming
- Automatic vulnerability parsing from output
"""

import asyncio
import json
import os
import random
import uuid
from datetime import datetime
from typing import Any, AsyncGenerator, Dict, List, Optional

from app.config import get_settings

settings = get_settings()

# ---------------------------------------------------------------------------
# Mock Data - Realistic Vulnerability Database
# ---------------------------------------------------------------------------

MOCK_VULNERABILITIES = [
    {
        "title": "Cross-Site Scripting (XSS) Refletido no Parâmetro de Busca",
        "severity": "high",
        "cvss_score": 7.1,
        "category": "A03:2021 - Injection",
        "description": "O parâmetro 'q' da página de busca não sanitiza corretamente a entrada do usuário, permitindo a injeção de scripts maliciosos. Um atacante pode criar um link que, quando acessado, executa JavaScript arbitrário no contexto da vítima.",
        "proof_of_concept": "https://example.com/busca?q=<script>alert(document.cookie)</script>",
        "remediation": "Implementar sanitização de entrada usando bibliotecas como DOMPurify. Utilizar Content Security Policy (CSP) e codificar toda saída HTML com escape adequado.",
        "cwe_id": "CWE-79",
        "evidence": "O servidor refletiu o payload sem encode HTML. O script foi executado no navegador.",
        "affected_urls": "/busca, /produtos, /categoria",
        "references": "https://owasp.org/www-community/attacks/xss/",
    },
    {
        "title": "SQL Injection em Autenticação de Usuários",
        "severity": "critical",
        "cvss_score": 9.1,
        "category": "A03:2021 - Injection",
        "description": "O campo de login é vulnerável a SQL Injection. É possível burlar a autenticação usando payloads como ' OR '1'='1'. Um atacante pode extrair dados sensíveis do banco de dados ou assumir contas de administradores.",
        "proof_of_concept": "Usuario: admin'--\nSenha: qualquer_valor",
        "remediation": "Utilizar prepared statements ou ORM parametrizado. Nunca concatenar strings SQL com entrada do usuário. Implementar WAF com regras de detecção de SQLi.",
        "cwe_id": "CWE-89",
        "evidence": "A consulta SQL retornou sucesso mesmo com senha incorreta. O payload '-- comentou o restante da query.",
        "affected_urls": "/login, /api/auth",
        "references": "https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html",
    },
    {
        "title": "Exposição de Informações Sensíveis via .env Acessível",
        "severity": "critical",
        "cvss_score": 8.6,
        "category": "A01:2021 - Broken Access Control",
        "description": "O arquivo .env do ambiente de produção está acessível publicamente em https://example.com/.env. Este arquivo contém credenciais de banco de dados, chaves de API e segredos de aplicação.",
        "proof_of_concept": "GET https://example.com/.env → Retorna DB_PASSWORD, AWS_ACCESS_KEY, STRIPE_SECRET_KEY",
        "remediation": "Bloquear acesso a arquivos de configuração no servidor web. Mover credenciais para variáveis de ambiente gerenciadas. Revisar permissões de arquivos.",
        "cwe_id": "CWE-200",
        "evidence": "Código de resposta HTTP 200 com conteúdo do arquivo .env incluindo DB_HOST, DB_USER, DB_PASS.",
        "affected_urls": "/.env, /.env.local, /.env.production",
        "references": "https://owasp.org/www-project-top-ten/2017/A3_2017-Sensitive_Data_Exposure",
    },
    {
        "title": "Cabeçalho de Segurança Content-Security-Policy Ausente",
        "severity": "medium",
        "cvss_score": 5.3,
        "category": "A05:2021 - Security Misconfiguration",
        "description": "O servidor não envia o cabeçalho Content-Security-Policy (CSP). Isso permite a execução de scripts inline e de origens não confiáveis, aumentando o impacto de vulnerabilidades XSS.",
        "proof_of_concept": "curl -I https://example.com | grep -i content-security-policy → (nenhum resultado)",
        "remediation": "Implementar CSP restritivo: Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'",
        "cwe_id": "CWE-693",
        "evidence": "Cabeçalho CSP ausente em todas as respostas HTTP analisadas.",
        "affected_urls": "Todas as páginas",
        "references": "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP",
    },
    {
        "title": "Autenticação de Dois Fatores (2FA) Não Implementada",
        "severity": "medium",
        "cvss_score": 5.7,
        "category": "A07:2021 - Identification and Authentication Failures",
        "description": "A aplicação não oferece suporte a autenticação de múltiplos fatores. Contas de usuário dependem apenas de senha, aumentando o risco de comprometimento via credential stuffing ou phishing.",
        "proof_of_concept": "N/A - Ausência de funcionalidade",
        "remediation": "Implementar TOTP (Time-based One-Time Password) usando bibliotecas como pyotp. Oferecer opções de 2FA via SMS, app autenticador ou hardware key.",
        "cwe_id": "CWE-308",
        "evidence": "Nenhuma opção de MFA encontrada nas configurações de conta ou fluxo de login.",
        "affected_urls": "/login, /conta/configuracoes",
        "references": "https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html",
    },
    {
        "title": "Diretório Git Exposto (.git/)",
        "severity": "high",
        "cvss_score": 7.5,
        "category": "A01:2021 - Broken Access Control",
        "description": "O diretório .git da aplicação está acessível publicamente. Um atacante pode baixar todo o histórico do repositório, incluindo commits antigos que podem conter credenciais ou código vulnerável.",
        "proof_of_concept": "wget --mirror https://example.com/.git/ → Recupera todo o repositório",
        "remediation": "Bloquear acesso ao diretório .git no servidor web. Adicionar .git ao .gitignore de deploy. Usar deploy via artefato, não clone direto.",
        "cwe_id": "CWE-548",
        "evidence": "Acesso a https://example.com/.git/config retorna 200 com conteúdo do arquivo de configuração do Git.",
        "affected_urls": "/.git/",
        "references": "https://git-scm.com/docs/git-config",
    },
    {
        "title": "Clickjacking - Falta de Proteção X-Frame-Options",
        "severity": "medium",
        "cvss_score": 6.1,
        "category": "A05:2021 - Security Misconfiguration",
        "description": "A aplicação não define o cabeçalho X-Frame-Options, permitindo que a página seja embedada em iframes de domínios maliciosos. Isso permite ataques de clickjacking onde usuários são enganados a clicar em elementos invisíveis.",
        "proof_of_concept": "<iframe src='https://example.com/transferencia' style='opacity:0;position:absolute;top:0;left:0;width:100%;height:100%;'></iframe>",
        "remediation": "Adicionar cabeçalho X-Frame-Options: DENY ou SAMEORIGIN. Alternativamente, usar CSP frame-ancestors directive.",
        "cwe_id": "CWE-1021",
        "evidence": "Cabeçalho X-Frame-Options ausente em todas as respostas. O site pode ser embedado em iframe externo.",
        "affected_urls": "Todas as páginas",
        "references": "https://owasp.org/www-community/attacks/Clickjacking",
    },
    {
        "title": "Cookie de Sessão sem Flags Secure e HttpOnly",
        "severity": "high",
        "cvss_score": 7.0,
        "category": "A02:2021 - Cryptographic Failures",
        "description": "O cookie de sessão da aplicação não possui as flags Secure e HttpOnly. Isso permite o roubo de sessão via XSS e o envio de cookies em conexões não criptografadas.",
        "proof_of_concept": "document.cookie → Retorna o session_id sem HttpOnly",
        "remediation": "Definir flags no cookie: Set-Cookie: sessionid=abc123; HttpOnly; Secure; SameSite=Strict",
        "cwe_id": "CWE-1004",
        "evidence": "Cookie de sessão definido sem flags Secure e HttpOnly visíveis nos cabeçalhos de resposta.",
        "affected_urls": "Todas as páginas (cookies de sessão)",
        "references": "https://owasp.org/www-community/HttpOnly",
    },
    {
        "title": "Enumeração de Usuários via Timing Attack no Login",
        "severity": "low",
        "cvss_score": 4.3,
        "category": "A07:2021 - Identification and Authentication Failures",
        "description": "O tempo de resposta do endpoint de login difere significativamente quando o usuário existe versus quando não existe. Isso permite a enumeração de usuários válidos.",
        "proof_of_concept": "Tempo para usuário existente: ~320ms. Tempo para usuário inexistente: ~85ms.",
        "remediation": "Implementar delay constante na resposta de autenticação. Usar funções de comparação constant-time para senhas.",
        "cwe_id": "CWE-208",
        "evidence": "Média de 10 requisições: usuário válido = 315ms, usuário inválido = 82ms (desvio padrão < 15ms).",
        "affected_urls": "/login, /api/auth/login",
        "references": "https://cwe.mitre.org/data/definitions/208.html",
    },
    {
        "title": "CORS Configurado de Forma Permissiva (Origin: *)",
        "severity": "medium",
        "cvss_score": 5.4,
        "category": "A05:2021 - Security Misconfiguration",
        "description": "O cabeçalho Access-Control-Allow-Origin está configurado como '*', permitindo que qualquer domínio faça requisições autenticadas em nome do usuário.",
        "proof_of_concept": "curl -H 'Origin: https://evil.com' https://example.com/api/dados → Access-Control-Allow-Origin: https://evil.com",
        "remediation": "Implementar whitelist de origens permitidas. Verificar o cabeçalho Origin no servidor e retornar apenas origens confiáveis.",
        "cwe_id": "CWE-942",
        "evidence": "O servidor reflete qualquer valor de Origin no cabeçalho Access-Control-Allow-Origin.",
        "affected_urls": "/api/*",
        "references": "https://portswigger.net/web-security/cors",
    },
    {
        "title": "Open Redirect no Parâmetro de Redirecionamento",
        "severity": "medium",
        "cvss_score": 6.1,
        "category": "A01:2021 - Broken Access Control",
        "description": "O parâmetro 'redirect' após login aceita URLs externas. Um atacante pode criar um link legítimo que redireciona para um site de phishing.",
        "proof_of_concept": "https://example.com/login?redirect=https://evil-phishing.com/login",
        "remediation": "Validar URLs de redirecionamento contra whitelist. Usar paths relativos ou mapeamento de chaves para URLs.",
        "cwe_id": "CWE-601",
        "evidence": "O redirecionamento ocorreu para https://evil.com sem validação.",
        "affected_urls": "/login, /logout",
        "references": "https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html",
    },
    {
        "title": "Rate Limiting Ausente no Endpoint de Login",
        "severity": "medium",
        "cvss_score": 5.9,
        "category": "A07:2021 - Identification and Authentication Failures",
        "description": "O endpoint de login não implementa rate limiting. Um atacante pode realizar ataques de força bruta em massa sem restrições.",
        "proof_of_concept": "Hydra -l admin -P passwords.txt https://example.com/login → 1000 tentativas/min sem bloqueio",
        "remediation": "Implementar rate limiting (ex: 5 tentativas por IP a cada 15 minutos). Adicionar CAPTCHA após falhas. Usar fail2ban.",
        "cwe_id": "CWE-307",
        "evidence": "100 requisições de login consecutivas em 10 segundos. Nenhum bloqueio ou delay foi aplicado.",
        "affected_urls": "/login, /api/auth/login",
        "references": "https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks",
    },
    {
        "title": "Versão do Servidor Web e Framework Exposta",
        "severity": "info",
        "cvss_score": 2.3,
        "category": "A05:2021 - Security Misconfiguration",
        "description": "O cabeçalho Server revela a versão exata do software (ex: nginx/1.18.0). Isso facilita a identificação de exploits específicos para versões vulneráveis.",
        "proof_of_concept": "curl -I https://example.com → Server: nginx/1.18.0, X-Powered-By: Express/4.17.1",
        "remediation": "Remover ou ofuscar cabeçalhos Server e X-Powered-By. Manter software atualizado.",
        "cwe_id": "CWE-200",
        "evidence": "Cabeçalhos Server e X-Powered-By presentes em todas as respostas HTTP.",
        "affected_urls": "Todas as páginas",
        "references": "https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/01-Information_Gathering/",
    },
    {
        "title": "CSRF - Tokens Ausentes em Formulários Críticos",
        "severity": "high",
        "cvss_score": 7.1,
        "category": "A01:2021 - Broken Access Control",
        "description": "Formulários de alteração de dados (perfil, transferência, exclusão) não possuem tokens CSRF. Um atacante pode forjar requisições em nome de usuários autenticados.",
        "proof_of_concept": "<form action='https://example.com/transferir' method='POST'><input name='valor' value='1000'><input name='destino' value='attacker'></form>",
        "remediation": "Implementar tokens CSRF em todos os formulários POST. Usar SameSite=Strict nos cookies de sessão. Validar cabeçalho Origin/Referer.",
        "cwe_id": "CWE-352",
        "evidence": "Formulário de transferência submetido sem token CSRF. Requisição aceita pelo servidor.",
        "affected_urls": "/transferir, /perfil/editar, /conta/excluir",
        "references": "https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html",
    },
    {
        "title": "Injeção de Comandos OS via Upload de Arquivo",
        "severity": "critical",
        "cvss_score": 9.8,
        "category": "A03:2021 - Injection",
        "description": "O recurso de upload de arquivos não valida extensões adequadamente. Upload de arquivo .php ou .sh permite execução remota de código no servidor.",
        "proof_of_concept": "Upload de shell.php com conteúdo: <?php system($_GET['cmd']); ?> → Acessível em /uploads/shell.php?cmd=id",
        "remediation": "Validar extensões por whitelist. Armazenar uploads fora do web root. Renomear arquivos. Verificar mime-type real. Desativar execução no diretório de uploads.",
        "cwe_id": "CWE-78",
        "evidence": "Arquivo PHP foi aceito e executado. Comando 'id' retornou uid=33(www-data) gid=33(www-data).",
        "affected_urls": "/upload, /api/upload",
        "references": "https://owasp.org/www-community/vulnerabilities/Unrestricted_File_Upload",
    },
]

# Mock log messages organized by phase and agent
MOCK_RECON_LOGS = [
    "[*] Iniciando reconhecimento do alvo: {target}",
    "[+] Resolvendo DNS...",
    "[+] Registros DNS encontrados: A → {ip}, MX → mail.{target}",
    "[*] Executando WHOIS lookup...",
    "[+] Informações WHOIS obtidas: Registrar {registrar}, Criado em {date}",
    "[*] Iniciando descoberta de subdomínios...",
    "[+] Subdomínios encontrados: www, api, admin, mail, ftp, dev, staging",
    "[*] Executando banner grabbing na porta 80...",
    "[+] Banner: nginx/1.18.0",
    "[*] Executando banner grabbing na porta 443...",
    "[+] Banner: nginx/1.18.0 (TLS 1.3 enabled)",
    "[*] Verificando certificado SSL...",
    "[+] Certificado válido emitido por Let's Encrypt, expira em {expiry}",
    "[*] Coletando URLs via crawling...",
    "[+] URLs descobertas: /login, /register, /api/v1/users, /admin, /upload",
    "[+] URLs descobertas: /search, /products, /cart, /checkout, /profile",
    "[*] Analisando tecnologias via Wappalyzer...",
    "[+] Frameworks detectados: React 18.2, Express.js 4.17, Node.js 18",
    "[+] Banco de dados detectado: MongoDB 5.0 (via erro de stack trace)",
    "[*] Reconhecimento de superfície de ataque concluído",
    "[+] {total_urls} URLs únicas catalogadas",
    "[+] {open_ports} portas abertas identificadas",
]

MOCK_SCAN_LOGS = [
    "[*] Iniciando varredura de vulnerabilidades ativas...",
    "[*] Testando para SQL Injection em {count} parâmetros...",
    "[!] Possível SQLi detectado em /login - parâmetro 'username'",
    "[*] Verificando falsos positivos...",
    "[+] SQL Injection confirmado em /login - tipo: UNION-based",
    "[*] Testando para Cross-Site Scripting (XSS)...",
    "[!] Reflected XSS detectado em /search - parâmetro 'q'",
    "[+] XSS confirmado - payload executado com sucesso",
    "[*] Verificando configurações de segurança de cookies...",
    "[!] Cookie 'sessionid' sem flag HttpOnly",
    "[!] Cookie 'sessionid' sem flag Secure",
    "[*] Testando para CSRF em formulários...",
    "[!] Token CSRF ausente em /transfer",
    "[!] Token CSRF ausente em /profile/edit",
    "[*] Verificando exposição de arquivos sensíveis...",
    "[!] Arquivo .env acessível em /.env",
    "[!] Diretório .git/ exposto em /.git/config",
    "[*] Verificando cabeçalhos de segurança HTTP...",
    "[!] Content-Security-Policy ausente",
    "[!] X-Frame-Options ausente (vulnerável a clickjacking)",
    "[!] Strict-Transport-Security (HSTS) ausente",
    "[*] Testando upload de arquivos maliciosos...",
    "[!] Upload de arquivo PHP aceito sem validação",
    "[+] RCE confirmado via upload - shell obtido",
    "[*] Verificando redirecionamentos abertos...",
    "[!] Open redirect em /login?redirect=...",
    "[*] Testando rate limiting...",
    "[!] Rate limiting ausente no endpoint de login",
    "[*] Verificando CORS configuration...",
    "[!] CORS permissivo: Access-Control-Allow-Origin: *",
    "[*] Analisando timing de respostas de autenticação...",
    "[!] Timing attack possível - diferença de ~230ms",
    "[*] Varredura de vulnerabilidades ativas concluída",
]

MOCK_EXPLOIT_LOGS = [
    "[*] Agente de Exploração iniciando atividades...",
    "[*] Tentando explorar SQL Injection em /login...",
    "[+] Dados extraídos: 1 usuário administrativo encontrado",
    "[+] Hash de senha obtido: $2b$12$... (bcrypt)",
    "[*] Tentando bypass de autenticação via SQLi...",
    "[+] Login como admin bem-sucedido via SQLi",
    "[*] Escalando privilégios...",
    "[+] Acesso ao painel administrativo obtido: /admin",
    "[*] Extraindo dados do banco via SQLi UNION-based...",
    "[+] 847 registros de usuários extraídos",
    "[*] Tentando execução remota via upload...",
    "[+] Shell reversa obtida - conexão estabelecida",
    "[*] Enumerando sistema de arquivos...",
    "[+] Acesso de leitura a /etc/passwd confirmado",
    "[+] Variáveis de ambiente expostas: AWS_ACCESS_KEY, DB_PASSWORD",
    "[*] Verificando containerização...",
    "[+] Aplicação rodando em Docker - escape attempt iniciado",
    "[!] Docker socket não exposto - escape não possível",
    "[*] Exploração concluída",
]

MOCK_VALIDATE_LOGS = [
    "[*] Agente de Validação iniciando verificação...",
    "[*] Revalidando vulnerabilidades críticas...",
    "[+] SQL Injection - revalidado com sucesso (CVE-confirmado)",
    "[+] XSS Refletido - revalidado com sucesso",
    "[+] RCE via Upload - revalidado com sucesso",
    "[*] Calculando scores CVSS v3.1...",
    "[+] Score médio de severidade: {avg_cvss:.1f}",
    "[*] Verificando impacto de negócio...",
    "[!] Impacto estimado: Comprometimento total de dados de usuários",
    "[*] Gerando evidências de exploração...",
    "[+] Screenshots capturadas para {vuln_count} vulnerabilidades",
    "[*] Verificação concluída",
    "[*] Scan finalizado - {vuln_count} vulnerabilidades confirmadas",
]

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def _random_ip() -> str:
    """Generate a random IP for mock data."""
    return f"{random.randint(1,223)}.{random.randint(0,255)}.{random.randint(0,255)}.{random.randint(1,254)}"


def _format_log(template: str, **kwargs) -> str:
    """Format a log template with provided kwargs."""
    try:
        return template.format(**kwargs)
    except KeyError:
        return template


def _create_log_entry(
    message: str,
    agent: str = "System",
    level: str = "info",
    details: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    """Create a structured log entry."""
    return {
        "type": "log",
        "timestamp": datetime.utcnow().isoformat(),
        "agent": agent,
        "level": level,
        "message": message,
        "details": details or {},
    }


# ---------------------------------------------------------------------------
# Real Strix Runner
# ---------------------------------------------------------------------------

async def run_strix_real(
    target_url: str,
    scan_mode: str,
    llm_provider: str,
    api_key: str,
    scan_id: str,
    instruction: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Run the actual Strix CLI tool and stream output lines.

    Yields JSON-formatted log lines for WebSocket consumption.
    """
    output_dir = f"/tmp/strix_runs/{scan_id}"
    os.makedirs(output_dir, exist_ok=True)

    # Build command
    cmd = [
        settings.strix_path,
        "-n",  # non-interactive mode
        "--target", target_url,
        "--scan-mode", scan_mode,
        "--output-dir", output_dir,
    ]
    if instruction:
        cmd.extend(["--instruction", instruction])

    # Environment variables
    env = os.environ.copy()
    env["STRIX_LLM"] = llm_provider
    env["LLM_API_KEY"] = api_key

    # Yield status
    yield json.dumps(_create_log_entry(
        f"Iniciando scan Strix no alvo: {target_url}",
        agent="Strix Orchestrator",
        level="info",
        details={"command": " ".join(cmd), "output_dir": output_dir},
    ))

    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            env=env,
        )

        while True:
            line = await process.stdout.readline()
            if not line:
                break

            decoded = line.decode("utf-8", errors="replace").strip()
            if decoded:
                # Try to parse Strix output format and re-emit as structured JSON
                yield json.dumps(_create_log_entry(decoded, agent="Strix"))

        await process.wait()

        if process.returncode == 0:
            yield json.dumps(_create_log_entry(
                "Scan concluído com sucesso",
                agent="Strix Orchestrator",
                level="success",
                details={"return_code": process.returncode, "output_dir": output_dir},
            ))
        else:
            yield json.dumps(_create_log_entry(
                f"Scan finalizou com código de erro: {process.returncode}",
                agent="Strix Orchestrator",
                level="error",
                details={"return_code": process.returncode},
            ))

    except FileNotFoundError:
        yield json.dumps(_create_log_entry(
            f"Strix CLI não encontrado em: {settings.strix_path}",
            agent="Strix Orchestrator",
            level="error",
            details={"suggestion": "Verifique se o Strix está instalado ou ative MOCK_MODE=true"},
        ))
    except Exception as e:
        yield json.dumps(_create_log_entry(
            f"Erro ao executar Strix: {str(e)}",
            agent="Strix Orchestrator",
            level="error",
            details={"error": str(e)},
        ))


# ---------------------------------------------------------------------------
# Mock Strix Runner
# ---------------------------------------------------------------------------

async def run_strix_mock(
    target_url: str,
    scan_mode: str,
    scan_id: str,
    instruction: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Simulate a realistic Strix scan for demonstration purposes.

    Generates mock log output over ~2-3 minutes with:
    - Multi-agent activity (Recon, Exploit, Validation)
    - Realistic vulnerability findings
    - Variable timing to simulate real network delays

    Yields JSON-formatted log lines.
    """
    # Determine scan parameters based on mode
    if scan_mode == "quick":
        total_duration = 30  # ~30 seconds
        delay_range = (0.1, 0.5)
        vuln_count_range = (3, 7)
        phase_weights = [0.3, 0.4, 0.3]
    elif scan_mode == "deep":
        total_duration = 180  # ~3 minutes
        delay_range = (0.3, 1.5)
        vuln_count_range = (10, 15)
        phase_weights = [0.25, 0.45, 0.3]
    else:  # standard
        total_duration = 90  # ~90 seconds
        delay_range = (0.2, 1.0)
        vuln_count_range = (6, 11)
        phase_weights = [0.25, 0.45, 0.3]

    # Select random vulnerabilities
    num_vulns = random.randint(*vuln_count_range)
    selected_vulns = random.sample(MOCK_VULNERABILITIES, min(num_vulns, len(MOCK_VULNERABILITIES)))

    # Determine which log lines will trigger vulnerabilities
    vuln_trigger_indices = sorted(random.sample(range(20, 80), len(selected_vulns)))
    vuln_index = 0

    # Agent phases
    phases = [
        ("Recon Agent", MOCK_RECON_LOGS),
        ("Exploitation Agent", MOCK_SCAN_LOGS + MOCK_EXPLOIT_LOGS),
        ("Validation Agent", MOCK_VALIDATE_LOGS),
    ]

    # Start scan
    yield json.dumps({
        "type": "status",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "running",
        "message": "Iniciando scan de penetração",
    })

    yield json.dumps(_create_log_entry(
        f"Iniciando scan Strix (MOCK) no alvo: {target_url}",
        agent="Strix Orchestrator",
        level="info",
        details={"mode": scan_mode, "scan_id": scan_id, "mock": True},
    ))

    if instruction:
        yield json.dumps(_create_log_entry(
            f"Instrução adicional: {instruction}",
            agent="Strix Orchestrator",
            level="info",
        ))

    total_steps = 100
    current_step = 0

    # Generate logs for each phase
    for phase_idx, (agent_name, log_templates) in enumerate(phases):
        # Phase change
        yield json.dumps({
            "type": "agent_change",
            "timestamp": datetime.utcnow().isoformat(),
            "agent": agent_name,
            "phase": phase_idx,
        })

        yield json.dumps(_create_log_entry(
            f"{agent_name} iniciando...",
            agent=agent_name,
            level="info",
        ))

        # Calculate how many logs for this phase
        phase_logs = int(len(log_templates) * (total_duration / 90))
        phase_logs = max(5, min(phase_logs, len(log_templates)))

        for log_idx, template in enumerate(log_templates[:phase_logs]):
            # Variable delay
            delay = random.uniform(*delay_range)
            await asyncio.sleep(delay)

            # Determine log level from template prefix
            if template.startswith("[+]"):
                level = "success"
            elif template.startswith("[!]"):
                level = "warning"
            elif template.startswith("[*]"):
                level = "info"
            else:
                level = "info"

            # Format template
            message = _format_log(
                template,
                target=target_url.replace("https://", "").replace("http://", "").split("/")[0],
                ip=_random_ip(),
                registrar="Cloudflare, Inc." if random.random() > 0.5 else "GoDaddy.com, LLC",
                date="2020-03-15",
                expiry="2025-03-15",
                total_urls=random.randint(50, 500),
                open_ports=random.randint(2, 8),
                count=random.randint(10, 50),
                avg_cvss=sum(v["cvss_score"] for v in selected_vulns) / max(len(selected_vulns), 1),
                vuln_count=len(selected_vulns),
            )

            yield json.dumps(_create_log_entry(message, agent=agent_name, level=level))

            # Update progress
            current_step += 1
            progress = min(int((current_step / total_steps) * 100), 99)

            yield json.dumps({
                "type": "progress",
                "timestamp": datetime.utcnow().isoformat(),
                "percent": progress,
                "current_phase": agent_name,
                "current_agent": agent_name,
            })

            # Inject vulnerability at predetermined indices
            if vuln_index < len(selected_vulns) and current_step >= vuln_trigger_indices[vuln_index]:
                vuln = selected_vulns[vuln_index]
                yield json.dumps({
                    "type": "vuln",
                    "timestamp": datetime.utcnow().isoformat(),
                    "vulnerability": {
                        "id": str(uuid.uuid4()),
                        **vuln,
                    },
                })
                yield json.dumps(_create_log_entry(
                    f"NOVA VULNERABILIDADE: {vuln['title']} [{vuln['severity'].upper()} - CVSS {vuln['cvss_score']}]",
                    agent=agent_name,
                    level="warning",
                    details={"severity": vuln["severity"], "cvss": vuln["cvss_score"]},
                ))
                vuln_index += 1

    # Final progress
    yield json.dumps({
        "type": "progress",
        "timestamp": datetime.utcnow().isoformat(),
        "percent": 100,
        "current_phase": "Concluído",
        "current_agent": "Strix Orchestrator",
    })

    # Summary
    severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for v in selected_vulns:
        severity_counts[v["severity"]] += 1

    yield json.dumps(_create_log_entry(
        f"Scan concluído. {len(selected_vulns)} vulnerabilidades encontradas: "
        f"{severity_counts['critical']} Críticas, {severity_counts['high']} Altas, "
        f"{severity_counts['medium']} Médias, {severity_counts['low']} Baixas, {severity_counts['info']} Info",
        agent="Strix Orchestrator",
        level="success",
        details={
            "total_vulns": len(selected_vulns),
            "severity_counts": severity_counts,
            "output_dir": f"/tmp/strix_runs/{scan_id}",
        },
    ))

    yield json.dumps({
        "type": "status",
        "timestamp": datetime.utcnow().isoformat(),
        "status": "completed",
        "message": "Scan de penetração concluído com sucesso",
        "details": {
            "total_vulnerabilities": len(selected_vulns),
            "severity_counts": severity_counts,
        },
    })


# ---------------------------------------------------------------------------
# Unified Entry Point
# ---------------------------------------------------------------------------

async def run_strix_scan(
    target_url: str,
    scan_mode: str,
    llm_provider: str,
    api_key: str,
    scan_id: str,
    instruction: Optional[str] = None,
) -> AsyncGenerator[str, None]:
    """
    Run a Strix scan (real or mock depending on settings).

    Args:
        target_url: The target URL to scan
        scan_mode: quick, standard, or deep
        llm_provider: LLM provider string (e.g., "anthropic/claude-sonnet-4")
        api_key: API key for the LLM provider
        scan_id: Unique scan ID for output directory
        instruction: Optional additional instructions

    Yields:
        JSON-formatted log lines as strings
    """
    if settings.mock_mode:
        async for line in run_strix_mock(target_url, scan_mode, scan_id, instruction):
            yield line
    else:
        async for line in run_strix_real(target_url, scan_mode, llm_provider, api_key, scan_id, instruction):
            yield line


def get_mock_vulnerabilities_for_scan(scan_mode: str) -> List[Dict[str, Any]]:
    """Get a set of mock vulnerabilities for a completed scan."""
    if scan_mode == "quick":
        count = random.randint(3, 7)
    elif scan_mode == "deep":
        count = random.randint(10, 15)
    else:
        count = random.randint(6, 11)

    selected = random.sample(MOCK_VULNERABILITIES, min(count, len(MOCK_VULNERABILITIES)))
    return [
        {
            "id": str(uuid.uuid4()),
            **vuln,
        }
        for vuln in selected
    ]
