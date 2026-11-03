"""Comprehensive automated tests for Seller History Intelligence in ShopShield BD.

Tests cover:
- Valid Facebook Page Transparency screenshot extraction
- Missing creation date handling
- Multiple Page name changes
- Rejection of unsupported or hallucinated AI claims (evidence grounding)
- Valid archived website with Wayback CDX API
- No archive snapshots handling
- Archive API failures and rate limits
- SSRF protection against malicious URLs, private IPs, loopback, and metadata services
- Evidence provenance categorization (independent web vs user screenshot vs unverified)
- Disclaimers on date interpretations (no false claims of domain founding date)
- Real authorized live Wayback CDX query test
- Real authorized Gemini multimodal screenshot extraction test (when configured)
"""

import io
from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from PIL import Image, ImageDraw

from backend.app.main import app
from backend.app.schemas.seller_history import (
    CoverageStatus,
    DatePrecision,
    HistoricalDateInterval,
    PageNameChange,
    PageTransparencyData,
    SourceType,
    VerificationStatus,
    WebsiteHistoryRequest,
    SellerHistoryReportRequest,
)
from backend.app.services.page_transparency_service import (
    PageTransparencyService,
    calculate_page_age_months,
    parse_date_to_comparable,
    parse_date_to_interval,
    check_timeline_consistency,
)
from backend.app.services.ssrf_validator import (
    validate_and_sanitize_url,
    SSRFValidationError,
)
from backend.app.services.wayback_service import (
    WaybackService,
    WaybackTimeoutError,
    WaybackRateLimitError,
    WaybackPayloadTooLargeError,
    WaybackSourceUnavailableError,
    validate_and_format_timestamp,
)
from backend.app.services.seller_history_service import SellerHistoryService
from backend.app.config import settings

client = TestClient(app)


def create_synthetic_page_transparency_image(
    page_name: str = "Dhaka Gadget Store",
    creation_date: str = "14 October 2024",
    name_changes: list = None,
    manager_country: str = "Bangladesh (2), Nigeria (1)",
    is_running_ads: bool = True,
) -> bytes:
    """Generate a clean synthetic PNG image mimicking a Facebook Page Transparency card."""
    if name_changes is None:
        name_changes = [
            ("Dhaka Gadget Store", "October 14, 2024"),
            ("Viral Clips BD", "May 12, 2023"),
        ]

    img = Image.new("RGB", (700, 900), color=(245, 247, 250))
    draw = ImageDraw.Draw(img)

    y = 30
    draw.text((40, y), "Page Transparency", fill=(15, 23, 42))
    y += 40
    draw.text((40, y), f"Page Name: {page_name}", fill=(30, 41, 59))
    y += 50
    draw.text((40, y), f"Page created - {creation_date}", fill=(51, 65, 85))
    y += 50
    draw.text((40, y), f"Changed name {len(name_changes)} times:", fill=(51, 65, 85))
    y += 35
    for prev_name, change_date in name_changes:
        draw.text((60, y), f"- {prev_name} ({change_date})", fill=(71, 85, 105))
        y += 35
    y += 25
    draw.text((40, y), f"Primary country/region location: {manager_country}", fill=(51, 65, 85))
    y += 50
    ads_text = "This Page is currently running ads" if is_running_ads else "This Page is not currently running ads"
    draw.text((40, y), ads_text, fill=(51, 65, 85))

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


# ============================================================================
# 1. SSRF & MALICIOUS URL PROTECTION TESTS
# ============================================================================

def test_ssrf_rejects_localhost_and_loopback():
    """Verify that localhost and loopback IPv4/IPv6 addresses are rejected."""
    with pytest.raises(SSRFValidationError, match="Access to restricted hostname"):
        validate_and_sanitize_url("http://localhost:8000/admin")

    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://127.0.0.1/status")


