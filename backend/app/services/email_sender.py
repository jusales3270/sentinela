"""
StrixGuard - Email Notification Service

Sends email notifications for scan events:
- Scan started
- Scan completed with findings
- Report generated
- Critical vulnerabilities found
"""

from typing import Optional

from app.config import get_settings

settings = get_settings()


class EmailSender:
    """Email notification service."""

    def __init__(self):
        self.host = settings.smtp_host
        self.port = settings.smtp_port
        self.user = settings.smtp_user
        self.password = settings.smtp_password
        self.from_addr = settings.smtp_from
        self.enabled = all([self.host, self.user, self.password])

    async def send_email(self, to: str, subject: str, body: str) -> bool:
        """Send an email notification."""
        if not self.enabled:
            # In mock mode, just log the email
            print(f"[MOCK EMAIL] To: {to}\nSubject: {subject}\n{body[:200]}...")
            return True

        try:
            import aiosmtplib
            from email.mime.text import MIMEText
            from email.mime.multipart import MIMEMultipart

            msg = MIMEMultipart()
            msg["From"] = self.from_addr
            msg["To"] = to
            msg["Subject"] = subject
            msg.attach(MIMEText(body, "html"))

            await aiosmtplib.send(
                msg,
                hostname=self.host,
                port=self.port,
                username=self.user,
                password=self.password,
                start_tls=True,
            )
            return True
        except Exception as e:
            print(f"[EMAIL ERROR] {e}")
            return False

    async def notify_scan_started(self, to: str, scan_id: str, target: str) -> bool:
        """Notify that a scan has started."""
        subject = f"[StrixGuard] Scan Iniciado - {target}"
        body = f"""
        <html>
        <body>
            <h2>Scan de Segurança Iniciado</h2>
            <p>O scan de penetração foi iniciado com sucesso.</p>
            <ul>
                <li><strong>Alvo:</strong> {target}</li>
                <li><strong>ID do Scan:</strong> {scan_id}</li>
            </ul>
            <p>Você receberá uma notificação quando o scan for concluído.</p>
        </body>
        </html>
        """
        return await self.send_email(to, subject, body)

    async def notify_scan_completed(
        self,
        to: str,
        scan_id: str,
        target: str,
        vuln_count: int,
        critical_count: int,
    ) -> bool:
        """Notify that a scan has completed."""
        severity_label = "CRÍTICAS" if critical_count > 0 else "encontradas"
        subject = f"[StrixGuard] Scan Concluído - {target} ({vuln_count} vulnerabilidades)"
        body = f"""
        <html>
        <body>
            <h2>Scan de Segurança Concluído</h2>
            <p>O scan de penetração foi concluído.</p>
            <ul>
                <li><strong>Alvo:</strong> {target}</li>
                <li><strong>ID do Scan:</strong> {scan_id}</li>
                <li><strong>Vulnerabilidades encontradas:</strong> {vuln_count}</li>
                <li><strong>Vulnerabilidades críticas:</strong> {critical_count}</li>
            </ul>
            <p>Acesse o painel para visualizar o relatório completo.</p>
        </body>
        </html>
        """
        return await self.send_email(to, subject, body)

    async def notify_critical_vulnerability(
        self,
        to: str,
        scan_id: str,
        target: str,
        vuln_title: str,
        vuln_severity: str,
    ) -> bool:
        """Notify about a critical vulnerability found during scanning."""
        subject = f"[StrixGuard] Vulnerabilidade {vuln_severity.upper()} Detectada - {target}"
        body = f"""
        <html>
        <body>
            <h2 style="color: red;">Vulnerabilidade {vuln_severity.upper()} Detectada</h2>
            <p>Uma vulnerabilidade de alta severidade foi encontrada durante o scan.</p>
            <ul>
                <li><strong>Alvo:</strong> {target}</li>
                <li><strong>Vulnerabilidade:</strong> {vuln_title}</li>
                <li><strong>Severidade:</strong> {vuln_severity.upper()}</li>
                <li><strong>ID do Scan:</strong> {scan_id}</li>
            </ul>
            <p>Ação imediata recomendada.</p>
        </body>
        </html>
        """
        return await self.send_email(to, subject, body)

    async def notify_report_generated(self, to: str, scan_id: str, target: str) -> bool:
        """Notify that a report has been generated."""
        subject = f"[StrixGuard] Relatório Gerado - {target}"
        body = f"""
        <html>
        <body>
            <h2>Relatório de Segurança Gerado</h2>
            <p>O relatório do scan de penetração está pronto.</p>
            <ul>
                <li><strong>Alvo:</strong> {target}</li>
                <li><strong>ID do Scan:</strong> {scan_id}</li>
            </ul>
            <p>Acesse o painel para fazer o download do relatório PDF.</p>
        </body>
        </html>
        """
        return await self.send_email(to, subject, body)


# Global instance
email_sender = EmailSender()
