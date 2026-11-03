"""Deterministic Payment Safety Rules Engine and Buyer Question Generator.

Identifies advance payment requests, high-pressure urgency cues, missing refund
terms, and generates practical buyer verification questions in clear Bangla.
Crucially: An advance bKash or Nagad payment request does NOT imply fraud.
"""

from datetime import datetime, timezone
import re
from typing import List, Tuple, Any, Optional

from backend.app.schemas.assessment import (
    AssessmentState,
    AssessmentSummary,
    ProductAuthenticityAssessment,
)
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

        # 1. Advance Payment Rules - strictly handle tri-state booleans and numerical zero
        advance_amount = chat_claims.advance_payment_amount if chat_claims.advance_payment_amount is not None else ad_claims.advance_payment_amount
        advance_required = chat_claims.advance_payment_required if chat_claims.advance_payment_required is not None else ad_claims.advance_payment_required
        advance_purpose = chat_claims.advance_payment_purpose if chat_claims.advance_payment_purpose is not None else ad_claims.advance_payment_purpose
        evidence = chat_claims.advance_payment_evidence if chat_claims.advance_payment_evidence is not None else ad_claims.advance_payment_evidence
        product_price = chat_claims.price if chat_claims.price is not None else ad_claims.price

        if advance_required is True and evidence:
            norm_purpose = (advance_purpose or "").upper()
            amt_str = f"৳{advance_amount:,.2f}" if advance_amount is not None else "an unspecified amount"

            # 1a. Full product payment requested upfront
            if norm_purpose in ("FULL_PRODUCT_PAYMENT", "FULL_PRICE") or (
                product_price is not None and advance_amount is not None and abs(advance_amount - product_price) < 1.0
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
        elif chat_claims.cod_available is False:
            ev = chat_claims.cod_evidence
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
        elif chat_claims.cod_available is None and ad_claims.cod_available is False:
            ev = ad_claims.cod_evidence
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
        if chat_claims.return_policy_available is False:
            ev = chat_claims.return_policy_evidence
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
        elif chat_claims.return_policy_available is None and ad_claims.return_policy_available is False:
            ev = ad_claims.return_policy_evidence
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
            if comp.field == "price":
                val = chat_claims.price if chat_claims.price is not None else ad_claims.price
            elif comp.field in ("cod", "cod_availability"):
                val = chat_claims.cod_available if chat_claims.cod_available is not None else ad_claims.cod_available
            elif comp.field == "advance_payment":
                val = chat_claims.advance_payment_amount if chat_claims.advance_payment_amount is not None else (
                    chat_claims.advance_payment_required if chat_claims.advance_payment_required is not None else (
                        ad_claims.advance_payment_amount if ad_claims.advance_payment_amount is not None else ad_claims.advance_payment_required
                    )
                )
            elif comp.field == "return_policy":
                val = chat_claims.return_policy_terms or (
                    chat_claims.return_policy_available if chat_claims.return_policy_available is not None else (
                        ad_claims.return_policy_terms or ad_claims.return_policy_available
                    )
                )
            elif comp.field == "warranty":
                val = chat_claims.warranty_terms or (
                    chat_claims.warranty_available if chat_claims.warranty_available is not None else (
                        ad_claims.warranty_terms or ad_claims.warranty_available
                    )
                )
            elif comp.field == "delivery_conditions":
                val = chat_claims.delivery_conditions or ad_claims.delivery_conditions
            else:
                chat_val = getattr(chat_claims, comp.field, None)
                ad_val = getattr(ad_claims, comp.field, None)
                val = chat_val if chat_val is not None else ad_val

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


QUESTION_MAPPINGS_BN_TO_EN = {
    "আমি কি সম্পূর্ণ মূল্য অগ্রিম না দিয়ে শুধুমাত্র কুরিয়ার চার্জ অগ্রিম দিয়ে বাকি টাকা প্রোডাক্ট হাতে পেয়ে পরিশোধ করতে পারি?":
        "Can I pay only the courier delivery charge in advance and pay the remaining product price on Cash on Delivery (COD)?",
    "অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য আপনাদের কি অফিসিয়াল বিকাশ/নগদ মার্চেন্ট নম্বর বা পেমেন্ট লিংক আছে?":
        "Do you have an official bKash/Nagad merchant payment number or checkout link for the courier charge advance?",
    "পণ্য ডেলিভারি পেতে দেরি হলে বা কোনো কারণে অর্ডার বাতিল হলে এই বুকিং ফি কি সম্পূর্ণ ফেরতযোগ্য?":
        "Is this booking fee fully refundable if delivery is delayed or if the order is cancelled?",
    "অগ্রিম দেওয়ার পর ডেলিভারির সময় আর কত টাকা দিতে হবে? ইনভয়েসে কি অগ্রিম টাকার উল্লেখ থাকবে?":
        "After this advance, how much balance will remain due on delivery? Will the official invoice reflect the advance payment?",
    "এই অগ্রিম টাকাটি কি শুধুমাত্র কুরিয়ার ডেলিভারি চার্জ বাবদ, নাকি পণ্যের মূল্যের অংশ?":
        "Is this advance payment specifically for courier shipping charges, or is it partial payment towards the product price?",
    "আপনাদের বিজ্ঞাপনে ক্যাশ অন ডেলিভারি উল্লেখ ছিল, চ্যাটে কেন সম্পূর্ণ অগ্রিম চাওয়া হচ্ছে?":
        "Your advertisement stated Cash on Delivery is available; why is 100% full advance payment being requested in chat?",
    "ক্যাশ অন ডেলিভারি সুবিধা না থাকলে, কুরিয়ার অফিস বা কোনো নিরাপদ পেমেন্ট মাধ্যমে লেনদেনের বিকল্প আছে কি?":
        "If Cash on Delivery is unavailable, can we transact via a courier branch collection or escrow payment method?",
    "পণ্য যদি সম্পূর্ণ ত্রুটিপূর্ণ বা ক্ষতিগ্রস্ত পৌঁছায়, সেক্ষেত্রে কি কোনো এক্সচেঞ্জ সুবিধা থাকবে?":
        "If the product arrives damaged or defective, what is your official exchange or replacement policy?",
    "পণ্যটি যদি ত্রুটিযুক্ত বা ক্ষতিগ্রস্ত পাওয়া যায়, তবে কতদিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্টের সুযোগ থাকবে?":
        "Within how many days can I request a return or replacement if the product has defects or transit damage?",
    "পণ্যটির ডেলিভারি চার্জসহ মোট নির্ধারিত চূড়ান্ত বিক্রয়মূল্য কত টাকা?":
        "What is the final total price of the product including all delivery and packaging charges?",
    "পণ্যটির ডেলিভারি চার্জসহ মোট নির্ধারিত চূড়ান্ত বিক্রয়মূল্য কত টাকা পড়বে?":
        "What is the final total price of the product including all delivery and packaging charges?",
    "ঢাকা এবং ঢাকার বাইরে কুরিয়ার ডেলিভারি চার্জ কত টাকা পড়বে এবং কত কার্যদিবসের মধ্যে ডেলিভারি হবে?":
        "What is the exact delivery charge for inside/outside Dhaka, and how many business days will delivery take?",
    "পণ্য হাতে পেয়ে মূল্য পরিশোধ (ক্যাশ অন ডেলিভারি) করার সুবিধা আছে কি?":
        "Is Cash on Delivery (payment upon receipt and parcel inspection) supported?",
    "পণ্যটিতে কোনো ত্রুটি, ক্ষতি বা সাইজের অমিল থাকলে কতদিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্টের সুযোগ পাব?":
        "If there is any defect, damage, or size mismatch, within how many days can I request a return or replacement?",
    "এই পণ্যের সাথে কি কোনো অফিসিয়াল বা শপ ওয়ারেন্টি রয়েছে? ওয়ারেন্টি কার্ড প্রদান করা হবে কি?":
        "Does this product come with an official brand or shop warranty, and will an official warranty card be included?",
    "বিজ্ঞাপনে উল্লেখিত 'শর্ত প্রযোজ্য' এর নির্দিষ্ট শর্তগুলো কী কী?":
        "What are the specific conditions referred to by 'Terms and Conditions Apply' in the advertisement?",
    "পণ্যটি কি ব্র্যান্ডের ১০০% আসল পণ্য এবং এর সত্যতা নিশ্চিত করার কি কোনো যাচাইযোগ্য উপায় (যেমন বারকোড/কিউআর কোড) আছে?":
        "Is this an authentic original branded product, and is there a verifiable serial, barcode, or distributor seal to verify it?",
    "ওয়ারেন্টির সুনির্দিষ্ট মেয়াদ কতদিন (যেমন: কত মাস বা বছর) এবং এর আওতাভুক্ত শর্তাবলী কী?":
        "What is the exact duration of the warranty (months or years), and what are the specific coverage terms?",
    "অর্ডার কনফার্ম করার জন্য অগ্রিম কত টাকা পাঠাতে হবে এবং তা কি শুধুমাত্র কুরিয়ার চার্জ বাবদ?":
        "How much advance payment is required to confirm the order, and is it exclusively for courier delivery charges?",
    "পণ্যটি কি সম্পূর্ণ নতুন ও ইনট্যাক্ট বক্স, নাকি ডিসপ্লে/রিফার্বিশড ইউনিট?":
        "Is the product brand new in an intact factory-sealed box, or is it a display/refurbished unit?",
    "কুরিয়ার থেকে পার্সেল রিসিভ করার সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?":
        "Will I be permitted to inspect the item in front of the delivery agent (Open-box inspection) before signing for the parcel?",
    "কুরিয়ার থেকে পার্সেল গ্রহণের সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?":
        "Will I be permitted to inspect the item in front of the delivery agent (Open-box inspection) before signing for the parcel?",
    "পণ্য ক্ষতিগ্রস্ত বা ভুল সাইজ পৌঁছালে তার দায়ভার কে বহন করবে? কোনো এক্সচেঞ্জ সুবিধা থাকবে কি?":
        "Who covers return expenses if the item arrives damaged or in the wrong size? Is an immediate exchange guaranteed?",
}


def map_bangla_questions_to_english(questions_bn: List[str]) -> List[str]:
    """Deterministically map generated Bangla buyer verification questions to fluent English."""
    results: List[str] = []
    for q in questions_bn:
        if q in QUESTION_MAPPINGS_BN_TO_EN:
            results.append(QUESTION_MAPPINGS_BN_TO_EN[q])
        else:
            # Fallback natural English query
            results.append("Please verify the commercial terms and inspect the parcel upon delivery.")
    return results


def evaluate_product_authenticity(text: str, product_name: Optional[str] = None) -> ProductAuthenticityAssessment:
    """Evaluate product authenticity claims with strict responsible AI guardrails."""
    if not text or not text.strip():
        return ProductAuthenticityAssessment(
            status="INSUFFICIENT_EVIDENCE",
            status_label_bn="অপর্যাপ্ত তথ্য",
            status_label_en="Insufficient Evidence",
            claim_detected=False,
            claim_evidence=None,
            explanation_bn="পণ্যের আসল বা নকল যাচাই করার জন্য কোনো বিবরণ পাওয়া যায়নি।",
            explanation_en="No product text available to assess authenticity claims.",
            verification_steps_bn=[],
            verification_steps_en=[],
        )

    # Check for originality / authenticity claims
    pattern = r"(?:(?:100%|১০০%)\s*(?:original|authentic|genuine|export\s*quality|অরিজিনাল|অরজিনাল|আসল|খাঁটি|জেনুইন)|শতাভাগ\s*আসল|একদম\s*(?:অরিজিনাল|অরজিনাল|আসল)|অরিজিনাল\s*প্রোডাক্ট|authentic\s*product|genuine\s*product|master\s*copy)"
    match = re.search(pattern, text, re.IGNORECASE)

    verification_steps_bn = [
        "ব্র্যান্ডের অনুমোদিত ডিলার বা অফিসিয়াল আমদানিকারকের স্টিকার/সার্টিফিকেট আছে কিনা দেখুন।",
        "বক্সের বারকোড, কিউআর কোড বা আইএমইআই (IMEI) নম্বর অফিসিয়াল ব্র্যান্ড ওয়েবসাইটে যাচাই করুন।",
        "ডেলিভারি গ্রহণের সময় কুরিয়ারের সামনে পার্সেল খুলে (Open-box delivery) সিল ও পণ্যের গুণমান নিশ্চিত করুন।",
        "বাজার মূল্যের চেয়ে অস্বাভাবিক কম মূল্যে বিক্রি হলে সতর্ক থাকুন (অতিরিক্ত কম দামে সাধারণত আসল পণ্য পাওয়া যায় না)।",
    ]
    verification_steps_en = [
        "Check for official brand authorized distributor/importer sticker or warranty card.",
        "Verify the product barcode, serial number, or IMEI on the official manufacturer website.",
        "Insist on Open-Box Delivery to inspect physical packaging, seal integrity, and build quality before paying.",
        "Beware of prices significantly below market average; genuine items are rarely sold at massive discounts.",
    ]

    if match:
        start = max(0, text.rfind(".", 0, match.start()), text.rfind("।", 0, match.start()), text.rfind("\n", 0, match.start()))
        if start > 0:
            start += 1
        end = len(text)
        for delim in (".", "।", "\n", "!", "?"):
            pos = text.find(delim, match.end())
            if pos != -1 and pos < end:
                end = pos
        evidence = text[start:end].strip() or match.group(0).strip()

        return ProductAuthenticityAssessment(
            status="CLAIMED_ORIGINAL",
            status_label_bn="আসল বলে দাবি করা হয়েছে (স্বাধীনভাবে যাচাইকৃত নয়)",
            status_label_en="Claimed as Original (Not independently verified)",
            claim_detected=True,
            claim_evidence=evidence,
            explanation_bn=(
                "বিজ্ঞাপনে বা বিক্রেতার চ্যাটে পণ্যটিকে 'আসল/অরিজিনাল' দাবি করা হয়েছে। "
                "তবে অনলাইন পোস্ট বা স্ক্রিনশটের মাধ্যমে পণ্যের বাহ্যিক বা আসল-নকল অবস্থা নিশ্চিত করা অসম্ভব।"
            ),
            explanation_en=(
                "The seller claims this item is original/authentic. "
                "However, online advertisements and chat statements cannot independently verify physical product authenticity."
            ),
            verification_steps_bn=verification_steps_bn,
            verification_steps_en=verification_steps_en,
        )

    return ProductAuthenticityAssessment(
        status="NOT_INDEPENDENTLY_VERIFIED",
        status_label_bn="স্বাধীনভাবে যাচাইকৃত নয়",
        status_label_en="Not independently verified",
        claim_detected=False,
        claim_evidence=None,
        explanation_bn=(
            "অনলাইন বিজ্ঞাপন বা বার্তার মাধ্যমে পণ্যের সত্যতা নিশ্চিত করা যায় না। "
            "ডেলিভারির সময় পণ্য ও প্যাকেজিং সরাসরি পরীক্ষা করুন।"
        ),
        explanation_en=(
            "Physical product authenticity cannot be verified from online text or screenshots. "
            "Always inspect packaging and serials upon delivery."
        ),
        verification_steps_bn=verification_steps_bn,
        verification_steps_en=verification_steps_en,
    )


def determine_overall_assessment_ad(
    ad_text: str,
    claims: ExtractedClaims,
    payment_considerations: List[PaymentWarning],
    missing_critical_info: List[MissingInfoItem],
    ambiguous_statements: List[str],
) -> Tuple[AssessmentState, AssessmentSummary]:
    """Evaluate advertisement text and findings to determine overall safety assessment state."""
    clean_text = ad_text.strip()
    has_substantive_claims = (
        claims.price is not None
        or claims.cod_available is not None
        or claims.advance_payment_required is not None
        or claims.return_policy_available is not None
        or claims.warranty_available is not None
        or bool(payment_considerations)
    )
    if not has_substantive_claims or len(clean_text) < 35:
        return (
            "INSUFFICIENT_EVIDENCE",
            AssessmentSummary(
                headline_bn="অপর্যাপ্ত তথ্য — যাচাই সম্ভব হয়নি",
                headline_en="Insufficient Evidence — Verification Inconclusive",
                explanation_bn="বিজ্ঞাপনে মূল তথ্য (যেমন পণ্যের নাম, দাম, বা ডেলিভারির শর্ত) পাওয়া যায়নি। বিস্তারিত তথ্যসহ আবার চেষ্টা করুন।",
                explanation_en="The advertisement lacks core terms such as product details, price, or delivery conditions.",
                primary_action_bn="বিক্রেতার থেকে পণ্যের পূর্ণাঙ্গ বিবরণ ও পেমেন্ট শর্ত জেনে নিন।",
                primary_action_en="Ask the seller for complete product descriptions and clear commercial terms.",
            ),
        )

    has_high_warning = any(w.severity in ("warning", "caution") for w in payment_considerations)
    missing_core = any(m.field in ("price", "cod") for m in missing_critical_info)

    if has_high_warning or missing_core:
        return (
            "WARNING_SIGNS_FOUND",
            AssessmentSummary(
                headline_bn="সতর্কতা সংকেত চিহ্নিত হয়েছে",
                headline_en="Warning Signs Detected",
                explanation_bn="বিজ্ঞাপনে ঝুঁকিপূর্ণ পেমেন্ট শর্ত বা গুরুত্বপূর্ণ তথ্যের ঘাটতি পাওয়া গেছে (যেমন: সম্পূর্ণ অগ্রিম পেমেন্টের চাপ বা গোপন মূল্য)।",
                explanation_en="Warning signs were detected in this ad (such as full advance payment demands, undisclosed price, or missing COD).",
                primary_action_bn="অগ্রিম সম্পূর্ণ টাকা পরিশোধ করবেন না। শুধুমাত্র কুরিয়ার চার্জ দিয়ে বাকি টাকা ক্যাশ অন ডেলিভারিতে দিন।",
                primary_action_en="Do not pay in full in advance. Insist on paying only courier shipping advance and remaining on Cash on Delivery.",
            ),
        )

    return (
        "NO_SPECIFIC_WARNING_SIGNS_FOUND",
        AssessmentSummary(
            headline_bn="কোনো নির্দিষ্ট সতর্কতা পাওয়া যায়নি",
            headline_en="No Specific Warning Signs Found",
            explanation_bn="বিজ্ঞাপনের দৃশ্যমান শর্তাবলীতে স্পষ্ট কোনো অসঙ্গতি পাওয়া যায়নি। মনে রাখবেন: এটি বিক্রেতার সততা বা আসল পণ্যের চূড়ান্ত নিশ্চয়তা নয়।",
            explanation_en="No explicit predatory terms were identified in the visible advertisement text. Note: This does NOT guarantee seller legitimacy.",
            primary_action_bn="অর্ডার করার আগে কুরিয়ার চার্জ এবং ওপেন-বক্স ডেলিভারির সুবিধা নিশ্চিত করুন।",
            primary_action_en="Confirm courier charges and open-box inspection before finalizing your order.",
        ),
    )


def determine_overall_assessment_comparison(
    ad_text: str,
    chat_text: str,
    comparison_results: List[ComparisonItem],
    warnings: List[PaymentWarning],
    missing_info: List[MissingInfoItem],
) -> Tuple[AssessmentState, AssessmentSummary]:
    """Evaluate comparison results to determine overall safety assessment state for Ad vs Chat."""
    if len(ad_text.strip()) < 20 and len(chat_text.strip()) < 20:
        return (
            "INSUFFICIENT_EVIDENCE",
            AssessmentSummary(
                headline_bn="অপর্যাপ্ত তথ্য — যাচাই সম্ভব হয়নি",
                headline_en="Insufficient Evidence — Verification Inconclusive",
                explanation_bn="বিজ্ঞাপন বা চ্যাটের টেক্সট অত্যন্ত সংক্ষিপ্ত হওয়ায় তুলনা সম্পন্ন করা যায়নি।",
                explanation_en="Provided advertisement or chat text is too brief to conduct meaningful promise comparison.",
                primary_action_bn="বিজ্ঞাপনের সম্পূর্ণ ক্যাপশন এবং চ্যাটের মূল কথোপকথন প্রদান করুন।",
                primary_action_en="Provide more complete conversation excerpts or post captions.",
            ),
        )

    has_contradiction = any(c.status == ContradictionStatus.CONTRADICTION for c in comparison_results)
    has_warning = any(w.severity in ("warning", "caution") for w in warnings)

    if has_contradiction or has_warning:
        return (
            "WARNING_SIGNS_FOUND",
            AssessmentSummary(
                headline_bn="সতর্কতা সংকেত ও গরমিল পাওয়া গেছে",
                headline_en="Warning Signs & Inconsistencies Detected",
                explanation_bn="বিজ্ঞাপনের প্রতিশ্রুতি এবং বিক্রেতার চ্যাটের মধ্যে স্পষ্ট গরমিল বা ঝুঁকিপূর্ণ পেমেন্ট শর্ত পাওয়া গেছে।",
                explanation_en="Direct contradictions between the public advertisement and private chat, or elevated payment risks, were detected.",
                primary_action_bn="অগ্রিম টাকা পাঠানোর আগে বিজ্ঞাপনের পোস্ট দেখিয়ে চ্যাটে লিখিতভাবে প্রতিশ্রুতির মিল নিশ্চিত করুন।",
                primary_action_en="Do not send advance funds until the seller resolves contradictory terms in writing.",
            ),
        )

    return (
        "NO_SPECIFIC_WARNING_SIGNS_FOUND",
        AssessmentSummary(
            headline_bn="কোনো নির্দিষ্ট সতর্কতা বা গরমিল পাওয়া যায়নি",
            headline_en="No Specific Warning Signs or Contradictions Found",
            explanation_bn="বিজ্ঞাপন ও চ্যাটের মধ্যে দৃশ্যমান গরমিল পাওয়া যায়নি। মনে রাখবেন: এটি বিক্রেতার সততা বা আসল পণ্যের চূড়ান্ত নিশ্চয়তা নয়।",
            explanation_en="No explicit contradictions or elevated warning signs were identified. Note: This does NOT guarantee merchant trustworthiness.",
            primary_action_bn="শুধুমাত্র ডেলিভারির সময় পণ্য যাচাই করে বাকি টাকা পরিশোধ করুন।",
            primary_action_en="Inspect product condition in person upon delivery before paying the remaining balance.",
        ),
    )