def test_ssrf_rejects_cloud_metadata_services():
    """Verify that cloud metadata IPs (AWS/GCP 169.254.169.254) are rejected."""
    with pytest.raises(SSRFValidationError, match="restricted hostname|restricted/internal IP|cloud metadata"):
        validate_and_sanitize_url("http://169.254.169.254/latest/meta-data/")

    with pytest.raises(SSRFValidationError, match="Access to restricted hostname"):
        validate_and_sanitize_url("http://metadata.google.internal/computeMetadata/v1/")


def test_ssrf_rejects_private_rfc1918_addresses():
    """Verify that RFC 1918 private subnets (10.x, 192.168.x, 172.16.x) are blocked."""
    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://10.0.0.1/internal")

    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://192.168.1.1/router")

    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://172.16.0.5/api")


def test_ssrf_rejects_unsupported_schemes_and_credentials():
    """Verify that non-HTTP(S) schemes and embedded credentials are prohibited."""
    with pytest.raises(SSRFValidationError, match="Unsupported URL scheme"):
        validate_and_sanitize_url("ftp://example.com/files")

    with pytest.raises(SSRFValidationError, match="Unsupported URL scheme"):
        validate_and_sanitize_url("file:///etc/passwd")

    with pytest.raises(SSRFValidationError, match="embedded user credentials"):
        validate_and_sanitize_url("http://admin:secret123@example.com")


def test_ssrf_accepts_legitimate_public_url():
    """Verify that a valid public URL resolves and normalizes cleanly."""
    normalized, domain = validate_and_sanitize_url("https://daraz.com.bd/products")
    assert "daraz.com.bd" in domain
    assert normalized.startswith("https://")


# ============================================================================
# 2. WEBSITE WAYBACK HISTORICAL RESEARCH TESTS
# ============================================================================

def test_validate_and_format_timestamp():
    """Verify validation of Wayback 14-digit timestamps."""
    # Valid timestamp
    ok, dt, yr = validate_and_format_timestamp("20241014120000")
    assert ok is True
    assert dt == "2024-10-14"
    assert yr == "2024"

    # Pre-1996 timestamp (Internet Archive founded in 1996)
    ok, _, _ = validate_and_format_timestamp("19900101120000")
    assert ok is False

    # Future-dated timestamp
    ok, _, _ = validate_and_format_timestamp("20990101120000")
    assert ok is False

    # Invalid characters or length
    ok, _, _ = validate_and_format_timestamp("abc")
    assert ok is False

    # Invalid calendar month
    ok, _, _ = validate_and_format_timestamp("20241301120000")
    assert ok is False


def test_wayback_service_with_valid_archive():
    """Test Wayback service with a simulated multi-snapshot archive response."""
    service = WaybackService()

    def mock_query_cdx_raw(params: dict):
        if params.get("limit") == "1" and params.get("sort") != "reverse":
            return [
                ["timestamp", "original", "statuscode"],
                ["20150110205606", "http://www.daraz.com.bd:80/", "200"],
            ]
        elif params.get("limit") == "1" and params.get("sort") == "reverse":
            return [
                ["timestamp", "original", "statuscode"],
                ["20240101112511", "https://www.daraz.com.bd/", "200"],
            ]
        else:
            return [
                ["timestamp", "original", "statuscode"],
                ["20150110205606", "http://www.daraz.com.bd:80/", "200"],
                ["20180102114753", "https://www.daraz.com.bd/", "200"],
                ["20240101112511", "https://www.daraz.com.bd/", "200"],
            ]

    with patch.object(service, "query_cdx_raw", side_effect=mock_query_cdx_raw):
        resp = service.fetch_website_history("https://daraz.com.bd")

        assert resp.status == "success"
        assert resp.website_data.archive_available is True
        assert resp.website_data.coverage_status == "DATE_RANGE_VERIFIED"
        assert resp.website_data.sample_snapshots_count == 3
        assert resp.website_data.earliest_snapshot.formatted_date == "2015-01-10"
        assert resp.website_data.latest_snapshot.formatted_date == "2024-01-01"
        assert "web.archive.org/web/20150110205606" in resp.website_data.earliest_snapshot.snapshot_url

        # Check evidence findings provenance
        assert len(resp.findings) >= 2
        earliest_finding = next(f for f in resp.findings if f.field_name == "earliest_archive_capture")
        assert earliest_finding.source_type == SourceType.INTERNET_ARCHIVE_CDX
        assert earliest_finding.verification_status == VerificationStatus.INDEPENDENTLY_RETRIEVED

        # Ensure limitations explicitly state this is NOT domain founding date
        assert "NOT proof of domain registration date" in earliest_finding.limitations
        assert len(resp.buyer_questions) > 0


