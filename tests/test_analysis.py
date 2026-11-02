"""Comprehensive automated tests for purchase promise extraction, comparison, and safety rules.

Covers the 10 core requirements:
1. Price contradiction
2. COD contradiction
3. Return policy contradiction
4. Consistent advertisement and chat
5. Missing information
6. Normal legitimate advance payment mention
7. Bangla/Banglish inputs
8. Invalid or unsupported extracted claims
9. AI API failure handling
10. No hallucinated evidence quotation
"""

from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient

from backend.app.schemas.claims import ExtractedClaims, SingleClaim
from backend.app.schemas.comparison import ContradictionStatus
from backend.app.schemas.rules import PaymentWarningType
from backend.app.services.ai_extractor import (
    AIExtractorService,
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
    verify_evidence_in_text,
)
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.rules_engine import PaymentRulesEngine
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.main import app


# ---------------------------------------------------------------------------
# 1. Price Contradiction Test
# ---------------------------------------------------------------------------
def test_price_contradiction():
    """Verify that differing prices are marked as CONTRADICTION with high severity."""
    comparer = ComparisonService()
    ad = ExtractedClaims(
        source_type="advertisement",
        price=1200.0,
        currency="BDT",
        price_evidence="Price is 1200 BDT only",
    )
    chat = ExtractedClaims(
        source_type="seller_chat",
        price=1500.0,
        currency="BDT",
        price_evidence="Price is 1500 BDT for this model",
    )

    results = comparer.compare(ad, chat)
    price_item = next(item for item in results if item.field == "price")

    assert price_item.status == ContradictionStatus.CONTRADICTION
    assert price_item.severity == "high"
    assert "1,200.00" in price_item.explanation
    assert "1,500.00" in price_item.explanation
    assert price_item.ad_evidence == "Price is 1200 BDT only"
    assert price_item.chat_evidence == "Price is 1500 BDT for this model"


# ---------------------------------------------------------------------------
# 2. COD Contradiction Test
# ---------------------------------------------------------------------------
def test_cod_contradiction():
    """Verify that promising COD in ad but denying it in chat is a CONTRADICTION."""
    comparer = ComparisonService()
    ad = ExtractedClaims(
        source_type="advertisement",
        cod_available=True,
        cod_evidence="Cash on delivery available all over Bangladesh",
    )
    chat = ExtractedClaims(
        source_type="seller_chat",
        cod_available=False,
        cod_evidence="No cash on delivery, only full advance payment accepted",
    )

    results = comparer.compare(ad, chat)
    cod_item = next(item for item in results if item.field == "cod_availability")

    assert cod_item.status == ContradictionStatus.CONTRADICTION
    assert cod_item.severity == "high"
    assert cod_item.ad_evidence == "Cash on delivery available all over Bangladesh"
    assert cod_item.chat_evidence == "No cash on delivery, only full advance payment accepted"


# ---------------------------------------------------------------------------
# 3. Return Policy Contradiction Test
# ---------------------------------------------------------------------------
def test_return_policy_contradiction():
    """Verify that offering returns in ad but denying in chat is a CONTRADICTION."""
    comparer = ComparisonService()
    ad = ExtractedClaims(
        source_type="advertisement",
        return_policy_available=True,
        return_policy_terms="7 days replacement guarantee",
        return_policy_evidence="7 days easy replacement guarantee",
    )
    chat = ExtractedClaims(
        source_type="seller_chat",
        return_policy_available=False,
        return_policy_terms="No returns once sold",
        return_policy_evidence="Bikri hoye gele ar return hobe na (no returns once sold)",
    )

    results = comparer.compare(ad, chat)
    return_item = next(item for item in results if item.field == "return_policy")

    assert return_item.status == ContradictionStatus.CONTRADICTION
    assert return_item.severity == "high"
    assert "return" in return_item.explanation.lower()


