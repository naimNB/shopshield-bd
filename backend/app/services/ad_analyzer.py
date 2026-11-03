"""Ad-only Quick Check Analyzer for ShopShield BD.

Enables consumers to evaluate e-commerce and f-commerce advertisements BEFORE
initiating conversation with the seller.
Extracts verified commercial commitments, flags missing critical protections,
detects ambiguous marketing statements, evaluates payment considerations,
and generates structured Bangla seller verification questions.

Crucial Guardrails:
1. When seller chat is unavailable, do NOT invent contradictions.
2. A missing return policy or warranty is MISSING_INFORMATION / UNKNOWN, not "no returns."
3. An ad that appears internally consistent is NOT proof that the seller is trustworthy.
"""

from datetime import datetime, timezone
import re
import time
from typing import List, Optional
import uuid

from backend.app.schemas.ad_analysis import AdAnalysisRequest, AdAnalysisResponse
from backend.app.schemas.analysis import AnalysisMetadata
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.rules import MissingInfoItem, PaymentWarning, PaymentWarningType
from backend.app.schemas.seller_history import SourceType, VerificationStatus
from backend.app.schemas.unified_evidence import UnifiedFinding, UnifiedFindingStatus
from backend.app.services.ai_extractor import AIExtractorService
from backend.app.services.rules_engine import (
    evaluate_product_authenticity,
    determine_overall_assessment_ad,
    map_bangla_questions_to_english,
)


