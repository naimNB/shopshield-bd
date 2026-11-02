"""Health check schema."""

from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, Field


class ServiceStatus(BaseModel):
    """Status details for internal services."""

    api: str = Field(default="operational", description="Core API operational status")
    database: str = Field(default="configured", description="Database connection status")
    ai_engine: str = Field(
        default="standby",
        description="Multimodal AI engine status (scheduled for Task 02+)",
    )


class HealthResponse(BaseModel):
    """Structured health check response."""

    status: str = Field(default="healthy", description="Overall system health status")
    project: str = Field(default="ShopShield BD", description="Project name")
    version: str = Field(default="0.1.0", description="API version")
    environment: str = Field(default="development", description="Current runtime environment")
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc),
        description="UTC timestamp of the health check",
    )
    services: ServiceStatus = Field(
        default_factory=ServiceStatus,
        description="Subsystem health breakdown",
    )
    docs_url: str = Field(default="/docs", description="Interactive OpenAPI documentation path")