# ---------------------------------------------------------------------------
# 4. Consistent Advertisement and Chat Test
# ---------------------------------------------------------------------------
def test_consistent_advertisement_and_chat():
    """Verify consistent attributes are marked as CONSISTENT."""
    comparer = ComparisonService()
    ad = ExtractedClaims(
        source_type="advertisement",
        price=2500.0,
        cod_available=True,
        warranty_available=True,
        warranty_terms="1 year official warranty",
    )
    chat = ExtractedClaims(
        source_type="seller_chat",
        price=2500.0,
        cod_available=True,
        warranty_available=True,
        warranty_terms="1 year official warranty",
    )

    results = comparer.compare(ad, chat)
    price_item = next(item for item in results if item.field == "price")
    cod_item = next(item for item in results if item.field == "cod_availability")
    warranty_item = next(item for item in results if item.field == "warranty")

    assert price_item.status == ContradictionStatus.CONSISTENT
    assert cod_item.status == ContradictionStatus.CONSISTENT
    assert warranty_item.status == ContradictionStatus.CONSISTENT


# ---------------------------------------------------------------------------
# 5. Missing Information Test (Never Confused with Contradiction)
# ---------------------------------------------------------------------------
def test_missing_information_not_contradiction():
    """Verify that omitted information yields INSUFFICIENT_INFORMATION, not CONTRADICTION."""
    comparer = ComparisonService()
    rules_engine = PaymentRulesEngine()

    ad = ExtractedClaims(source_type="advertisement", price=1200.0)
    chat = ExtractedClaims(source_type="seller_chat")  # No fields mentioned

    results = comparer.compare(ad, chat)
    price_item = next(item for item in results if item.field == "price")
    cod_item = next(item for item in results if item.field == "cod_availability")

    # Missing in one or both sources must NOT be marked contradiction
    assert price_item.status == ContradictionStatus.INSUFFICIENT_INFORMATION
    assert cod_item.status == ContradictionStatus.INSUFFICIENT_INFORMATION

    warnings, missing_info, _ = rules_engine.evaluate(ad, chat, results)
    missing_fields = [m.field for m in missing_info]
    assert "return_policy" in missing_fields
    assert "warranty" in missing_fields


# ---------------------------------------------------------------------------
# 6. Normal Legitimate Advance Payment Mention Test
# ---------------------------------------------------------------------------
def test_normal_legitimate_advance_payment():
    """Verify that asking standard courier delivery fee (e.g. 150 Tk) is labeled INFO, not fraud."""
    rules_engine = PaymentRulesEngine()
    ad = ExtractedClaims(source_type="advertisement", price=1800.0)
    chat = ExtractedClaims(
        source_type="seller_chat",
        price=1800.0,
        advance_payment_required=True,
        advance_payment_amount=150.0,
        advance_payment_purpose="delivery_charge",
        advance_payment_evidence="Delivery charge 150 taka advance dite hobe bkash e",
    )

    comparer = ComparisonService()
    results = comparer.compare(ad, chat)

    warnings, _, _ = rules_engine.evaluate(ad, chat, results)
    delivery_warning = next(w for w in warnings if w.type == PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value)

    assert delivery_warning.severity == "info"
    assert "standard courier delivery charges" in delivery_warning.explanation.lower()
    assert "does not imply fraud" in delivery_warning.explanation.lower()


# ---------------------------------------------------------------------------
# 7. Bangla and Banglish Inputs Test
# ---------------------------------------------------------------------------
def test_bangla_and_banglish_claims_and_evidence():
    """Verify substring verification and comparison handle Bangla and Banglish."""
    bangla_source = "মূল্য ১২০০ টাকা। ক্যাশ অন ডেলিভারি প্রযোজ্য। ডেলিভারি চার্জ ১৫০ টাকা অগ্রিম বিকাশ করতে হবে।"
    banglish_source = "Dam 1200 taka, advance delivery charge 150 dite hobe, baki COD."

    assert verify_evidence_in_text("মূল্য ১২০০ টাকা", bangla_source) is True
    assert verify_evidence_in_text("ডেলিভারি চার্জ ১৫০ টাকা অগ্রিম", bangla_source) is True
    assert verify_evidence_in_text("Dam 1200 taka", banglish_source) is True
    assert verify_evidence_in_text("advance delivery charge 150", banglish_source) is True
    assert verify_evidence_in_text("baki COD", banglish_source) is True


