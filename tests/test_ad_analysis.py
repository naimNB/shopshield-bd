"""Tests for Ad-only Purchase Verification and Unified Evidence Decision Engine (Task 11).

Covers:
1. Ad-only endpoint POST /api/v1/analyze-ad (200 success, response structure)
2. Stated terms extraction (price, COD, advance, return policy)
3. Missing critical information detection (missing price, missing returns, missing delivery charge)
4. Ambiguous promotional buzzwords detection ("100% genuine", "export quality", etc.)
5. Payment safety considerations (advance courier charge, full advance payment, COD unavailable)
6. Unified evidence findings classification and provenance tracking
7. Practical Bangla verification questions for buyers
8. Input validation bounds (min length 5, max length 15000)
9. Error handling and deterministic fallback
"""

from unittest.mock import patch
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app
from backend.app.schemas.ad_analysis import AdAnalysisRequest, AdAnalysisResponse
from backend.app.schemas.unified_evidence import UnifiedFindingStatus
from backend.app.schemas.rules import PaymentWarningType
from backend.app.services.ad_analyzer import AdAnalyzer
from backend.app.services.ai_extractor import DeterministicExtractor

client = TestClient(app)


def test_ad_analysis_endpoint_success():
    """Verify POST /api/v1/analyze-ad extracts stated promises and returns structured response."""
    ad_text = (
        "স্মার্ট ওয়াচ প্রো ম্যাক্স! আকর্ষণীয় অফার মূল্য মাত্র ১২০০ টাকা। "
        "সারা বাংলাদেশে ক্যাশ অন ডেলিভারি সুবিধা আছে। ডেলিভারি চার্জ মাত্র ৬০ টাকা। "
        "কোনো অগ্রিম লাগবে না। ৭ দিনের রিপ্লেসমেন্ট গ্যারান্টি।"
    )
    with patch("backend.app.api.v1.routes.AdAnalyzer", lambda: AdAnalyzer(extractor=DeterministicExtractor())):
        response = client.post("/api/v1/analyze-ad", json={"advertisement_text": ad_text})
        assert response.status_code == 200
        data = response.json()

        assert data["status"] == "success"
        assert data["advertisement_claims"]["price"] == 1200.0
        assert data["advertisement_claims"]["cod_available"] is True
        assert data["advertisement_claims"]["return_policy_available"] is True

        # Explicit terms
        assert len(data["explicit_terms"]) > 0

        # Unified findings
        assert len(data["findings"]) > 0
        price_findings = [f for f in data["findings"] if f["claim_type"] == "price"]
        assert len(price_findings) == 1
        assert price_findings[0]["status"] == UnifiedFindingStatus.AGREEMENT.value

        # Metadata
        assert data["metadata"]["ad_char_count"] == len(ad_text)


def test_ad_analysis_missing_price_detection():
    """Verify ad with omitted price triggers high-severity missing information."""
    ad_text = (
        "প্রিমিয়াম সুতি পাঞ্জাবি কালেকশন। ইনবক্সে দাম জানতে মেসেজ করুন। "
        "সারাদেশে ক্যাশ অন ডেলিভারি দেওয়া যাবে। ডেলিভারি চার্জ ৮০ টাকা।"
    )
    with patch("backend.app.api.v1.routes.AdAnalyzer", lambda: AdAnalyzer(extractor=DeterministicExtractor())):
        response = client.post("/api/v1/analyze-ad", json={"advertisement_text": ad_text})
        assert response.status_code == 200
        data = response.json()

        missing_fields = [m["field"] for m in data["missing_critical_info"]]
        assert "price" in missing_fields

        # Should have a Bangla question asking for price
        assert any("দাম" in q or "মূল্য" in q for q in data["buyer_questions_bangla"])

        # Unified finding for price should be MISSING_INFORMATION
        price_finding = next(f for f in data["findings"] if f["claim_type"] == "price")
        assert price_finding["status"] == UnifiedFindingStatus.MISSING_INFORMATION.value


def test_ad_analysis_missing_return_and_delivery_fee():
    """Verify missing return policy and delivery charge are identified when absent."""
    ad_text = "ওয়্যারলেস ব্লুটুথ হেডফোন। মূল্য ৯৫০ টাকা। ক্যাশ অন ডেলিভারি আছে।"
    analyzer = AdAnalyzer(extractor=DeterministicExtractor())
    req = AdAnalysisRequest(advertisement_text=ad_text)
    res = analyzer.analyze_ad(req)

    missing_fields = [m.field for m in res.missing_critical_info]
    assert "return_policy" in missing_fields
    assert "delivery_charge" in missing_fields

    # Bangla questions should cover missing aspects
    assert any("রিটার্ন" in q or "ফেরত" in q for q in res.buyer_questions_bangla)


