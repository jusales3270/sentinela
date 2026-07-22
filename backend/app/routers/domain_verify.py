"""
StrixGuard - Domain Verification Router

Handles domain ownership verification via DNS TXT, file upload, or meta tag.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.models import (
    ApiResponse,
    DomainVerifyInitiate,
    DomainVerifyResponse,
    ScanORM,
    ScanStatus,
    UserORM,
    VerificationMethod,
    get_db,
)
from app.services.domain_verifier import check_and_verify, create_verification

router = APIRouter(prefix="/scans", tags=["Domain Verification"])


def verification_to_response(v) -> dict:
    """Convert verification ORM to response dict."""
    return {
        "id": v.id,
        "scan_id": v.scan_id,
        "method": v.method.value,
        "token": v.token,
        "verified": v.verified,
        "verified_at": v.verified_at,
        "instructions": v.instructions,
        "verification_url": v.verification_url,
    }


@router.post("/{scan_id}/domain-verify", response_model=ApiResponse)
async def initiate_domain_verification(
    scan_id: str,
    data: DomainVerifyInitiate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Initiate domain verification for a scan.

    Creates a verification token and returns instructions based on the chosen method:
    - **dns_txt**: Add a TXT record to DNS
    - **file_upload**: Upload a verification file to the site root
    - **meta_tag**: Add a meta tag to the homepage HTML
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Create verification
    verification = create_verification(db, scan_id, data.method)

    # Update scan status
    scan.status = ScanStatus.VERIFYING_DOMAIN
    db.commit()
    db.refresh(verification)

    return ApiResponse(
        success=True,
        data=verification_to_response(verification),
        message=f"Verificação iniciada via {data.method.value}. Siga as instruções fornecidas.",
    )


@router.post("/{scan_id}/domain-verify/check", response_model=ApiResponse)
async def check_domain_verification(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Check if domain verification is complete.

    Performs the actual verification check (DNS lookup, HTTP request, etc.)
    and updates the scan status if verification succeeds.
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    success, message = await check_and_verify(db, scan_id)

    if success:
        # Update scan status if not already running
        if scan.status in [ScanStatus.VERIFYING_DOMAIN, ScanStatus.PENDING]:
            scan.status = ScanStatus.AWAITING_AUTHORIZATION
        scan.domain_verified = True
        db.commit()
        db.refresh(scan)

        return ApiResponse(
            success=True,
            data={"verified": True, "message": message},
            message="Domínio verificado com sucesso! Agora complete a autorização.",
        )

    return ApiResponse(
        success=True,
        data={"verified": False, "message": message},
        message=f"Verificação pendente: {message}",
    )


@router.get("/{scan_id}/domain-verify", response_model=ApiResponse)
async def get_domain_verification(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get the current domain verification status and instructions."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    if not scan.domain_verification:
        return ApiResponse(
            success=True,
            data=None,
            message="Nenhuma verificação de domínio iniciada",
        )

    return ApiResponse(
        success=True,
        data=verification_to_response(scan.domain_verification),
        message="Verificação de domínio encontrada",
    )
