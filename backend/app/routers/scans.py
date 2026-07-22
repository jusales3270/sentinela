"""
StrixGuard - Scans Router

CRUD operations for scans, plus start/stop scan functionality.
Handles the full scan lifecycle from creation to completion.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.models import (
    ApiResponse,
    AuthorizationTermORM,
    DomainVerificationORM,
    ScanCreate,
    ScanListResponse,
    ScanMode,
    ScanORM,
    ScanResponse,
    ScanStatus,
    ScanUpdate,
    UserORM,
    VulnerabilityORM,
    get_db,
)

router = APIRouter(prefix="/scans", tags=["Scans"])


# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def scan_to_response(scan: ScanORM) -> Dict[str, Any]:
    """Convert ScanORM to response dict."""
    return {
        "id": scan.id,
        "target_url": scan.target_url,
        "status": scan.status.value if scan.status else None,
        "scan_mode": scan.scan_mode.value if scan.scan_mode else None,
        "llm_provider": scan.llm_provider,
        "instruction": scan.instruction,
        "created_at": scan.created_at,
        "started_at": scan.started_at,
        "completed_at": scan.completed_at,
        "domain_verified": scan.domain_verified,
        "authorization_signed": scan.authorization_signed,
        "user_id": scan.user_id,
        "current_agent": scan.current_agent,
        "progress_percent": scan.progress_percent,
        "error_message": scan.error_message,
        "vulnerability_count": len(scan.vulnerabilities) if scan.vulnerabilities else 0,
    }


# ---------------------------------------------------------------------------
# CRUD Endpoints
# ---------------------------------------------------------------------------

@router.post("", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def create_scan(
    scan_data: ScanCreate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Create a new scan.

    The scan starts in 'pending' status. Domain verification and
    authorization must be completed before starting.
    """
    scan = ScanORM(
        id=str(uuid.uuid4()),
        target_url=scan_data.target_url,
        status=ScanStatus.PENDING,
        scan_mode=scan_data.scan_mode,
        llm_provider=scan_data.llm_provider,
        instruction=scan_data.instruction,
        user_id=current_user.id,
    )
    db.add(scan)
    db.commit()
    db.refresh(scan)

    return ApiResponse(
        success=True,
        data=scan_to_response(scan),
        message="Scan criado com sucesso. Complete a verificação de domínio e autorização para iniciar.",
    )