def test_wayback_service_large_history_independent_earliest_latest():
    """Verify that a site with massive historical captures (>100) retrieves true earliest (2014)

    and latest (2026) captures independently without false truncation from forward limits.
    """
    service = WaybackService()

    def mock_query_cdx_raw(params: dict):
        if params.get("limit") == "1" and params.get("sort") != "reverse":
            return [
                ["timestamp", "original", "statuscode"],
                ["20141104183951", "http://daraz.com.bd:80/", "200"],
            ]
        elif params.get("limit") == "1" and params.get("sort") == "reverse":
            return [
                ["timestamp", "original", "statuscode"],
                ["20261102131729", "https://www.daraz.com.bd/", "200"],
            ]
        else:
            return [
                ["timestamp", "original", "statuscode"],
                ["20141104183951", "http://daraz.com.bd:80/", "200"],
                ["20150110205606", "http://www.daraz.com.bd:80/", "200"],
                ["20261102131729", "https://www.daraz.com.bd/", "200"],
            ]

    with patch.object(service, "query_cdx_raw", side_effect=mock_query_cdx_raw):
        resp = service.fetch_website_history("https://daraz.com.bd")

        assert resp.status == "success"
        assert resp.website_data.coverage_status == "DATE_RANGE_VERIFIED"
        # Earliest must be 2014
        assert resp.website_data.earliest_snapshot.formatted_date == "2014-11-04"
        # Latest must be 2026, NOT an intermediate date
        assert resp.website_data.latest_snapshot.formatted_date == "2026-11-02"
        # Total captures estimate disclaimer
        assert resp.website_data.total_captures_estimate is not None
        assert "does not represent total capture volume" in resp.website_data.total_captures_estimate


def test_wayback_service_zero_snapshots():
    """Test Wayback service when domain has zero captures in Internet Archive."""
    service = WaybackService()
    with patch.object(service, "query_cdx_raw", return_value=[]):
        resp = service.fetch_website_history("https://brandnewstore12345.com.bd")

        assert resp.status == "success"
        assert resp.website_data.archive_available is False
        assert resp.website_data.coverage_status == "NO_ARCHIVES"
        assert resp.website_data.total_snapshots_observed == 0
        assert resp.website_data.earliest_snapshot is None
        assert resp.website_data.latest_snapshot is None

        presence_finding = next(f for f in resp.findings if f.field_name == "archive_presence")
        assert presence_finding.verification_status == VerificationStatus.UNAVAILABLE
        assert "NOT automatically prove a business is fraudulent" in presence_finding.limitations


def test_wayback_endpoint_api_errors():
    """Test HTTP API handling when Wayback API times out or hits rate limits."""
    # Test rate limit (429)
    with patch.object(WaybackService, "fetch_website_history", side_effect=WaybackRateLimitError):
        r = client.post("/api/v1/seller-history/website", json={"url": "https://example.com"})
        assert r.status_code == 429
        assert "rate limit" in r.json()["detail"].lower()

    # Test timeout (504)
    with patch.object(WaybackService, "fetch_website_history", side_effect=WaybackTimeoutError):
        r = client.post("/api/v1/seller-history/website", json={"url": "https://example.com"})
        assert r.status_code == 504
        assert "timed out" in r.json()["detail"].lower()


