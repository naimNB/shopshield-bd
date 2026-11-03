"""Comparison Service for detecting contradictions and consistency between advertisement and seller chat.

Deterministic comparison for prices, amounts, explicit yes/no flags, with constrained
reasoning and NEEDS_REVIEW labels for ambiguous semantic claims or claims lacking verified evidence.
Never confuses missing information with contradiction, and never triggers CONTRADICTION
without verified supporting evidence from both sources.
"""

import re
from typing import List, Optional
from backend.app.schemas.claims import ExtractedClaims
from backend.app.schemas.comparison import ContradictionStatus, ComparisonItem


class ComparisonService:
    """Service to evaluate promises from advertisements against direct seller conversations."""

    def compare(self, ad_claims: ExtractedClaims, chat_claims: ExtractedClaims) -> List[ComparisonItem]:
        """Run all comparison checks and return structured comparison items."""
        items: List[ComparisonItem] = [
            self._compare_price(ad_claims, chat_claims),
            self._compare_cod(ad_claims, chat_claims),
            self._compare_advance_payment(ad_claims, chat_claims),
            self._compare_return_policy(ad_claims, chat_claims),
            self._compare_warranty(ad_claims, chat_claims),
            self._compare_delivery_conditions(ad_claims, chat_claims),
        ]
        return items

    def _compare_price(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare price promises."""
        label = "Product Price"
        field = "price"

        if ad.price is None or chat.price is None:
            explanation = "Price not stated in both sources. "
            if ad.price is not None:
                explanation += f"Advertisement stated ৳{ad.price:,.2f}, but price was not mentioned in chat."
            elif chat.price is not None:
                explanation += f"Seller chat quoted ৳{chat.price:,.2f}, but price was not mentioned in the advertisement."
            else:
                explanation += "Neither advertisement nor chat mentions a numerical price."

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.price_evidence,
                chat_evidence=chat.price_evidence,
                explanation=explanation,
                severity="info",
            )

        # Ensure supporting evidence is present before declaring a contradiction
        diff = abs(ad.price - chat.price)
        if diff > 1.0:
            if not ad.price_evidence or not chat.price_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.price_evidence,
                    chat_evidence=chat.price_evidence,
                    explanation=(
                        f"Price discrepancy detected (৳{ad.price:,.2f} vs ৳{chat.price:,.2f}), but one or both sources "
                        "lack a verified evidence quotation. Requires manual review."
                    ),
                    severity="medium",
                )

            # Check contextual conditions before flat contradiction
            ad_ev = (ad.price_evidence or "").lower()
            chat_ev = (chat.price_evidence or "").lower()

            # 1. Bundle vs Single Item Quantity Distinction
            ad_bundle = bool(re.search(r"(?:combo|pack|কম্বো|প্যাক|package|[২-৫2-5]\s*(?:টি|টা|pcs|pieces|tar|ta))", ad_ev))
            chat_single = bool(re.search(r"(?:১টি|১টা|1\s*(?:pc|piece)|single|প্রতি\s*পিস|per\s*piece)", chat_ev))
            if ad_bundle and chat_single:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.price_evidence,
                    chat_evidence=chat.price_evidence,
                    explanation=(
                        f"Unit quantity difference: Advertisement quoted a bundle/combo price (৳{ad.price:,.2f}), "
                        f"whereas seller in chat quoted a single unit price (৳{chat.price:,.2f}). Confirm intended package quantity."
                    ),
                    severity="medium",
                )

            # 2. Expired promotional offer / conditional discount
            chat_urg = (chat.urgency_evidence or "").lower()
            chat_expired = bool(
                re.search(r"(?:offer\s*(?:expired|shesh|bondho)|expired|অফার\s*শেষ|মেয়াদ\s*শেষ)", chat_ev)
                or re.search(r"(?:offer\s*(?:expired|shesh|bondho)|expired|অফার\s*শেষ|মেয়াদ\s*শেষ)", chat_urg)
            )
            if chat_expired:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.price_evidence,
                    chat_evidence=chat.price_evidence,
                    explanation=(
                        f"Conditional or expired promotional price: Seller in chat indicated promotional offer has expired. "
                        f"Advertised ৳{ad.price:,.2f} vs current quote ৳{chat.price:,.2f}."
                    ),
                    severity="medium",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.price_evidence,
                chat_evidence=chat.price_evidence,
                explanation=(
                    f"Price contradiction: Advertisement advertised ৳{ad.price:,.2f}, "
                    f"but seller in chat quoted ৳{chat.price:,.2f} (difference: ৳{diff:,.2f})."
                ),
                severity="high",
            )

        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.price_evidence,
            chat_evidence=chat.price_evidence,
            explanation=f"Price is consistent: Both sources agree on ৳{ad.price:,.2f}.",
            severity="info",
        )

    def _compare_cod(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare Cash on Delivery (COD) availability."""
        label = "Cash on Delivery (COD)"
        field = "cod_availability"

        if ad.cod_available is None or chat.cod_available is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.cod_evidence,
                chat_evidence=chat.cod_evidence,
                explanation="Cash on Delivery availability is not explicitly specified in both sources.",
                severity="info",
            )

        if ad.cod_available is True and chat.cod_available is False:
            if not ad.cod_evidence or not chat.cod_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.cod_evidence,
                    chat_evidence=chat.cod_evidence,
                    explanation="COD conflict indicated, but supporting evidence quotation is missing from one source. Requires review.",
                    severity="medium",
                )

            # Check location-conditional COD (inside Dhaka vs outside Dhaka)
            ad_ev = (ad.cod_evidence or "").lower()
            chat_ev = (chat.cod_evidence or "").lower()

            ad_inside_only = bool(re.search(r"(?:ঢাকার\s*ভেতর|inside\s*dhaka|dhakar\s*bhitore|dhakar\s*vetore)", ad_ev)) and not bool(re.search(r"(?:সারা\s*বাংলাদেশ|all\s*over\s*bd|nationwide|সারাদেশে)", ad_ev))
            chat_outside_denied = bool(re.search(r"(?:ঢাকার\s*বাইরে|outside\s*dhaka|dhakar\s*baire)", chat_ev))

            if ad_inside_only and chat_outside_denied:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.cod_evidence,
                    chat_evidence=chat.cod_evidence,
                    explanation=(
                        "Conditional regional COD policy: Advertisement restricted COD to inside Dhaka. "
                        "Seller in chat stated COD is unavailable outside Dhaka. Confirm buyer delivery destination."
                    ),
                    severity="info",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.cod_evidence,
                chat_evidence=chat.cod_evidence,
                explanation=(
                    "Cash on Delivery contradiction: The advertisement promised Cash on Delivery, "
                    "but the seller in chat explicitly refused COD or demanded 100% full advance payment."
                ),
                severity="high",
            )

        if ad.cod_available is False and chat.cod_available is True:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.NEEDS_REVIEW,
                ad_evidence=ad.cod_evidence,
                chat_evidence=chat.cod_evidence,
                explanation=(
                    "Advertisement indicated COD was not available, but the seller agreed to COD in chat. "
                    "Confirm the arrangement before proceeding."
                ),
                severity="low",
            )

        status_text = "available" if ad.cod_available else "not available"
        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.cod_evidence,
            chat_evidence=chat.cod_evidence,
            explanation=f"Cash on delivery status is consistent: Both sources indicate COD is {status_text}.",
            severity="info",
        )

    def _compare_advance_payment(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare advance payment conditions."""
        label = "Advance Payment Requirement"
        field = "advance_payment"

        # Check explicit zero-advance claim in ad vs advance required in chat
        if ad.advance_payment_required is False and chat.advance_payment_required is True:
            if not chat.advance_payment_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.advance_payment_evidence,
                    chat_evidence=chat.advance_payment_evidence,
                    explanation="Advance payment discrepancy suggested, but chat lacks verified supporting evidence.",
                    severity="medium",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation=(
                    "Advance payment contradiction: Advertisement promised zero advance payment "
                    "('no advance needed' / 'free booking'), but the seller in chat requires advance payment."
                ),
                severity="high",
            )

        # Check advance required in ad vs waived (zero-advance) in chat
        if ad.advance_payment_required is True and chat.advance_payment_required is False:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.NEEDS_REVIEW,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation=(
                    "Advertisement indicated advance payment was required, but seller in chat agreed to waive advance payment. "
                    "Confirm whether full cash on delivery is accepted."
                ),
                severity="low",
            )

        # Both state a numerical advance amount
        if ad.advance_payment_amount is not None and chat.advance_payment_amount is not None:
            diff = abs(ad.advance_payment_amount - chat.advance_payment_amount)
            if diff > 10.0:
                if not ad.advance_payment_evidence or not chat.advance_payment_evidence:
                    return ComparisonItem(
                        field=field,
                        field_label=label,
                        status=ContradictionStatus.NEEDS_REVIEW,
                        ad_evidence=ad.advance_payment_evidence,
                        chat_evidence=chat.advance_payment_evidence,
                        explanation="Advance amounts differ, but supporting evidence quotation is missing. Needs manual verification.",
                        severity="medium",
                    )

                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.CONTRADICTION,
                    ad_evidence=ad.advance_payment_evidence,
                    chat_evidence=chat.advance_payment_evidence,
                    explanation=(
                        f"Advance payment amount mismatch: Advertisement listed ৳{ad.advance_payment_amount:,.2f}, "
                        f"but seller in chat demanded ৳{chat.advance_payment_amount:,.2f}."
                    ),
                    severity="medium",
                )
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONSISTENT,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation=f"Advance payment requirement of ৳{ad.advance_payment_amount:,.2f} is consistent across both sources.",
                severity="info",
            )

        # If advance is requested in chat but ad didn't mention it
        if chat.advance_payment_required is True and ad.advance_payment_required is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation=(
                    "The advertisement did not mention advance payment terms. "
                    "The seller in chat requested an advance (evaluated under Payment Safety Findings)."
                ),
                severity="info",
            )

        # If advance was stated in ad but chat didn't mention it
        if ad.advance_payment_required is not None and chat.advance_payment_required is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation="The advertisement stated advance payment terms, but advance payment was not discussed in chat.",
                severity="info",
            )

        if ad.advance_payment_required is None or chat.advance_payment_required is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation="Advance payment terms are not explicitly mentioned in both sources.",
                severity="info",
            )

        if ad.advance_payment_required is False and chat.advance_payment_required is False:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONSISTENT,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation="Advance payment requirements are aligned: Both sources indicate zero advance payment is required.",
                severity="info",
            )

        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.advance_payment_evidence,
            chat_evidence=chat.advance_payment_evidence,
            explanation="Advance payment requirements are aligned.",
            severity="info",
        )

    def _compare_return_policy(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare return and refund terms."""
        label = "Return & Refund Policy"
        field = "return_policy"

        if ad.return_policy_available is None or chat.return_policy_available is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.return_policy_evidence,
                chat_evidence=chat.return_policy_evidence,
                explanation="Return policy details are not fully articulated in both sources.",
                severity="info",
            )

        if ad.return_policy_available is True and chat.return_policy_available is False:
            if not ad.return_policy_evidence or not chat.return_policy_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.return_policy_evidence,
                    chat_evidence=chat.return_policy_evidence,
                    explanation="Return terms conflict suggested, but supporting quotation is missing. Needs manual verification.",
                    severity="medium",
                )

            ad_ev = (ad.return_policy_evidence or "").lower()
            chat_ev = (chat.return_policy_evidence or "").lower()

            # Check replacement vs refund clarification
            ad_replacement = bool(re.search(r"(?:replacement|exchange|রিপ্লেসমেন্ট|পরিবর্তন|এক্সচেঞ্জ)", ad_ev))
            chat_no_cash_refund = bool(re.search(r"(?:no\s+refund|non-refundable|টাকা\s*ফেরত\s*হবে\s*না|রিফান্ড\s*নেই)", chat_ev))
            chat_allows_exchange = bool(re.search(r"(?:replacement|exchange|রিপ্লেসমেন্ট|এক্সচেঞ্জ|পরিবর্তন\s*পাবেন)", chat_ev))

            if ad_replacement and chat_no_cash_refund and chat_allows_exchange:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.CONSISTENT,
                    ad_evidence=ad.return_policy_evidence,
                    chat_evidence=chat.return_policy_evidence,
                    explanation=(
                        "Return policy terms are aligned: Both sources support replacement/exchange for defective items. "
                        "Seller clarified that cash refunds are not offered."
                    ),
                    severity="info",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.return_policy_evidence,
                chat_evidence=chat.return_policy_evidence,
                explanation=(
                    "Return policy contradiction: Advertisement claimed return or replacement is offered, "
                    "but seller in chat stated items cannot be returned ('no return' / 'বিক্রিত পণ্য ফেরত নয়')."
                ),
                severity="high",
            )

        if ad.return_policy_available is False and chat.return_policy_available is True:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.NEEDS_REVIEW,
                ad_evidence=ad.return_policy_evidence,
                chat_evidence=chat.return_policy_evidence,
                explanation=(
                    "The advertisement stated no returns, but seller in chat indicated returns might be accepted. "
                    "Confirm the exact return conditions in writing."
                ),
                severity="low",
            )

        # Both offer returns, check terms if available
        if ad.return_policy_terms and chat.return_policy_terms:
            if ad.return_policy_terms.strip().lower() != chat.return_policy_terms.strip().lower():
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.return_policy_evidence,
                    chat_evidence=chat.return_policy_evidence,
                    explanation=(
                        f"Return conditions require review: Advertisement mentions '{ad.return_policy_terms}', "
                        f"while chat mentions '{chat.return_policy_terms}'."
                    ),
                    severity="low",
                )

        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.return_policy_evidence,
            chat_evidence=chat.return_policy_evidence,
            explanation="Return and refund conditions are consistent between both sources.",
            severity="info",
        )

    def _compare_warranty(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare warranty terms."""
        label = "Warranty Promises"
        field = "warranty"

        if ad.warranty_available is None or chat.warranty_available is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.warranty_evidence,
                chat_evidence=chat.warranty_evidence,
                explanation="Warranty terms are not stated in both sources.",
                severity="info",
            )

        if ad.warranty_available is True and chat.warranty_available is False:
            if not ad.warranty_evidence or not chat.warranty_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.warranty_evidence,
                    chat_evidence=chat.warranty_evidence,
                    explanation="Warranty contradiction indicated, but supporting quote is missing from one source.",
                    severity="medium",
                )

            # Check service warranty vs official/replacement warranty distinction
            chat_ev_lower = (chat.warranty_evidence or "").lower()
            if "service" in chat_ev_lower or "সার্ভিস" in chat_ev_lower:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.warranty_evidence,
                    chat_evidence=chat.warranty_evidence,
                    explanation=(
                        "Warranty scope clarification needed: Advertisement advertised warranty coverage, "
                        "while seller in chat stated only service warranty is provided (no parts/replacement warranty)."
                    ),
                    severity="low",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.warranty_evidence,
                chat_evidence=chat.warranty_evidence,
                explanation=(
                    "Warranty contradiction: Advertisement advertised warranty protection, "
                    "but seller in chat stated there is no warranty provided."
                ),
                severity="high",
            )

        if ad.warranty_available is False and chat.warranty_available is True:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.NEEDS_REVIEW,
                ad_evidence=ad.warranty_evidence,
                chat_evidence=chat.warranty_evidence,
                explanation=(
                    "The advertisement indicated no warranty, but seller in chat agreed to provide warranty. "
                    "Confirm official warranty terms in writing."
                ),
                severity="low",
            )

        if ad.warranty_terms and chat.warranty_terms:
            norm_ad = ad.warranty_terms.strip().lower()
            norm_chat = chat.warranty_terms.strip().lower()
            if norm_ad != norm_chat and ("year" in norm_ad or "month" in norm_ad or "day" in norm_ad):
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.warranty_evidence,
                    chat_evidence=chat.warranty_evidence,
                    explanation=(
                        f"Warranty details differ: Advertisement promises '{ad.warranty_terms}', "
                        f"whereas seller chat specifies '{chat.warranty_terms}'."
                    ),
                    severity="medium",
                )

        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.warranty_evidence,
            chat_evidence=chat.warranty_evidence,
            explanation="Warranty coverage is aligned across both sources.",
            severity="info",
        )

    def _compare_delivery_conditions(self, ad: ExtractedClaims, chat: ExtractedClaims) -> ComparisonItem:
        """Compare delivery and inspection conditions."""
        label = "Delivery Conditions & Inspection"
        field = "delivery_conditions"

        ad_text = (ad.delivery_conditions or "").lower()
        chat_text = (chat.delivery_conditions or "").lower()
        ad_ev = (ad.delivery_evidence or "").lower()
        chat_ev = (chat.delivery_evidence or "").lower()

        # Check conditional free delivery (thresholds, minimum orders, conditions)
        threshold_pattern = r"(?:above|over|minimum|min|\+|বেশি|অর্ডার|শর্ত|condition|টাকার|যদি|[১-৯0-9]+\s*(?:পিস|টি|টা|হলে|টাকা))"
        has_conditional_free = bool(re.search(threshold_pattern, ad_text) or re.search(threshold_pattern, ad_ev))

        # Free delivery contradiction
        if ("free delivery" in ad_text or "delivery free" in ad_text or "ফ্রি ডেলিভারি" in ad_text or "ফ্রি" in ad_ev) and (
            "delivery charge" in chat_text or "ডেলিভারি চার্জ" in chat_text or "charge" in chat_text or "চার্জ" in chat_ev
        ):
            if has_conditional_free:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.delivery_evidence,
                    chat_evidence=chat.delivery_evidence,
                    explanation=(
                        "Conditional free delivery detected in advertisement (e.g. minimum purchase amount, quantity threshold, or regional limit). "
                        "Seller in chat quoted a delivery fee; verify whether the order meets all required conditions."
                    ),
                    severity="low",
                )

            if not ad.delivery_evidence or not chat.delivery_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.delivery_evidence,
                    chat_evidence=chat.delivery_evidence,
                    explanation="Delivery fee conflict suspected, but verified supporting quote is missing.",
                    severity="low",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.delivery_evidence,
                chat_evidence=chat.delivery_evidence,
                explanation="Delivery fee contradiction: Advertisement offered free delivery, but seller chat requires delivery fees.",
                severity="medium",
            )

        # Open-box inspection check
        if ("open" in ad_text or "check" in ad_text or "খুলে" in ad_text) and (
            "cannot open" in chat_text or "no check" in chat_text or "খুলতে পারবেন না" in chat_text
        ):
            if not ad.delivery_evidence or not chat.delivery_evidence:
                return ComparisonItem(
                    field=field,
                    field_label=label,
                    status=ContradictionStatus.NEEDS_REVIEW,
                    ad_evidence=ad.delivery_evidence,
                    chat_evidence=chat.delivery_evidence,
                    explanation="Inspection conflict suspected, but verified supporting quote is missing.",
                    severity="medium",
                )

            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.CONTRADICTION,
                ad_evidence=ad.delivery_evidence,
                chat_evidence=chat.delivery_evidence,
                explanation="Inspection contradiction: Advertisement indicated inspection upon delivery, but seller in chat disallowed it.",
                severity="high",
            )

        if not ad.delivery_conditions or not chat.delivery_conditions:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.delivery_evidence,
                chat_evidence=chat.delivery_evidence,
                explanation="Detailed delivery conditions are not fully specified in both sources.",
                severity="info",
            )

        return ComparisonItem(
            field=field,
            field_label=label,
            status=ContradictionStatus.CONSISTENT,
            ad_evidence=ad.delivery_evidence,
            chat_evidence=chat.delivery_evidence,
            explanation="Delivery terms are consistent between both sources.",
            severity="info",
        )