@router.get("", response_model=ApiResponse)
async def list_scans(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    List scans with pagination and optional filtering.

    - **page**: Page number (1-based)
    - **page_size**: Items per page
    - **status**: Filter by scan status
    - **search**: Search in target_url
    """
    query = db.query(ScanORM).filter(ScanORM.user_id == current_user.id)

    if status:
        try:
            scan_status = ScanStatus(status)
            query = query.filter(ScanORM.status == scan_status)
        except ValueError:
            pass  # Invalid status, ignore filter

    if search:
        query = query.filter(ScanORM.target_url.ilike(f"%{search}%"))

    total = query.count()
    scans = (
        query.order_by(desc(ScanORM.created_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [scan_to_response(s) for s in scans]

    return ApiResponse(
        success=True,
        data={
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
        message=f"{total} scans encontrados",
    )


@router.get("/{scan_id}", response_model=ApiResponse)
async def get_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get a single scan by ID with full details."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Build detailed response
    response_data = scan_to_response(scan)

    # Include domain verification status
    if scan.domain_verification:
        response_data["domain_verification"] = {
            "method": scan.domain_verification.method.value,
            "verified": scan.domain_verification.verified,
            "verified_at": scan.domain_verification.verified_at,
        }

    # Include auth terms status
    if scan.auth_terms:
        response_data["auth_terms"] = {
            "signed": scan.auth_terms.signed,
            "signer_name": scan.auth_terms.signer_name,
            "signed_at": scan.auth_terms.signed_at,
        }

    # Include vulnerability summary
    vuln_counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for v in scan.vulnerabilities:
        vuln_counts[v.severity.value] = vuln_counts.get(v.severity.value, 0) + 1
    response_data["vulnerability_summary"] = vuln_counts

    return ApiResponse(
        success=True,
        data=response_data,
        message="Scan encontrado",
    )


@router.patch("/{scan_id}", response_model=ApiResponse)
async def update_scan(
    scan_id: str,
    scan_data: ScanUpdate,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Update scan details (only allowed before scan starts)."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Only allow updates for pending scans
    if scan.status not in [ScanStatus.PENDING, ScanStatus.AWAITING_AUTHORIZATION]:
        raise HTTPException(
            status_code=400,
            detail="Não é possível editar um scan que já foi iniciado",
        )

    if scan_data.target_url:
        scan.target_url = scan_data.target_url
    if scan_data.scan_mode:
        scan.scan_mode = scan_data.scan_mode
    if scan_data.instruction is not None:
        scan.instruction = scan_data.instruction

    db.commit()
    db.refresh(scan)

    return ApiResponse(
        success=True,
        data=scan_to_response(scan),
        message="Scan atualizado com sucesso",
    )


@router.delete("/{scan_id}", response_model=ApiResponse)
async def delete_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Delete a scan and all related data."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Don't allow deleting running scans
    if scan.status == ScanStatus.RUNNING:
        raise HTTPException(
            status_code=400,
            detail="Não é possível excluir um scan em execução. Pare o scan primeiro.",
        )

    db.delete(scan)
    db.commit()

    return ApiResponse(
        success=True,
        message="Scan excluído com sucesso",
    )


# ---------------------------------------------------------------------------
# Scan Control Endpoints
# ---------------------------------------------------------------------------

@router.post("/{scan_id}/start", response_model=ApiResponse)
async def start_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Start a scan.

    Requires domain verification and authorization to be completed first.
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Validate prerequisites
    if not scan.domain_verified:
        raise HTTPException(
            status_code=400,
            detail="Domínio não verificado. Complete a verificação de domínio primeiro.",
        )

    if not scan.authorization_signed:
        raise HTTPException(
            status_code=400,
            detail="Autorização não assinada. Complete os termos de autorização primeiro.",
        )

    # Check current status
    if scan.status == ScanStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Scan já está em execução")

    if scan.status == ScanStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Scan já foi concluído")

    # Update status to running
    scan.status = ScanStatus.RUNNING
    scan.started_at = datetime.utcnow()
    scan.progress_percent = 0
    scan.current_agent = "Strix Orchestrator"
    db.commit()
    db.refresh(scan)

    return ApiResponse(
        success=True,
        data=scan_to_response(scan),
        message="Scan iniciado com sucesso",
    )


@router.post("/{scan_id}/stop", response_model=ApiResponse)
async def stop_scan(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Stop a running scan."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    if scan.status != ScanStatus.RUNNING:
        raise HTTPException(
            status_code=400,
            detail=f"Scan não está em execução (status atual: {scan.status.value})",
        )

    scan.status = ScanStatus.STOPPED
    scan.completed_at = datetime.utcnow()
    scan.current_agent = None
    db.commit()
    db.refresh(scan)

    return ApiResponse(
        success=True,
        data=scan_to_response(scan),
        message="Scan interrompido",
    )


# ---------------------------------------------------------------------------
# Scan Logs (HTTP Polling Fallback)
# ---------------------------------------------------------------------------

@router.get("/{scan_id}/logs", response_model=ApiResponse)
async def get_scan_logs(
    scan_id: str,
    lines: int = Query(100, ge=1, le=1000),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Get scan logs via HTTP polling (fallback for WebSocket).

    Returns the last N log lines from the scan output file.
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # In a real implementation, logs would be stored in a file or database
    # For now, return a placeholder
    return ApiResponse(
        success=True,
        data={
            "scan_id": scan_id,
            "logs": [],  # Would contain actual log lines
            "total_lines": 0,
            "status": scan.status.value,
            "progress_percent": scan.progress_percent,
        },
        message="Logs disponíveis via WebSocket para streaming em tempo real",
    )


# ---------------------------------------------------------------------------
# Vulnerability Endpoints (nested under scans)
# ---------------------------------------------------------------------------

@router.get("/{scan_id}/vulns", response_model=ApiResponse)
async def get_scan_vulnerabilities(
    scan_id: str,
    severity: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get all vulnerabilities for a scan, optionally filtered by severity."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    query = db.query(VulnerabilityORM).filter(VulnerabilityORM.scan_id == scan_id)

    if severity:
        query = query.filter(VulnerabilityORM.severity == severity)

    vulns = query.order_by(VulnerabilityORM.cvss_score.desc()).all()

    items = []
    for v in vulns:
        items.append({
            "id": v.id,
            "scan_id": v.scan_id,
            "title": v.title,
            "severity": v.severity.value,
            "cvss_score": v.cvss_score,
            "category": v.category,
            "description": v.description,
            "proof_of_concept": v.proof_of_concept,
            "remediation": v.remediation,
            "cwe_id": v.cwe_id,
            "discovered_at": v.discovered_at,
            "evidence": v.evidence,
            "affected_urls": v.affected_urls,
            "references": v.references,
        })

    return ApiResponse(
        success=True,
        data={"items": items, "total": len(items)},
        message=f"{len(items)} vulnerabilidades encontradas",
    )
