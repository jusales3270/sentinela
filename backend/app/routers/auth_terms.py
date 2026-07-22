"""
StrixGuard - Authorization Terms Router

Handles the creation and signing of authorization terms for penetration testing.
"""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.models import (
    ApiResponse,
    AuthTermsCreate,
    AuthTermsResponse,
    AuthTermsSign,
    AuthorizationTermORM,
    ScanORM,
    ScanStatus,
    UserORM,
    get_db,
)

router = APIRouter(prefix="/scans", tags=["Authorization Terms"])


def auth_terms_to_response(terms: AuthorizationTermORM) -> dict:
    """Convert auth terms ORM to response dict."""
    return {
        "id": terms.id,
        "scan_id": terms.scan_id,
        "ip_range": terms.ip_range,
        "scope_urls": terms.scope_urls,
        "techniques_allowed": terms.techniques_allowed,
        "start_date": terms.start_date,
        "end_date": terms.end_date,
        "signed": terms.signed,
        "signed_at": terms.signed_at,
        "signer_name": terms.signer_name,
        "signer_email": terms.signer_email,
        "terms_text": terms.terms_text,
    }


def generate_terms_text(scan: ScanORM, terms: AuthorizationTermORM) -> str:
    """Generate the authorization terms text in Portuguese."""
    return f"""TERMO DE AUTORIZAÇÃO PARA TESTE DE PENETRAÇÃO

1. PARTES
   Contratante: {terms.signer_name or '_______________________________'}
   Email: {terms.signer_email or '_______________________________'}
   Alvo do Teste: {scan.target_url}

2. OBJETO
   O presente termo autoriza a realização de testes de penetração (pentest)
   no sistema alvo especificado acima, conforme escopo definido.

3. ESCOPO
   URLs no escopo: {terms.scope_urls or scan.target_url}
   Faixa de IP: {terms.ip_range or 'Conforme URLs de escopo'}
   Técnicas permitidas: {terms.techniques_allowed or 'Todas as técnicas não destrutivas'}

4. PERÍODO
   Data de início: {terms.start_date.strftime('%d/%m/%Y %H:%M') if terms.start_date else 'Data do início do scan'}
   Data de término: {terms.end_date.strftime('%d/%m/%Y %H:%M') if terms.end_date else 'Data de conclusão do scan'}

5. RESPONSABILIDADES
   a) O contratante declara ser o proprietário ou ter autorização do
      proprietário do sistema alvo.
   b) O contratante está ciente de que o teste pode causar indisponibilidade
      temporária de serviços.
   c) Os resultados serão mantidos em sigilo e apenas compartilhados com o
      contratante.

6. LIMITAÇÕES
   O teste NÃO inclui:
   - Sistemas fora do escopo definido
   - Ataques de negação de serviço (DoS/DDoS) sem autorização prévia
   - Modificação ou destruição de dados
   - Uso de dados acessados para fins maliciosos

7. ACEITE
   Ao assinar este termo, o contratante confirma possuir autoridade legal
   para autorizar o teste de penetração no sistema alvo.

Assinado eletronicamente via StrixGuard em {datetime.utcnow().strftime('%d/%m/%Y às %H:%M:%S UTC')}.
"""


@router.post("/{scan_id}/auth-terms", response_model=ApiResponse)
async def create_auth_terms(
    scan_id: str,
    data: AuthTermsCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Create authorization terms for a scan.

    Defines the scope, allowed techniques, and timeframe for the pentest.
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Check if auth terms already exist
    existing = db.query(AuthorizationTermORM).filter(
        AuthorizationTermORM.scan_id == scan_id,
    ).first()

    if existing:
        # Update existing
        if data.ip_range:
            existing.ip_range = data.ip_range
        if data.scope_urls:
            existing.scope_urls = data.scope_urls
        if data.techniques_allowed:
            existing.techniques_allowed = data.techniques_allowed
        if data.start_date:
            existing.start_date = data.start_date
        if data.end_date:
            existing.end_date = data.end_date

        existing.terms_text = generate_terms_text(scan, existing)
        db.commit()
        db.refresh(existing)

        return ApiResponse(
            success=True,
            data=auth_terms_to_response(existing),
            message="Termos de autorização atualizados",
        )

    # Create new
    terms = AuthorizationTermORM(
        id=str(uuid.uuid4()),
        scan_id=scan_id,
        ip_range=data.ip_range,
        scope_urls=data.scope_urls,
        techniques_allowed=data.techniques_allowed,
        start_date=data.start_date,
        end_date=data.end_date,
        signed=False,
    )
    terms.terms_text = generate_terms_text(scan, terms)

    db.add(terms)
    db.commit()
    db.refresh(terms)

    return ApiResponse(
        success=True,
        data=auth_terms_to_response(terms),
        message="Termos de autorização criados. Leia e assine para prosseguir.",
    )


@router.post("/{scan_id}/auth-terms/sign", response_model=ApiResponse)
async def sign_auth_terms(
    scan_id: str,
    data: AuthTermsSign,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Sign the authorization terms.

    Confirms that the user has read and agrees to the terms.
    Required before starting a scan.
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    terms = db.query(AuthorizationTermORM).filter(
        AuthorizationTermORM.scan_id == scan_id,
    ).first()

    if not terms:
        raise HTTPException(
            status_code=404,
            detail="Termos de autorização não encontrados. Crie os termos primeiro.",
        )

    # Sign
    terms.signed = True
    terms.signed_at = datetime.utcnow()
    terms.signer_name = data.signer_name
    terms.signer_email = data.signer_email
    scan.authorization_signed = True

    # Update scan status
    if scan.status == ScanStatus.AWAITING_AUTHORIZATION:
        scan.status = ScanStatus.PENDING  # Ready to start

    db.commit()
    db.refresh(terms)

    return ApiResponse(
        success=True,
        data=auth_terms_to_response(terms),
        message="Termos de autorização assinados com sucesso! O scan pode ser iniciado.",
    )


@router.get("/{scan_id}/auth-terms", response_model=ApiResponse)
async def get_auth_terms(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get the authorization terms for a scan."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    terms = db.query(AuthorizationTermORM).filter(
        AuthorizationTermORM.scan_id == scan_id,
    ).first()

    if not terms:
        return ApiResponse(
            success=True,
            data=None,
            message="Termos de autorização não criados",
        )

    return ApiResponse(
        success=True,
        data=auth_terms_to_response(terms),
        message="Termos de autorização encontrados",
    )
