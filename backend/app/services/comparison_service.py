"""Comparison Service for detecting contradictions and consistency between advertisement and seller chat.

Deterministic comparison for prices, amounts, explicit yes/no flags, with constrained
reasoning and NEEDS_REVIEW labels for ambiguous semantic claims.
Never confuses missing information with contradiction.
"""

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

        # Deterministic numeric comparison
        diff = abs(ad.price - chat.price)
        if diff > 1.0:
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

        # Both state a numerical advance amount
        if ad.advance_payment_amount is not None and chat.advance_payment_amount is not None:
            diff = abs(ad.advance_payment_amount - chat.advance_payment_amount)
            if diff > 10.0:
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

        if ad.advance_payment_required is None and chat.advance_payment_required is None:
            return ComparisonItem(
                field=field,
                field_label=label,
                status=ContradictionStatus.INSUFFICIENT_INFORMATION,
                ad_evidence=ad.advance_payment_evidence,
                chat_evidence=chat.advance_payment_evidence,
                explanation="Advance payment terms are not explicitly mentioned in either source.",
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

        # Free delivery contradiction
        if ("free delivery" in ad_text or "delivery free" in ad_text or "ফ্রি ডেলিভারি" in ad_text) and (
            "delivery charge" in chat_text or "ডেলিভারি চার্জ" in chat_text or "charge" in chat_text
        ):
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
