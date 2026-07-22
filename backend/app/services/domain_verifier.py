"""
StrixGuard - Domain Verification Service

Handles three methods of domain ownership verification:
1. DNS TXT Record - User adds a TXT record with a token
2. File Upload - User uploads a verification file to the site root
3. Meta Tag - User adds a meta tag to the site's HTML
"""

import random
import string
import uuid
from datetime import datetime
from typing import Optional, Tuple

import dns.resolver
import httpx
from sqlalchemy.orm import Session

from app.models import DomainVerificationORM, ScanORM, VerificationMethod


# ---------------------------------------------------------------------------
# Token Generation
# ---------------------------------------------------------------------------

def generate_verification_token() -> str:
    """Generate a random verification token."""
    return "strix_" + "".join(random.choices(string.ascii_lowercase + string.digits, k=32))


# ---------------------------------------------------------------------------
# DNS TXT Verification
# ---------------------------------------------------------------------------

async def verify_dns_txt(domain: str, token: str) -> Tuple[bool, str]:
    """
    Verify domain ownership via DNS TXT record.

    Looks for a TXT record containing the verification token.
    Returns (success, message).
    """
    try:
        # Clean domain (remove protocol and path)
        clean_domain = domain.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]

        resolver = dns.resolver.Resolver()
        resolver.timeout = 10
        resolver.lifetime = 10

        try:
            answers = resolver.resolve(clean_domain, "TXT")
        except dns.resolver.NXDOMAIN:
            return False, f"Domínio {clean_domain} não encontrado no DNS"
        except dns.resolver.NoAnswer:
            return False, f"Nenhum registro TXT encontrado para {clean_domain}"

        for rdata in answers:
            txt_value = rdata.to_text().strip('"')
            if token in txt_value:
                return True, f"Token encontrado no registro TXT: {txt_value[:50]}..."

        return False, f"Token não encontrado nos registros TXT de {clean_domain}"

    except Exception as e:
        return False, f"Erro ao verificar DNS: {str(e)}"


# ---------------------------------------------------------------------------
# File Upload Verification
# ---------------------------------------------------------------------------

async def verify_file_upload(domain: str, token: str) -> Tuple[bool, str]:
    """
    Verify domain ownership via uploaded file.

    Checks for a file at https://domain/strix-verify-<token>.html
    Returns (success, message).
    """
    try:
        # Build URL
        if not domain.startswith(("http://", "https://")):
            url = f"https://{domain}"
        else:
            url = domain

        clean_domain = url.rstrip("/")
        verification_url = f"{clean_domain}/strix-verify-{token}.html"

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(verification_url)

            if response.status_code == 200:
                content = response.text.strip()
                if token in content:
                    return True, f"Arquivo de verificação encontrado em {verification_url}"
                else:
                    return False, f"Arquivo encontrado mas token não corresponde"
            else:
                return False, f"Arquivo não encontrado (HTTP {response.status_code}): {verification_url}"

    except httpx.RequestError as e:
        return False, f"Erro de conexão: {str(e)}"
    except Exception as e:
        return False, f"Erro ao verificar arquivo: {str(e)}"


# ---------------------------------------------------------------------------
# Meta Tag Verification
# ---------------------------------------------------------------------------

async def verify_meta_tag(domain: str, token: str) -> Tuple[bool, str]:
    """
    Verify domain ownership via HTML meta tag.

    Checks for <meta name="strix-verify" content="<token>"> in the homepage HTML.
    Returns (success, message).
    """
    try:
        # Build URL
        if not domain.startswith(("http://", "https://")):
            url = f"https://{domain}"
        else:
            url = domain

        clean_domain = url.rstrip("/")

        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            response = await client.get(clean_domain)

            if response.status_code == 200:
                content = response.text
                # Look for the meta tag
                meta_str = f'<meta name="strix-verify" content="{token}">'
                meta_str_alt = f"<meta name='strix-verify' content='{token}'>"

                if meta_str in content or meta_str_alt in content:
                    return True, "Meta tag de verificação encontrada na página inicial"

                # Check if there's any strix-verify meta tag (wrong content)
                if 'name="strix-verify"' in content or "name='strix-verify'" in content:
                    return False, "Meta tag encontrada mas token não corresponde"

                return False, "Meta tag strix-verify não encontrada na página inicial"
            else:
                return False, f"Página não acessível (HTTP {response.status_code})"

    except httpx.RequestError as e:
        return False, f"Erro de conexão: {str(e)}"
    except Exception as e:
        return False, f"Erro ao verificar meta tag: {str(e)}"


