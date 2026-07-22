"""
StrixGuard - Application Configuration

All application settings are loaded from environment variables with sensible defaults.
Use .env file for local development and proper secret management in production.
"""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # Application
    app_name: str = "StrixGuard"
    debug: bool = False
    mock_mode: bool = True
    secret_key: str = "change-me-in-production"
    api_v1_prefix: str = "/api"

    # Database
    database_url: str = "sqlite:///./strixguard.db"

    # CORS
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    # LLM Configuration
    default_llm_provider: str = "anthropic/claude-sonnet-4"
    llm_api_key: str = ""

    # Email (optional)
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@strixguard.local"

    # Strix CLI
    strix_path: str = "strix"

    # JWT
    jwt_algorithm: str = "HS256"
    jwt_expiration_hours: int = 24

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        env_prefix = ""
        case_sensitive = False

    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS origins string into a list."""
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()
