"""Automated tests validating the ShopShield BD Evaluation Dataset and Benchmark integrity."""

import json
from pathlib import Path
import pytest

from backend.app.schemas.analysis import AnalyzeRequest
from backend.app.schemas.ad_analysis import AdAnalysisRequest
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.ad_analyzer import AdAnalyzer
from backend.app.services.ai_extractor import DeterministicExtractor, verify_evidence_in_text


DATASET_PATH = Path(__file__).resolve().parent.parent / "evaluation" / "dataset.json"


@pytest.fixture(scope="module")
def scenarios():
    assert DATASET_PATH.exists(), f"Evaluation dataset missing at {DATASET_PATH}"
    with open(DATASET_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def test_dataset_size_and_schema(scenarios):
    """Verify that dataset contains at least 60 diverse Bangladeshi commerce scenarios."""
    assert len(scenarios) >= 60, f"Expected >= 60 scenarios, found {len(scenarios)}"

    valid_languages = {"bangla", "banglish", "english", "mixed"}
    valid_modes = {"ad_only", "ad_chat"}

    seen_ids = set()
    for sc in scenarios:
        assert "id" in sc
        assert sc["id"] not in seen_ids, f"Duplicate scenario id: {sc['id']}"
        seen_ids.add(sc["id"])

        assert sc.get("mode") in valid_modes
        assert sc.get("language") in valid_languages
        assert len(sc.get("advertisement_text", "")) >= 10

        if sc["mode"] == "ad_chat":
            assert len(sc.get("seller_chat_text", "")) >= 5

        expected = sc.get("expected", {})
        assert isinstance(expected, dict)


def test_deterministic_benchmark_accuracy_and_grounding(scenarios):
    """Run regression benchmark across all scenarios ensuring > 95% accuracy and 0 hallucinated quotes."""
    extractor = DeterministicExtractor()
    ad_analyzer = AdAnalyzer(extractor=extractor)
    promise_analyzer = PurchasePromiseAnalyzer(extractor=extractor)

    tp_contra = 0
    fp_contra = 0
    tn_contra = 0
    fn_contra = 0

    total_evidence_quotes = 0
    unsupported_quotes = 0

    for sc in scenarios:
        ad_text = sc["advertisement_text"]
        chat_text = sc.get("seller_chat_text")
        mode = sc.get("mode", "ad_chat")
        expected = sc["expected"]

        if mode == "ad_only" or not chat_text:
            req = AdAnalysisRequest(advertisement_text=ad_text)
            res = ad_analyzer.analyze_ad(req)
            if expected.get("has_contradiction") is False:
                tn_contra += 1
            for c in res.advertisement_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
        else:
            req = AnalyzeRequest(advertisement_text=ad_text, seller_chat_text=chat_text)
            res = promise_analyzer.analyze(req)
            exp_contra = expected.get("has_contradiction", False)
            obs_contra = res.has_contradictions

            if exp_contra and obs_contra:
                tp_contra += 1
            elif not exp_contra and not obs_contra:
                tn_contra += 1
            elif not exp_contra and obs_contra:
                fp_contra += 1
            elif exp_contra and not obs_contra:
                fn_contra += 1

            for c in res.advertisement_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
            for c in res.seller_chat_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, chat_text):
                        unsupported_quotes += 1

    total = tp_contra + tn_contra + fp_contra + fn_contra
    accuracy = (tp_contra + tn_contra) / total if total > 0 else 0.0

    assert total_evidence_quotes > 100
    assert unsupported_quotes == 0, f"Found {unsupported_quotes} unsupported evidence quotes!"
    assert fp_contra == 0, f"Found {fp_contra} false positive contradictions"
    assert accuracy >= 0.95, f"Contradiction accuracy dropped to {accuracy:.2%}"
