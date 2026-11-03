"""Structured AI Extraction Service using the official google-genai SDK.

Extracts verifiable purchase commitments from advertisements and chat conversations
supporting Bangla, English, and Banglish. Validates that evidence quotations actually
occur in the source text. Unsupported or fabricated claims are strictly marked and
removed from downstream comparisons to avoid false contradictions.
"""

import json
import logging
import re
import time
from typing import Optional, Any
from google import genai
from google.genai import types
from google.genai.errors import APIError
import httpx

from backend.app.config import settings
from backend.app.core.errors import (
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
    AIResponseValidationError,
)
from backend.app.schemas.claims import ExtractedClaims, SingleClaim

logger = logging.getLogger(__name__)

__all__ = [
    "AIExtractorService",
    "ConfigurationError",
    "AIProviderError",
    "AIQuotaExhaustedError",
    "AITimeoutError",
    "AIResponseValidationError",
    "verify_evidence_in_text",
    "normalize_whitespace",
]


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

        client = self.client
        models_to_try = [self.model_name]
        fallback_model = "gemini-3.5-flash-lite" if self.model_name != "gemini-3.5-flash-lite" else "gemini-3.5-flash"
        if fallback_model not in models_to_try:
            models_to_try.append(fallback_model)

        response = None
        last_error = None

        for model in models_to_try:
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=ExtractedClaims,
                            temperature=0.0,
                        ),
                    )
                    if response and response.text:
                        break
                except ConfigurationError:
                    raise
                except APIError as e:
                    code = getattr(e, "code", None)
                    if code == 429:
                        last_error = e
                        if attempt == 0:
                            time.sleep(2.0)
                            continue
                        # If rate limit hit on this model, break to attempt fallback model
                        break
                    elif code in (408, 504):
                        raise AITimeoutError("Gemini API request timed out. Please try again.") from e
                    elif code in (401, 403):
                        raise ConfigurationError("Gemini API authentication failed. Please check your GEMINI_API_KEY.") from e
                    elif code == 503:
                        last_error = e
                        if attempt == 0:
                            time.sleep(1.5)
                            continue
                        # If second attempt on this model failed, break to try fallback model
                        break
                    raise AIProviderError("AI service provider returned an error.") from e
                except httpx.TimeoutException as e:
                    logger.error("AI provider HTTP client timeout: %s", str(e))
                    raise AITimeoutError("AI extraction request timed out.") from e
                except Exception as e:
                    logger.error("Unexpected error during AI call: %s", type(e).__name__)
                    raise AIProviderError("AI service provider is currently unavailable. Please try again later.") from e
            if response and response.text:
                break

        if not response or not response.text:
            if last_error:
                code = getattr(last_error, "code", None)
                if code == 429:
                    raise AIQuotaExhaustedError("Gemini API quota or rate limit exceeded. Please try again later.") from last_error
                raise AIProviderError("AI service provider returned an error.") from last_error
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

    def extract_claims_deterministic(self, text: str, source_type: str = "advertisement") -> ExtractedClaims:
        """Deterministic pattern-based claim extraction supporting Bangla, English, and Banglish."""
        if not text or not text.strip():
            return ExtractedClaims(source_type=source_type)

        claims = ExtractedClaims(source_type=source_type)

        # 1. Product title
        m_title = re.search(r"(?:product|item|title|পণ্য|আইটেম)\s*[:\-]\s*([^\n\r,]+)", text, re.IGNORECASE)
        if m_title:
            cand = m_title.group(1).strip()
            if 3 <= len(cand) <= 120:
                claims.product_name = cand
        else:
            lines = [l.strip() for l in text.splitlines() if l.strip()]
            for line in lines[:8]:
                if 5 <= len(line) <= 80 and not any(k in line.lower() for k in ("welcome", "home", "search", "menu", "cart", "login", "register", "store header", "special offer", "winter sale")):
                    if re.search(r"\b(shirt|t-shirt|shoes|watch|bag|backpack|wallet|phone|laptop|earbuds|headphone|hoodie|cream|oil|soap|shampoo|panjabi|saree|dress|speaker|cover|case|tv|smart watch|pro max)\b", line, re.IGNORECASE):
                        claims.product_name = line
                        break

        # 2. Price pattern (avoiding delivery charges, advance fees, discounts)
        BANGLA_DIGITS_MAP = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")
        clauses = re.split(r"(?<=\D)\.(?=\s|$)|[।\n\r;!?]+", text)
        for clause in clauses:
            clause_str = clause.strip()
            if not clause_str:
                continue
            is_delivery_or_adv_clause = bool(re.search(r"^(?:ডেলিভারি|delivery|কুরিয়ার|courier|অগ্রিম|advance|booking|বুকিং|চার্জ|charge|ফি|fee)", clause_str, re.IGNORECASE))
            
            m1 = re.search(r"(?:price|অফার\s*মূল্য|মূল্য|দাম|rate|দর|৳|bdt)(?:[^\d০-৯\n\r]{0,25})([0-9০-৯,]+(?:\.[0-9০-৯]{1,2})?)", clause_str, re.IGNORECASE)
            m2 = re.search(r"([0-9০-৯,]+(?:\.[0-9০-৯]{1,2})?)\s*(?:/-|tk|taka|টাকা|bdt)(?:\s|[.,।;!?]|$)", clause_str, re.IGNORECASE)
            
            cand = None
            if m1 and not is_delivery_or_adv_clause:
                cand = m1
            elif m2 and not is_delivery_or_adv_clause:
                pre_start = max(0, m2.start() - 25)
                context = clause_str[pre_start:m2.start()].lower()
                if not any(k in context for k in ("delivery", "ডেলিভারি", "charge", "চার্জ", "advance", "অগ্রিম", "booking", "বুকিং", "fee", "ফি")):
                    cand = m2
            if cand:
                raw_num = cand.group(1).translate(BANGLA_DIGITS_MAP).replace(",", "")
                try:
                    val = float(raw_num)
                    if 10.0 <= val <= 10_000_000.0:
                        claims.price = val
                        claims.price_evidence = cand.group(0).strip()
                        break
                except ValueError:
                    pass

        # 3. Cash on Delivery (COD) - Check denial phrases FIRST
        COD_DENIAL_REGEX = re.compile(
            r"(?:no\s+cod|no\s+cash\s+on\s+delivery|cash\s+on\s+delivery\s+(?:is\s+)?(?:not\s+available|unavailable|bondho\b|off\b)|cod\s+(?:is\s+)?(?:unavailable|bondho\b|off\b)|ক্যাশ\s*অন\s*ডেলিভারি[^\n\r।.;!?]{0,35}(?:নেই|না|নয়|নয়|বন্ধ|হবে\s*না)|(?:cash\s*on\s*delivery|cod)[^\n\r।.;!?]{0,35}(?:bondho|off|hobe\s*na|hobena)|ক্যাশ\s*অন\s*ডেলিভারি\s*দেওয়া\s*যাবে\s*না|কোনো\s*ক্যাশ\s*অন\s*ডেলিভারি\s*নেই)",
            re.IGNORECASE,
        )
        COD_POSITIVE_REGEX = re.compile(
            r"(?:cash\s+on\s+delivery\s+(?:is\s+)?available|cod\s+available|ক্যাশ\s*অন\s*ডেলিভারি[^\n\r।.;!?]{0,35}(?:হবে|আছে|পাবেন|সুবিধা|প্রযোজ্য)|পণ্য\s*হাতে\s*পেয়ে\s*মূল্য\s*পরিশোধ|ক্যাশ\s*অন\s*ডেলিভারিতে\s*নিতে\s*পারবেন|cod\s+te\s+diben|cod\s+paben|cod\s+hobe)",
            re.IGNORECASE,
        )

        m_no_cod = COD_DENIAL_REGEX.search(text)
        m_pos_cod = COD_POSITIVE_REGEX.search(text)

        if m_no_cod:
            claims.cod_available = False
            claims.cod_evidence = m_no_cod.group(0).strip()
        elif m_pos_cod:
            claims.cod_available = True
            claims.cod_evidence = m_pos_cod.group(0).strip()
        elif re.search(r"\b(cash on delivery|payment on delivery|pay cash|ক্যাশ অন ডেলিভারি)\b", text, re.IGNORECASE):
            m_gen = re.search(r"\b(cash on delivery|payment on delivery|pay cash|ক্যাশ অন ডেলিভারি)\b", text, re.IGNORECASE)
            start_pos = max(0, m_gen.start() - 25)
            context = text[start_pos:m_gen.start()].lower()
            if any(neg in context for neg in ("no ", "not ", "don't ", "dont ", "নেই", "না ")):
                claims.cod_available = False
            else:
                claims.cod_available = True
            claims.cod_evidence = m_gen.group(0).strip()

        # 4. Advance payment
        m_full_adv = re.search(r"(?:full\s+advance|shob\s*taka\s*advance|সব\s*টাকা\s*অগ্রিম|সম্পূর্ণ\s*(?:[^\n\r]{0,15})(?:টাকা|মূল্য|পেমেন্ট)\s*(?:আগে|অগ্রিম|বিকাশ)|full\s*payment\s*advance|100%\s*full\s*advance|shob\s*advance|সব\s*টাকা\s*বিকাশ)", text, re.IGNORECASE)
        m_adv_after = re.search(r"(?:advance|অগ্রিম|বুকিং)(?:[^\d০-৯\n\r]{0,25})([0-9০-৯,]{2,7})", text, re.IGNORECASE)
        m_adv_before = re.search(r"([0-9০-৯,]{2,7})\s*(?:/-|tk|taka|টাকা|bdt)?(?:[^\n\r]{0,25})(?:advance|অগ্রিম|booking|বুকিং)(?:\s|[.,।;!?]|$)", text, re.IGNORECASE)

        if m_full_adv:
            claims.advance_payment_required = True
            claims.advance_payment_purpose = "full_price"
            claims.advance_payment_evidence = m_full_adv.group(0).strip()
            # If explicit amount mentioned in full advance phrase
            m_amt_in_full = re.search(r"([0-9০-৯,]+)", m_full_adv.group(0))
            if m_amt_in_full:
                try:
                    claims.advance_payment_amount = float(m_amt_in_full.group(1).translate(BANGLA_DIGITS_MAP).replace(",", ""))
                except ValueError:
                    pass
            elif claims.price:
                claims.advance_payment_amount = claims.price
        elif m_adv_after or m_adv_before:
            m_target_adv = m_adv_after or m_adv_before
            raw = m_target_adv.group(1).translate(BANGLA_DIGITS_MAP).replace(",", "")
            try:
                amt = float(raw)
                claims.advance_payment_required = True
                claims.advance_payment_amount = amt
                claims.advance_payment_evidence = m_target_adv.group(0).strip()
                if amt <= 250.0:
                    claims.advance_payment_purpose = "delivery_charge"
                else:
                    claims.advance_payment_purpose = "booking"
            except ValueError:
                pass
        elif re.search(r"\b(advance payment|অগ্রিম পেমেন্ট|advance দিতে হবে|টাকা আগে বিকাশ)\b", text, re.IGNORECASE):
            m_gen_adv = re.search(r"\b(advance payment|অগ্রিম পেমেন্ট|advance দিতে হবে|টাকা আগে বিকাশ)\b", text, re.IGNORECASE)
            claims.advance_payment_required = True
            claims.advance_payment_evidence = m_gen_adv.group(0).strip()

        # 5. Return & Replacement policy
        RETURN_DENIAL_REGEX = re.compile(
            r"(?:no\s+returns?|non-refundable|no\s+refunds?|all\s+sales\s+(?:are\s+)?final|রিটার্ন[^\n\r।.;!?]{0,35}(?:প্রযোজ্য\s*[নন][য়য়]|হবে\s*না|নেই)|ফেরত[^\n\r।.;!?]{0,25}নেওয়া\s*হবে\s*না|বিক্রি\s*হয়ে\s*গেলে\s*কোনো\s*রিটার্ন|কোনো\s*রিটার্ন\s*বা\s*রিপ্লেসমেন্ট\s*হবে\s*না)",
            re.IGNORECASE,
        )
        RETURN_DAYS_REGEX = re.compile(
            r"\b([0-9০-৯]{1,2})\s*(?:days?|দিনের)\s*(?:easy\s+)?(?:return|refund|replacement|exchange|রিটার্ন|রিপ্লেসমেন্ট|এক্সচেঞ্জ|চেকিং|গ্যারান্টি|পরিবর্তনযোগ্য)\b",
            re.IGNORECASE,
        )
        m_no_ret = RETURN_DENIAL_REGEX.search(text)
        m_ret_days = RETURN_DAYS_REGEX.search(text)
        if m_no_ret:
            claims.return_policy_available = False
            claims.return_policy_evidence = m_no_ret.group(0).strip()
        elif m_ret_days:
            claims.return_policy_available = True
            days_str = m_ret_days.group(1).translate(BANGLA_DIGITS_MAP)
            claims.return_policy_terms = f"{days_str} days replacement/return"
            claims.return_policy_evidence = m_ret_days.group(0).strip()
        elif re.search(r"\b(return|replacement|রিটার্ন|রিপ্লেসমেন্ট|পরিবর্তনযোগ্য)\b", text, re.IGNORECASE):
            m_gen_ret = re.search(r"\b(return|replacement|রিটার্ন|রিপ্লেসমেন্ট|পরিবর্তনযোগ্য)\b", text, re.IGNORECASE)
            start_pos = max(0, m_gen_ret.start() - 25)
            context = text[start_pos:m_gen_ret.start()].lower()
            if any(neg in context for neg in ("no ", "not ", "নেই", "না ")):
                claims.return_policy_available = False
            else:
                claims.return_policy_available = True
                claims.return_policy_terms = "Return/replacement available"
            claims.return_policy_evidence = m_gen_ret.group(0).strip()

        # 6. Warranty
        WARRANTY_DENIAL_REGEX = re.compile(
            r"(?:no\s+warranty|ওয়ারেন্টি\s*নেই|কোনো\s*ওয়ারেন্টি\s*নেই|কখনোই\s*ওয়ারেন্টি\s*নেই)",
            re.IGNORECASE,
        )
        WARRANTY_TERMS_REGEX = re.compile(
            r"\b([0-9০-৯]{1,2})\s*(?:years?|months?|বছর|মাস|বছরের?|মাসের?)\s*(?:official\s+)?(?:brand\s+)?(?:service\s+)?warranty\b|\b([0-9০-৯]{1,2})\s*(?:বছরের|মাসের)\s*(?:সার্ভিস\s+)?ওয়ারেন্টি\b",
            re.IGNORECASE,
        )
        m_no_warr = WARRANTY_DENIAL_REGEX.search(text)
        m_warr_terms = WARRANTY_TERMS_REGEX.search(text)
        if m_no_warr:
            claims.warranty_available = False
            claims.warranty_evidence = m_no_warr.group(0).strip()
        elif m_warr_terms:
            claims.warranty_available = True
            claims.warranty_terms = m_warr_terms.group(0).strip()
            claims.warranty_evidence = m_warr_terms.group(0).strip()
        elif re.search(r"\b(official warranty|brand warranty|service warranty|ওয়ারেন্টি|গ্যারান্টি)\b", text, re.IGNORECASE):
            m_gen_warr = re.search(r"\b(official warranty|brand warranty|service warranty|ওয়ারেন্টি|গ্যারান্টি)\b", text, re.IGNORECASE)
            claims.warranty_available = True
            claims.warranty_terms = m_gen_warr.group(0).strip()
            claims.warranty_evidence = m_gen_warr.group(0).strip()

        # 7. Delivery conditions
        m_deliv = re.search(r"(?:free\s+delivery|ফ্রি\s*ডেলিভারি|delivery\s*(?:charge|fee)[^\n\r]{0,35}[0-9০-৯]{2,4}|ডেলিভারি\s*চার্জ[^\n\r]{0,35}[0-9০-৯]{2,4}|home\s+delivery|সারাদেশে\s*ডেলিভারি)", text, re.IGNORECASE)
        if m_deliv:
            claims.delivery_conditions = m_deliv.group(0).strip()
            claims.delivery_evidence = m_deliv.group(0).strip()

        # 8. Urgency & Pressure
        m_urg = re.search(r"(?:অফার\s*সীমিত\s*সময়ের\s*জন্য|limited\s+time\s+offer|hurry|দ্রুত\s*অর্ডার\s*করুন|stock\s+limited|অফার\s*শেষ\s*হয়ে\s*যাবে|order\s+fast)", text, re.IGNORECASE)
        if m_urg:
            claims.urgency_or_pressure = m_urg.group(0).strip()
            claims.urgency_evidence = m_urg.group(0).strip()

        # Populate claims_list with SingleClaim instances
        claims.claims_list = []
        if claims.product_name:
            claims.claims_list.append(SingleClaim(claim_type="product_name", normalized_value=claims.product_name, original_evidence=claims.product_name, source_type=source_type, is_supported=True))
        if claims.price is not None and claims.price_evidence:
            claims.claims_list.append(SingleClaim(claim_type="price", normalized_value=f"{claims.price} BDT", original_evidence=claims.price_evidence, source_type=source_type, is_supported=True))
        if claims.cod_available is not None and claims.cod_evidence:
            claims.claims_list.append(SingleClaim(claim_type="cod", normalized_value=str(claims.cod_available), original_evidence=claims.cod_evidence, source_type=source_type, is_supported=True))
        if claims.advance_payment_required is not None and claims.advance_payment_evidence:
            claims.claims_list.append(SingleClaim(claim_type="advance_payment", normalized_value=f"required={claims.advance_payment_required}, amount={claims.advance_payment_amount}", original_evidence=claims.advance_payment_evidence, source_type=source_type, is_supported=True))
        if claims.return_policy_available is not None and claims.return_policy_evidence:
            claims.claims_list.append(SingleClaim(claim_type="return_policy", normalized_value=f"available={claims.return_policy_available}, terms={claims.return_policy_terms}", original_evidence=claims.return_policy_evidence, source_type=source_type, is_supported=True))
        if claims.warranty_available is not None and claims.warranty_evidence:
            claims.claims_list.append(SingleClaim(claim_type="warranty", normalized_value=f"available={claims.warranty_available}, terms={claims.warranty_terms}", original_evidence=claims.warranty_evidence, source_type=source_type, is_supported=True))
        if claims.delivery_conditions and claims.delivery_evidence:
            claims.claims_list.append(SingleClaim(claim_type="delivery", normalized_value=claims.delivery_conditions, original_evidence=claims.delivery_evidence, source_type=source_type, is_supported=True))
        if claims.urgency_or_pressure and claims.urgency_evidence:
            claims.claims_list.append(SingleClaim(claim_type="urgency", normalized_value=claims.urgency_or_pressure, original_evidence=claims.urgency_evidence, source_type=source_type, is_supported=True))

        return self.validate_extracted_claims(claims, text)


class DeterministicExtractor(AIExtractorService):
    """Offline deterministic extractor subclassing AIExtractorService for benchmark reproducibility and offline testing."""

    def extract_claims(self, text: str, source_type: str = "advertisement") -> ExtractedClaims:
        return self.extract_claims_deterministic(text, source_type)


