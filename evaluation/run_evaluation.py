"""Reproducible evaluation runner for ShopShield BD across 65 diverse Bangladesh commerce scenarios.

Measures:
1. Claim extraction correctness (price, COD, advance payment, return policy)
2. Contradiction classification (precision, recall, F1, false positive rate)
3. Missing-information classification accuracy
4. Payment advisory correctness
5. Unsupported evidence rate (hallucination defense)
6. Language-specific breakdown (Bangla, Banglish, English, Mixed)
"""

import json
import logging
import os
import sys
import time

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import argparse
from typing import Optional
from backend.app.schemas.ad_analysis import AdAnalysisRequest
from backend.app.schemas.analysis import AnalyzeRequest
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.comparison import ContradictionStatus
from backend.app.services.ad_analyzer import AdAnalyzer
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.ai_extractor import AIExtractorService, verify_evidence_in_text


class DeterministicExtractor(AIExtractorService):
    """Offline deterministic extractor subclassing AIExtractorService for benchmark reproducibility."""

    def extract_claims(self, text: str, source_type: str = "advertisement") -> ExtractedClaims:
        return self.extract_claims_deterministic(text, source_type)


def run_benchmark(engine: str = "deterministic", limit: Optional[int] = None):
    dataset_path = os.path.join(os.path.dirname(__file__), "dataset.json")
    with open(dataset_path, "r", encoding="utf-8") as f:
        scenarios = json.load(f)

    if limit:
        scenarios = scenarios[:limit]

    if engine == "gemini":
        extractor = AIExtractorService()
    else:
        extractor = DeterministicExtractor()

    ad_analyzer = AdAnalyzer(extractor=extractor)
    promise_analyzer = PurchasePromiseAnalyzer(extractor=extractor)

    total_scenarios = len(scenarios)
    print(f"=== Starting ShopShield BD Evaluation ({engine.upper()}) on {total_scenarios} Scenarios ===\n")

    # Metrics accumulators
    price_evals = 0
    price_correct = 0

    cod_evals = 0
    cod_correct = 0

    advance_evals = 0
    advance_correct = 0

    return_evals = 0
    return_correct = 0

    tp_contra = 0
    fp_contra = 0
    tn_contra = 0
    fn_contra = 0

    missing_info_evals = 0
    missing_info_correct = 0

    payment_warning_evals = 0
    payment_warning_correct = 0

    total_evidence_quotes = 0
    unsupported_quotes = 0

    lang_stats = {
        "bangla": {"total": 0, "correct": 0},
        "banglish": {"total": 0, "correct": 0},
        "english": {"total": 0, "correct": 0},
        "mixed": {"total": 0, "correct": 0},
    }

    start_time = time.perf_counter()

    for idx, sc in enumerate(scenarios, 1):
        sc_id = sc["id"]
        lang = sc.get("language", "mixed")
        mode = sc.get("mode", "ad_chat")
        expected = sc["expected"]

        lang_stats[lang]["total"] += 1
        scenario_passed = True

        ad_text = sc["advertisement_text"]
        chat_text = sc.get("seller_chat_text")

        if mode == "ad_only" or not chat_text:
            req = AdAnalysisRequest(advertisement_text=ad_text)
            res = ad_analyzer.analyze_ad(req)
            ad_claims = res.advertisement_claims

            # In ad-only mode, contradiction must ALWAYS be False
            if expected.get("has_contradiction") is False:
                tn_contra += 1

            # Price check
            exp_p = expected.get("expected_price_ad")
            if exp_p is not None:
                price_evals += 1
                if ad_claims.price is not None and abs(ad_claims.price - exp_p) < 1.0:
                    price_correct += 1
                else:
                    price_correct += 0
                    scenario_passed = False

            # COD check
            exp_cod = expected.get("expected_cod_ad")
            if exp_cod is not None:
                cod_evals += 1
                if ad_claims.cod_available == exp_cod:
                    cod_correct += 1
                else:
                    scenario_passed = False

            # Return check
            exp_ret = expected.get("expected_return_available")
            if exp_ret is not None:
                return_evals += 1
                if ad_claims.return_policy_available == exp_ret:
                    return_correct += 1
                else:
                    scenario_passed = False

            # Missing fields check
            exp_missing = expected.get("missing_critical_fields")
            if exp_missing:
                missing_info_evals += 1
                observed_missing_fields = [m.field for m in res.missing_critical_info]
                all_found = all(f in observed_missing_fields for f in exp_missing)
                if all_found:
                    missing_info_correct += 1
                else:
                    scenario_passed = False

            # Payment warnings check
            exp_warnings = expected.get("expected_payment_warnings")
            if exp_warnings:
                payment_warning_evals += 1
                obs_warnings = [w.type for w in res.payment_considerations]
                if any(w in obs_warnings for w in exp_warnings):
                    payment_warning_correct += 1
                else:
                    scenario_passed = False

            # Grounding check
            for c in ad_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
                        scenario_passed = False

        else:
            req = AnalyzeRequest(
                advertisement_text=ad_text,
                seller_chat_text=chat_text,
            )
            res = promise_analyzer.analyze(req)
            ad_claims = res.advertisement_claims
            chat_claims = res.seller_chat_claims

            # Contradiction classification
            exp_contra = expected.get("has_contradiction", False)
            obs_contra = res.has_contradictions

            if exp_contra and obs_contra:
                tp_contra += 1
            elif not exp_contra and not obs_contra:
                tn_contra += 1
            elif not exp_contra and obs_contra:
                fp_contra += 1
                scenario_passed = False
            elif exp_contra and not obs_contra:
                fn_contra += 1
                scenario_passed = False

            # Price check
            exp_p_ad = expected.get("expected_price_ad")
            if exp_p_ad is not None:
                price_evals += 1
                if ad_claims.price is not None and abs(ad_claims.price - exp_p_ad) < 1.0:
                    price_correct += 1
                else:
                    scenario_passed = False

            exp_p_chat = expected.get("expected_price_chat")
            if exp_p_chat is not None:
                price_evals += 1
                if chat_claims.price is not None and abs(chat_claims.price - exp_p_chat) < 1.0:
                    price_correct += 1
                else:
                    scenario_passed = False

            # COD check
            exp_cod_ad = expected.get("expected_cod_ad")
            if exp_cod_ad is not None:
                cod_evals += 1
                if ad_claims.cod_available == exp_cod_ad:
                    cod_correct += 1
                else:
                    scenario_passed = False

            exp_cod_chat = expected.get("expected_cod_chat")
            if exp_cod_chat is not None:
                cod_evals += 1
                if chat_claims.cod_available == exp_cod_chat:
                    cod_correct += 1
                else:
                    scenario_passed = False

            # Advance check
            exp_adv_req = expected.get("expected_advance_required")
            if exp_adv_req is not None:
                advance_evals += 1
                obs_adv = chat_claims.advance_payment_required or ad_claims.advance_payment_required
                if obs_adv == exp_adv_req:
                    advance_correct += 1
                else:
                    scenario_passed = False

            exp_adv_amt = expected.get("expected_advance_amount")
            if exp_adv_amt is not None:
                advance_evals += 1
                obs_amt = chat_claims.advance_payment_amount or ad_claims.advance_payment_amount
                if obs_amt is not None and abs(obs_amt - exp_adv_amt) < 1.0:
                    advance_correct += 1
                else:
                    scenario_passed = False

            # Return check
            exp_ret = expected.get("expected_return_available")
            if exp_ret is not None:
                return_evals += 1
                obs_ret = chat_claims.return_policy_available if chat_claims.return_policy_available is not None else ad_claims.return_policy_available
                if obs_ret == exp_ret:
                    return_correct += 1
                else:
                    scenario_passed = False

            # Payment warnings check
            exp_warnings = expected.get("expected_payment_warnings")
            if exp_warnings:
                payment_warning_evals += 1
                obs_warnings = [w.type for w in res.payment_warnings]
                if any(w in obs_warnings for w in exp_warnings):
                    payment_warning_correct += 1
                else:
                    scenario_passed = False

            # Grounding check
            for c in ad_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
                        scenario_passed = False

            for c in chat_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, chat_text):
                        unsupported_quotes += 1
                        scenario_passed = False

        if scenario_passed:
            lang_stats[lang]["correct"] += 1

    elapsed_s = time.perf_counter() - start_time

    # Compute classification metrics
    precision = (tp_contra / (tp_contra + fp_contra)) * 100 if (tp_contra + fp_contra) > 0 else 100.0
    recall = (tp_contra / (tp_contra + fn_contra)) * 100 if (tp_contra + fn_contra) > 0 else 100.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 100.0
    accuracy_contra = ((tp_contra + tn_contra) / (tp_contra + tn_contra + fp_contra + fn_contra)) * 100

    price_acc = (price_correct / price_evals) * 100 if price_evals > 0 else 100.0
    cod_acc = (cod_correct / cod_evals) * 100 if cod_evals > 0 else 100.0
    advance_acc = (advance_correct / advance_evals) * 100 if advance_evals > 0 else 100.0
    return_acc = (return_correct / return_evals) * 100 if return_evals > 0 else 100.0
    missing_info_acc = (missing_info_correct / missing_info_evals) * 100 if missing_info_evals > 0 else 100.0
    payment_warning_acc = (payment_warning_correct / payment_warning_evals) * 100 if payment_warning_evals > 0 else 100.0
    unsupported_rate = (unsupported_quotes / total_evidence_quotes) * 100 if total_evidence_quotes > 0 else 0.0

    print("=====================================================================")
    print("                SHOPSHIELD BD BENCHMARK EVALUATION RESULTS            ")
    print("=====================================================================")
    print(f"Total Scenarios Evaluated: {total_scenarios} in {elapsed_s:.2f} seconds")
    print(f"Total Evaluated Evidence Quotes: {total_evidence_quotes}")
    print(f"Unsupported / Hallucinated Quotes: {unsupported_quotes} (Rate: {unsupported_rate:.2f}%)\n")

    print("--- 1. CONTRADICTION CLASSIFICATION ---")
    print(f"True Positives:  {tp_contra}")
    print(f"True Negatives:  {tn_contra}")
    print(f"False Positives: {fp_contra}")
    print(f"False Negatives: {fn_contra}")
    print(f"Precision: {precision:.2f}%")
    print(f"Recall:    {recall:.2f}%")
    print(f"F1 Score:  {f1:.2f}%")
    print(f"Accuracy:  {accuracy_contra:.2f}%\n")

    print("--- 2. CLAIM EXTRACTION ACCURACY ---")
    print(f"Price Extraction:        {price_correct}/{price_evals} ({price_acc:.2f}%)")
    print(f"COD Status Extraction:   {cod_correct}/{cod_evals} ({cod_acc:.2f}%)")
    print(f"Advance Payment Terms:   {advance_correct}/{advance_evals} ({advance_acc:.2f}%)")
    print(f"Return Policy Terms:     {return_correct}/{return_evals} ({return_acc:.2f}%)")
    print(f"Missing Info Detection:  {missing_info_correct}/{missing_info_evals} ({missing_info_acc:.2f}%)")
    print(f"Payment Warning Accuracy:{payment_warning_correct}/{payment_warning_evals} ({payment_warning_acc:.2f}%)\n")

    print("--- 3. LANGUAGE BREAKDOWN ---")
    for lang, st in lang_stats.items():
        pct = (st["correct"] / st["total"]) * 100 if st["total"] > 0 else 100.0
        print(f" - {lang.capitalize():10}: {st['correct']}/{st['total']} ({pct:.2f}%)")
    print("=====================================================================\n")

    results = {
        "total_scenarios": total_scenarios,
        "elapsed_seconds": round(elapsed_s, 3),
        "contradiction_metrics": {
            "true_positives": tp_contra,
            "true_negatives": tn_contra,
            "false_positives": fp_contra,
            "false_negatives": fn_contra,
            "precision_percent": round(precision, 2),
            "recall_percent": round(recall, 2),
            "f1_score_percent": round(f1, 2),
            "accuracy_percent": round(accuracy_contra, 2),
        },
        "extraction_accuracies": {
            "price_accuracy": round(price_acc, 2),
            "cod_accuracy": round(cod_acc, 2),
            "advance_accuracy": round(advance_acc, 2),
            "return_accuracy": round(return_acc, 2),
            "missing_info_accuracy": round(missing_info_acc, 2),
            "payment_warning_accuracy": round(payment_warning_acc, 2),
        },
        "evidence_integrity": {
            "total_quotes": total_evidence_quotes,
            "unsupported_quotes": unsupported_quotes,
            "unsupported_rate_percent": round(unsupported_rate, 2),
        },
        "language_breakdown": lang_stats,
    }

    out_file = os.path.join(os.path.dirname(__file__), "results.json")
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ShopShield BD evaluation benchmark")
    parser.add_argument("--engine", choices=["deterministic", "gemini"], default="deterministic", help="Extraction engine")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of scenarios evaluated")
    args = parser.parse_args()

    run_benchmark(engine=args.engine, limit=args.limit)