# ---------------------------------------------------------------------------
# 8 & 10. Invalid / Unsupported Extracted Claims & No Hallucinated Quotes
# ---------------------------------------------------------------------------
def test_unsupported_evidence_quotation_rejected():
    """Verify that claims with quotes not in the source text are flagged as unsupported."""
    extractor = AIExtractorService(api_key="mock_key")
    real_text = "Wireless mouse only 650 Taka. Delivery all over BD."

    # Model returned a hallucinated quote not present in real_text
    hallucinated_claims = ExtractedClaims(
        source_type="advertisement",
        price=650.0,
        price_evidence="650 Taka",  # present in source text
        warranty_available=True,
        warranty_terms="Lifetime warranty",
        warranty_evidence="We offer complete lifetime warranty for all customers",  # NOT present!
    )

    validated = extractor.validate_extracted_claims(hallucinated_claims, real_text)

    # Hallucinated warranty quote must be stripped/nullified
    assert validated.warranty_evidence is None

    # An atomic claim marked is_supported=False must be recorded
    unsupported = [c for c in validated.claims_list if c.is_supported is False]
    assert len(unsupported) > 0
    assert unsupported[0].claim_type == "warranty_available"


# ---------------------------------------------------------------------------
# 9. AI API Failure & Error Handling Tests
# ---------------------------------------------------------------------------
def test_analyze_endpoint_missing_api_key(client: TestClient):
    """Verify that POST /api/v1/analyze returns 503 when GEMINI_API_KEY is not configured."""
    with patch("backend.app.services.ai_extractor.settings.GEMINI_API_KEY", None):
        response = client.post(
            "/api/v1/analyze",
            json={
                "advertisement_text": "Price 1200 Tk, Cash on delivery.",
                "seller_chat_text": "Price 1500 Tk, send advance.",
            },
        )
        assert response.status_code == 503
        assert "Gemini API key is not configured" in response.json()["detail"]


def test_analyze_endpoint_short_input_validation(client: TestClient):
    """Verify that short or empty inputs return 422 Unprocessable Entity."""
    response = client.post(
        "/api/v1/analyze",
        json={
            "advertisement_text": "abc",  # < 5 characters
            "seller_chat_text": "Price 1500 Tk",
        },
    )
    assert response.status_code == 422


def test_analyze_endpoint_provider_error_handling(client: TestClient):
    """Verify that AIProviderError returns 502 Bad Gateway and a user-safe message, never fake data."""
    mock_extractor = MagicMock()
    mock_extractor.extract_claims.side_effect = AIProviderError("Gemini quota exceeded or timeout.")

    with patch("backend.app.api.v1.routes.PurchasePromiseAnalyzer") as mock_analyzer_cls:
        instance = mock_analyzer_cls.return_value
        instance.analyze.side_effect = AIProviderError("Gemini quota exceeded or timeout.")

        response = client.post(
            "/api/v1/analyze",
            json={
                "advertisement_text": "Price 1200 Tk, Cash on delivery available.",
                "seller_chat_text": "Price 1500 Tk, advance required.",
            },
        )
        assert response.status_code == 502
        assert "unavailable" in response.json()["detail"].lower()


def test_analyze_endpoint_quota_exhausted_returns_429(client: TestClient):
    """Verify that AIQuotaExhaustedError returns 429 Too Many Requests."""
    with patch("backend.app.api.v1.routes.PurchasePromiseAnalyzer") as mock_analyzer_cls:
        instance = mock_analyzer_cls.return_value
        instance.analyze.side_effect = AIQuotaExhaustedError("Rate limit exceeded")

        response = client.post(
            "/api/v1/analyze",
            json={
                "advertisement_text": "Price 1200 Tk, Cash on delivery available.",
                "seller_chat_text": "Price 1500 Tk, advance required.",
            },
        )
        assert response.status_code == 429
        assert "quota" in response.json()["detail"].lower() or "rate limit" in response.json()["detail"].lower()


def test_analyze_endpoint_timeout_returns_504(client: TestClient):
    """Verify that AITimeoutError returns 504 Gateway Timeout."""
    with patch("backend.app.api.v1.routes.PurchasePromiseAnalyzer") as mock_analyzer_cls:
        instance = mock_analyzer_cls.return_value
        instance.analyze.side_effect = AITimeoutError("Request timed out after 30s")

        response = client.post(
            "/api/v1/analyze",
            json={
                "advertisement_text": "Price 1200 Tk, Cash on delivery available.",
                "seller_chat_text": "Price 1500 Tk, advance required.",
            },
        )
        assert response.status_code == 504
        assert "timed out" in response.json()["detail"].lower()


