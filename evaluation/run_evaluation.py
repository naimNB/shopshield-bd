"""Reproducible evaluation runner for ShopShield BD across diverse Bangladesh commerce scenarios.

Supports:
1. Baseline dataset (dataset.json) - 65 scenarios
2. Independent holdout dataset (holdout_dataset.json) - 42 challenging scenarios
3. Deterministic and Gemini execution engines
4. Division-by-zero guards (reporting 'N/A' when appropriate)
5. Comprehensive confusion matrix and failed-scenario logs
"""

import argparse
import json
import logging
import os
import sys
import time
from typing import Any, Dict, List, Optional

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.schemas.ad_analysis import AdAnalysisRequest
from backend.app.schemas.analysis import AnalyzeRequest
from backend.app.schemas.claims import ExtractedClaims
from backend.app.services.ad_analyzer import AdAnalyzer
from backend.app.services.analyzer import PurchasePromiseAnalyzer
from backend.app.services.ai_extractor import AIExtractorService, verify_evidence_in_text


class DeterministicExtractor(AIExtractorService):
    """Offline deterministic extractor subclassing AIExtractorService for benchmark reproducibility."""

    def extract_claims(self, text: str, source_type: str = "advertisement") -> ExtractedClaims:
        return self.extract_claims_deterministic(text, source_type)


def normalize_purpose(val: Optional[str]) -> Optional[str]:
    """Normalize advance payment purpose string for consistent evaluation."""
    if not val:
        return None
    val_upper = val.strip().upper()
    if val_upper in ("FULL_PRICE", "FULL_PAYMENT"):
        return "FULL_PRODUCT_PAYMENT"
    return val_upper


def safe_pct(num: int, denom: int) -> Any:
    """Safely calculate percentage or return 'N/A' if denominator is 0."""
    if denom == 0:
        return "N/A"
    return round((num / denom) * 100, 2)


