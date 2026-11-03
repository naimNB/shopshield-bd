"""Application configuration settings for ShopShield BD."""

import json
from typing import List, Union
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from environment or defaults."""

    PROJECT_NAME: str = "ShopShield BD"
    DESCRIPTION: str = (
        "AI-Powered Purchase Promise & Payment Safety Assistant API "
        "— YUNet AIgnite Buildathon 2026"
    )
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    SECRET_KEY: str = "shopshield-bd-dev-secret-key-35d7a8dd"
    ALLOWED_ORIGINS: Union[List[str], str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "https://shopshield-bd.vercel.app",
    ]

    # Multimodal AI Engine Configuration
    GEMINI_API_KEY: Union[str, None] = None
    GEMINI_MODEL: str = "gemini-3.1-flash-lite"
    AI_REQUEST_TIMEOUT_SECONDS: int = 25
    MAX_INPUT_TEXT_LENGTH: int = 15000
    MAX_IMAGE_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    ALLOWED_IMAGE_TYPES: List[str] = ["image/png", "image/jpeg", "image/webp", "image/jpg"]

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        """Parse comma-separated strings or JSON string into list of clean origins."""
        if isinstance(v, str):
            v = v.strip()
            if v.startswith("[") and v.endswith("]"):
                return [origin.strip().rstrip("/") for origin in json.loads(v) if origin.strip()]
            return [origin.strip().rstrip("/") for origin in v.split(",") if origin.strip()]
        if isinstance(v, list):
            return [origin.strip().rstrip("/") for origin in v if isinstance(origin, str) and origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()
