"""Tests for Tri-State Boolean and Numerical Zero integrity in claims and comparison logic.

Verifies that explicit False, 0.0, and unknown (None) values are never conflated by truthiness operators.
"""

import pytest
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.comparison import ContradictionStatus
from backend.app.schemas.ad_analysis import AdAnalysisRequest
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.rules_engine import PaymentRulesEngine
from backend.app.services.ad_analyzer import AdAnalyzer


@pytest.fixture
def comparison_service():
    return ComparisonService()


@pytest.fixture
def rules_engine():
    return PaymentRulesEngine()


@pytest.fixture
def ad_analyzer():
    return AdAnalyzer()


def test_tristate_cod_denial_not_flipped_by_ad_truthiness(rules_engine, comparison_service):
    """When ad states COD available (True) but chat explicitly denies it (False),

    COD warning must reflect explicit chat denial and must not attach ad evidence.
    """
    ad_claims = ExtractedClaims(
        source_type="advertisement",
        product_name="Wireless Earbuds",
        price=1500.0,
        price_evidence="Price: 1500 taka",
        cod_available=True,
        cod_evidence="Cash on delivery available all over BD",
    )
    chat_claims = ExtractedClaims(
        source_type="chat",
        cod_available=False,
        cod_evidence="না ভাই ক্যাশ অন ডেলিভারি দেওয়া যাবে না, ফুল পেমেন্ট করতে হবে",
    )

    items = comparison_service.compare(ad_claims, chat_claims)
    warnings, missing_info, questions = rules_engine.evaluate(ad_claims, chat_claims, items)

    cod_warnings = [w for w in warnings if w.type == "COD_DENIED_OR_CONFLICT"]
    assert len(cod_warnings) == 1
    assert "না ভাই ক্যাশ অন ডেলিভারি দেওয়া যাবে না" in cod_warnings[0].supporting_evidence
    # Ensure ad evidence is not erroneously attached to the denial warning
    assert "Cash on delivery available all over BD" not in cod_warnings[0].supporting_evidence


def test_tristate_advance_waived_in_chat(rules_engine, comparison_service):
    """When ad required advance (True / 150.0) but seller in chat agreed to waive advance (False / 0.0),

    the chat waiver must override the ad requirement and trigger a NEEDS_REVIEW concession.
    """
    ad_claims = ExtractedClaims(
        source_type="advertisement",
        product_name="Smart Watch",
        price=2200.0,
        advance_payment_required=True,
        advance_payment_amount=150.0,
        advance_payment_purpose="DELIVERY_CHARGE",
        advance_payment_evidence="ডেলিভারি চার্জ ১৫০ টাকা অগ্রিম দিয়ে অর্ডার কনফার্ম করুন",
    )
    chat_claims = ExtractedClaims(
        source_type="chat",
        advance_payment_required=False,
        advance_payment_amount=0.0,
        advance_payment_evidence="ঠিক আছে আপনার জন্য কোনো অগ্রিম লাগবে না, ডেলিভারির সময় সব টাকা দিলেই হবে",
    )

    items = comparison_service.compare(ad_claims, chat_claims)

    # 1. Rules engine evaluation
    warnings, missing, questions = rules_engine.evaluate(ad_claims, chat_claims, items)
    # Since chat explicitly waived advance, no advance payment warnings should be emitted
    advance_warnings = [w for w in warnings if "ADVANCE" in w.type]
    assert len(advance_warnings) == 0

    # 2. Comparison service evaluation: concession should be NEEDS_REVIEW
    adv_item = next(it for it in items if it.field == "advance_payment")
    assert adv_item.status == ContradictionStatus.NEEDS_REVIEW
    assert "waive advance payment" in adv_item.explanation.lower()


def test_tristate_warranty_concession_in_chat(comparison_service):
    """When ad states no warranty (False) but seller in chat agrees to warranty (True),

    comparison must return NEEDS_REVIEW (policy concession).
    """
    ad_claims = ExtractedClaims(
        source_type="advertisement",
        warranty_available=False,
        warranty_evidence="কোনো ওয়ারেন্টি নেই",
    )
    chat_claims = ExtractedClaims(
        source_type="chat",
        warranty_available=True,
        warranty_terms="6 months seller warranty",
        warranty_evidence="আমরা ৬ মাসের সেলার ওয়ারেন্টি দেব আপনাকে",
    )

    items = comparison_service.compare(ad_claims, chat_claims)
    warr_item = next(it for it in items if it.field == "warranty")
    assert warr_item.status == ContradictionStatus.NEEDS_REVIEW
    assert "agreed to provide warranty" in warr_item.explanation.lower()


def test_tristate_zero_advance_ad_analyzer_unified_finding(ad_analyzer):
    """AdAnalyzer with zero advance explicitly stated in ad must record observed_value 0.0."""
    ad_text = (
        "স্মার্ট ওয়াচ মাত্র ২০০০ টাকা। সম্পূর্ণ ক্যাশ অন ডেলিভারি। কোনো অগ্রিম ছাড়াই অর্ডার করুন।"
    )
    report = ad_analyzer.analyze_ad(AdAnalysisRequest(advertisement_text=ad_text))

    # Find the advance payment finding
    adv_finding = next((f for f in report.findings if f.claim_type == "advance_payment"), None)
    assert adv_finding is not None
    assert adv_finding.observed_value == 0.0
    assert "zero advance payment" in adv_finding.explanation.lower()


def test_tristate_explicit_denials_in_rules_engine_build_unified_findings(rules_engine, comparison_service):
    """build_unified_findings must preserve False observed_values."""
    ad_claims = ExtractedClaims(
        source_type="advertisement",
        product_name="Backpack",
        price=850.0,
        price_evidence="850 taka",
        return_policy_available=False,
        return_policy_evidence="বিক্রিত পণ্য কোনোভাবেই ফেরত নেওয়া হবে না",
    )
    chat_claims = ExtractedClaims(
        source_type="chat",
        return_policy_available=False,
        return_policy_evidence="না ফেরত নেওয়া যাবে না",
    )

    items = comparison_service.compare(ad_claims, chat_claims)
    warnings, missing, questions = rules_engine.evaluate(ad_claims, chat_claims, items)
    findings = rules_engine.build_unified_findings(ad_claims, chat_claims, items, warnings, missing)

    ret_finding = next(f for f in findings if f.claim_type == "return_policy")
    assert ret_finding.observed_value == "False"
