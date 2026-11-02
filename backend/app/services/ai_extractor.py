"""Structured AI Extraction Service using the official google-genai SDK.

Extracts verifiable purchase commitments from advertisements and chat conversations
supporting Bangla, English, and Banglish. Validates that evidence quotations actually
occur in the source text.
"""

import json
import logging
import re
from typing import Optional, Any
from google import genai
from google.genai import types
from google.genai.errors import APIError

from backend.app.config import settings
from backend.app.schemas.claims import ExtractedClaims, SingleClaim

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when the AI extraction service is missing required configuration."""
    pass


class AIProviderError(Exception):
    """Raised when the AI provider fails, times out, or returns an error."""
    pass


class AIResponseValidationError(Exception):
    """Raised when the AI response does not match the expected schema."""
    pass


def normalize_whitespace(text: str) -> str:
    """Normalize string for robust substring matching across whitespace variations."""
    if not text:
        return ""
    # Strip common punctuation that might vary slightly, lowercase, collapse spaces
    cleaned = re.sub(r"[\"'\u201c\u201d\u2018\u2019]", "", text.lower())
    return " ".join(cleaned.split())


def verify_evidence_in_text(evidence: Optional[str], source_text: str) -> bool:
    """Verify that an extracted evidence quote actually occurs in the source text."""
    if not evidence or not evidence.strip():
        return True
    norm_evidence = normalize_whitespace(evidence)
    norm_source = normalize_whitespace(source_text)
    return norm_evidence in norm_source


EXTRACTION_PROMPT = """You are an objective purchase promise extraction assistant specialized in Bangladesh e-commerce and f-commerce.
Extract all explicit commitments and commercial terms from the provided text.
The text may be in English, Bengali (বাংলা), or Banglish (Bengali written in Latin script, e.g. 'dam koto', 'advance dite hobe', 'baki COD').

CRITICAL RULES:
1. Extract ONLY what is EXPLICITLY stated in the text.
2. NEVER invent, assume, or hallucinate missing information. If a field is not stated, leave it null/empty.
3. Every extracted claim MUST include an exact quote from the input text in the corresponding evidence field.
4. Normalize prices and amounts to numbers in Bangladeshi Taka (BDT).
5. For Cash on Delivery (COD):
   - cod_available: true if COD is offered.
   - cod_available: false if COD is explicitly denied or seller insists on full advance.
   - cod_available: null if COD is not discussed.
6. For Advance Payment:
   - advance_payment_required: true if any advance payment is required.
   - advance_payment_amount: numerical amount if specified (e.g. 150).
   - advance_payment_purpose: e.g. "delivery_charge", "booking", "full_price".
7. For Return/Replacement:
   - return_policy_available: true if return/replacement is offered.
   - return_policy_available: false if explicitly "no return" or "ফেরত নেই".
   - return_policy_terms: description of the terms if provided.
8. For Warranty:
   - warranty_available: true if warranty offered, false if explicitly "no warranty".
   - warranty_terms: duration and conditions if stated.
9. For Urgency/Pressure:
   - Note any statements pressuring the buyer to pay immediately or claiming limited validity.
10. This is NOT a scam classifier. Remain completely objective and factual.
"""


class AIExtractorService:
    """Service for extracting structured purchase claims using Gemini."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client

    @property
    def client(self) -> genai.Client:
        """Lazy-loaded or injected Google GenAI client."""
        if self._client is not None:
            return self._client
        if not self.api_key:
            raise ConfigurationError(
                "Gemini API key is not configured. Please set the GEMINI_API_KEY "
                "environment variable or configure it in your .env file."
            )
        self._client = genai.Client(api_key=self.api_key)
        return self._client

    def validate_extracted_claims(self, claims: ExtractedClaims, source_text: str) -> ExtractedClaims:
        """Validate all evidence quotes against the source text to prevent hallucinations."""
        evidence_fields = [
            ("price_evidence", "price"),
            ("cod_evidence", "cod_available"),
            ("advance_payment_evidence", "advance_payment_required"),
            ("payment_methods_evidence", "payment_methods"),
            ("return_policy_evidence", "return_policy_available"),
            ("warranty_evidence", "warranty_available"),
            ("delivery_evidence", "delivery_conditions"),
            ("urgency_evidence", "urgency_or_pressure"),
        ]

        # Check each evidence field
        for ev_attr, val_attr in evidence_fields:
            quote = getattr(claims, ev_attr, None)
            if quote and not verify_evidence_in_text(quote, source_text):
                logger.warning(
                    "Hallucinated or unsupported evidence detected for %s: '%s'. Marking unsupported.",
                    ev_attr,
                    quote,
                )
                # Mark as unsupported by nullifying the invalid quote and recording an unsupported claim
                claims.claims_list.append(
                    SingleClaim(
                        claim_type=val_attr,
                        normalized_value=str(getattr(claims, val_attr, "")),
                        original_evidence=quote,
                        source_type=claims.source_type,
                        is_supported=False,
                    )
                )
                setattr(claims, ev_attr, None)

        # Validate individual atomic claims in claims_list
        validated_list: list[SingleClaim] = []
        for c in claims.claims_list:
            if c.original_evidence:
                supported = verify_evidence_in_text(c.original_evidence, source_text)
                c.is_supported = supported
            validated_list.append(c)

        claims.claims_list = validated_list
        return claims

    def extract_claims(self, text: str, source_type: str = "advertisement") -> ExtractedClaims:
        """Extract structured claims from input text using Gemini."""
        if not text or not text.strip():
            return ExtractedClaims(source_type=source_type)

        prompt = (
            f"{EXTRACTION_PROMPT}\n\n"
            f"SOURCE TYPE: {source_type}\n"
            f"INPUT TEXT:\n\"\"\"\n{text}\n\"\"\"\n\n"
            f"Extract all claims and return the structured JSON conforming to the schema."
        )

        try:
            client = self.client
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=ExtractedClaims,
                    temperature=0.0,
                ),
            )
        except ConfigurationError:
            raise
        except APIError as e:
            logger.error("Gemini API Error: %s", str(e))
            raise AIProviderError(f"Gemini API error occurred during extraction: {e.message}") from e
        except Exception as e:
            logger.error("Failed to call AI provider: %s", str(e))
            raise AIProviderError(f"AI provider communication failure: {str(e)}") from e

        if not response.text:
            raise AIResponseValidationError("AI provider returned an empty response.")

        try:
            data = json.loads(response.text)
            claims = ExtractedClaims(**data)
            claims.source_type = source_type
        except Exception as e:
            logger.error("Failed to parse AI response into schema: %s. Response was: %s", str(e), response.text)
            raise AIResponseValidationError(f"Could not parse AI output into valid claims schema: {str(e)}") from e

        # Validate evidence against source text to prevent hallucinated quotes
        validated_claims = self.validate_extracted_claims(claims, text)
        return validated_claims
