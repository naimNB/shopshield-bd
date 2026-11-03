"""Analyzer orchestrator service that coordinates AI extraction, comparison, and rules."""

import time
from typing import Optional
from backend.app.config import settings
from backend.app.schemas.analysis import AnalyzeRequest, AnalyzeResponse, AnalysisMetadata
from backend.app.schemas.comparison import ContradictionStatus
from backend.app.services.ai_extractor import AIExtractorService
from backend.app.services.comparison_service import ComparisonService
from backend.app.services.rules_engine import PaymentRulesEngine


class PurchasePromiseAnalyzer:
    """Orchestrates purchase promise extraction, cross-referencing, and payment safety checks."""

    def __init__(
        self,
        extractor: Optional[AIExtractorService] = None,
        comparer: Optional[ComparisonService] = None,
        rules_engine: Optional[PaymentRulesEngine] = None,
    ):
        self.extractor = extractor or AIExtractorService()
        self.comparer = comparer or ComparisonService()
        self.rules_engine = rules_engine or PaymentRulesEngine()

    def analyze(self, request: AnalyzeRequest) -> AnalyzeResponse:
        """Execute full comparison and safety analysis between advertisement and chat."""
        start_time = time.time()

        # 1. Extract claims from advertisement and conversation
        ad_claims = self.extractor.extract_claims(
            text=request.advertisement_text,
            source_type="advertisement",
        )
        chat_claims = self.extractor.extract_claims(
            text=request.seller_chat_text,
            source_type="seller_chat",
        )

        # 2. Compare promises across critical categories
        comparison_results = self.comparer.compare(ad_claims, chat_claims)

        contradictions = [c for c in comparison_results if c.status == ContradictionStatus.CONTRADICTION]
        needs_review = [c for c in comparison_results if c.status == ContradictionStatus.NEEDS_REVIEW]

        # 3. Evaluate payment safety rules and generate buyer verification questions
        warnings, missing_info, buyer_questions = self.rules_engine.evaluate(
            ad_claims=ad_claims,
            chat_claims=chat_claims,
            comparison_results=comparison_results,
        )

        # 4. Standardize findings into unified classification model
        unified_findings = self.rules_engine.build_unified_findings(
            ad_claims=ad_claims,
            chat_claims=chat_claims,
            comparison_results=comparison_results,
            warnings=warnings,
            missing_info=missing_info,
        )

        elapsed_ms = (time.time() - start_time) * 1000.0

        model_str = getattr(self.extractor, "model_name", None)
        if model_str is not None:
            model_str = str(model_str)

        metadata = AnalysisMetadata(
            model_used=model_str,
            ad_char_count=len(request.advertisement_text),
            chat_char_count=len(request.seller_chat_text),
            execution_time_ms=round(elapsed_ms, 2),
        )

        return AnalyzeResponse(
            status="success",
            advertisement_claims=ad_claims,
            seller_chat_claims=chat_claims,
            comparison_results=comparison_results,
            has_contradictions=len(contradictions) > 0,
            contradiction_count=len(contradictions),
            needs_review_count=len(needs_review),
            payment_warnings=warnings,
            missing_information=missing_info,
            buyer_questions_bangla=buyer_questions,
            unified_findings=unified_findings,
            metadata=metadata,
        )
