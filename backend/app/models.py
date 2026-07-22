"""
StrixGuard - Pydantic Models and SQLAlchemy ORM Models

Defines all data models for the application including:
- Database ORM models (SQLAlchemy)
- API request/response models (Pydantic)
- Enums for status fields
"""

import uuid
from datetime import datetime
from enum import Enum
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum as SQLEnum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
)
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship, sessionmaker

from app.config import get_settings

# ---------------------------------------------------------------------------
# Enums
# ---------------------------------------------------------------------------

class ScanStatus(str, Enum):
    """Scan lifecycle states."""
    PENDING = "pending"
    VERIFYING_DOMAIN = "verifying_domain"
    AWAITING_AUTHORIZATION = "awaiting_authorization"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"
    STOPPED = "stopped"


class ScanMode(str, Enum):
    """Scan depth levels."""
    QUICK = "quick"
    STANDARD = "standard"
    DEEP = "deep"


class Severity(str, Enum):
    """Vulnerability severity levels (CVSS-based)."""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"


class VerificationMethod(str, Enum):
    """Domain verification methods."""
    DNS_TXT = "dns_txt"
    FILE_UPLOAD = "file_upload"
    META_TAG = "meta_tag"


# ---------------------------------------------------------------------------
# SQLAlchemy Base & Engine
# ---------------------------------------------------------------------------

Base = declarative_base()

# Use check_same_thread=False for SQLite to allow usage across threads
settings = get_settings()
engine_args = {}
if settings.database_url.startswith("sqlite"):
    engine_args["connect_args"] = {"check_same_thread": False}

engine = create_engine(settings.database_url, **engine_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency to get a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------------------------------------------------------------------------
# SQLAlchemy ORM Models
# ---------------------------------------------------------------------------

class ScanORM(Base):
    """Represents a penetration testing scan."""
    __tablename__ = "scans"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    target_url = Column(String(512), nullable=False)
    status = Column(SQLEnum(ScanStatus), default=ScanStatus.PENDING, nullable=False)
    scan_mode = Column(SQLEnum(ScanMode), default=ScanMode.STANDARD, nullable=False)
    llm_provider = Column(String(128), default="anthropic/claude-sonnet-4")
    instruction = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    strix_run_dir = Column(String(512), nullable=True)
    domain_verified = Column(Boolean, default=False, nullable=False)
    authorization_signed = Column(Boolean, default=False, nullable=False)
    user_id = Column(String(36), nullable=False, default="default")
    current_agent = Column(String(64), nullable=True)
    progress_percent = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)

    # Relationships
    vulnerabilities = relationship("VulnerabilityORM", back_populates="scan", cascade="all, delete-orphan")
    domain_verification = relationship("DomainVerificationORM", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    auth_terms = relationship("AuthorizationTermORM", back_populates="scan", uselist=False, cascade="all, delete-orphan")
    report = relationship("ReportORM", back_populates="scan", uselist=False, cascade="all, delete-orphan")


class VulnerabilityORM(Base):
    """Represents a discovered vulnerability."""
    __tablename__ = "vulnerabilities"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(256), nullable=False)
    severity = Column(SQLEnum(Severity), nullable=False)
    cvss_score = Column(Float, default=0.0)
    category = Column(String(128), nullable=False)  # OWASP category
    description = Column(Text, nullable=False)
    proof_of_concept = Column(Text, nullable=True)
    remediation = Column(Text, nullable=True)
    cwe_id = Column(String(32), nullable=True)
    discovered_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    evidence = Column(Text, nullable=True)
    affected_urls = Column(Text, nullable=True)
    references = Column(Text, nullable=True)

    scan = relationship("ScanORM", back_populates="vulnerabilities")


class DomainVerificationORM(Base):
    """Tracks domain ownership verification."""
    __tablename__ = "domain_verifications"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    method = Column(SQLEnum(VerificationMethod), nullable=False)
    token = Column(String(128), nullable=False)
    verified = Column(Boolean, default=False, nullable=False)
    verified_at = Column(DateTime, nullable=True)
    instructions = Column(Text, nullable=True)
    verification_url = Column(String(512), nullable=True)

    scan = relationship("ScanORM", back_populates="domain_verification")


class AuthorizationTermORM(Base):
    """Stores the authorization terms for a scan."""
    __tablename__ = "authorization_terms"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    ip_range = Column(String(256), nullable=True)
    scope_urls = Column(Text, nullable=True)
    techniques_allowed = Column(Text, nullable=True)
    start_date = Column(DateTime, nullable=True)
    end_date = Column(DateTime, nullable=True)
    signed = Column(Boolean, default=False, nullable=False)
    signed_at = Column(DateTime, nullable=True)
    signer_name = Column(String(256), nullable=True)
    signer_email = Column(String(256), nullable=True)
    terms_text = Column(Text, nullable=True)

    scan = relationship("ScanORM", back_populates="auth_terms")


class ReportORM(Base):
    """Stores generated PDF reports."""
    __tablename__ = "reports"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String(36), ForeignKey("scans.id", ondelete="CASCADE"), nullable=False, unique=True)
    generated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    report_path = Column(String(512), nullable=True)
    risk_score = Column(Float, default=0.0)
    vuln_summary = Column(JSON, default=dict)
    executive_summary = Column(Text, nullable=True)

    scan = relationship("ScanORM", back_populates="report")