def test_ad_analysis_advance_payment_warning():
    """Verify ad requiring courier booking advance produces correct payment consideration."""
    ad_text = (
        "লেদার জ্যাকেট শীতের অফার! মূল্য ২৫০০ টাকা। "
        "অর্ডার নিশ্চিত করতে ১৫০ টাকা কুরিয়ার ডেলিভারি চার্জ অগ্রিম বিকাশ করতে হবে। বাকি টাকা ক্যাশ অন ডেলিভারি।"
    )
    analyzer = AdAnalyzer(extractor=DeterministicExtractor())
    req = AdAnalysisRequest(advertisement_text=ad_text)
    res = analyzer.analyze_ad(req)

    warning_types = [w.type for w in res.payment_considerations]
    assert PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value in warning_types
    assert res.advertisement_claims.advance_payment_required is True
    assert res.advertisement_claims.advance_payment_amount == 150.0


def test_ad_analysis_full_advance_warning():
    """Verify ad requiring full payment upfront generates warning payment consideration."""
    ad_text = (
        "আইফোন ১৫ প্রো ম্যাক্স পানির দামে! অফার মূল্য ৪৫০০০ টাকা। "
        "ক্যাশ অন ডেলিভারি নেই। অর্ডার করতে সম্পূর্ণ টাকা অগ্রিম পরিশোধ করতে হবে।"
    )
    analyzer = AdAnalyzer(extractor=DeterministicExtractor())
    req = AdAnalysisRequest(advertisement_text=ad_text)
    res = analyzer.analyze_ad(req)

    warning_types = [w.type for w in res.payment_considerations]
    assert PaymentWarningType.ADVANCE_FULL_PAYMENT.value in warning_types


def test_ad_analysis_ambiguous_buzzwords():
    """Verify vague promotional buzzwords are detected without false accusations."""
    ad_text = (
        "১০০% অরজিনাল এক্সপোর্ট কোয়ালিটি ড্রিম ক্রিম! মাত্র ৭ দিনে দ্রুত ফর্সা হওয়ার ম্যাজিক ফর্মুলা। "
        "মূল্য ৫০০ টাকা। ক্যাশ অন ডেলিভারি সারা দেশে।"
    )
    analyzer = AdAnalyzer(extractor=DeterministicExtractor())
    req = AdAnalysisRequest(advertisement_text=ad_text)
    res = analyzer.analyze_ad(req)

    assert len(res.ambiguous_statements) > 0
    ambiguous_words = [a.lower() for a in res.ambiguous_statements]
    assert any("100% original" in w or "অরজিনাল" in w or "এক্সপোর্ট" in w or "ম্যাজিক" in w for w in ambiguous_words)

    # Ambiguous unified findings should be present
    ambiguous_findings = [f for f in res.findings if f.status == UnifiedFindingStatus.AMBIGUOUS]
    assert len(ambiguous_findings) > 0


def test_ad_analysis_validation_min_length():
    """Verify request with less than 5 characters fails with 422."""
    response = client.post("/api/v1/analyze-ad", json={"advertisement_text": "Hi"})
    assert response.status_code == 422


def test_ad_analysis_validation_oversized():
    """Verify request exceeding 15000 characters fails with 413 or 422."""
    oversized_text = "A" * 15001
    response = client.post("/api/v1/analyze-ad", json={"advertisement_text": oversized_text})
    assert response.status_code in (413, 422)


def test_ad_analysis_empty_claims_handles_gracefully():
    """Verify an ad with minimal non-commercial text produces valid output with missing info."""
    analyzer = AdAnalyzer(extractor=DeterministicExtractor())
    req = AdAnalysisRequest(advertisement_text="Just testing this text message hello world.")
    res = analyzer.analyze_ad(req)

    assert res.status == "success"
    missing_fields = [m.field for m in res.missing_critical_info]
    assert "price" in missing_fields
    assert "cod" in missing_fields
    assert "return_policy" in missing_fields
    assert len(res.buyer_questions_bangla) > 0
