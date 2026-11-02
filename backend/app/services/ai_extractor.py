"""Structured AI Extraction Service using the official google-genai SDK.

Extracts verifiable purchase commitments from advertisements and chat conversations
supporting Bangla, English, and Banglish. Validates that evidence quotations actually
occur in the source text. Unsupported or fabricated claims are strictly marked and
removed from downstream comparisons to avoid false contradictions.
"""

import json
import logging
import re
from typing import Optional, Any
from google import genai
from google.genai import types
from google.genai.errors import APIError
import httpx

from backend.app.config import settings
from backend.app.schemas.claims import ExtractedClaims, SingleClaim

logger = logging.getLogger(__name__)


class ConfigurationError(Exception):
    """Raised when the AI extraction service is missing required configuration."""
    pass


class AIProviderError(Exception):
    """Base exception for AI provider communication failures."""
    pass


class AIQuotaExhaustedError(AIProviderError):
    """Raised when the Gemini API rate limit or quota is exhausted."""
    pass


class AITimeoutError(AIProviderError):
    """Raised when the request to Gemini API times out."""
    pass


class AIResponseValidationError(AIProviderError):
    """Raised when the AI response does not match the expected schema."""
    pass


def normalize_whitespace(text: str) -> str:
    """Normalize string for robust substring matching across whitespace and quote variations."""
    if not text:
        return ""
    # Strip common quote variations and collapse whitespace
    cleaned = re.sub(r"[\"'\u201c\u201d\u2018\u2019]", "", text.lower())
    return " ".join(cleaned.split())


def verify_evidence_in_text(evidence: Optional[str], source_text: str) -> bool:
    """Verify that an extracted evidence quote is non-empty and actually occurs in the source text."""
    if not evidence or not evidence.strip():
        return False
    if not source_text or not source_text.strip():
        return False
    norm_evidence = normalize_whitespace(evidence)
    norm_source = normalize_whitespace(source_text)
    return norm_evidence in norm_source