def test_wayback_endpoint_malicious_url_422():
    """Test that POST /api/v1/seller-history/website rejects malicious URLs with 422."""
    r = client.post("/api/v1/seller-history/website", json={"url": "http://127.0.0.1:8000/api"})
    assert r.status_code == 422
    assert "restricted" in r.json()["detail"].lower()


# ============================================================================
# 3. PAGE TRANSPARENCY & EVIDENCE VALIDATION TESTS
# ============================================================================

def test_calculate_page_age_months():
    """Test age calculation from various human date strings."""
    assert calculate_page_age_months(None) is None
    assert calculate_page_age_months("No date visible") is None

    # Test with known historical year
    age = calculate_page_age_months("14 October 2024")
    assert age is not None
    assert age >= 0


def test_page_transparency_evidence_validation_rejects_hallucinations():
    """Verify that claims hallucinated by AI that do not appear in raw text are discarded."""
    service = PageTransparencyService()

    raw_text = "Page Transparency\nPage Name: Trusted BD\nPage created - 10 May 2024"
    data = PageTransparencyData(
        page_name="Trusted BD",
        page_creation_date="10 May 2024",
        # Hallucinated date and name change not in raw_text:
        name_changes=[
            PageNameChange(previous_name="Scam Page 123", change_date="2023"),
        ],
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)

    # Hallucinated name change must be stripped
    assert validated.name_changes_count == 0
    assert len(validated.name_changes) == 0
    # Supported creation date must remain
    assert validated.page_creation_date == "10 May 2024"
    assert validated.page_name == "Trusted BD"


def test_page_transparency_missing_creation_date():
    """Verify handling when creation date is missing or unreadable in the screenshot."""
    service = PageTransparencyService()
    raw_text = "Page Transparency\nPage Name: Fashion Hub BD\nPrimary country: Bangladesh"
    data = PageTransparencyData(
        page_name="Fashion Hub BD",
        page_creation_date=None,
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)
    assert validated.page_creation_date is None
    assert "page_creation_date" in validated.unreadable_or_missing_fields

    findings, questions = service.build_findings_and_questions(validated)
    date_finding = next(f for f in findings if f.field_name == "page_creation_date")
    assert date_finding.verification_status == VerificationStatus.UNAVAILABLE
    assert date_finding.observed_value == "NOT_VISIBLE_IN_SCREENSHOT"


def test_page_transparency_multiple_name_changes_as_factual_record():
    """Verify that multiple name changes are treated as factual records, not fraud accusations."""
    service = PageTransparencyService()
    raw_text = (
        "Page Transparency\nPage Name: Gadget Mart\nPage created - 2020\n"
        "Changed name 2 times: 'Viral Videos BD', 'Tech Hub BD'"
    )
    data = PageTransparencyData(
        page_name="Gadget Mart",
        page_creation_date="2020",
        name_changes=[
            PageNameChange(previous_name="Viral Videos BD", change_date="2021"),
            PageNameChange(previous_name="Tech Hub BD", change_date="2023"),
        ],
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)
    assert validated.name_changes_count == 2

    findings, questions = service.build_findings_and_questions(validated)
    name_finding = next(f for f in findings if f.field_name == "page_name_changes")

    assert name_finding.source_type == SourceType.USER_SCREENSHOT
    assert name_finding.verification_status == VerificationStatus.USER_PROVIDED_UNVERIFIED
    # Ensure limitations emphasize legitimate rebranding, not fraud accusations
    assert "legitimately rebrand" in name_finding.limitations
    assert "does not constitute proof of fraud" in name_finding.limitations


