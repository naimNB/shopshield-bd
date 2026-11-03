"""Unit and integration tests for high-level assessment states and responsible product authenticity verification."""

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.schemas.ad_analysis import AdAnalysisRequest
from backend.app.schemas.analysis import AnalyzeRequest
from backend.app.services.ad_analyzer import AdAnalyzer
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.rules_engine import (
    evaluate_product_authenticity,
    determine_overall_assessment_ad,
    determine_overall_assessment_comparison,
    map_bangla_questions_to_english,
)

client = TestClient(app)


def test_product_authenticity_when_originality_claimed():
    text = "100% Original Casio Edifice Watch only 2,200 Tk! Authentic imported piece, limited stock!"
    res = evaluate_product_authenticity(text)
    assert res.status == "CLAIMED_ORIGINAL"
    assert res.claim_detected is True
    assert "Original" in (res.claim_evidence or "")
    assert "স্বাধীনভাবে যাচাইকৃত নয়" in res.status_label_bn
    assert "Not independently verified" in res.status_label_en
    assert len(res.verification_steps_bn) >= 3
    assert len(res.verification_steps_en) >= 3
    assert "অনলাইন বিজ্ঞাপন" in res.disclaimer_bn
    assert "cannot verify physical product authenticity" in res.disclaimer_en


def test_product_authenticity_when_no_claim():
    text = "Winter Fleece Hoodie only 850 Tk. Cash on delivery available. 7 days exchange."
    res = evaluate_product_authenticity(text)
    assert res.status == "NOT_INDEPENDENTLY_VERIFIED"
    assert res.claim_detected is False
    assert res.claim_evidence is None
    assert res.status_label_bn == "স্বাধীনভাবে যাচাইকৃত নয়"
    assert res.status_label_en == "Not independently verified"


def test_product_authenticity_empty_text():
    res = evaluate_product_authenticity("")
    assert res.status == "INSUFFICIENT_EVIDENCE"
    assert res.claim_detected is False


def test_bilingual_questions_mapping():
    bn_questions = [
        "আমি কি সম্পূর্ণ মূল্য অগ্রিম না দিয়ে শুধুমাত্র কুরিয়ার চার্জ অগ্রিম দিয়ে বাকি টাকা প্রোডাক্ট হাতে পেয়ে পরিশোধ করতে পারি?",
        "পণ্য ডেলিভারি পেতে দেরি হলে বা কোনো কারণে অর্ডার বাতিল হলে এই বুকিং ফি কি সম্পূর্ণ ফেরতযোগ্য?",
        "কুরিয়ার থেকে পার্সেল রিসিভ করার সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?",
    ]
    en_questions = map_bangla_questions_to_english(bn_questions)
    assert len(en_questions) == len(bn_questions)
    assert "Can I pay only the courier delivery charge" in en_questions[0]
    assert "Is this booking fee fully refundable" in en_questions[1]
    assert "Open-box inspection" in en_questions[2]


def test_synthetic_scenario_1_ad_cod_vs_chat_100_advance():
    """Scenario 1: Ad promises COD, private chat demands 100% advance."""
    payload = {
        "advertisement_text": "শীতের প্রিমিয়াম উইন্টার জ্যাকেট মাত্র ১,৮৫০ টাকা! সারা দেশে ক্যাশ অন ডেলিভারি (COD) সুবিধা। পণ্য দেখে মূল্য পরিশোধ করুন। স্টক সীমিত, অর্ডার করতে এখনই ইনবক্স করুন!",
        "seller_chat_text": "স্যার জ্যাকেট স্টকে আছে। কিন্তু এই অফার প্রাইজে কোনো ক্যাশ অন ডেলিভারি দেওয়া যাবে না। এখনই আমাদের পার্সোনাল বিকাশ নম্বরে ১,৮৫০ টাকা ফুল অ্যাডভান্স পাঠাতে হবে, তারপর পার্সেল বুক হবে।",
    }
    resp = client.post("/api/v1/analyze", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["overall_assessment"] == "WARNING_SIGNS_FOUND"
    assert data["assessment_summary"] is not None
    assert data["has_contradictions"] is True
    assert len(data["payment_warnings"]) > 0
    assert len(data["buyer_questions_bangla"]) > 0
    assert len(data["buyer_questions_en"]) == len(data["buyer_questions_bangla"])
    assert data["product_authenticity"] is not None


def test_synthetic_scenario_2_unverified_original_watch_claim():
    """Scenario 2: Ad claims 100% original watch with no independent proof."""
    payload = {
        "advertisement_text": "100% Original Casio Edifice Chronograph Watch only 2,200 Tk! Authentic imported piece with original box and tags. Hurry, limited quantity available! Inbox to order.",
    }
    resp = client.post("/api/v1/analyze-ad", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["product_authenticity"]["status"] == "CLAIMED_ORIGINAL"
    assert data["product_authenticity"]["claim_detected"] is True
    assert "Not independently verified" in data["product_authenticity"]["status_label_en"]
    assert len(data["product_authenticity"]["verification_steps_en"]) >= 3
    assert len(data["buyer_questions_bangla"]) > 0
    assert len(data["buyer_questions_en"]) == len(data["buyer_questions_bangla"])


def test_synthetic_scenario_3_insufficient_evidence():
    """Scenario 3: Sparse or vague text produces INSUFFICIENT_EVIDENCE."""
    payload = {
        "advertisement_text": "Inbox please. Very nice item.",
    }
    resp = client.post("/api/v1/analyze-ad", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["overall_assessment"] == "INSUFFICIENT_EVIDENCE"
    assert "অপর্যাপ্ত" in data["assessment_summary"]["headline_bn"]
    assert "Insufficient" in data["assessment_summary"]["headline_en"]


def test_safe_disclaimer_on_no_specific_warning_signs():
    """When no specific warning signs are found, explicit disclaimer is present."""
    payload = {
        "advertisement_text": "Winter Hoodie price 1,200 Tk. Cash on Delivery available across Bangladesh. Delivery charge 100 Tk. 7 days exchange policy. 6 months warranty.",
    }
    resp = client.post("/api/v1/analyze-ad", json=payload)
    assert resp.status_code == 200
    data = resp.json()

    assert data["overall_assessment"] == "NO_SPECIFIC_WARNING_SIGNS_FOUND"
    assert "এটি বিক্রেতার সততা বা আসল পণ্যের চূড়ান্ত নিশ্চয়তা নয়" in data["assessment_summary"]["explanation_bn"]
    assert "does NOT guarantee seller legitimacy" in data["assessment_summary"]["explanation_en"]
