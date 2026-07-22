"""
StrixGuard - Settings Router

Manages application settings including LLM provider configuration.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.auth import get_current_active_user
from app.config import get_settings
from app.models import ApiResponse, SettingsResponse, SettingsUpdate, UserORM, get_db

router = APIRouter(prefix="/settings", tags=["Settings"])

# In-memory settings store (in production, use database)
# For demo purposes, settings are stored in memory
_app_settings = {
    "llm_provider": None,
    "llm_api_key": None,
}


def _get_current_settings():
    """Get current settings with overrides."""
    cfg = get_settings()
    return {
        "llm_provider": _app_settings.get("llm_provider") or cfg.default_llm_provider,
        "api_key_configured": bool(
            _app_settings.get("llm_api_key") or cfg.llm_api_key
        ),
        "mock_mode": cfg.mock_mode,
    }


@router.get("", response_model=ApiResponse)
async def get_settings_endpoint(
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Get current application settings.

    Returns LLM provider info and mock mode status.
    API keys are never returned for security.
    """
    settings = _get_current_settings()

    return ApiResponse(
        success=True,
        data=settings,
        message="Configurações carregadas",
    )


@router.put("", response_model=ApiResponse)
async def update_settings(
    data: SettingsUpdate,
    current_user: UserORM = Depends(get_current_active_user),
):
    """
    Update application settings.

    - **llm_provider**: LLM provider string (e.g., "anthropic/claude-sonnet-4")
    - **llm_api_key**: API key for the LLM provider (masked in responses)
    """
    if data.llm_provider:
        _app_settings["llm_provider"] = data.llm_provider

    if data.llm_api_key:
        _app_settings["llm_api_key"] = data.llm_api_key

    settings = _get_current_settings()

    return ApiResponse(
        success=True,
        data=settings,
        message="Configurações atualizadas com sucesso",
    )