def test_page_transparency_timeline_name_change_before_creation_needs_review():
    """Verify that a name change occurring before the page creation date triggers NEEDS_REVIEW."""
    service = PageTransparencyService()
    raw_text = (
        "Page Transparency\nPage Name: BD Tech Store\nPage created - 10 May 2024\n"
        "Changed name 1 time: 'Old Fashion BD' (15 January 2022)"
    )
    data = PageTransparencyData(
        page_name="BD Tech Store",
        page_creation_date="10 May 2024",
        name_changes=[
            PageNameChange(previous_name="Old Fashion BD", change_date="15 January 2022"),
        ],
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)
    assert validated.timeline_consistency_status == "NEEDS_REVIEW"
    assert len(validated.timeline_conflicts) > 0
    assert any("precedes page creation date" in c for c in validated.timeline_conflicts)

    findings, questions = service.build_findings_and_questions(validated)
    nc_finding = next(f for f in findings if f.field_name == "page_name_changes")
    assert nc_finding.verification_status == VerificationStatus.NEEDS_REVIEW
    assert "Timeline anomaly detected" in nc_finding.limitations
    assert "does not imply fraud" in nc_finding.limitations
    assert any("অসঙ্গতি" in q for q in questions)


def test_page_transparency_timeline_future_dated_needs_review():
    """Verify that future-dated creation dates trigger NEEDS_REVIEW without accusations."""
    service = PageTransparencyService()
    raw_text = "Page Transparency\nPage Name: Time Traveler BD\nPage created - 10 May 2099"
    data = PageTransparencyData(
        page_name="Time Traveler BD",
        page_creation_date="10 May 2099",
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)
    assert validated.timeline_consistency_status == "NEEDS_REVIEW"
    assert len(validated.timeline_conflicts) > 0
    assert any("in the future" in c for c in validated.timeline_conflicts)

    findings, questions = service.build_findings_and_questions(validated)
    date_finding = next(f for f in findings if f.field_name == "page_creation_date")
    assert date_finding.verification_status == VerificationStatus.NEEDS_REVIEW
    assert "future" in date_finding.limitations.lower()


def test_page_transparency_timeline_consistent():
    """Verify that chronological, valid historical events yield CONSISTENT status."""
    service = PageTransparencyService()
    raw_text = (
        "Page Transparency\nPage Name: Dhaka Mart\nPage created - 15 January 2020\n"
        "Changed name 1 time: 'Dhaka Grocery' (10 March 2022)"
    )
    data = PageTransparencyData(
        page_name="Dhaka Mart",
        page_creation_date="15 January 2020",
        name_changes=[
            PageNameChange(previous_name="Dhaka Grocery", change_date="10 March 2022"),
        ],
        raw_extracted_text=raw_text,
    )

    validated = service.validate_transparency_evidence(data)
    assert validated.timeline_consistency_status == "CONSISTENT"
    assert len(validated.timeline_conflicts) == 0

    findings, questions = service.build_findings_and_questions(validated)
    date_finding = next(f for f in findings if f.field_name == "page_creation_date")
    assert date_finding.verification_status == VerificationStatus.USER_PROVIDED_UNVERIFIED


def test_page_transparency_endpoint_with_mocked_gemini():
    """Test the full /api/v1/seller-history/page-transparency endpoint with a synthetic image."""
    img_bytes = create_synthetic_page_transparency_image()

    mock_resp_text = (
        '{"page_name": "Dhaka Gadget Store", '
        '"page_creation_date": "14 October 2024", '
        '"name_changes_count": 2, '
        '"name_changes": [{"previous_name": "Viral Clips BD", "change_date": "May 12, 2023", "evidence_text": "Viral Clips BD"}], '
        '"merge_history": null, '
        '"manager_locations": [{"country": "Bangladesh", "count": 2}, {"country": "Nigeria", "count": 1}], '
        '"is_running_ads": true, '
        '"unreadable_or_missing_fields": [], '
        '"raw_extracted_text": "Page Transparency\\nPage Name: Dhaka Gadget Store\\nPage created - 14 October 2024\\nChanged name 2 times:\\n- Viral Clips BD (May 12, 2023)\\nPrimary country/region location: Bangladesh (2), Nigeria (1)\\nThis Page is currently running ads"}'
    )

    mock_model_response = MagicMock()
    mock_model_response.text = mock_resp_text

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_model_response

    with patch.object(PageTransparencyService, "client", new_callable=lambda: mock_client):
        response = client.post(
            "/api/v1/seller-history/page-transparency",
            files={"file": ("transparency.png", img_bytes, "image/png")},
        )

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert data["transparency_data"]["page_name"] == "Dhaka Gadget Store"
        assert data["transparency_data"]["page_creation_date"] == "14 October 2024"
        assert len(data["findings"]) >= 3

        # Check disclaimer requirement
        assert "not independently verified against Meta/Facebook servers" in data["disclaimer"]