def test_analyze_endpoint_unexpected_error_safe_generic_response(client: TestClient):
    """Verify unexpected errors return 500 without leaking private text or internal stack trace."""
    with patch("backend.app.api.v1.routes.PurchasePromiseAnalyzer") as mock_analyzer_cls:
        instance = mock_analyzer_cls.return_value
        instance.analyze.side_effect = RuntimeError("secret_db_password_1234 failure in /var/internal/db.py")

        response = client.post(
            "/api/v1/analyze",
            json={
                "advertisement_text": "Price 1200 Tk, Cash on delivery available.",
                "seller_chat_text": "Customer personal chat text that must not leak.",
            },
        )
        assert response.status_code == 500
        detail = response.json()["detail"]
        assert "internal server error" in detail.lower()
        # Ensure internal details and user text are never leaked in response
        assert "secret_db_password" not in detail
        assert "/var/internal" not in detail
        assert "Customer personal chat" not in detail


# ---------------------------------------------------------------------------
# Full Workflow Test with Injected Extractor (Mocked Provider for Testing)
# ---------------------------------------------------------------------------
def test_full_analysis_workflow_with_contradictions():
    """Verify complete end-to-end analyzer logic on a conflicting f-commerce conversation."""
    mock_extractor = MagicMock()

    ad_claims = ExtractedClaims(
        source_type="advertisement",
        product_name="Smart Watch Ultra",
        price=2200.0,
        price_evidence="2200 Tk",
        cod_available=True,
        cod_evidence="Cash on delivery available nationwide",
        return_policy_available=True,
        return_policy_terms="7 days replacement",
        return_policy_evidence="7 days replacement",
        warranty_available=True,
        warranty_terms="1 year official warranty",
        warranty_evidence="1 year official warranty",
    )

    chat_claims = ExtractedClaims(
        source_type="seller_chat",
        product_name="Smart Watch Ultra",
        price=2600.0,  # Contradiction: 2200 vs 2600
        price_evidence="2600 taka",
        cod_available=False,  # Contradiction: True vs False
        cod_evidence="No COD outside Dhaka, full payment advance",
        advance_payment_required=True,
        advance_payment_amount=2600.0,
        advance_payment_purpose="full_price",
        advance_payment_evidence="Full 2600 taka advance send money koren",
        urgency_or_pressure="Offer valid only for 30 minutes, fast pay koren",
        urgency_evidence="Offer valid only for 30 minutes, fast pay koren",
    )

    mock_extractor.extract_claims.side_effect = [ad_claims, chat_claims]
    analyzer = PurchasePromiseAnalyzer(extractor=mock_extractor)

    from backend.app.schemas.analysis import AnalyzeRequest
    request = AnalyzeRequest(
        advertisement_text="Smart Watch Ultra 2200 Tk. Cash on delivery available nationwide. 7 days replacement. 1 year official warranty.",
        seller_chat_text="Full 2600 taka advance send money koren. No COD outside Dhaka, full payment advance. Offer valid only for 30 minutes, fast pay koren.",
    )

    response = analyzer.analyze(request)

    assert response.status == "success"
    assert response.has_contradictions is True
    assert response.contradiction_count >= 2  # price and COD

    # Payment warning for full advance payment
    full_advance_warning = next(w for w in response.payment_warnings if w.type == PaymentWarningType.ADVANCE_FULL_PAYMENT.value)
    assert full_advance_warning.severity == "warning"

    # Payment warning for urgency pressure
    urgency_warning = next(w for w in response.payment_warnings if w.type == PaymentWarningType.IMMEDIATE_URGENCY_PRESSURE.value)
    assert urgency_warning.severity == "warning"

    # Buyer questions generated in Bangla
    assert len(response.buyer_questions_bangla) > 0
    assert any("কুরিয়ার" in q or "ডেলিভারি" in q for q in response.buyer_questions_bangla)


# ---------------------------------------------------------------------------
# Regression Checks: Unsupported Evidence & Strict Validation
# ---------------------------------------------------------------------------
def test_verify_evidence_in_text_edge_cases():
    """Verify that None, empty, or whitespace-only evidence always returns False."""
    assert verify_evidence_in_text("", "Some genuine source text") is False
    assert verify_evidence_in_text(None, "Some genuine source text") is False
    assert verify_evidence_in_text("   ", "Some genuine source text") is False
    assert verify_evidence_in_text("hello", "") is False
    assert verify_evidence_in_text("hello", None) is False