def run_benchmark(engine: str = "deterministic", dataset: str = "baseline", limit: Optional[int] = None):
    # Resolve dataset file path
    if dataset == "frozen":
        dataset_file = "frozen_dataset.json"
    elif dataset == "holdout":
        dataset_file = "holdout_dataset.json"
    elif dataset == "baseline":
        dataset_file = "dataset.json"
    elif os.path.isfile(dataset):
        dataset_file = dataset
    else:
        dataset_file = f"{dataset}.json"

    dataset_path = os.path.join(os.path.dirname(__file__), dataset_file)
    if not os.path.exists(dataset_path):
        raise FileNotFoundError(f"Dataset file not found at {dataset_path}")

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
    print(f"=== Starting ShopShield BD Evaluation ({engine.upper()}) on {total_scenarios} Scenarios [{dataset.upper()}] ===\n")

    # Metrics accumulators
    price_evals = 0
    price_correct = 0

    cod_evals = 0
    cod_correct = 0

    advance_evals = 0
    advance_correct = 0

    advance_purpose_evals = 0
    advance_purpose_correct = 0

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

    lang_stats: Dict[str, Dict[str, int]] = {
        "bangla": {"total": 0, "correct": 0},
        "banglish": {"total": 0, "correct": 0},
        "english": {"total": 0, "correct": 0},
        "mixed": {"total": 0, "correct": 0},
    }

    failed_scenarios: List[Dict[str, Any]] = []

    start_time = time.perf_counter()

    for idx, sc in enumerate(scenarios, 1):
        sc_id = sc["id"]
        title = sc.get("title", f"Scenario {idx}")
        lang = sc.get("language", "mixed")
        mode = sc.get("mode", "ad_chat")
        expected = sc["expected"]

        if lang not in lang_stats:
            lang_stats[lang] = {"total": 0, "correct": 0}
        lang_stats[lang]["total"] += 1

        scenario_passed = True
        failure_reasons: List[str] = []

        ad_text = sc["advertisement_text"]
        chat_text = sc.get("seller_chat_text")

        if mode == "ad_only" or not chat_text:
            req = AdAnalysisRequest(advertisement_text=ad_text)
            res = ad_analyzer.analyze_ad(req)
            ad_claims = res.advertisement_claims

            # In ad-only mode, contradiction must ALWAYS be False
            if expected.get("has_contradiction") is False:
                tn_contra += 1
            elif expected.get("has_contradiction") is True:
                # If scenario author expected contradiction in ad-only, that's impossible
                fn_contra += 1
                scenario_passed = False
                failure_reasons.append("Expected contradiction in ad-only mode, but ad-only cannot contradict itself.")

            # Price check
            exp_p = expected.get("expected_price_ad")
            if exp_p is not None:
                price_evals += 1
                if ad_claims.price is not None and abs(ad_claims.price - exp_p) < 1.0:
                    price_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Price mismatch: expected {exp_p}, got {ad_claims.price}")

            # COD check
            exp_cod = expected.get("expected_cod_ad")
            if exp_cod is not None:
                cod_evals += 1
                if ad_claims.cod_available == exp_cod:
                    cod_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"COD mismatch: expected {exp_cod}, got {ad_claims.cod_available}")

            # Advance payment requirement & amount check
            exp_adv_req = expected.get("expected_advance_required")
            if exp_adv_req is not None:
                advance_evals += 1
                if ad_claims.advance_payment_required == exp_adv_req:
                    advance_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance required mismatch: expected {exp_adv_req}, got {ad_claims.advance_payment_required}")

            exp_adv_amt = expected.get("expected_advance_amount")
            if exp_adv_amt is not None:
                advance_evals += 1
                if ad_claims.advance_payment_amount is not None and abs(ad_claims.advance_payment_amount - exp_adv_amt) < 1.0:
                    advance_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance amount mismatch: expected {exp_adv_amt}, got {ad_claims.advance_payment_amount}")

            # Advance payment purpose check
            exp_adv_purpose = normalize_purpose(expected.get("expected_advance_purpose"))
            if exp_adv_purpose:
                advance_purpose_evals += 1
                obs_purpose = normalize_purpose(ad_claims.advance_payment_purpose)
                if obs_purpose == exp_adv_purpose:
                    advance_purpose_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance purpose mismatch: expected {exp_adv_purpose}, got {obs_purpose}")

            # Return check
            exp_ret = expected.get("expected_return_available")
            if exp_ret is not None:
                return_evals += 1
                if ad_claims.return_policy_available == exp_ret:
                    return_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Return policy mismatch: expected {exp_ret}, got {ad_claims.return_policy_available}")

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
                    failure_reasons.append(f"Missing info mismatch: expected {exp_missing}, got {observed_missing_fields}")

            # Payment warnings check
            exp_warnings = expected.get("expected_payment_warnings")
            if exp_warnings:
                payment_warning_evals += 1
                obs_warnings = [w.type for w in res.payment_considerations]
                if any(w in obs_warnings for w in exp_warnings):
                    payment_warning_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Payment warning mismatch: expected one of {exp_warnings}, got {obs_warnings}")

            # Grounding check
            for c in ad_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
                        scenario_passed = False
                        failure_reasons.append(f"Unsupported evidence quote in ad: '{c.original_evidence}'")

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
                failure_reasons.append(f"False Positive contradiction: predicted true, expected false")
            elif exp_contra and not obs_contra:
                fn_contra += 1
                scenario_passed = False
                failure_reasons.append(f"False Negative contradiction: predicted false, expected true")

            # Price check
            exp_p_ad = expected.get("expected_price_ad")
            if exp_p_ad is not None:
                price_evals += 1
                if ad_claims.price is not None and abs(ad_claims.price - exp_p_ad) < 1.0:
                    price_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Ad price mismatch: expected {exp_p_ad}, got {ad_claims.price}")

            exp_p_chat = expected.get("expected_price_chat")
            if exp_p_chat is not None:
                price_evals += 1
                if chat_claims.price is not None and abs(chat_claims.price - exp_p_chat) < 1.0:
                    price_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Chat price mismatch: expected {exp_p_chat}, got {chat_claims.price}")

            # COD check
            exp_cod_ad = expected.get("expected_cod_ad")
            if exp_cod_ad is not None:
                cod_evals += 1
                if ad_claims.cod_available == exp_cod_ad:
                    cod_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Ad COD mismatch: expected {exp_cod_ad}, got {ad_claims.cod_available}")

            exp_cod_chat = expected.get("expected_cod_chat")
            if exp_cod_chat is not None:
                cod_evals += 1
                if chat_claims.cod_available == exp_cod_chat:
                    cod_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Chat COD mismatch: expected {exp_cod_chat}, got {chat_claims.cod_available}")

            # Advance check
            exp_adv_req = expected.get("expected_advance_required")
            if exp_adv_req is not None:
                advance_evals += 1
                obs_adv = chat_claims.advance_payment_required if chat_claims.advance_payment_required is not None else ad_claims.advance_payment_required
                if obs_adv == exp_adv_req:
                    advance_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance required mismatch: expected {exp_adv_req}, got {obs_adv}")

            exp_adv_amt = expected.get("expected_advance_amount")
            if exp_adv_amt is not None:
                advance_evals += 1
                obs_amt = chat_claims.advance_payment_amount if chat_claims.advance_payment_amount is not None else ad_claims.advance_payment_amount
                if obs_amt is not None and abs(obs_amt - exp_adv_amt) < 1.0:
                    advance_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance amount mismatch: expected {exp_adv_amt}, got {obs_amt}")

            # Advance payment purpose check
            exp_adv_purpose = normalize_purpose(expected.get("expected_advance_purpose"))
            if exp_adv_purpose:
                advance_purpose_evals += 1
                purpose_raw = chat_claims.advance_payment_purpose if chat_claims.advance_payment_purpose is not None else ad_claims.advance_payment_purpose
                obs_purpose = normalize_purpose(purpose_raw)
                if obs_purpose == exp_adv_purpose:
                    advance_purpose_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Advance purpose mismatch: expected {exp_adv_purpose}, got {obs_purpose}")

            # Return check
            exp_ret = expected.get("expected_return_available")
            if exp_ret is not None:
                return_evals += 1
                obs_ret = chat_claims.return_policy_available if chat_claims.return_policy_available is not None else ad_claims.return_policy_available
                if obs_ret == exp_ret:
                    return_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Return policy mismatch: expected {exp_ret}, got {obs_ret}")

            # Payment warnings check
            exp_warnings = expected.get("expected_payment_warnings")
            if exp_warnings:
                payment_warning_evals += 1
                obs_warnings = [w.type for w in res.payment_warnings]
                if any(w in obs_warnings for w in exp_warnings):
                    payment_warning_correct += 1
                else:
                    scenario_passed = False
                    failure_reasons.append(f"Payment warnings mismatch: expected one of {exp_warnings}, got {obs_warnings}")

            # Grounding check
            for c in ad_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, ad_text):
                        unsupported_quotes += 1
                        scenario_passed = False
                        failure_reasons.append(f"Unsupported evidence quote in ad: '{c.original_evidence}'")

            for c in chat_claims.claims_list:
                if c.original_evidence:
                    total_evidence_quotes += 1
                    if not verify_evidence_in_text(c.original_evidence, chat_text):
                        unsupported_quotes += 1
                        scenario_passed = False
                        failure_reasons.append(f"Unsupported evidence quote in chat: '{c.original_evidence}'")

        if scenario_passed:
            lang_stats[lang]["correct"] += 1
        else:
            failed_scenarios.append({
                "id": sc_id,
                "title": title,
                "reasons": failure_reasons,
            })

    elapsed_s = time.perf_counter() - start_time

    # Compute classification metrics with division-by-zero guards
    denom_prec = tp_contra + fp_contra
    precision = (tp_contra / denom_prec) * 100 if denom_prec > 0 else "N/A"

    denom_rec = tp_contra + fn_contra
    recall = (tp_contra / denom_rec) * 100 if denom_rec > 0 else "N/A"

    if isinstance(precision, float) and isinstance(recall, float) and (precision + recall) > 0:
        f1 = (2 * precision * recall) / (precision + recall)
    else:
        f1 = "N/A"

    total_contra_evals = tp_contra + tn_contra + fp_contra + fn_contra
    accuracy_contra = safe_pct(tp_contra + tn_contra, total_contra_evals)

    price_acc = safe_pct(price_correct, price_evals)
    cod_acc = safe_pct(cod_correct, cod_evals)
    advance_acc = safe_pct(advance_correct, advance_evals)
    advance_purpose_acc = safe_pct(advance_purpose_correct, advance_purpose_evals)
    return_acc = safe_pct(return_correct, return_evals)
    missing_info_acc = safe_pct(missing_info_correct, missing_info_evals)
    payment_warning_acc = safe_pct(payment_warning_correct, payment_warning_evals)

    grounding_rate = safe_pct(total_evidence_quotes - unsupported_quotes, total_evidence_quotes)
    unsupported_rate = safe_pct(unsupported_quotes, total_evidence_quotes)

    # Format prints
    def fmt(val: Any) -> str:
        return f"{val:.2f}%" if isinstance(val, (int, float)) else str(val)

    print("=====================================================================")
    print(f"       SHOPSHIELD BD BENCHMARK RESULTS [{dataset.upper()} - {engine.upper()}]      ")
    print("=====================================================================")
    print(f"Total Scenarios Evaluated: {total_scenarios} in {elapsed_s:.2f} seconds")
    print(f"Total Evaluated Evidence Quotes: {total_evidence_quotes}")
    print(f"Unsupported / Hallucinated Quotes: {unsupported_quotes} (Rate: {fmt(unsupported_rate)})")
    print(f"Evidence Grounding Rate: {fmt(grounding_rate)}\n")

    print("--- 1. CONTRADICTION CONFUSION MATRIX ---")
    print(f"True Positives (TP):  {tp_contra}")
    print(f"True Negatives (TN):  {tn_contra}")
    print(f"False Positives (FP): {fp_contra}")
    print(f"False Negatives (FN): {fn_contra}")
    print(f"Precision: {fmt(precision)}")
    print(f"Recall:    {fmt(recall)}")
    print(f"F1 Score:  {fmt(f1)}")
    print(f"Accuracy:  {fmt(accuracy_contra)}\n")

    print("--- 2. CLAIM EXTRACTION ACCURACY ---")
    print(f"Price Extraction:        {price_correct}/{price_evals} ({fmt(price_acc)})")
    print(f"COD Status Extraction:   {cod_correct}/{cod_evals} ({fmt(cod_acc)})")
    print(f"Advance Payment Terms:   {advance_correct}/{advance_evals} ({fmt(advance_acc)})")
    print(f"Advance Purpose Reason:  {advance_purpose_correct}/{advance_purpose_evals} ({fmt(advance_purpose_acc)})")
    print(f"Return Policy Terms:     {return_correct}/{return_evals} ({fmt(return_acc)})")
    print(f"Missing Info Detection:  {missing_info_correct}/{missing_info_evals} ({fmt(missing_info_acc)})")
    print(f"Payment Warning Accuracy:{payment_warning_correct}/{payment_warning_evals} ({fmt(payment_warning_acc)})\n")

    print("--- 3. LANGUAGE BREAKDOWN ---")
    for lang, st in lang_stats.items():
        pct = safe_pct(st["correct"], st["total"])
        print(f" - {lang.capitalize():10}: {st['correct']}/{st['total']} ({fmt(pct)})")

    if failed_scenarios:
        print(f"\n--- 4. FAILED SCENARIOS ({len(failed_scenarios)}) ---")
        for f_sc in failed_scenarios:
            print(f" [!] {f_sc['id']}: {f_sc['title']}")
            for r in f_sc["reasons"]:
                print(f"     - {r}")
    else:
        print("\n--- 4. ALL SCENARIOS PASSED CLEANLY ---")

    print("=====================================================================\n")

    results = {
        "dataset": dataset,
        "engine": engine,
        "total_scenarios": total_scenarios,
        "elapsed_seconds": round(elapsed_s, 3),
        "contradiction_confusion_matrix": {
            "true_positives": tp_contra,
            "true_negatives": tn_contra,
            "false_positives": fp_contra,
            "false_negatives": fn_contra,
            "precision": round(precision, 2) if isinstance(precision, float) else precision,
            "recall": round(recall, 2) if isinstance(recall, float) else recall,
            "f1_score": round(f1, 2) if isinstance(f1, float) else f1,
            "accuracy": round(accuracy_contra, 2) if isinstance(accuracy_contra, float) else accuracy_contra,
        },
        "extraction_accuracies": {
            "price_accuracy": price_acc,
            "cod_accuracy": cod_acc,
            "advance_accuracy": advance_acc,
            "advance_purpose_accuracy": advance_purpose_acc,
            "return_accuracy": return_acc,
            "missing_info_accuracy": missing_info_acc,
            "payment_warning_accuracy": payment_warning_acc,
        },
        "evidence_integrity": {
            "total_quotes": total_evidence_quotes,
            "unsupported_quotes": unsupported_quotes,
            "unsupported_rate": unsupported_rate,
            "grounding_rate": grounding_rate,
        },
        "language_breakdown": lang_stats,
        "failed_scenarios_count": len(failed_scenarios),
        "failed_scenarios": failed_scenarios,
    }

    # Save to dataset-specific and default results.json
    results_dir = os.path.dirname(__file__)
    dataset_out_file = os.path.join(results_dir, f"results_{dataset}.json")
    with open(dataset_out_file, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    with open(os.path.join(results_dir, "results.json"), "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run ShopShield BD evaluation benchmark")
    parser.add_argument("--engine", choices=["deterministic", "gemini"], default="deterministic", help="Extraction engine")
    parser.add_argument("--dataset", default="baseline", help="Dataset name ('baseline', 'holdout', or file path)")
    parser.add_argument("--limit", type=int, default=None, help="Limit number of scenarios evaluated")
    args = parser.parse_args()

    run_benchmark(engine=args.engine, dataset=args.dataset, limit=args.limit)
