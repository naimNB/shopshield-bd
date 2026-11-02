"""Tests for health check and documentation endpoints."""

from fastapi.testclient import TestClient


def test_root_health_endpoint(client: TestClient):
    """Test that GET /health returns 200 and healthy status."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "ShopShield BD"
    assert data["version"] == "0.1.0"
    assert data["services"]["api"] == "operational"
    assert data["services"]["ai_engine"] in ["standby", "operational", "unconfigured (missing GEMINI_API_KEY)"]
    assert "timestamp" in data
    assert data["docs_url"] == "/docs"


def test_api_v1_health_endpoint(client: TestClient):
    """Test that GET /api/v1/health returns 200 and matches root health."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "ShopShield BD"


def test_root_index_endpoint(client: TestClient):
    """Test that GET / returns index information."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "ShopShield BD" in data["message"]
    assert data["documentation"] == "/docs"
    assert data["health"] == "/health"


def test_api_v1_status_endpoint(client: TestClient):
    """Test that GET /api/v1/status returns phase metadata."""
    response = client.get("/api/v1/status")
    assert response.status_code == 200
    data = response.json()
    assert data["event"] == "YUNet AIgnite Buildathon 2026"
    assert "features" in data


def test_docs_endpoints(client: TestClient):
    """Test that /docs and /openapi.json are accessible."""
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200
    assert "text/html" in docs_resp.headers.get("content-type", "")

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    spec = openapi_resp.json()
    assert spec["info"]["title"] == "ShopShield BD"
    assert "/health" in spec["paths"]
