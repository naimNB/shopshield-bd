"""Pytest fixtures for ShopShield BD tests."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app


@pytest.fixture
def client() -> TestClient:
    """Fixture providing a test client configured for the FastAPI app."""
    return TestClient(app)