# ============================================================================
# 4. CONSOLIDATED SELLER HISTORY REPORT TESTS
# ============================================================================

def test_consolidated_seller_history_report():
    """Test combining Page Transparency and Website archive data into a consolidated report."""
    transparency_data = PageTransparencyData(
        page_name="Gadget Lab BD",
        page_creation_date="2024-01-15",
        name_changes_count=1,
        name_changes=[PageNameChange(previous_name="Phone Mart BD", change_date="2024-05")],
        raw_extracted_text="Gadget Lab BD 2024-01-15 Phone Mart BD",
    )

    mock_cdx_rows = [
        ["timestamp", "original", "statuscode"],
        ["20240201120000", "https://gadgetlab.com.bd/", "200"],
    ]

    wayback_service = WaybackService()
    transparency_service = PageTransparencyService()
    report_service = SellerHistoryService(
        wayback_service=wayback_service,
        transparency_service=transparency_service,
    )

    with patch.object(wayback_service, "query_cdx_raw", return_value=mock_cdx_rows):
        report = report_service.generate_report(
            transparency_data=transparency_data,
            website_url="https://gadgetlab.com.bd",
        )

        assert report.status == "success"
        # Findings must be cleanly separated
        assert len(report.independently_retrieved) >= 1
        assert len(report.user_provided_screenshots) >= 1
        assert any(f.source_type == SourceType.INTERNET_ARCHIVE_CDX for f in report.independently_retrieved)
        assert any(f.source_type == SourceType.USER_SCREENSHOT for f in report.user_provided_screenshots)

        # Ensure no fake scores or scam probabilities exist
        report_json = report.model_dump_json()
        assert "trust_score" not in report_json
        assert "scam_probability" not in report_json
        assert "fraud_score" not in report_json


def test_consolidated_seller_history_with_timeline_needs_review():
    """Verify consolidated report keeps NEEDS_REVIEW finding in user_provided_screenshots."""
    transparency_data = PageTransparencyData(
        page_name="Anomaly BD",
        page_creation_date="2099-01-01",
        timeline_consistency_status="NEEDS_REVIEW",
        timeline_conflicts=["Page creation date '2099-01-01' is in the future."],
        raw_extracted_text="Anomaly BD 2099-01-01",
    )
    report_service = SellerHistoryService()
    report = report_service.generate_report(transparency_data=transparency_data)
    assert report.status == "success"
    # Finding for creation date should be in user_provided_screenshots with status NEEDS_REVIEW
    creation_f = next(f for f in report.user_provided_screenshots if f.field_name == "page_creation_date")
    assert creation_f.verification_status == VerificationStatus.NEEDS_REVIEW


# ============================================================================
# 5. REAL AUTHORIZED LIVE CALL TESTS
# ============================================================================

def test_live_authorized_wayback_cdx_call():
    """Perform a live, authorized read-only query against the Internet Archive CDX API.

    Verifies real-world connectivity and parsing of public archive data.
    """
    service = WaybackService()
    try:
        # Use an established, public Bangladesh domain
        resp = service.fetch_website_history("https://daraz.com.bd")
        assert resp.status == "success"
        assert resp.website_data.archive_available is True
        assert resp.website_data.total_snapshots_observed > 0
        assert resp.website_data.earliest_snapshot is not None
        # Verify that earliest snapshot year is between 2012 and 2018
        earliest_year = int(resp.website_data.earliest_snapshot.formatted_date[:4])
        assert 2010 <= earliest_year <= 2018
    except (WaybackTimeoutError, WaybackRateLimitError):
        pytest.skip("Internet Archive Wayback Machine API is currently rate-limited or timed out.")