def test_unsupported_price_claim_does_not_trigger_contradiction():
    """Verify that hallucinated/unsupported price is discarded and does NOT trigger contradiction."""
    extractor = AIExtractorService(api_key="mock_key")
    real_ad_text = "Exclusive panjabi for Eid. Best quality fabric."
    
    # Model hallucinated price quote not in text
    extracted = ExtractedClaims(
        source_type="advertisement",
        price=1800.0,
        price_evidence="Only 1800 Taka limited stock",  # NOT in real_ad_text
    )
    validated = extractor.validate_extracted_claims(extracted, real_ad_text)
    assert validated.price is None
    assert validated.price_evidence is None
    assert len(validated.unsupported_claims) == 1

    # In comparison against a chat price, it should yield INSUFFICIENT_INFORMATION, not CONTRADICTION
    chat_claims = ExtractedClaims(
        source_type="seller_chat",
        price=2200.0,
        price_evidence="dam 2200 taka",
    )
    comparer = ComparisonService()
    results = comparer.compare(validated, chat_claims)
    price_item = next(item for item in results if item.field == "price")
    assert price_item.status == ContradictionStatus.INSUFFICIENT_INFORMATION


def test_unsupported_cod_claim_does_not_trigger_contradiction():
    """Verify that hallucinated COD claim is discarded and does not cause a false contradiction."""
    extractor = AIExtractorService(api_key="mock_key")
    real_chat_text = "Apni kon color nite chan? Red and black available."
    
    # Model hallucinated that COD is denied
    extracted = ExtractedClaims(
        source_type="seller_chat",
        cod_available=False,
        cod_evidence="No cash on delivery for anyone",  # NOT in real_chat_text
    )
    validated = extractor.validate_extracted_claims(extracted, real_chat_text)
    assert validated.cod_available is None
    assert validated.cod_evidence is None

    # Ad promised COD with valid evidence
    ad_claims = ExtractedClaims(
        source_type="advertisement",
        cod_available=True,
        cod_evidence="Cash on delivery available nationwide",
    )
    comparer = ComparisonService()
    results = comparer.compare(ad_claims, validated)
    cod_item = next(item for item in results if item.field == "cod_availability")
    assert cod_item.status == ContradictionStatus.INSUFFICIENT_INFORMATION


def test_unsupported_advance_payment_does_not_trigger_warning():
    """Verify that hallucinated advance payment claim does not trigger false safety warnings."""
    extractor = AIExtractorService(api_key="mock_key")
    real_chat_text = "Apnar address din, amra pathiye dibo."

    # Model hallucinated advance payment
    extracted = ExtractedClaims(
        source_type="seller_chat",
        advance_payment_required=True,
        advance_payment_amount=1000.0,
        advance_payment_evidence="1000 taka advance bkash koren",  # NOT in text
    )
    validated = extractor.validate_extracted_claims(extracted, real_chat_text)
    assert validated.advance_payment_required is None
    assert validated.advance_payment_amount is None

    # Rules engine must not generate ADVANCE_FULL_PAYMENT or ADVANCE_DELIVERY_CHARGE warning
    rules_engine = PaymentRulesEngine()
    ad_claims = ExtractedClaims(source_type="advertisement", price=1000.0)
    warnings, _, _ = rules_engine.evaluate(ad_claims, validated, [])
    advance_warnings = [w for w in warnings if "ADVANCE" in w.type]
    assert len(advance_warnings) == 0


def test_numeric_and_boolean_comparisons_require_evidence():
    """Verify that differing values without supporting evidence are labeled NEEDS_REVIEW, not CONTRADICTION."""
    comparer = ComparisonService()
    
    # Prices differ, but neither side provided evidence
    ad = ExtractedClaims(source_type="advertisement", price=1200.0, price_evidence=None)
    chat = ExtractedClaims(source_type="seller_chat", price=1600.0, price_evidence=None)

    results = comparer.compare(ad, chat)
    price_item = next(item for item in results if item.field == "price")
    assert price_item.status == ContradictionStatus.NEEDS_REVIEW
    assert "lack a verified evidence quotation" in price_item.explanation.lower() or "review" in price_item.explanation.lower()