class UserORM(Base):
    """User accounts for authentication."""
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(128), unique=True, nullable=False)
    email = Column(String(256), unique=True, nullable=True)
    hashed_password = Column(String(256), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    is_admin = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


# ---------------------------------------------------------------------------
# Create all tables
# ---------------------------------------------------------------------------

Base.metadata.create_all(bind=engine)


# ---------------------------------------------------------------------------
# Pydantic Models (API Schemas)
# ---------------------------------------------------------------------------

# --- Scan Schemas ---

class ScanCreate(BaseModel):
    """Request model for creating a scan."""
    target_url: str = Field(..., min_length=1, max_length=512)
    scan_mode: ScanMode = ScanMode.STANDARD
    llm_provider: Optional[str] = None
    instruction: Optional[str] = None


class ScanUpdate(BaseModel):
    """Request model for updating a scan."""
    target_url: Optional[str] = None
    scan_mode: Optional[ScanMode] = None
    instruction: Optional[str] = None


class ScanResponse(BaseModel):
    """Response model for a scan."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    target_url: str
    status: ScanStatus
    scan_mode: ScanMode
    llm_provider: Optional[str] = None
    instruction: Optional[str] = None
    created_at: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    domain_verified: bool
    authorization_signed: bool
    user_id: str
    current_agent: Optional[str] = None
    progress_percent: int = 0
    error_message: Optional[str] = None
    vulnerability_count: int = 0


class ScanListResponse(BaseModel):
    """Paginated list of scans."""
    items: List[ScanResponse]
    total: int
    page: int
    page_size: int


# --- Vulnerability Schemas ---

class VulnerabilityResponse(BaseModel):
    """Response model for a vulnerability."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    title: str
    severity: Severity
    cvss_score: float
    category: str
    description: str
    proof_of_concept: Optional[str] = None
    remediation: Optional[str] = None
    cwe_id: Optional[str] = None
    discovered_at: datetime
    evidence: Optional[str] = None
    affected_urls: Optional[str] = None
    references: Optional[str] = None


class VulnerabilityListResponse(BaseModel):
    """Paginated list of vulnerabilities."""
    items: List[VulnerabilityResponse]
    total: int


# --- Domain Verification Schemas ---

class DomainVerifyInitiate(BaseModel):
    """Request to initiate domain verification."""
    method: VerificationMethod


class DomainVerifyResponse(BaseModel):
    """Response with verification instructions."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    method: VerificationMethod
    token: str
    verified: bool
    verified_at: Optional[datetime] = None
    instructions: str
    verification_url: Optional[str] = None


# --- Authorization Terms Schemas ---

class AuthTermsCreate(BaseModel):
    """Request to create authorization terms."""
    ip_range: Optional[str] = None
    scope_urls: Optional[str] = None
    techniques_allowed: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None


class AuthTermsSign(BaseModel):
    """Request to sign authorization terms."""
    signer_name: str = Field(..., min_length=1)
    signer_email: str = Field(..., min_length=1)


class AuthTermsResponse(BaseModel):
    """Response model for authorization terms."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    ip_range: Optional[str] = None
    scope_urls: Optional[str] = None
    techniques_allowed: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    signed: bool
    signed_at: Optional[datetime] = None
    signer_name: Optional[str] = None
    signer_email: Optional[str] = None
    terms_text: Optional[str] = None


# --- Report Schemas ---

class ReportResponse(BaseModel):
    """Response model for a report."""
    model_config = ConfigDict(from_attributes=True)

    id: str
    scan_id: str
    generated_at: datetime
    report_path: Optional[str] = None
    risk_score: float
    vuln_summary: Dict[str, Any]
    executive_summary: Optional[str] = None


class ReportListResponse(BaseModel):
    """Paginated list of reports."""
    items: List[ReportResponse]
    total: int


# --- Settings Schemas ---

class SettingsResponse(BaseModel):
    """Response model for application settings."""
    llm_provider: str
    api_key_configured: bool
    mock_mode: bool


class SettingsUpdate(BaseModel):
    """Request to update settings."""
    llm_provider: Optional[str] = None
    llm_api_key: Optional[str] = None


# --- Auth Schemas ---

class UserRegister(BaseModel):
    """Request to register a new user."""
    username: str = Field(..., min_length=3, max_length=128)
    password: str = Field(..., min_length=6)
    email: Optional[str] = None


class UserLogin(BaseModel):
    """Request to login."""
    username: str
    password: str


class TokenResponse(BaseModel):
    """Response with JWT token."""
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    """Response model for current user."""
    id: str
    username: str
    email: Optional[str] = None
    is_admin: bool


# --- Stats Schemas ---

class StatsResponse(BaseModel):
    """Dashboard statistics."""
    total_scans: int
    completed_scans: int
    running_scans: int
    failed_scans: int
    total_vulnerabilities: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    info_count: int
    risk_score_avg: float
    recent_scans: List[ScanResponse]
    scans_by_month: Dict[str, int]


# --- WebSocket Message Schemas ---

class LogMessage(BaseModel):
    """A single log line from the scan process."""
    type: str = "log"  # log, vuln, progress, status, agent_change
    timestamp: str
    agent: Optional[str] = None
    level: str = "info"  # debug, info, warning, error, success
    message: str
    details: Optional[Dict[str, Any]] = None


class VulnFoundMessage(BaseModel):
    """Message emitted when a vulnerability is found."""
    type: str = "vuln"
    timestamp: str
    vulnerability: Dict[str, Any]


class ProgressMessage(BaseModel):
    """Progress update message."""
    type: str = "progress"
    timestamp: str
    percent: int
    current_phase: str
    current_agent: Optional[str] = None


class StatusMessage(BaseModel):
    """Scan status change message."""
    type: str = "status"
    timestamp: str
    status: str
    message: Optional[str] = None


# --- Generic API Response ---

class ApiResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool = True
    data: Optional[Any] = None
    message: str = ""
    error: Optional[str] = None