class AdAnalyzer:
    """Evaluates standalone advertisements to prepare buyers before seller contact."""

    def __init__(self, extractor: Optional[AIExtractorService] = None):
        self.extractor = extractor or AIExtractorService()

    def analyze_ad(self, request: AdAnalysisRequest) -> AdAnalysisResponse:
        """Execute end-to-end ad-only verification and evidence classification."""
        start_time = time.time()
        ad_text = request.advertisement_text.strip()

        # 1. Extract structured claims from the advertisement
        claims = None
        try:
            claims = self.extractor.extract_claims(
                text=ad_text,
                source_type="advertisement",
            )
        except Exception:
            claims = self.extractor.extract_claims_deterministic(
                text=ad_text,
                source_type="advertisement",
            )

        now_iso = datetime.now(timezone.utc).isoformat()

        # 2. Extract Explicitly Stated Terms
        explicit_terms: List[str] = []
        if claims.product_name:
            explicit_terms.append(f"Product: {claims.product_name}")
        if claims.price is not None:
            ev = f" ('{claims.price_evidence}')" if claims.price_evidence else ""
            explicit_terms.append(f"Price: ৳{claims.price:,.2f} {claims.currency or 'BDT'}{ev}")
        if claims.cod_available is True:
            ev = f" ('{claims.cod_evidence}')" if claims.cod_evidence else ""
            explicit_terms.append(f"Cash on Delivery: Available{ev}")
        elif claims.cod_available is False:
            ev = f" ('{claims.cod_evidence}')" if claims.cod_evidence else ""
            explicit_terms.append(f"Cash on Delivery: Explicitly Denied{ev}")
        if claims.advance_payment_required is True:
            amt = f" ৳{claims.advance_payment_amount:,.2f}" if claims.advance_payment_amount is not None else ""
            purpose = f" ({claims.advance_payment_purpose})" if claims.advance_payment_purpose else ""
            ev = f" ('{claims.advance_payment_evidence}')" if claims.advance_payment_evidence else ""
            explicit_terms.append(f"Advance Payment Required:{amt}{purpose}{ev}")
        elif claims.advance_payment_required is False:
            ev = f" ('{claims.advance_payment_evidence}')" if claims.advance_payment_evidence else ""
            explicit_terms.append(f"Advance Payment: None Required (Zero Advance){ev}")
        if claims.return_policy_available is True:
            terms = f" - {claims.return_policy_terms}" if claims.return_policy_terms else ""
            ev = f" ('{claims.return_policy_evidence}')" if claims.return_policy_evidence else ""
            explicit_terms.append(f"Return / Replacement: Available{terms}{ev}")
        elif claims.return_policy_available is False:
            ev = f" ('{claims.return_policy_evidence}')" if claims.return_policy_evidence else ""
            explicit_terms.append(f"Return / Replacement: Explicitly Denied (Final Sale){ev}")
        if claims.warranty_available is True:
            terms = f" - {claims.warranty_terms}" if claims.warranty_terms else ""
            ev = f" ('{claims.warranty_evidence}')" if claims.warranty_evidence else ""
            explicit_terms.append(f"Warranty: Promised{terms}{ev}")
        elif claims.warranty_available is False:
            ev = f" ('{claims.warranty_evidence}')" if claims.warranty_evidence else ""
            explicit_terms.append(f"Warranty: Explicitly No Warranty{ev}")
        if claims.delivery_conditions:
            ev = f" ('{claims.delivery_evidence}')" if claims.delivery_evidence else ""
            explicit_terms.append(f"Delivery Conditions: {claims.delivery_conditions}{ev}")

        # 3. Detect Missing Critical Information
        missing_critical_info: List[MissingInfoItem] = []
        buyer_questions: List[str] = []

        # Missing Price
        if claims.price is None:
            missing_critical_info.append(
                MissingInfoItem(
                    field="price",
                    field_label="Product Price",
                    description=(
                        "The advertisement does not disclose a clear numerical price. Social media posts often ask "
                        "buyers to 'Inbox for price', which obscures costs and enables discriminatory pricing."
                    ),
                    importance="high",
                )
            )
            buyer_questions.append("পণ্যটির ডেলিভারি চার্জসহ মোট নির্ধারিত চূড়ান্ত বিক্রয়মূল্য কত টাকা পড়বে?")

        # Missing Delivery Charges
        if not claims.delivery_conditions:
            missing_critical_info.append(
                MissingInfoItem(
                    field="delivery_charge",
                    field_label="Delivery Fee & Shipping Terms",
                    description=(
                        "Courier delivery fees and estimated delivery duration are omitted from the ad. "
                        "In Bangladesh, standard courier charges range from ৳60–৳150 depending on inside/outside Dhaka."
                    ),
                    importance="medium",
                )
            )
            buyer_questions.append("ঢাকা এবং ঢাকার বাইরে কুরিয়ার ডেলিভারি চার্জ কত টাকা পড়বে এবং কত কার্যদিবসের মধ্যে ডেলিভারি হবে?")

        # Missing COD Terms
        if claims.cod_available is None:
            missing_critical_info.append(
                MissingInfoItem(
                    field="cod",
                    field_label="Cash on Delivery (COD) Terms",
                    description=(
                        "The advertisement does not mention whether Cash on Delivery is supported. "
                        "Always verify payment mode before sharing contact details."
                    ),
                    importance="high",
                )
            )
            buyer_questions.append("পণ্য হাতে পেয়ে মূল্য পরিশোধ (ক্যাশ অন ডেলিভারি) করার সুবিধা আছে কি?")

        # Missing Return Policy
        if claims.return_policy_available is None:
            missing_critical_info.append(
                MissingInfoItem(
                    field="return_policy",
                    field_label="Return & Replacement Policy",
                    description=(
                        "No return or exchange policy is articulated in the advertisement. If the product arrives "
                        "defective, wrong size, or damaged, terms for resolution are unknown."
                    ),
                    importance="high",
                )
            )
            buyer_questions.append("পণ্যটিতে কোনো ত্রুটি, ক্ষতি বা সাইজের অমিল থাকলে কতদিনের মধ্যে রিটার্ন বা রিপ্লেসমেন্টের সুযোগ পাব?")

        # Missing Warranty
        if claims.warranty_available is None:
            missing_critical_info.append(
                MissingInfoItem(
                    field="warranty",
                    field_label="Warranty Coverage",
                    description="No warranty period or coverage scope is stated for this product.",
                    importance="medium",
                )
            )
            buyer_questions.append("এই পণ্যের সাথে কি কোনো অফিসিয়াল বা শপ ওয়ারেন্টি রয়েছে? ওয়ারেন্টি কার্ড প্রদান করা হবে কি?")

        # 4. Detect Ambiguous Statements
        ambiguous_statements: List[str] = []
        ad_lower = ad_text.lower()

        # Vague terms / conditions
        if re.search(r"(?:condition[s]?\s+apply|শর্ত\s*প্রযোজ্য|terms\s*(?:and|&)\s*conditions)", ad_lower):
            ambiguous_statements.append("Contains 'Conditions apply' (শর্ত প্রযোজ্য) without detailing the specific restrictions.")
            buyer_questions.append("বিজ্ঞাপনে উল্লেখিত 'শর্ত প্রযোজ্য' এর নির্দিষ্ট শর্তগুলো কী কী?")

        # Vague quality buzzwords without verifiable brand/origin
        if re.search(r"(?:(?:100%|১০০%)\s*(?:original|authentic|export|অরিজিনাল|অরজিনাল|আসল)|শতাভাগ\s*আসল|একদম\s*অরিজিনাল|একদম\s*অরজিনাল|এক্সপোর্ট\s*কো[য়য়]ালিটি|ম্যাজিক\s*ফর্মুলা|magic\s*formula)", ad_lower):
            if not claims.product_name or not any(k in ad_lower for k in ("guarantee", "certificate", "official distributor", "বারকোড")):
                ambiguous_statements.append(
                    "Uses promotional buzzwords ('100% original / Export Quality / Magic formula') without citing official distributor credentials or verifiable batch/barcode details."
                )
                buyer_questions.append("পণ্যটি কি ব্র্যান্ডের ১০০% আসল পণ্য এবং এর সত্যতা নিশ্চিত করার কি কোনো যাচাইযোগ্য উপায় (যেমন বারকোড/কিউআর কোড) আছে?")

        # Warranty mentioned without duration
        if claims.warranty_available is True and (not claims.warranty_terms or not re.search(r"\d+", claims.warranty_terms)):
            ambiguous_statements.append("Warranty is claimed but the specific duration (months or years) is not stated.")
            buyer_questions.append("ওয়ারেন্টির সুনির্দিষ্ট মেয়াদ কতদিন (যেমন: কত মাস বা বছর) এবং এর আওতাভুক্ত শর্তাবলী কী?")

        # Advance mentioned without amount
        if claims.advance_payment_required is True and claims.advance_payment_amount is None:
            ambiguous_statements.append("Advance payment is requested without stating the exact numerical amount.")
            buyer_questions.append("অর্ডার কনফার্ম করার জন্য অগ্রিম কত টাকা পাঠাতে হবে এবং তা কি শুধুমাত্র কুরিয়ার চার্জ বাবদ?")

        # Urgency pressure
        if claims.urgency_or_pressure:
            ambiguous_statements.append(f"Contains urgency cue ('{claims.urgency_or_pressure}').")

        # 5. Evaluate Payment Considerations & Warnings
        payment_considerations: List[PaymentWarning] = []

        if claims.advance_payment_required is True and claims.advance_payment_evidence:
            norm_purpose = (claims.advance_payment_purpose or "").upper()
            amt_str = f"৳{claims.advance_payment_amount:,.2f}" if claims.advance_payment_amount is not None else "an unspecified amount"

            if norm_purpose in ("FULL_PRODUCT_PAYMENT", "FULL_PRICE") or (
                claims.price is not None and claims.advance_payment_amount is not None and abs(claims.advance_payment_amount - claims.price) < 1.0
            ):
                payment_considerations.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_FULL_PAYMENT.value,
                        severity="warning",
                        supporting_evidence=claims.advance_payment_evidence,
                        explanation=(
                            "The advertisement requests 100% full payment in advance. In social commerce, full upfront "
                            "payment prior to shipment carries substantial risk of non-delivery."
                        ),
                        suggested_buyer_action="অনুরোধ করুন যেন শুধুমাত্র কুরিয়ার চার্জ অগ্রিম নিয়ে বাকি টাকা ক্যাশ অন ডেলিভারিতে পাঠানো হয়।",
                    )
                )
                buyer_questions.append("আমি কি সম্পূর্ণ মূল্য অগ্রিম না দিয়ে শুধুমাত্র কুরিয়ার চার্জ অগ্রিম দিয়ে বাকি টাকা প্রোডাক্ট হাতে পেয়ে দিতে পারি?")

            elif norm_purpose in ("DELIVERY_CHARGE",):
                payment_considerations.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_DELIVERY_CHARGE.value,
                        severity="info",
                        supporting_evidence=claims.advance_payment_evidence,
                        explanation=(
                            f"The ad explicitly requests {amt_str} advance for courier delivery charges. "
                            "Sellers commonly request delivery fees in advance to guard against uncollected parcels. "
                            "While common, advance payment of freight does not guarantee merchant legitimacy."
                        ),
                        suggested_buyer_action="অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য অফিসিয়াল মার্চেন্ট নম্বর বা ব্যাংক একাউন্ট ব্যবহার করুন।",
                    )
                )
                buyer_questions.append("অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য আপনাদের কি অফিসিয়াল বিকাশ/নগদ মার্চেন্ট নম্বর বা পেমেন্ট লিংক আছে?")

            elif norm_purpose in ("BOOKING_FEE", "BOOKING"):
                payment_considerations.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_BOOKING_FEE.value,
                        severity="caution",
                        supporting_evidence=claims.advance_payment_evidence,
                        explanation=(
                            f"The ad requests an advance booking/reservation fee of {amt_str}. "
                            "Unlike third-party courier delivery fees, a booking fee is retained by the seller before shipment."
                        ),
                        suggested_buyer_action="অর্ডার বাতিল বা ডেলিভারিতে বিলম্ব হলে এই বুকিং ফি ফেরতযোগ্য (refundable) কিনা তা চ্যাটে নিশ্চিত করুন।",
                    )
                )
                buyer_questions.append("পণ্য ডেলিভারি পেতে দেরি হলে বা কোনো কারণে অর্ডার বাতিল হলে এই বুকিং ফি কি সম্পূর্ণ ফেরতযোগ্য?")

            elif norm_purpose in ("PARTIAL_PRODUCT_PAYMENT", "PARTIAL"):
                payment_considerations.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_PARTIAL_PAYMENT.value,
                        severity="caution",
                        supporting_evidence=claims.advance_payment_evidence,
                        explanation=(
                            f"The ad requests a partial product payment of {amt_str} in advance. "
                            "Paying a portion of the product cost before receiving the item increases buyer exposure."
                        ),
                        suggested_buyer_action="বাকি কত টাকা ডেলিভারির সময় দিতে হবে তার পরিষ্কার হিসাব নিন এবং মানি রিসিট বা ইনভয়েস সংগ্রহ করুন।",
                    )
                )
                buyer_questions.append("অগ্রিম দেওয়ার পর ডেলিভারির সময় আর কত টাকা দিতে হবে? ইনভয়েসে কি অগ্রিম টাকার উল্লেখ থাকবে?")

            else:
                payment_considerations.append(
                    PaymentWarning(
                        type=PaymentWarningType.ADVANCE_UNSPECIFIED_PURPOSE.value,
                        severity="caution",
                        supporting_evidence=claims.advance_payment_evidence,
                        explanation=(
                            f"The advertisement requests an advance payment of {amt_str}, but does not explicitly specify what it covers "
                            "(e.g., courier delivery charge vs. booking fee vs. product price)."
                        ),
                        suggested_buyer_action="অগ্রিম টাকাটি কুরিয়ার চার্জ বাবদ নাকি পণ্যের মূল্যের অংশ, তা চ্যাটে পরিষ্কারভাবে জেনে নিন।",
                    )
                )
                buyer_questions.append("এই অগ্রিম টাকাটি কি শুধুমাত্র কুরিয়ার ডেলিভারি চার্জ বাবদ, নাকি পণ্যের মূল্যের অংশ?")

        if claims.cod_available is False:
            payment_considerations.append(
                PaymentWarning(
                    type=PaymentWarningType.COD_DENIED_OR_CONFLICT.value,
                    severity="caution",
                    supporting_evidence=claims.cod_evidence,
                    explanation="Cash on Delivery is explicitly unavailable according to this advertisement.",
                    suggested_buyer_action="ক্যাশ অন ডেলিভারি না থাকলে সম্পূর্ণ টাকা পাঠানোর আগে বিক্রেতার রিভিউ ও নির্ভরযোগ্যতা যাচাই করুন।",
                )
            )
            buyer_questions.append("ক্যাশ অন ডেলিভারি সুবিধা না থাকলে, কুরিয়ার অফিস বা কোনো নিরাপদ পেমেন্ট মাধ্যমে লেনদেনের বিকল্প আছে কি?")

        if claims.return_policy_available is False:
            payment_considerations.append(
                PaymentWarning(
                    type="NO_RETURN_POLICY",
                    severity="caution",
                    supporting_evidence=claims.return_policy_evidence,
                    explanation="The advertisement explicitly declares that returns or exchanges are not accepted (all sales final).",
                    suggested_buyer_action="পণ্য গ্রহণের আগে কুরিয়ারের সামনে পার্সেল খুলে গুণমান ও সাইজ নিশ্চিত হয়ে নিন।",
                )
            )
            buyer_questions.append("পণ্য ক্ষতিগ্রস্ত বা ভুল সাইজ পৌঁছালে তার দায়ভার কে বহন করবে? কোনো এক্সচেঞ্জ সুবিধা থাকবে কি?")

        if claims.urgency_or_pressure and claims.urgency_evidence:
            payment_considerations.append(
                PaymentWarning(
                    type=PaymentWarningType.IMMEDIATE_URGENCY_PRESSURE.value,
                    severity="warning",
                    supporting_evidence=claims.urgency_evidence,
                    explanation=(
                        f"The advertisement uses urgency pressure ('{claims.urgency_or_pressure}'). "
                        "Artificial time limits are commonly employed to rush purchasing decisions."
                    ),
                    suggested_buyer_action="তাড়াহুড়ো করবেন না। সিদ্ধান্ত নেওয়ার জন্য পর্যাপ্ত সময় নিন।",
                )
            )

        # Standard safety check: Open-box inspection & condition
        buyer_questions.append("পণ্যটি কি সম্পূর্ণ নতুন ও ইনট্যাক্ট বক্স, নাকি ডিসপ্লে/রিফার্বিশড ইউনিট?")
        buyer_questions.append("কুরিয়ার থেকে পার্সেল গ্রহণের সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?")

        # 6. Build Standardized Unified Findings
        findings: List[UnifiedFinding] = []

        # Price finding
        if claims.price is not None:
            findings.append(
                UnifiedFinding(
                    claim_type="price",
                    field_label="Product Listed Price",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=claims.price,
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.price_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=f"Advertisement explicitly states product price as ৳{claims.price:,.2f} {claims.currency or 'BDT'}.",
                    severity="info",
                    limitations="Price observed in public advertisement; subject to seller confirmation during ordering.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="price",
                    field_label="Product Listed Price",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Product price is not stated in the advertisement text.",
                    severity="high",
                    limitations="Missing price requires direct inquiry before purchasing.",
                )
            )

        # Delivery charge finding
        if claims.delivery_conditions:
            findings.append(
                UnifiedFinding(
                    claim_type="delivery_charge",
                    field_label="Delivery Fee & Shipping",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=claims.delivery_conditions,
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.delivery_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=f"Delivery conditions stated: {claims.delivery_conditions}.",
                    severity="info",
                    limitations="Shipping commitments stated in ad.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="delivery_charge",
                    field_label="Delivery Fee & Shipping",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Delivery fee and transit duration are omitted from the advertisement.",
                    severity="medium",
                    limitations="Courier rates vary by location.",
                )
            )

        # COD finding
        if claims.cod_available is True:
            findings.append(
                UnifiedFinding(
                    claim_type="cod",
                    field_label="Cash on Delivery (COD)",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value="Available",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.cod_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Cash on Delivery is explicitly offered in the advertisement.",
                    severity="info",
                    limitations="Subject to seller confirmation in conversation.",
                )
            )
        elif claims.cod_available is False:
            findings.append(
                UnifiedFinding(
                    claim_type="cod",
                    field_label="Cash on Delivery (COD)",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value="Unavailable",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.cod_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Cash on Delivery is explicitly unavailable according to the advertisement.",
                    severity="medium",
                    limitations="Advance payment required.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="cod",
                    field_label="Cash on Delivery (COD)",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Cash on Delivery terms are not stated in the advertisement.",
                    severity="high",
                    limitations="Confirm payment mode before ordering.",
                )
            )

        # Advance payment finding
        if claims.advance_payment_required is True:
            adv_sev = "info" if claims.advance_payment_purpose == "DELIVERY_CHARGE" else ("warning" if claims.advance_payment_purpose == "FULL_PRODUCT_PAYMENT" else "caution")
            findings.append(
                UnifiedFinding(
                    claim_type="advance_payment",
                    field_label="Advance Payment Requirement",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=claims.advance_payment_amount if claims.advance_payment_amount is not None else "Required",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.advance_payment_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=(
                        f"Advance payment required: ৳{claims.advance_payment_amount:,.2f} ({claims.advance_payment_purpose or 'UNSPECIFIED'})"
                        if claims.advance_payment_amount is not None
                        else f"Advance payment is required ({claims.advance_payment_purpose or 'UNSPECIFIED'})."
                    ),
                    severity=adv_sev,
                    limitations=f"Advance payment stated for {claims.advance_payment_purpose or 'UNSPECIFIED'}; verify recipient credentials before transferring.",
                )
            )
        elif claims.advance_payment_required is False:
            findings.append(
                UnifiedFinding(
                    claim_type="advance_payment",
                    field_label="Advance Payment Requirement",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=0.0,
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.advance_payment_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="The advertisement explicitly promises zero advance payment (no advance needed / free booking).",
                    severity="info",
                    limitations="Verify seller does not request advance payment later in private chat.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="advance_payment",
                    field_label="Advance Payment Requirement",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Advance payment requirements are not stated in the advertisement.",
                    severity="medium",
                    limitations="Inquire whether courier charge advance or full cash on delivery applies.",
                )
            )

        # Return policy finding
        if claims.return_policy_available is True:
            findings.append(
                UnifiedFinding(
                    claim_type="return_policy",
                    field_label="Return & Replacement Policy",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=claims.return_policy_terms or "Available",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.return_policy_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=f"Return/replacement policy promised: {claims.return_policy_terms or 'Yes'}.",
                    severity="info",
                    limitations="Verify return window and conditions before buying.",
                )
            )
        elif claims.return_policy_available is False:
            findings.append(
                UnifiedFinding(
                    claim_type="return_policy",
                    field_label="Return & Replacement Policy",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value="Denied (Final Sale)",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.return_policy_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="The advertisement explicitly denies returns or exchanges (final sale).",
                    severity="medium",
                    limitations="No post-delivery recourse for defective items.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="return_policy",
                    field_label="Return & Replacement Policy",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Return and replacement terms are not stated in the advertisement.",
                    severity="high",
                    limitations="Unknown return policy is not proof of seller dishonesty, but carries buyer risk.",
                )
            )

        # Warranty finding
        if claims.warranty_available is True:
            dur = claims.warranty_terms or "Promised"
            is_ambiguous = not re.search(r"\d+", dur)
            findings.append(
                UnifiedFinding(
                    claim_type="warranty",
                    field_label="Warranty Coverage",
                    status=UnifiedFindingStatus.AMBIGUOUS if is_ambiguous else UnifiedFindingStatus.STATED_CLAIM,
                    observed_value=dur,
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.warranty_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=f"Warranty stated: {dur}." + (" (Specific duration omitted)." if is_ambiguous else ""),
                    severity="low",
                    limitations="Confirm official vs shop warranty card.",
                )
            )
        elif claims.warranty_available is False:
            findings.append(
                UnifiedFinding(
                    claim_type="warranty",
                    field_label="Warranty Coverage",
                    status=UnifiedFindingStatus.STATED_CLAIM,
                    observed_value="No Warranty",
                    source_type=SourceType.USER_INPUT,
                    evidence_quote=claims.warranty_evidence,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Advertisement explicitly states no warranty is provided.",
                    severity="info",
                    limitations="As-is purchase.",
                )
            )
        else:
            findings.append(
                UnifiedFinding(
                    claim_type="warranty",
                    field_label="Warranty Coverage",
                    status=UnifiedFindingStatus.MISSING_INFORMATION,
                    observed_value=None,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation="Warranty terms are not stated in the advertisement.",
                    severity="medium",
                    limitations="Electronic and mechanical goods warrant explicit verification.",
                )
            )

        # Ambiguous statements findings
        for idx, amb in enumerate(ambiguous_statements):
            findings.append(
                UnifiedFinding(
                    claim_type=f"ambiguous_term_{idx+1}",
                    field_label="Promotional Claim Clarity",
                    status=UnifiedFindingStatus.AMBIGUOUS,
                    observed_value=amb,
                    source_type=SourceType.USER_INPUT,
                    retrieval_date=now_iso,
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    explanation=f"Ambiguous or unverified marketing claim: {amb}",
                    severity="low",
                    limitations="Promotional buzzwords do not guarantee authentic product provenance.",
                )
            )

        # Deduplicate buyer questions preserving priority
        seen_q = set()
        deduped_questions: List[str] = []
        for q in buyer_questions:
            if q not in seen_q:
                seen_q.add(q)
                deduped_questions.append(q)

        # Determine overall assessment and summary
        overall_assessment, assessment_summary = determine_overall_assessment_ad(
            ad_text=ad_text,
            claims=claims,
            payment_considerations=payment_considerations,
            missing_critical_info=missing_critical_info,
            ambiguous_statements=ambiguous_statements,
        )

        # Evaluate product authenticity
        product_authenticity = evaluate_product_authenticity(
            text=ad_text,
            product_name=claims.product_name,
        )

        # Generate English buyer questions
        questions_en = map_bangla_questions_to_english(deduped_questions)

        elapsed_ms = (time.time() - start_time) * 1000.0
        model_str = getattr(self.extractor, "model_name", None)
        if model_str is not None:
            model_str = str(model_str)

        metadata = AnalysisMetadata(
            model_used=model_str,
            ad_char_count=len(ad_text),
            chat_char_count=0,
            execution_time_ms=round(elapsed_ms, 2),
        )

        return AdAnalysisResponse(
            status="success",
            overall_assessment=overall_assessment,
            assessment_summary=assessment_summary,
            product_authenticity=product_authenticity,
            advertisement_claims=claims,
            findings=findings,
            explicit_terms=explicit_terms,
            missing_critical_info=missing_critical_info,
            ambiguous_statements=ambiguous_statements,
            payment_considerations=payment_considerations,
            buyer_questions_bangla=deduped_questions,
            buyer_questions_en=questions_en,
            source_coverage="ADVERTISEMENT_ONLY",
            metadata=metadata,
        )