EXTRACTION_PROMPT = """You are an objective purchase promise extraction assistant specialized in Bangladesh e-commerce and f-commerce.
Extract all explicit commitments and commercial terms from the provided text.
The text may be in English, Bengali (বাংলা), or Banglish (Bengali written in Latin script, e.g. 'dam koto', 'advance dite hobe', 'baki COD').

CRITICAL RULES:
1. Extract ONLY what is EXPLICITLY stated in the text.
2. NEVER invent, assume, or hallucinate missing information. If a field is not stated, leave it null/empty.
3. Every extracted claim MUST include an exact verbatim quote from the input text in the corresponding evidence field.
4. Normalize prices and amounts to numbers in Bangladeshi Taka (BDT).
5. For Cash on Delivery (COD):
   - cod_available: true if COD is explicitly offered.
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
        """Lazy-loaded or injected Google GenAI client configured with timeout."""
        if self._client is not None:
            return self._client
        if not self.api_key:
            raise ConfigurationError(
                "Gemini API key is not configured. Please set the GEMINI_API_KEY "
                "environment variable or configure it in your .env file."
            )
        # Timeout configured in milliseconds for google-genai HttpOptions
        timeout_ms = max(5000, settings.AI_REQUEST_TIMEOUT_SECONDS * 1000)
        http_options = types.HttpOptions(timeout=timeout_ms)
        self._client = genai.Client(
            api_key=self.api_key,
            http_options=http_options,
        )
        return self._client

    def validate_extracted_claims(self, claims: ExtractedClaims, source_text: str) -> ExtractedClaims:
        """Validate all evidence quotes against source text.

        Removes unsupported normalized values from downstream comparisons to prevent
        hallucinated claims from triggering false contradictions or misleading payment warnings.
        """
        # Definition: (claim_type, value_is_present_fn, evidence_attr, clear_fn)
        checks = [
            (
                "price",
                claims.price is not None,
                claims.price_evidence,
                lambda: (setattr(claims, "price", None), setattr(claims, "price_evidence", None)),
                f"{claims.price} {claims.currency or 'BDT'}",
            ),
            (
                "cod_available",
                claims.cod_available is not None,
                claims.cod_evidence,
                lambda: (setattr(claims, "cod_available", None), setattr(claims, "cod_evidence", None)),
                str(claims.cod_available),
            ),
            (
                "advance_payment",
                claims.advance_payment_required is not None or claims.advance_payment_amount is not None,
                claims.advance_payment_evidence,
                lambda: (
                    setattr(claims, "advance_payment_required", None),
                    setattr(claims, "advance_payment_amount", None),
                    setattr(claims, "advance_payment_purpose", None),
                    setattr(claims, "advance_payment_evidence", None),
                ),
                f"required={claims.advance_payment_required}, amount={claims.advance_payment_amount}",
            ),
            (
                "payment_methods",
                bool(claims.payment_methods),
                claims.payment_methods_evidence,
                lambda: (setattr(claims, "payment_methods", []), setattr(claims, "payment_methods_evidence", None)),
                ", ".join(claims.payment_methods),
            ),
            (
                "return_policy",
                claims.return_policy_available is not None or claims.return_policy_terms is not None,
                claims.return_policy_evidence,
                lambda: (
                    setattr(claims, "return_policy_available", None),
                    setattr(claims, "return_policy_terms", None),
                    setattr(claims, "return_policy_evidence", None),
                ),
                f"available={claims.return_policy_available}, terms={claims.return_policy_terms}",
            ),
            (
                "warranty_available",
                claims.warranty_available is not None or claims.warranty_terms is not None,
                claims.warranty_evidence,
                lambda: (
                    setattr(claims, "warranty_available", None),
                    setattr(claims, "warranty_terms", None),
                    setattr(claims, "warranty_evidence", None),
                ),
                f"available={claims.warranty_available}, terms={claims.warranty_terms}",
            ),
            (
                "delivery_conditions",
                claims.delivery_conditions is not None,
                claims.delivery_evidence,
                lambda: (setattr(claims, "delivery_conditions", None), setattr(claims, "delivery_evidence", None)),
                str(claims.delivery_conditions),
            ),
            (
                "urgency_or_pressure",
                claims.urgency_or_pressure is not None,
                claims.urgency_evidence,
                lambda: (setattr(claims, "urgency_or_pressure", None), setattr(claims, "urgency_evidence", None)),
                str(claims.urgency_or_pressure),
            ),
        ]

        for claim_type, is_present, evidence_val, clear_fn, normalized_repr in checks:
            if is_present:
                is_supported = verify_evidence_in_text(evidence_val, source_text)
                if not is_supported:
                    logger.warning(
                        "Unsupported evidence detected for claim '%s'. Evidence quote was missing or not found in source text. Discarding claim from active comparison.",
                        claim_type,
                    )
                    unsupported_claim = SingleClaim(
                        claim_type=claim_type,
                        normalized_value=normalized_repr,
                        original_evidence=evidence_val,
                        source_type=claims.source_type,
                        is_supported=False,
                    )
                    claims.claims_list.append(unsupported_claim)
                    claims.unsupported_claims.append(unsupported_claim)
                    # Clear value so it does not influence downstream comparison
                    clear_fn()

        # Also validate existing atomic claims in claims_list
        validated_list: list[SingleClaim] = []
        for c in claims.claims_list:
            if c.original_evidence:
                c.is_supported = verify_evidence_in_text(c.original_evidence, source_text)
            else:
                c.is_supported = False
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
            logger.error("Gemini API Error (status_code=%s)", getattr(e, "code", "unknown"))
            code = getattr(e, "code", None)
            if code == 429:
                raise AIQuotaExhaustedError("Gemini API quota or rate limit exceeded. Please try again later.") from e
            elif code in (408, 504):
                raise AITimeoutError("Gemini API request timed out. Please try again.") from e
            elif code in (401, 403):
                raise ConfigurationError("Gemini API authentication failed. Please check your GEMINI_API_KEY.") from e
            raise AIProviderError("AI service provider returned an error.") from e
        except httpx.TimeoutException as e:
            logger.error("AI provider HTTP client timeout: %s", str(e))
            raise AITimeoutError("AI extraction request timed out.") from e
        except Exception as e:
            logger.error("Unexpected error during AI call: %s", type(e).__name__)
            raise AIProviderError("AI service provider is currently unavailable. Please try again later.") from e

        if not response.text:
            raise AIResponseValidationError("AI provider returned an empty response.")

        try:
            data = json.loads(response.text)
            claims = ExtractedClaims(**data)
            claims.source_type = source_type
        except Exception as e:
            logger.error("Failed to parse AI response into schema: %s", type(e).__name__)
            raise AIResponseValidationError("Could not parse AI output into valid claims schema.") from e

        # Validate evidence against source text to prevent hallucinated quotes
        validated_claims = self.validate_extracted_claims(claims, text)
        return validated_claims
