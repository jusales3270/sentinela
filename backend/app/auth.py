"""
StrixGuard - Authentication Module

JWT-based authentication with simple username/password login.
Includes default demo user (admin/admin) for quick testing.
"""

import uuid
from datetime import datetime, timedelta
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models import UserORM, get_db

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer()

settings = get_settings()


# ---------------------------------------------------------------------------
# Password Utilities
# ---------------------------------------------------------------------------

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


# ---------------------------------------------------------------------------
# JWT Utilities
# ---------------------------------------------------------------------------

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=settings.jwt_expiration_hours)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.secret_key, algorithm=settings.jwt_algorithm)
    return encoded_jwt


def decode_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT token."""
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
        return payload
    except JWTError:
        return None


# ---------------------------------------------------------------------------
# User Management
# ---------------------------------------------------------------------------

def get_user_by_username(db: Session, username: str) -> Optional[UserORM]:
    """Get a user by username."""
    return db.query(UserORM).filter(UserORM.username == username).first()


def get_user_by_id(db: Session, user_id: str) -> Optional[UserORM]:
    """Get a user by ID."""
    return db.query(UserORM).filter(UserORM.id == user_id).first()


def create_user(db: Session, username: str, password: str, email: Optional[str] = None) -> UserORM:
    """Create a new user."""
    hashed_password = get_password_hash(password)
    user = UserORM(
        id=str(uuid.uuid4()),
        username=username,
        email=email,
        hashed_password=hashed_password,
        is_active=True,
        is_admin=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def ensure_default_user(db: Session) -> None:
    """Ensure the default demo user exists (admin/admin)."""
    default_user = get_user_by_username(db, "admin")
    if not default_user:
        create_user(db, "admin", "admin", "admin@strixguard.local")
        # Make admin user an admin
        default_user = get_user_by_username(db, "admin")
        if default_user:
            default_user.is_admin = True
            db.commit()


# ---------------------------------------------------------------------------
# FastAPI Dependencies
# ---------------------------------------------------------------------------

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db),
) -> UserORM:
    """FastAPI dependency to get the current authenticated user."""
    token = credentials.credentials
    payload = decode_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id: str = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user = get_user_by_id(db, user_id)
    if user is None or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return user


async def get_current_active_user(
    current_user: UserORM = Depends(get_current_user),
) -> UserORM:
    """Dependency that requires an active user."""
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


# Initialize default user on module load
# Note: In production, use Alembic migrations or startup events instead
def init_default_user():
    """Initialize default user. Call during app startup."""
    db = next(get_db())
    try:
        ensure_default_user(db)
    finally:
        db.close()
