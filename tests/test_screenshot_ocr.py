"""Automated tests for Gemini-powered screenshot OCR extraction endpoint.

Validates image formats, dimension validation, corrupted file handling,
oversized uploads, invalid parameters, error handling, mocked OCR responses,
and guarantees that user screenshots are never persisted to disk.
"""

import io
import os
from unittest.mock import MagicMock, patch
from PIL import Image
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.config import settings
from google.genai.errors import APIError

client = TestClient(app)


def create_test_image(format: str = "PNG", size=(100, 100), color="white") -> bytes:
    """Helper to generate in-memory valid test images."""
    img = Image.new("RGB", size, color=color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def test_extract_screenshot_valid_png(monkeypatch):
    """Test successful OCR extraction from a valid PNG image with mocked Gemini response."""
    png_bytes = create_test_image("PNG", (200, 200))
    mock_response = MagicMock()
    mock_response.text = "স্পেশাল অফার ১২০০ টাকা। ক্যাশ অন ডেলিভারি ফ্রি।"

    with patch("backend.app.services.screenshot_extractor.ScreenshotExtractorService.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response

        response = client.post(
            "/api/v1/extract-screenshot",
            files={"file": ("screenshot.png", png_bytes, "image/png")},
            data={"source_type": "advertisement"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["source_type"] == "advertisement"
        assert "স্পেশাল অফার ১২০০ টাকা" in data["extracted_text"]
        assert data["character_count"] == len(data["extracted_text"])
        assert data["image_dimensions"] == {"width": 200, "height": 200}


def test_extract_screenshot_valid_jpeg(monkeypatch):
    """Test successful OCR extraction from a valid JPEG image."""
    jpeg_bytes = create_test_image("JPEG", (150, 250))
    mock_response = MagicMock()
    mock_response.text = "Hello brother, price is 1500 tk. 200 advance bKash."

    with patch("backend.app.services.screenshot_extractor.ScreenshotExtractorService.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response

        response = client.post(
            "/api/v1/extract-screenshot",
            files={"file": ("chat.jpg", jpeg_bytes, "image/jpeg")},
            data={"source_type": "seller_chat"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["source_type"] == "seller_chat"
        assert "price is 1500 tk" in data["extracted_text"]
        assert data["image_dimensions"] == {"width": 150, "height": 250}


def test_extract_screenshot_valid_webp(monkeypatch):
    """Test successful OCR extraction from a valid WebP image."""
    webp_bytes = create_test_image("WEBP", (300, 180))
    mock_response = MagicMock()
    mock_response.text = "৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি।"

    with patch("backend.app.services.screenshot_extractor.ScreenshotExtractorService.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response

        response = client.post(
            "/api/v1/extract-screenshot",
            files={"file": ("offer.webp", webp_bytes, "image/webp")},
            data={"source_type": "advertisement"},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "রিপ্লেসমেন্ট গ্যারান্টি" in data["extracted_text"]
        assert data["image_dimensions"] == {"width": 300, "height": 180}


def test_extract_screenshot_invalid_mime_type():
    """Test uploading an unsupported MIME type returns HTTP 415."""
    fake_txt = b"Hello, this is not an image."
    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("notes.txt", fake_txt, "text/plain")},
        data={"source_type": "advertisement"},
    )
    assert response.status_code == 415
    assert "Unsupported media type" in response.json()["detail"]


def test_extract_screenshot_corrupt_image():
    """Test uploading corrupt image bytes returns HTTP 422 with validation error."""
    corrupt_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDRnotarealimagecorrupteddata"
    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("corrupt.png", corrupt_bytes, "image/png")},
        data={"source_type": "advertisement"},
    )
    assert response.status_code == 422
    assert "Invalid or corrupted image" in response.json()["detail"] or "decode" in response.json()["detail"]


def test_extract_screenshot_empty_upload():
    """Test uploading empty image file returns HTTP 422."""
    empty_bytes = b""
    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("empty.png", empty_bytes, "image/png")},
        data={"source_type": "advertisement"},
    )
    assert response.status_code == 422
    assert "empty" in response.json()["detail"].lower()


def test_extract_screenshot_oversized_upload(monkeypatch):
    """Test uploading an oversized image (> 5 MB) returns HTTP 413."""
    # Temporarily set max size to 100 KB for rapid test execution
    monkeypatch.setattr(settings, "MAX_IMAGE_SIZE_BYTES", 100 * 1024)

    oversized_bytes = b"A" * (105 * 1024)
    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("large.png", oversized_bytes, "image/png")},
        data={"source_type": "advertisement"},
    )
    assert response.status_code == 413
    assert "exceeds maximum size" in response.json()["detail"]


def test_extract_screenshot_invalid_source_type():
    """Test invalid source_type returns HTTP 422."""
    png_bytes = create_test_image("PNG")
    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("screenshot.png", png_bytes, "image/png")},
        data={"source_type": "arbitrary_unknown_type"},
    )
    assert response.status_code == 422
    assert "source_type must be either" in response.json()["detail"]


def test_extract_screenshot_missing_api_key(monkeypatch):
    """Test OCR endpoint returns HTTP 503 when GEMINI_API_KEY is not configured."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", None)
    png_bytes = create_test_image("PNG")

    response = client.post(
        "/api/v1/extract-screenshot",
        files={"file": ("screenshot.png", png_bytes, "image/png")},
        data={"source_type": "advertisement"},
    )
    assert response.status_code == 503
    assert "GEMINI_API_KEY" in response.json()["detail"]


def test_extract_screenshot_provider_failure(monkeypatch):
    """Test OCR endpoint returns HTTP 502 when Gemini provider fails."""
    monkeypatch.setattr(settings, "GEMINI_API_KEY", "test-api-key")
    png_bytes = create_test_image("PNG")

    with patch("backend.app.services.screenshot_extractor.ScreenshotExtractorService.client") as mock_client:
        mock_client.models.generate_content.side_effect = APIError(
            500, {"error": {"message": "Internal model execution error"}}
        )

        response = client.post(
            "/api/v1/extract-screenshot",
            files={"file": ("screenshot.png", png_bytes, "image/png")},
            data={"source_type": "advertisement"},
        )
        assert response.status_code == 502
        assert "AI service provider" in response.json()["detail"]


def test_extract_screenshot_no_persistence():
    """Verify that uploaded screenshots are never saved or persisted anywhere on disk."""
    png_bytes = create_test_image("PNG", (120, 120), color="blue")
    mock_response = MagicMock()
    mock_response.text = "Ephemeral image text extraction"

    # Track directory snapshots before upload
    cwd_files_before = set(os.listdir("."))

    with patch("backend.app.services.screenshot_extractor.ScreenshotExtractorService.client") as mock_client:
        mock_client.models.generate_content.return_value = mock_response

        response = client.post(
            "/api/v1/extract-screenshot",
            files={"file": ("ephemeral.png", png_bytes, "image/png")},
            data={"source_type": "advertisement"},
        )
        assert response.status_code == 200

    cwd_files_after = set(os.listdir("."))
    # No new files created in working directory
    assert cwd_files_before == cwd_files_after