# ---------------------------------------------------------------------------
# Unified Verification Dispatcher
# ---------------------------------------------------------------------------

async def verify_domain(
    method: VerificationMethod,
    domain: str,
    token: str,
) -> Tuple[bool, str]:
    """
    Verify domain ownership using the specified method.

    Args:
        method: The verification method to use
        domain: The domain to verify
        token: The verification token

    Returns:
        Tuple of (success: bool, message: str)
    """
    if method == VerificationMethod.DNS_TXT:
        return await verify_dns_txt(domain, token)
    elif method == VerificationMethod.FILE_UPLOAD:
        return await verify_file_upload(domain, token)
    elif method == VerificationMethod.META_TAG:
        return await verify_meta_tag(domain, token)
    else:
        return False, f"Método de verificação desconhecido: {method}"


# ---------------------------------------------------------------------------
# Verification Setup
# ---------------------------------------------------------------------------

def create_verification(
    db: Session,
    scan_id: str,
    method: VerificationMethod,
) -> DomainVerificationORM:
    """
    Create a new domain verification record with instructions.

    Returns the created verification record.
    """
    token = generate_verification_token()

    # Get scan for target URL
    scan = db.query(ScanORM).filter(ScanORM.id == scan_id).first()
    target = scan.target_url if scan else "example.com"

    # Clean domain
    domain = target.replace("https://", "").replace("http://", "").split("/")[0].split(":")[0]

    # Generate instructions based on method
    if method == VerificationMethod.DNS_TXT:
        instructions = (
            f"Adicione um registro TXT ao DNS do domínio '{domain}' com o seguinte valor:\n\n"
            f"  Nome: @ (ou {domain})\n"
            f"  Valor: {token}\n\n"
            f"Aguarde a propagação DNS (pode levar até 24 horas) e clique em 'Verificar'."
        )
        verification_url = None

    elif method == VerificationMethod.FILE_UPLOAD:
        filename = f"strix-verify-{token}.html"
        instructions = (
            f"Crie um arquivo chamado '{filename}' no diretório raiz do seu site ({domain})\n\n"
            f"Conteúdo do arquivo:\n"
            f"  {token}\n\n"
            f"O arquivo deve estar acessível em:\n"
            f"  https://{domain}/{filename}\n\n"
            f"Clique em 'Verificar' quando o arquivo estiver no lugar."
        )
        verification_url = f"https://{domain}/{filename}"

    elif method == VerificationMethod.META_TAG:
        instructions = (
            f"Adicione a seguinte meta tag ao <head> da página inicial de {domain}:\n\n"
            f'  <meta name="strix-verify" content="{token}">\n\n'
            f"A tag deve estar presente na página:\n"
            f"  https://{domain}/\n\n"
            f"Clique em 'Verificar' após adicionar a tag."
        )
        verification_url = f"https://{domain}/"

    else:
        instructions = "Método de verificação não suportado."
        verification_url = None

    # Create or update verification record
    existing = db.query(DomainVerificationORM).filter(
        DomainVerificationORM.scan_id == scan_id
    ).first()

    if existing:
        existing.method = method
        existing.token = token
        existing.verified = False
        existing.verified_at = None
        existing.instructions = instructions
        existing.verification_url = verification_url
        db.commit()
        db.refresh(existing)
        return existing

    verification = DomainVerificationORM(
        id=str(uuid.uuid4()),
        scan_id=scan_id,
        method=method,
        token=token,
        verified=False,
        instructions=instructions,
        verification_url=verification_url,
    )
    db.add(verification)
    db.commit()
    db.refresh(verification)
    return verification


async def check_and_verify(db: Session, scan_id: str) -> Tuple[bool, str]:
    """
    Check the verification status and verify if possible.

    Returns (is_verified, message).
    """
    verification = db.query(DomainVerificationORM).filter(
        DomainVerificationORM.scan_id == scan_id
    ).first()

    if not verification:
        return False, "Nenhuma verificação iniciada para este scan"

    if verification.verified:
        return True, "Domínio já verificado"

    # Attempt verification
    scan = db.query(ScanORM).filter(ScanORM.id == scan_id).first()
    if not scan:
        return False, "Scan não encontrado"

    success, message = await verify_domain(
        verification.method,
        scan.target_url,
        verification.token,
    )

    if success:
        verification.verified = True
        verification.verified_at = datetime.utcnow()
        scan.domain_verified = True
        db.commit()
        return True, message

    return False, message