@pytest.mark.skipif(
    not settings.GEMINI_API_KEY,
    reason="Requires active GEMINI_API_KEY for live multimodal OCR verification",
)
def test_live_gemini_page_transparency_extraction():
    """Perform a real, live Gemini multimodal extraction on a synthetic Page Transparency screenshot."""
    img_bytes = create_synthetic_page_transparency_image(
        page_name="ShopShield BD Verified Store",
        creation_date="15 January 2024",
        name_changes=[("Old Store BD", "2023")],
        manager_country="Bangladesh (2)",
        is_running_ads=False,
    )

    service = PageTransparencyService()
    try:
        result = service.extract_page_transparency(img_bytes, declared_content_type="image/png")
        assert result.status == "success"
        assert result.transparency_data is not None
        # Model should extract the visible page name or date from the clean synthetic image
        assert len(result.transparency_data.raw_extracted_text) > 0
        assert len(result.findings) > 0
        assert len(result.buyer_questions) > 0
    except Exception as e:
        # Log exception details if live call hits transient quota
        if "quota" in str(e).lower() or "429" in str(e):
            pytest.skip("Live Gemini API quota reached during multimodal OCR test.")
        raise


# ============================================================================
# 6. TASK 08 RELIABILITY & EVIDENCE INTEGRITY REGRESSION TESTS
# ============================================================================

def test_ssrf_rejects_cgnat_and_ipv4_mapped_ipv6():
    """Verify SSRF validator rejects CGNAT (100.64.0.0/10) and IPv4-mapped IPv6 addresses."""
    # CGNAT range (100.64.0.0 - 100.127.255.255)
    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://100.64.0.1/admin")

    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://100.127.255.254/status")

    # IPv4-mapped IPv6 loopback and metadata
    with pytest.raises(SSRFValidationError, match="restricted/internal IP"):
        validate_and_sanitize_url("http://[::ffff:127.0.0.1]/internal")

    with pytest.raises(SSRFValidationError, match="restricted/internal IP|cloud metadata"):
        validate_and_sanitize_url("http://[::ffff:169.254.169.254]/latest/meta-data/")


def test_timeline_precision_overlapping_intervals_consistent():
    """Verify that partial date precision overlap (e.g. 2024 vs March 2024) is CONSISTENT."""
    # Creation 2024 ([2024-01-01, 2024-12-31]) and name change March 2024 ([2024-03-01, 2024-03-31])
    data = PageTransparencyData(
        page_name="Gadget BD",
        page_creation_date="2024",
        name_changes=[
            PageNameChange(previous_name="Viral Page", change_date="March 2024"),
        ],
        raw_extracted_text="Gadget BD 2024 Viral Page March 2024",
    )
    status, conflicts = check_timeline_consistency(data)
    assert status == "CONSISTENT"
    assert len(conflicts) == 0

    # Creation 2024 and name change 2024
    data2 = PageTransparencyData(
        page_name="Gadget BD",
        page_creation_date="2024",
        name_changes=[
            PageNameChange(previous_name="Old Name", change_date="2024"),
        ],
        raw_extracted_text="Gadget BD 2024 Old Name 2024",
    )
    status2, conflicts2 = check_timeline_consistency(data2)
    assert status2 == "CONSISTENT"
    assert len(conflicts2) == 0


def test_timeline_precision_strict_preceding_contradiction_needs_review():
    """Verify that a name change occurring strictly before page creation triggers NEEDS_REVIEW."""
    data = PageTransparencyData(
        page_name="Gadget BD",
        page_creation_date="2024",
        name_changes=[
            PageNameChange(previous_name="Old Name", change_date="2022"),
        ],
        raw_extracted_text="Gadget BD 2024 Old Name 2022",
    )
    status, conflicts = check_timeline_consistency(data)
    assert status == "NEEDS_REVIEW"
    assert any("precedes page creation date" in c for c in conflicts)


