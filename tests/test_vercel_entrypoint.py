"""Automated regression tests for Vercel serverless function entry points.

Verifies that both `api/index.py` (root directory deployment) and
`backend/api/index.py` (backend directory deployment) expose standard
ASGI applications that route system health, documentation, and analysis.
"""

from fastapi.testclient import TestClient
from api.index import app as root_app
from backend.api.index import app as backend_app


def test_root_vercel_entrypoint_health():
    """Verify root api/index.py handles /health."""
    client = TestClient(root_app)
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["project"] == "ShopShield BD"


def test_root_vercel_entrypoint_api_v1_health():
    """Verify root api/index.py handles /api/v1/health."""
    client = TestClient(root_app)
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_backend_vercel_entrypoint_health():
    """Verify backend/api/index.py handles /health."""
    client = TestClient(backend_app)
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_vercel_entrypoint_analyze_validation():
    """Verify both entry points validate POST /api/v1/analyze payloads."""
    for entry_app in [root_app, backend_app]:
        client = TestClient(entry_app)
        # Empty payload should fail validation with 422
        response = client.post("/api/v1/analyze", json={})
        assert response.status_code == 422
