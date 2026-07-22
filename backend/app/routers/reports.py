"""
StrixGuard - Reports Router

Handles report generation and retrieval.
"""

import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import FileResponse
from sqlalchemy import desc
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.models import (
    ApiResponse,
    ReportORM,
    ScanORM,
    UserORM,
    get_db,
)
from app.services.report_generator import report_generator

router = APIRouter(prefix="/reports", tags=["Reports"])


def report_to_response(report: ReportORM) -> dict:
    """Convert ReportORM to response dict."""
    return {
        "id": report.id,
        "scan_id": report.scan_id,
        "generated_at": report.generated_at,
        "report_path": report.report_path,
        "risk_score": report.risk_score,
        "vuln_summary": report.vuln_summary,
        "executive_summary": report.executive_summary,
    }


@router.post("/scan/{scan_id}", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def generate_report(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Generate a PDF report for a scan.

    Requires the scan to be completed. Creates a professional PDF with:
    - Executive summary
    - Complete vulnerability listing
    - OWASP mapping
    - Compliance mapping
    """
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    # Allow report generation for completed, stopped, or running (mock) scans
    if scan.status not in ["completed", "stopped", "running", "failed"]:
        raise HTTPException(
            status_code=400,
            detail="O scan precisa ser iniciado antes de gerar um relatório",
        )

    # Generate report
    report = await report_generator.generate_report(db, scan_id)

    if not report:
        raise HTTPException(
            status_code=500,
            detail="Erro ao gerar relatório",
        )

    return ApiResponse(
        success=True,
        data=report_to_response(report),
        message="Relatório gerado com sucesso",
    )


@router.get("/scan/{scan_id}", response_model=ApiResponse)
async def get_scan_report(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Get the report metadata for a scan."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    report = db.query(ReportORM).filter(ReportORM.scan_id == scan_id).first()

    if not report:
        raise HTTPException(status_code=404, detail="Relatório não encontrado. Gere o relatório primeiro.")

    return ApiResponse(
        success=True,
        data=report_to_response(report),
        message="Relatório encontrado",
    )


@router.get("/scan/{scan_id}/download")
async def download_report(
    scan_id: str,
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """Download the PDF report file."""
    scan = db.query(ScanORM).filter(
        ScanORM.id == scan_id,
        ScanORM.user_id == current_user.id,
    ).first()

    if not scan:
        raise HTTPException(status_code=404, detail="Scan não encontrado")

    report = db.query(ReportORM).filter(ReportORM.scan_id == scan_id).first()

    if not report or not report.report_path:
        raise HTTPException(status_code=404, detail="Relatório não encontrado. Gere o relatório primeiro.")

    if not os.path.exists(report.report_path):
        raise HTTPException(status_code=404, detail="Arquivo do relatório não encontrado")

    filename = os.path.basename(report.report_path)

    return FileResponse(
        path=report.report_path,
        filename=f"strixguard_report_{scan.target_url.replace('https://', '').replace('http://', '').split('/')[0]}.pdf",
        media_type="application/pdf",
    )


@router.get("", response_model=ApiResponse)
async def list_reports(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_active_user),
):
    """List all generated reports."""
    # Join with scans to filter by user
    query = db.query(ReportORM).join(ScanORM).filter(ScanORM.user_id == current_user.id)

    total = query.count()
    reports = (
        query.order_by(desc(ReportORM.generated_at))
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    items = [report_to_response(r) for r in reports]

    return ApiResponse(
        success=True,
        data={
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
        },
        message=f"{total} relatórios encontrados",
    )
