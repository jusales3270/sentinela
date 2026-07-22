"""
StrixGuard - FastAPI Application Entry Point

Main FastAPI application with:
- CORS middleware for frontend communication
- API routers for all endpoints
- Health check endpoint
- Startup/shutdown events
- Error handlers
"""

import logging
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.auth import init_default_user
from app.config import get_settings
from app.models import ApiResponse
from app.routers import auth_terms, domain_verify, reports, scans, settings as settings_router
from app.routers.websocket import router as websocket_router

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("strixguard")

settings = get_settings()


# ---------------------------------------------------------------------------
# Lifespan Manager (Startup/Shutdown)
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown events."""
    # Startup
    logger.info("=" * 60)
    logger.info("StrixGuard Backend Iniciando...")
    logger.info(f"Modo: {'MOCK (simulação)' if settings.mock_mode else 'PRODUÇÃO'}")
    logger.info(f"Banco de dados: {settings.database_url}")
    logger.info(f"LLM Provider: {settings.default_llm_provider}")
    logger.info("=" * 60)

    # Initialize default user
    try:
        init_default_user()
        logger.info("Usuário padrão verificado (admin/admin)")
    except Exception as e:
        logger.warning(f"Não foi possível inicializar usuário padrão: {e}")

    yield

    # Shutdown
    logger.info("StrixGuard Backend encerrando...")


# ---------------------------------------------------------------------------
# FastAPI App
# ---------------------------------------------------------------------------

app = FastAPI(
    title=settings.app_name,
    description="""
    StrixGuard - Plataforma Inteligente de Teste de Penetração

    Backend API para orquestração de scans de segurança com:
    - Integração com Strix CLI (ferramenta open-source de pentest com IA)
    - Verificação de domínio (DNS TXT, arquivo, meta tag)
    - Termos de autorização digitais
    - Streaming de logs via WebSocket
    - Geração de relatórios PDF profissionais
    - Todas as operações em português

    ## Autenticação
    A maioria dos endpoints requer autenticação via JWT Bearer token.
    Use `/api/auth/login` para obter um token.

    ## Mock Mode
    Quando MOCK_MODE=true, o backend simula execução do Strix CLI
    com logs realistas e vulnerabilidades de demonstração.
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    """Log all incoming requests with timing."""
    start_time = time.time()
    path = request.url.path

    # Skip health check logging to reduce noise
    if path != "/api/health":
        logger.info(f"→ {request.method} {path}")

    response = await call_next(request)

    duration = time.time() - start_time
    if path != "/api/health":
        logger.info(f"← {request.method} {path} - {response.status_code} ({duration:.3f}s)")

    # Add response time header
    response.headers["X-Response-Time"] = f"{duration:.3f}s"
    return response


# ---------------------------------------------------------------------------
# Error Handlers
# ---------------------------------------------------------------------------

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Handle unexpected errors gracefully."""
    logger.error(f"Erro não tratado em {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ApiResponse(
            success=False,
            error="Erro interno do servidor",
            message="Ocorreu um erro inesperado. Por favor, tente novamente.",
        ).model_dump(),
    )


@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    """Handle 404 errors."""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ApiResponse(
            success=False,
            error="Endpoint não encontrado",
            message=f"O caminho {request.url.path} não existe.",
        ).model_dump(),
    )


# ---------------------------------------------------------------------------
# Include Routers
# ---------------------------------------------------------------------------

# Scans (main CRUD + control)
app.include_router(scans.router, prefix=f"{settings.api_v1_prefix}")

# Reports
app.include_router(reports.router, prefix=f"{settings.api_v1_prefix}")

# Domain verification
app.include_router(domain_verify.router, prefix=f"{settings.api_v1_prefix}")

# Auth terms
app.include_router(auth_terms.router, prefix=f"{settings.api_v1_prefix}")

# Settings
app.include_router(settings_router.router, prefix=f"{settings.api_v1_prefix}")

# WebSocket
app.include_router(websocket_router, prefix=f"{settings.api_v1_prefix}")


# ---------------------------------------------------------------------------
# Auth Endpoints (inline, simple)
# ---------------------------------------------------------------------------

from fastapi import Depends
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session

from app.auth import (
    create_access_token,
    create_user,
    decode_token,
    ensure_default_user,
    get_current_user,
    get_user_by_username,
    get_user_by_id,
    verify_password,
)
from app.models import (
    TokenResponse,
    UserLogin,
    UserORM,
    UserRegister,
    UserResponse,
    get_db,
)

security = HTTPBearer()


@app.post(f"{settings.api_v1_prefix}/auth/register", response_model=ApiResponse, status_code=status.HTTP_201_CREATED)
async def register(data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user account."""
    # Check if username exists
    existing = get_user_by_username(db, data.username)
    if existing:
        raise HTTPException(status_code=400, detail="Nome de usuário já existe")

    user = create_user(db, data.username, data.password, data.email)

    # Generate token
    token = create_access_token({"sub": user.id})

    return ApiResponse(
        success=True,
        data={
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expiration_hours * 3600,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
            },
        },
        message="Conta criada com sucesso",
    )