def test_timeline_impossible_calendar_dates_needs_review():
    """Verify that impossible dates (e.g. Feb 31) are detected and flagged as NEEDS_REVIEW."""
    data = PageTransparencyData(
        page_name="Bogus Dates Store",
        page_creation_date="31 February 2024",
        raw_extracted_text="Bogus Dates Store 31 February 2024",
    )
    status, conflicts = check_timeline_consistency(data)
    assert status == "NEEDS_REVIEW"
    assert any("valid calendar date" in c for c in conflicts)


def test_timeline_insufficient_information_when_dates_missing():
    """Verify that missing dates yield INSUFFICIENT_INFORMATION rather than false CONSISTENT."""
    data = PageTransparencyData(
        page_name="No Date Page",
        page_creation_date=None,
        name_changes=[],
        raw_extracted_text="No Date Page",
    )
    status, conflicts = check_timeline_consistency(data)
    assert status == "INSUFFICIENT_INFORMATION"
    assert len(conflicts) == 0


def test_wayback_oversized_response_raises_payload_too_large():
    """Verify that an oversized streaming response from Wayback CDX raises WaybackPayloadTooLargeError."""
    service = WaybackService()

    class FakeOversizedStream:
        status_code = 200
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def raise_for_status(self):
            pass
        def iter_bytes(self, chunk_size=65536):
            # Yield chunks that exceed MAX_RESPONSE_BYTES (5 MB)
            chunk = b"X" * (1024 * 1024)  # 1 MB
            for _ in range(6):
                yield chunk

    class FakeClient:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def stream(self, method, url, params=None):
            return FakeOversizedStream()

    with patch.object(service, "_client_context", return_value=FakeClient()):
        with pytest.raises(WaybackPayloadTooLargeError, match="maximum allowable size"):
            service.query_cdx_raw({"url": "example.com"})

    # Test HTTP endpoint returns 502 Bad Gateway
    with patch.object(WaybackService, "fetch_website_history", side_effect=WaybackPayloadTooLargeError):
        r = client.post("/api/v1/seller-history/website", json={"url": "https://example.com"})
        assert r.status_code == 502
        assert "maximum safe limit" in r.json()["detail"].lower()


def test_wayback_malformed_json_raises_source_unavailable():
    """Verify that malformed/HTML responses from Wayback raise WaybackSourceUnavailableError, not silent NO_ARCHIVES."""
    service = WaybackService()

    class FakeMalformedStream:
        status_code = 200
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def raise_for_status(self):
            pass
        def iter_bytes(self, chunk_size=65536):
            yield b"<html><head><title>503 Service Unavailable</title></head><body>Error</body></html>"

    class FakeClient:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def stream(self, method, url, params=None):
            return FakeMalformedStream()

    with patch.object(service, "_client_context", return_value=FakeClient()):
        with pytest.raises(WaybackSourceUnavailableError, match="non-JSON|malformed"):
            service.query_cdx_raw({"url": "example.com"})


def test_wayback_http_500_raises_source_unavailable():
    """Verify that HTTP 5xx errors from Wayback CDX raise WaybackSourceUnavailableError."""
    import httpx
    service = WaybackService()

    class Fake500Stream:
        status_code = 500
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def raise_for_status(self):
            request = httpx.Request("GET", "http://web.archive.org/cdx/search/cdx")
            response = httpx.Response(500, request=request)
            raise httpx.HTTPStatusError("500 Internal Server Error", request=request, response=response)
        def iter_bytes(self, chunk_size=65536):
            yield b""

    class FakeClient:
        def __enter__(self):
            return self
        def __exit__(self, *args):
            pass
        def stream(self, method, url, params=None):
            return Fake500Stream()

    with patch.object(service, "_client_context", return_value=FakeClient()):
        with pytest.raises(WaybackSourceUnavailableError, match="HTTP 500"):
            service.query_cdx_raw({"url": "example.com"})

