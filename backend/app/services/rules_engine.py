"""Deterministic Payment Safety Rules Engine and Buyer Question Generator.

Identifies advance payment requests, high-pressure urgency cues, missing refund
terms, and generates practical buyer verification questions in clear Bangla.
Crucially: An advance bKash or Nagad payment request does NOT imply fraud.
"""

from datetime import datetime, timezone
from typing import List, Tuple, Any
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.comparison import ComparisonItem, ContradictionStatus
from backend.app.schemas.rules import PaymentWarning, PaymentWarningType, MissingInfoItem


class PaymentRulesEngine:
    """Evaluates payment conditions, missing consumer protections, and seller pressure."""

    def evaluate(
        self,
        ad_claims: ExtractedClaims,
        chat_claims: ExtractedClaims,
        comparison_results: List[ComparisonItem],
    ) -> Tuple[List[PaymentWarning], List[MissingInfoItem], List[str]]:
        """Run all safety rules and return warnings, missing information, and Bangla questions."""
        warnings: List[PaymentWarning] = []
        missing_info: List[MissingInfoItem] = []
        buyer_questions: List[str] = []

        # 1. Advance Payment Rules
        advance_amount = chat_claims.advance_payment_amount or ad_claims.advance_payment_amount
        advance_required = chat_claims.advance_payment_required or ad_claims.advance_payment_required
        advance_purpose = chat_claims.advance_payment_purpose or ad_claims.advance_payment_purpose
        evidence = chat_claims.advance_payment_evidence or ad_claims.advance_payment_evidence
        product_price = chat_claims.price or ad_claims.price

        if advance_required and evidence:
            norm_purpose = (advance_purpose or "").upper()
            amt_str = f"৳{advance_amount:,.2f}" if advance_amount else "an unspecified amount"

            # 1a. Full product payment requested upfront
            if norm_purpose in ("FULL_PRODUCT_PAYMENT", "FULL_PRICE") or (
                product_price and advance_amount and abs(advance_amount - product_price) < 1.0
            ):
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_FULL_PAYMENT.value,
                        severity="warning",
                        supporting_evidence=evidence,
                        explanation=(
                            "The seller is requesting 100% full payment in advance before shipment. "
                            "In social media e-commerce, paying the full purchase price before receiving the item carries substantial financial risk."
                        ),
                        suggested_buyer_action=(
                            "অনুরোধ করুন যেন শুধুমাত্র কুরিয়ার ডেলিভারি চার্জ অগ্রিম নিয়ে বাকি টাকা ক্যাশ অন ডেলিভারিতে (COD) পাঠানো হয়।"
                        ),
                    )
                )
                buyer_questions.append(
                    "আমি কি সম্পূর্ণ মূল্য অগ্রিম না দিয়ে শুধুমাত্র কুরিয়ার চার্জ অগ্রিম দিয়ে বাকি টাকা প্রোডাক্ট হাতে পেয়ে পরিশোধ করতে পারি?"
                )

            # 1b. Advance explicitly for delivery/courier charge
            elif norm_purpose in ("DELIVERY_CHARGE",):
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value,
                        severity="info",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The seller explicitly requested {amt_str} advance for courier delivery charges. "
                            "In Bangladesh, online shops commonly request delivery fees in advance to safeguard against uncollected returns. "
                            "This is standard courier delivery charges practice and does not imply fraud, though buyers should still verify seller authenticity."
                        ),
                        suggested_buyer_action=(
                            "কুরিয়ার চার্জ অগ্রিম পাঠানোর আগে বিক্রেতার ফেসবুক পেজ/শপের রিভিউ দেখুন এবং সম্ভব হলে অফিসিয়াল মার্চেন্ট একাউন্টে পেমেন্ট করুন।"
                        ),
                    )
                )
                buyer_questions.append(
                    "অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য আপনাদের কি অফিসিয়াল বিকাশ/নগদ মার্চেন্ট নম্বর বা পেমেন্ট লিংক আছে?"
                )

            # 1c. Advance explicitly for booking fee
            elif norm_purpose in ("BOOKING_FEE", "BOOKING"):
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_BOOKING_FEE.value,
                        severity="caution",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The seller requested an advance booking/reservation fee of {amt_str}. "
                            "Unlike third-party courier delivery fees, a booking fee is retained by the seller before shipment."
                        ),
                        suggested_buyer_action=(
                            "অর্ডার বাতিল বা ডেলিভারিতে বিলম্ব হলে এই বুকিং ফি ফেরতযোগ্য (refundable) কিনা তা চ্যাটে নিশ্চিত করুন।"
                        ),
                    )
                )
                buyer_questions.append(
                    "পণ্য ডেলিভারি পেতে দেরি হলে বা কোনো কারণে অর্ডার বাতিল হলে এই বুকিং ফি কি সম্পূর্ণ ফেরতযোগ্য?"
                )

            # 1d. Partial product payment
            elif norm_purpose in ("PARTIAL_PRODUCT_PAYMENT", "PARTIAL"):
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_PARTIAL_PAYMENT.value,
                        severity="caution",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The seller requested a partial product payment of {amt_str} in advance. "
                            "Paying a portion of the product cost before receiving the item increases buyer exposure relative to courier-only advance."
                        ),
                        suggested_buyer_action=(
                            "বাকি কত টাকা ডেলিভারির সময় দিতে হবে তার পরিষ্কার হিসাব নিন এবং মানি রিসিট বা ইনভয়েস সংগ্রহ করুন।"
                        ),
                    )
                )
                buyer_questions.append(
                    "অগ্রিম দেওয়ার পর ডেলিভারির সময় আর কত টাকা দিতে হবে? ইনভয়েসে কি অগ্রিম টাকার উল্লেখ থাকবে?"
                )

            # 1e. Purpose is unspecified in source context
            else:
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_UNSPECIFIED_PURPOSE.value,
                        severity="caution",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The seller requested an advance payment of {amt_str}, but did not explicitly specify what it covers "
                            "(e.g. courier delivery charge vs. booking fee vs. product price). "
                            "Sending funds without a clear stated purpose leaves the remaining payment obligation ambiguous."
                        ),
                        suggested_buyer_action="অগ্রিম টাকাটি কুরিয়ার চার্জ বাবদ নাকি পণ্যের মূল্যের অংশ, তা চ্যাটে পরিষ্কারভাবে জেনে নিন।",
                    )
                )
                buyer_questions.append(
                    "এই অগ্রিম টাকাটি কি শুধুমাত্র কুরিয়ার ডেলিভারি চার্জ বাবদ, নাকি পণ্যের মূল্যের অংশ?"
                )

        # 2. Urgency and Pressure Rules
        urgency = chat_claims.urgency_or_pressure or ad_claims.urgency_or_pressure
        urgency_ev = chat_claims.urgency_evidence or ad_claims.urgency_evidence
        if urgency and urgency_ev:
            warnings.append(
                PaymentWarning(
                    type=PaymentWarningType.IMMEDIATE_URGENCY_PRESSURE.value,
                    severity="warning",
                    supporting_evidence=urgency_ev,
                    explanation=(
                        f"The seller is using urgency or time-pressure phrasing ('{urgency}'). "
                        "High-pressure sales tactics are frequently used to induce rushed payment decisions."
                    ),
                    suggested_buyer_action=(
                        "তাড়াহুড়ো করবেন না। যাচাই করার জন্য সময় নিন এবং বিক্রেতাকে জানান আপনি সাধারণ নিয়মেই অর্ডারটি বিবেচনা করছেন।"
                    ),
                )
            )

        # 3. Conflicting or Denied COD Rules
        cod_contradiction = any(
            c.field == "cod_availability" and c.status == ContradictionStatus.CONTRADICTION
            for c in comparison_results
        )
        if cod_contradiction:
            cod_item = next(c for c in comparison_results if c.field == "cod_availability")
            warnings.append(
                PaymentWarning(
                    type=PaymentWarningType.COD_DENIED_OR_CONFLICT.value,
                    severity="warning",
                    supporting_evidence=cod_item.chat_evidence,
                    explanation=(
                        "The seller refused Cash on Delivery despite the public advertisement advertising it. "
                        "Discrepancies in payment terms should be clarified before sending any money."
                    ),
                    suggested_buyer_action=(
                        "বিক্রেতাকে পেজের পোস্টের স্ক্রিনশট দেখিয়ে বিজ্ঞাপনের প্রতিশ্রুতির কথা স্মরণ করিয়ে দিন।"
                    ),
                )
            )
            buyer_questions.append(
                "আপনাদের বিজ্ঞাপনে ক্যাশ অন ডেলিভারি উল্লেখ ছিল, চ্যাটে কেন সম্পূর্ণ অগ্রিম চাওয়া হচ্ছে?"
            )
        elif chat_claims.cod_available is False or ad_claims.cod_available is False:
            ev = chat_claims.cod_evidence or ad_claims.cod_evidence
            warnings.append(
                PaymentWarning(
                    type=PaymentWarningType.COD_DENIED_OR_CONFLICT.value,
                    severity="caution",
                    supporting_evidence=ev,
                    explanation=(
                        "Cash on Delivery is explicitly unavailable. Payment is required prior to receiving the parcel."
                    ),
                    suggested_buyer_action=(
                        "ক্যাশ অন ডেলিভারি না থাকলে সম্পূর্ণ টাকা পাঠানোর আগে বিক্রেতার রিভিউ ও নির্ভরযোগ্যতা যাচাই করুন।"
                    ),
                )
            )
            buyer_questions.append(
                "ক্যাশ অন ডেলিভারি সুবিধা না থাকলে, কুরিয়ার অফিস বা কোনো নিরাপদ পেমেন্ট মাধ্যমে লেনদেনের বিকল্প আছে কি?"
            )

        # 4. Return Policy Explicit Denial vs Missing
        if chat_claims.return_policy_available is False or ad_claims.return_policy_available is False:
            ev = chat_claims.return_policy_evidence or ad_claims.return_policy_evidence
            warnings.append(
                PaymentWarning(
                    type="NO_RETURN_POLICY",
                    severity="caution",
                    supporting_evidence=ev,
                    explanation=(
                        "The seller explicitly stated that returns or refunds are not allowed (final sale). "
                        "Purchasing without return recourse carries elevated risk if the product is defective or damaged."
                    ),
                    suggested_buyer_action=(
                        "পণ্য গ্রহণের আগে কুরিয়ারের সামনে পার্সেল খুলে গুণমান ও সাইজ নিশ্চিত হয়ে নিন।"
                    ),
                )
            )
            buyer_questions.append(
                "পণ্য যদি সম্পূর্ণ ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পৌঁছায়, সেক্ষেত্রে কি কোনো এক্সচেঞ্জ সুবিধা থাকবে?"
            )
        elif ad_claims.return_policy_available is None and chat_claims.return_policy_available is None:
            missing_info.append(
                MissingInfoItem(
                    field="return_policy",
                    field_label="Return & Replacement Policy",
                    description="Neither source mentions what happens if the product arrives damaged, defective, or incorrect.",
                    importance="high",
                )
            )
            buyer_questions.append(
                "পণ্যটি যদি ত্রুটিযুক্ত বা ক্ষতিগ্রস্ত পাওয়া যায়, তবে কতদিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্টের সুযোগ থাকবে?"
            )

        # 5. Missing Product Price
        if ad_claims.price is None and chat_claims.price is None:
            missing_info.append(
                MissingInfoItem(
                    field="price",
                    field_label="Product Price",
                    description="Neither the advertisement nor the conversation states a clear numerical product price.",
                    importance="high",
                )
            )
            buyer_questions.append(
                "পণ্যটির ডেলিভারি চার্জসহ মোট নির্ধারিত চূড়ান্ত বিক্রয়মূল্য কত টাকা?"
            )

        # 6. Missing Delivery Conditions
        if not ad_claims.delivery_conditions and not chat_claims.delivery_conditions:
            missing_info.append(
                MissingInfoItem(
                    field="delivery_charge",
                    field_label="Delivery Fee & Shipping Terms",
                    description="Courier delivery charges and delivery timeline were not specified in either source.",
                    importance="medium",
                )
            )
            buyer_questions.append(
                "ঢাকা এবং ঢাকার বাইরে কুরিয়ার ডেলিভারি চার্জ কত টাকা পড়বে এবং কত কার্যদিবসের মধ্যে ডেলিভারি হবে?"
            )

        # 7. Warranty missing
        if ad_claims.warranty_available is None and chat_claims.warranty_available is None:
            missing_info.append(
                MissingInfoItem(
                    field="warranty",
                    field_label="Warranty Coverage",
                    description="No warranty period or terms were stated in either the advertisement or chat.",
                    importance="medium",
                )
            )
            buyer_questions.append(
                "এই পণ্যের সাথে কি কোনো অফিসিয়াল বা শপ ওয়ারেন্টি রয়েছে? ওয়ারেন্টি কার্ড প্রদান করা হবে কি?"
            )

        # Open-box inspection recommendation
        buyer_questions.append(
            "কুরিয়ার থেকে পার্সেল রিসিভ করার সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?"
        )

        # Deduplicate buyer questions preserving chronological priority
        seen = set()
        deduped_questions: List[str] = []
        for q in buyer_questions:
            if q not in seen:
                seen.add(q)
                deduped_questions.append(q)

        return warnings, missing_info, deduped_questions

    def build_unified_findings(
        self,
        ad_claims: ExtractedClaims,
        chat_claims: ExtractedClaims,
        comparison_results: List[ComparisonItem],
        warnings: List[PaymentWarning],
        missing_info: List[MissingInfoItem],
    ) -> List[Any]:
        """Convert cross-reference comparison items and safety rules into standardized UnifiedFinding items."""
        from backend.app.schemas.unified_evidence import UnifiedFinding, UnifiedFindingStatus
        from backend.app.schemas.seller_history import SourceType, VerificationStatus

        findings: List[UnifiedFinding] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        for comp in comparison_results:
            if comp.status == ContradictionStatus.CONSISTENT:
                u_status = UnifiedFindingStatus.AGREEMENT
            elif comp.status == ContradictionStatus.CONTRADICTION:
                u_status = UnifiedFindingStatus.CONTRADICTION
            elif comp.status == ContradictionStatus.NEEDS_REVIEW:
                u_status = UnifiedFindingStatus.NEEDS_REVIEW
            elif comp.status == ContradictionStatus.INSUFFICIENT_INFORMATION:
                # If one source stated a claim with evidence, it is a single-source STATED_CLAIM
                if comp.ad_evidence or comp.chat_evidence:
                    u_status = UnifiedFindingStatus.STATED_CLAIM
                else:
                    u_status = UnifiedFindingStatus.MISSING_INFORMATION
            else:
                u_status = UnifiedFindingStatus.NEEDS_REVIEW

            ev = comp.chat_evidence or comp.ad_evidence
            val = getattr(chat_claims, comp.field, None) or getattr(ad_claims, comp.field, None)

            findings.append(
                UnifiedFinding(
                    claim_type=comp.field,
                    field_label=comp.field_label,
                    status=u_status,
                    observed_value=str(val) if val is not None else None,
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=ev,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=comp.explanation,
                    severity=comp.severity,
                    limitations="Based on user-submitted advertisement and seller conversation text.",
                )
            )

        return findings

