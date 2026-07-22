"""
StrixGuard - Report Generator Service

Generates professional PDF reports using Jinja2 templates and WeasyPrint.
All report text is in Portuguese.
"""

import os
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from weasyprint import HTML

from app.config import get_settings
from app.models import AuthorizationTermORM, ReportORM, ScanORM, VulnerabilityORM

settings = get_settings()

# Severity colors for PDF styling
SEVERITY_COLORS = {
    "critical": "#DC2626",
    "high": "#EA580C",
    "medium": "#D97706",
    "low": "#059669",
    "info": "#2563EB",
}

SEVERITY_LABELS = {
    "critical": "CRÍTICA",
    "high": "ALTA",
    "medium": "MÉDIA",
    "low": "BAIXA",
    "info": "INFORMATIVA",
}

SEVERITY_SCORES = {
    "critical": 4,
    "high": 3,
    "medium": 2,
    "low": 1,
    "info": 0,
}

# OWASP Top 10 2021 descriptions (Portuguese)
OWASP_DESCRIPTIONS = {
    "A01:2021 - Broken Access Control": "Falhas que permitem que usuários ajam fora de suas permissões. Leva a acesso não autorizado a dados e funcionalidades.",
    "A02:2021 - Cryptographic Failures": "Falhas relacionadas à criptografia que levam à exposição de dados sensíveis.",
    "A03:2021 - Injection": "Injeção de código malicioso através de entrada do usuário. Inclui SQL, NoSQL, OS Command e LDAP injection.",
    "A04:2021 - Insecure Design": "Falhas de design arquitetural que não podem ser corrigidas apenas com implementação correta.",
    "A05:2021 - Security Misconfiguration": "Configurações de segurança ausentes ou incorretas em aplicações, frameworks e servidores.",
    "A06:2021 - Vulnerable and Outdated Components": "Uso de componentes com vulnerabilidades conhecidas sem atualizações de segurança.",
    "A07:2021 - Identification and Authentication Failures": "Falhas em funções relacionadas a identificação, autenticação e gerenciamento de sessão.",
    "A08:2021 - Software and Data Integrity Failures": "Suposições relacionadas a atualizações de software e dados críticos sem verificação de integridade.",
    "A09:2021 - Security Logging and Monitoring Failures": "Falta de logging e monitoramento adequados impedem detecção de ataques e resposta a incidentes.",
    "A10:2021 - Server-Side Request Forgery (SSRF)": "O servidor faz requisições a URLs controladas pelo atacante, podendo acessar recursos internos.",
}

# Compliance mappings
COMPLIANCE_MAPPINGS = {
    "LGPD (Lei 13.709/2018)": [
        "Art. 46 - Segurança do tratamento de dados pessoais",
        "Art. 50 - Boas práticas e governança",
        "Art. 52 - Relatório de impacto à proteção de dados",
    ],
    "PCI DSS v4.0": [
        "Req. 6.2 - Patch de vulnerabilidades de segurança",
        "Req. 6.4 - Prevenção de injeção",
        "Req. 6.5 - Endereçar ameaças de engenharia de software",
        "Req. 8.2 - Autenticação forte",
        "Req. 10.2 - Log de acesso aos dados",
    ],
    "ISO/IEC 27001:2022": [
        "A.5.1 - Políticas de segurança da informação",
        "A.5.7 - Defesa contra malware",
        "A.5.9 - Inventário de ativos",
        "A.5.16 - Gerenciamento de vulnerabilidades técnicas",
        "A.5.18 - Privilegios de acesso",
        "A.5.24 - Planejamento e preparação para gestão de incidentes",
        "A.8.1 - Dispositivos de endpoint",
    ],
    "NIST CSF 2.0": [
        "GV.RR-01 - Políticas de governança de risco",
        "ID.RA-01 - Avaliação de riscos",
        "PR.AA-01 - Identidades e credenciais",
        "PR.DS-01 - Criptografia em repouso e em trânsito",
        "DE.CM-01 - Monitoramento contínuo",
        "RS.MA-01 - Processo de gerenciamento de incidentes",
    ],
}


