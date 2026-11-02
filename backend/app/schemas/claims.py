"""Schemas for structured purchase promise claims extracted from text."""

from enum import Enum
from typing import List, Optional, Any
from pydantic import BaseModel, Field


class ClaimType(str, Enum):
    """Categorization of individual purchase claims."""

    PRICE = "price"
    COD = "cod"
    ADVANCE_PAYMENT = "advance_payment"
    PAYMENT_METHOD = "payment_method"
    RETURN_POLICY = "return_policy"
    WARRANTY = "warranty"
    DELIVERY = "delivery"
    URGENCY = "urgency"
    OTHER = "other"


class SingleClaim(BaseModel):
    """Individual atomic claim extracted from the source."""

    claim_type: str = Field(..., description="Category of the claim (e.g. price, cod, warranty)")
    normalized_value: Optional[str] = Field(None, description="Standardized normalized value of the claim")
    original_evidence: Optional[str] = Field(None, description="Exact quotation from the source text")
    source_type: str = Field(..., description="Source origin: 'advertisement' or 'seller_chat'")
    is_supported: bool = Field(True, description="Whether the evidence quote was verified in the source text")


class ExtractedClaims(BaseModel):
    """Structured extraction of all purchase promises from a single source."""

    source_type: str = Field(..., description="'advertisement' or 'seller_chat'")
    product_name: Optional[str] = Field(None, description="Identified product name, if mentioned")
    
    # Pricing
    price: Optional[float] = Field(None, description="Numerical price in BDT")
    currency: Optional[str] = Field("BDT", description="Currency code (e.g. BDT, Tk)")
    price_evidence: Optional[str] = Field(None, description="Exact quotation for price")

    # Cash on Delivery
    cod_available: Optional[bool] = Field(None, description="True if COD offered, False if denied, None if unmentioned")
    cod_evidence: Optional[str] = Field(None, description="Exact quotation for COD status")

    # Advance Payment
    advance_payment_required: Optional[bool] = Field(None, description="True if advance payment required, False if explicitly not needed, None if unmentioned")
    advance_payment_amount: Optional[float] = Field(None, description="Advance amount requested in BDT")
    advance_payment_purpose: Optional[str] = Field(None, description="Purpose: e.g. 'delivery_charge', 'full_price', 'partial_booking'")
    advance_payment_evidence: Optional[str] = Field(None, description="Exact quotation for advance payment")

    # Payment Methods
    payment_methods: List[str] = Field(default_factory=list, description="Mentioned payment channels (bKash, Nagad, COD, etc.)")
    payment_methods_evidence: Optional[str] = Field(None, description="Exact quotation for payment methods")

    # Return & Refund
    return_policy_available: Optional[bool] = Field(None, description="True if return/replacement allowed, False if explicitly denied, None if unmentioned")
    return_policy_terms: Optional[str] = Field(None, description="Normalized return terms (e.g. '7 days replacement')")
    return_policy_evidence: Optional[str] = Field(None, description="Exact quotation for return policy")

    # Warranty
    warranty_available: Optional[bool] = Field(None, description="True if warranty promised, False if no warranty, None if unmentioned")
    warranty_terms: Optional[str] = Field(None, description="Warranty details (e.g. '1 year official brand warranty')")
    warranty_evidence: Optional[str] = Field(None, description="Exact quotation for warranty terms")

    # Delivery & Condition
    delivery_conditions: Optional[str] = Field(None, description="Delivery fee, duration, or open-box inspection condition")
    delivery_evidence: Optional[str] = Field(None, description="Exact quotation for delivery terms")

    # Urgency & Pressure
    urgency_or_pressure: Optional[str] = Field(None, description="High-pressure tactics or urgency cues")
    urgency_evidence: Optional[str] = Field(None, description="Exact quotation for urgency cues")

    # All granular claims
    claims_list: List[SingleClaim] = Field(default_factory=list, description="All granular atomic claims")
    unsupported_claims: List[SingleClaim] = Field(
        default_factory=list,
        description="Claims discarded or marked unsupported due to invalid or missing evidence",
    )
