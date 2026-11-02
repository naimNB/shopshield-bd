"""Deterministic Payment Safety Rules Engine and Buyer Question Generator.

Identifies advance payment requests, high-pressure urgency cues, missing refund
terms, and generates practical buyer verification questions in clear Bangla.
Crucially: An advance bKash or Nagad payment request does NOT imply fraud.
"""

from typing import List, Tuple
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

        if advance_required:
            if advance_purpose == "full_price" or (
                product_price and advance_amount and abs(advance_amount - product_price) < 1.0
            ):
                # Full advance requested
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_FULL_PAYMENT.value,
                        severity="warning",
                        supporting_evidence=evidence,
                        explanation=(
                            "The seller is requesting 100% full payment in advance before shipment. "
                            "In social media e-commerce, full advance payment carries substantial financial risk."
                        ),
                        suggested_buyer_action=(
                            "অনুরোধ করুন যেন শুধুমাত্র কুরিয়ার ডেলিভারি চার্জ অগ্রিম নিয়ে বাকি টাকা ক্যাশ অন ডেলিভারিতে (COD) পাঠানো হয়।"
                        ),
                    )
                )
                buyer_questions.append(
                    "আমি কি শুধুমাত্র ডেলিভারি চার্জ অগ্রিম দিয়ে বাকি টাকা প্রোডাক্ট হাতে পেয়ে পরিশোধ করতে পারি?"
                )

            elif advance_amount and advance_amount <= 250.0:
                # Standard delivery charge advance (100 - 250 BDT) -> Normal BD commerce practice
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value,
                        severity="info",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The seller requested ৳{advance_amount:,.2f} advance, which corresponds to standard courier "
                            "delivery charges in Bangladesh. Bangladeshi online shops commonly request delivery fees in advance "
                            "to safeguard against uncollected returns. This is normal practice and does not imply fraud."
                        ),
                        suggested_buyer_action=(
                            "কুরিয়ার চার্জ অগ্রিম পাঠানোর আগে বিক্রেতার ফেসবুক পেজ/শপের রিভিউ দেখুন এবং সম্ভব হলে অফিসিয়াল মার্চেন্ট একাউন্টে পেমেন্ট করুন।"
                        ),
                    )
                )
                buyer_questions.append(
                    "অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য আপনাদের কি অফিসিয়াল বিকাশ/নগদ মার্চেন্ট নম্বর বা পেমেন্ট লিংক আছে?"
                )

            elif advance_amount and advance_amount > 250.0:
                # Substantial advance (> 250 BDT)
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.HIGH_ADVANCE_AMOUNT.value,
                        severity="caution",
                        supporting_evidence=evidence,
                        explanation=(
                            f"The requested advance payment (৳{advance_amount:,.2f}) exceeds standard courier delivery charges. "
                            "Paying significant advance sums without escrow or marketplace protection increases consumer exposure."
                        ),
                        suggested_buyer_action=(
                            "অগ্রিম টাকার পরিমাণ সীমিত করে শুধুমাত্র প্রকৃত কুরিয়ার চার্জ (৳১০০–৳২০০) দেওয়ার প্রস্তাব দিন।"
                        ),
                    )
                )
                buyer_questions.append(
                    "অগ্রিম টাকার পরিমাণ কি কমানো সম্ভব? ডেলিভারি চার্জের অতিরিক্ত টাকা আমি কুরিয়ারের কাছে পরিশোধ করতে চাই।"
                )
            else:
                # Advance required but amount unspecified
                warnings.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value,
                        severity="caution",
                        supporting_evidence=evidence,
                        explanation="The seller requested an advance payment without clearly stating the exact amount or purpose.",
                        suggested_buyer_action="অগ্রিম কত টাকা এবং কী বাবদ পাঠাতে হবে তা চ্যাটে পরিষ্কারভাবে জেনে নিন।",
                    )
                )

        # 2. Urgency and Pressure Rules
        urgency = chat_claims.urgency_or_pressure or ad_claims.urgency_or_pressure
        urgency_ev = chat_claims.urgency_evidence or ad_claims.urgency_evidence
        if urgency:
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

        # 3. Conflicting COD Rules
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

        # 4. Missing Information Rules
        # Return policy missing
        if ad_claims.return_policy_available is None and chat_claims.return_policy_available is None:
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

        # Warranty missing
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

        # Open-box inspection check
        buyer_questions.append(
            "কুরিয়ার থেকে পার্সেল রিসিভ করার সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?"
        )

        return warnings, missing_info, buyer_questions