class ReportGenerator:
    """Generates professional PDF pentest reports."""

    def __init__(self):
        self.reports_dir = os.path.join(os.getcwd(), "reports")
        os.makedirs(self.reports_dir, exist_ok=True)

        # Setup Jinja2
        templates_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "templates")
        self.env = Environment(loader=FileSystemLoader(templates_dir))

    def calculate_risk_score(self, vulnerabilities: List[VulnerabilityORM]) -> float:
        """Calculate overall risk score (0-100)."""
        if not vulnerabilities:
            return 0.0

        total_weight = 0
        weighted_sum = 0

        for vuln in vulnerabilities:
            weight = SEVERITY_SCORES.get(vuln.severity.value, 1)
            weighted_sum += weight * vuln.cvss_score
            total_weight += weight

        if total_weight == 0:
            return 0.0

        # Normalize to 0-100
        raw_score = (weighted_sum / total_weight) * 10
        return min(100.0, round(raw_score, 1))

    def get_risk_label(self, score: float) -> str:
        """Get risk label based on score."""
        if score >= 80:
            return "CRÍTICO"
        elif score >= 60:
            return "ALTO"
        elif score >= 40:
            return "MÉDIO"
        elif score >= 20:
            return "BAIXO"
        else:
            return "INFORMATIVO"

    def get_risk_color(self, score: float) -> str:
        """Get risk color based on score."""
        if score >= 80:
            return "#DC2626"
        elif score >= 60:
            return "#EA580C"
        elif score >= 40:
            return "#D97706"
        elif score >= 20:
            return "#059669"
        else:
            return "#2563EB"

    def generate_executive_summary(
        self,
        scan: ScanORM,
        vulnerabilities: List[VulnerabilityORM],
        risk_score: float,
    ) -> str:
        """Generate an executive summary in Portuguese."""
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        for v in vulnerabilities:
            severity_counts[v.severity.value] = severity_counts.get(v.severity.value, 0) + 1

        risk_label = self.get_risk_label(risk_score)

        summary = f"""
        Este relatório apresenta os resultados do teste de penetração realizado no alvo
        <strong>{scan.target_url}</strong> utilizando a metodologia OWASP Testing Guide v4.2
        e o framework StrixGuard com inteligência artificial.

        <strong>Resumo Executivo:</strong>

        O teste de penetração identificou <strong>{len(vulnerabilities)} vulnerabilidades</strong>
        no sistema avaliado. A pontuação de risco geral é de <strong>{risk_score}/100 ({risk_label})</strong>.

        Distribuição por severidade:
        <ul>
            <li><strong style="color: #DC2626;">Críticas:</strong> {severity_counts['critical']}</li>
            <li><strong style="color: #EA580C;">Altas:</strong> {severity_counts['high']}</li>
            <li><strong style="color: #D97706;">Médias:</strong> {severity_counts['medium']}</li>
            <li><strong style="color: #059669;">Baixas:</strong> {severity_counts['low']}</li>
            <li><strong style="color: #2563EB;">Informativas:</strong> {severity_counts['info']}</li>
        </ul>

        <strong>Principais Conclusões:</strong>

        O sistema apresenta falhas significativas que podem comprometer a confidencialidade,
        integridade e disponibilidade dos dados. As vulnerabilidades mais críticas incluem
        injeção de código SQL e execução remota de comandos, que podem permitir acesso total
        ao servidor e ao banco de dados.

        Recomenda-se a correção prioritária das vulnerabilidades classificadas como Críticas e Altas,
        seguida de um novo teste de validação após as correções.
        """

        return " ".join(summary.split())

    async def generate_report(self, db: Session, scan_id: str) -> Optional[ReportORM]:
        """
        Generate a PDF report for a scan.

        Returns the created ReportORM object, or None if scan not found.
        """
        scan = db.query(ScanORM).filter(ScanORM.id == scan_id).first()
        if not scan:
            return None

        vulnerabilities = (
            db.query(VulnerabilityORM)
            .filter(VulnerabilityORM.scan_id == scan_id)
            .order_by(
                VulnerabilityORM.cvss_score.desc(),
            )
            .all()
        )

        auth_terms = (
            db.query(AuthorizationTermORM)
            .filter(AuthorizationTermORM.scan_id == scan_id)
            .first()
        )

        # Calculate metrics
        risk_score = self.calculate_risk_score(vulnerabilities)
        severity_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
        owasp_categories: Dict[str, int] = {}

        for v in vulnerabilities:
            sev = v.severity.value
            severity_counts[sev] = severity_counts.get(sev, 0) + 1
            cat = v.category
            owasp_categories[cat] = owasp_categories.get(cat, 0) + 1

        # Build vulnerability data for template
        vuln_data = []
        for i, v in enumerate(vulnerabilities, 1):
            vuln_data.append({
                "index": i,
                "id": v.id,
                "title": v.title,
                "severity": v.severity.value,
                "severity_label": SEVERITY_LABELS.get(v.severity.value, v.severity.value.upper()),
                "severity_color": SEVERITY_COLORS.get(v.severity.value, "#6B7280"),
                "cvss_score": v.cvss_score,
                "category": v.category,
                "description": v.description,
                "proof_of_concept": v.proof_of_concept,
                "remediation": v.remediation,
                "cwe_id": v.cwe_id,
                "discovered_at": v.discovered_at.strftime("%d/%m/%Y %H:%M:%S"),
                "evidence": v.evidence,
                "affected_urls": v.affected_urls,
                "references": v.references,
            })

        # Executive summary
        executive_summary = self.generate_executive_summary(scan, vulnerabilities, risk_score)

        # OWASP descriptions for found categories
        owasp_data = []
        for cat, count in sorted(owasp_categories.items(), key=lambda x: -x[1]):
            owasp_data.append({
                "category": cat,
                "count": count,
                "description": OWASP_DESCRIPTIONS.get(cat, ""),
            })

        # Compliance data
        compliance_data = []
        for standard, items in COMPLIANCE_MAPPINGS.items():
            compliance_data.append({
                "standard": standard,
                "items": items,
            })

        # Render template
        template = self.env.get_template("report_template.html")
        html_content = template.render(
            scan={
                "id": scan.id,
                "target_url": scan.target_url,
                "scan_mode": scan.scan_mode.value,
                "status": scan.status.value,
                "created_at": scan.created_at.strftime("%d/%m/%Y %H:%M:%S"),
                "started_at": scan.started_at.strftime("%d/%m/%Y %H:%M:%S") if scan.started_at else None,
                "completed_at": scan.completed_at.strftime("%d/%m/%Y %H:%M:%S") if scan.completed_at else None,
            },
            auth_terms={
                "signed": auth_terms.signed if auth_terms else False,
                "signer_name": auth_terms.signer_name if auth_terms else None,
                "signer_email": auth_terms.signer_email if auth_terms else None,
                "scope_urls": auth_terms.scope_urls if auth_terms else None,
                "ip_range": auth_terms.ip_range if auth_terms else None,
                "signed_at": auth_terms.signed_at.strftime("%d/%m/%Y %H:%M:%S") if auth_terms and auth_terms.signed_at else None,
            } if auth_terms else None,
            vulnerabilities=vuln_data,
            total_vulns=len(vulnerabilities),
            severity_counts=severity_counts,
            risk_score=risk_score,
            risk_label=self.get_risk_label(risk_score),
            risk_color=self.get_risk_color(risk_score),
            executive_summary=executive_summary,
            owasp_categories=owasp_data,
            compliance=compliance_data,
            generated_at=datetime.utcnow().strftime("%d/%m/%Y %H:%M:%S"),
            report_id=str(uuid.uuid4())[:8],
        )

        # Generate PDF
        report_filename = f"report_{scan_id}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.pdf"
        report_path = os.path.join(self.reports_dir, report_filename)

        HTML(string=html_content).write_pdf(report_path)

        # Save to database
        existing = db.query(ReportORM).filter(ReportORM.scan_id == scan_id).first()
        if existing:
            existing.generated_at = datetime.utcnow()
            existing.report_path = report_path
            existing.risk_score = risk_score
            existing.vuln_summary = severity_counts
            existing.executive_summary = executive_summary
            db.commit()
            db.refresh(existing)
            return existing

        report = ReportORM(
            id=str(uuid.uuid4()),
            scan_id=scan_id,
            generated_at=datetime.utcnow(),
            report_path=report_path,
            risk_score=risk_score,
            vuln_summary=severity_counts,
            executive_summary=executive_summary,
        )
        db.add(report)
        db.commit()
        db.refresh(report)
        return report


# Global instance
report_generator = ReportGenerator()