@app.post(f"{settings.api_v1_prefix}/auth/login", response_model=ApiResponse)
async def login(data: UserLogin, db: Session = Depends(get_db)):
    """
    Login with username and password.

    Returns a JWT token for use in authenticated requests.
    Default demo user: admin / admin
    """
    user = get_user_by_username(db, data.username)
    if not user or not verify_password(data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciais inválidas")

    token = create_access_token({"sub": user.id})

    return ApiResponse(
        success=True,
        data={
            "access_token": token,
            "token_type": "bearer",
            "expires_in": settings.jwt_expiration_hours * 3600,
            "user": {
                "id": user.id,
                "username": user.username,
                "email": user.email,
                "is_admin": user.is_admin,
            },
        },
        message="Login realizado com sucesso",
    )


@app.get(f"{settings.api_v1_prefix}/auth/me", response_model=ApiResponse)
async def get_current_user_info(
    credentials: HTTPBearer = Depends(security),
    db: Session = Depends(get_db),
):
    """Get the current authenticated user's information."""
    user = await get_current_user(credentials, db)

    return ApiResponse(
        success=True,
        data={
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "is_admin": user.is_admin,
        },
        message="Usuário autenticado",
    )


# ---------------------------------------------------------------------------
# Stats Endpoint
# ---------------------------------------------------------------------------

from sqlalchemy import func
from app.models import Severity


@app.get(f"{settings.api_v1_prefix}/stats", response_model=ApiResponse)
async def get_stats(
    db: Session = Depends(get_db),
    current_user: UserORM = Depends(get_current_user),
):
    """
    Get dashboard statistics.

    Returns aggregated data about scans, vulnerabilities, and risk scores.
    """
    # Count scans by status
    total_scans = db.query(ScanORM).filter(ScanORM.user_id == current_user.id).count()
    completed_scans = db.query(ScanORM).filter(
        ScanORM.user_id == current_user.id,
        ScanORM.status == ScanStatus.COMPLETED,
    ).count()
    running_scans = db.query(ScanORM).filter(
        ScanORM.user_id == current_user.id,
        ScanORM.status == ScanStatus.RUNNING,
    ).count()
    failed_scans = db.query(ScanORM).filter(
        ScanORM.user_id == current_user.id,
        ScanORM.status.in_([ScanStatus.FAILED, ScanStatus.STOPPED]),
    ).count()

    # Count vulnerabilities by severity
    vuln_query = db.query(VulnerabilityORM).join(ScanORM).filter(ScanORM.user_id == current_user.id)
    total_vulns = vuln_query.count()

    critical_count = vuln_query.filter(VulnerabilityORM.severity == Severity.CRITICAL).count()
    high_count = vuln_query.filter(VulnerabilityORM.severity == Severity.HIGH).count()
    medium_count = vuln_query.filter(VulnerabilityORM.severity == Severity.MEDIUM).count()
    low_count = vuln_query.filter(VulnerabilityORM.severity == Severity.LOW).count()
    info_count = vuln_query.filter(VulnerabilityORM.severity == Severity.INFO).count()

    # Average risk score from reports
    from app.models import ReportORM
    avg_risk = db.query(func.avg(ReportORM.risk_score)).join(ScanORM).filter(
        ScanORM.user_id == current_user.id,
    ).scalar() or 0.0

    # Recent scans
    recent_scans = db.query(ScanORM).filter(
        ScanORM.user_id == current_user.id,
    ).order_by(ScanORM.created_at.desc()).limit(5).all()

    recent_items = []
    for s in recent_scans:
        recent_items.append({
            "id": s.id,
            "target_url": s.target_url,
            "status": s.status.value,
            "scan_mode": s.scan_mode.value,
            "created_at": s.created_at.isoformat(),
            "progress_percent": s.progress_percent,
            "vulnerability_count": len(s.vulnerabilities) if s.vulnerabilities else 0,
        })

    # Scans by month (last 6 months)
    from datetime import datetime, timedelta
    scans_by_month = {}
    for i in range(5, -1, -1):
        month_date = datetime.utcnow() - timedelta(days=i * 30)
        month_key = month_date.strftime("%Y-%m")
        month_start = datetime(month_date.year, month_date.month, 1)
        if month_date.month == 12:
            month_end = datetime(month_date.year + 1, 1, 1)
        else:
            month_end = datetime(month_date.year, month_date.month + 1, 1)

        count = db.query(ScanORM).filter(
            ScanORM.user_id == current_user.id,
            ScanORM.created_at >= month_start,
            ScanORM.created_at < month_end,
        ).count()

        month_label = month_date.strftime("%b/%Y")
        scans_by_month[month_label] = count

    return ApiResponse(
        success=True,
        data={
            "total_scans": total_scans,
            "completed_scans": completed_scans,
            "running_scans": running_scans,
            "failed_scans": failed_scans,
            "total_vulnerabilities": total_vulns,
            "critical_count": critical_count,
            "high_count": high_count,
            "medium_count": medium_count,
            "low_count": low_count,
            "info_count": info_count,
            "risk_score_avg": round(float(avg_risk), 1),
            "recent_scans": recent_items,
            "scans_by_month": scans_by_month,
        },
        message="Estatísticas carregadas",
    )


# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------

@app.get("/api/health")
async def health_check():
    """Health check endpoint for Docker/monitoring."""
    return {
        "status": "healthy",
        "service": settings.app_name,
        "mock_mode": settings.mock_mode,
        "version": "1.0.0",
    }


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "name": settings.app_name,
        "version": "1.0.0",
        "description": "Plataforma Inteligente de Teste de Penetração",
        "docs": "/api/docs",
        "mock_mode": settings.mock_mode,
    }
