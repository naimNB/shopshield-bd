"""Facebook Page Transparency screenshot analysis service for ShopShield BD.

Safely processes user-uploaded Page Transparency screenshots using Google Gemini multimodal vision.
Extracts visible page names, creation dates, name change histories, manager countries,
and ad statuses strictly from visual evidence.
Never asserts that a user screenshot is verified against Facebook servers.
Identifies name changes as factual historical observations, not proof of fraud.
"""

from datetime import datetime, timezone
import json
import logging
import re
import time
from typing import List, Optional, Any, Tuple
from google import genai
from google.genai import types
from google.genai.errors import APIError
import httpx

from backend.app.config import settings
from backend.app.schemas.seller_history import (
    EvidenceFinding,
    PageManagerLocation,
    PageNameChange,
    PageTransparencyData,
    PageTransparencyResponse,
    SourceType,
    VerificationStatus,
)
from backend.app.services.screenshot_extractor import (
    ScreenshotExtractorService,
    ImageValidationError,
)
from backend.app.services.ai_extractor import (
    ConfigurationError,
    AIProviderError,
    AIQuotaExhaustedError,
    AITimeoutError,
    AIResponseValidationError,
    verify_evidence_in_text,
)

logger = logging.getLogger(__name__)

PAGE_TRANSPARENCY_PROMPT = """You are an objective, precise Facebook Page Transparency data extraction assistant specialized in Bangladesh commerce analysis.
You are given a screenshot of a Facebook Page Transparency panel, Page About section, or Page Details card.

Extract ONLY facts and text that are ACTUALLY VISIBLE in the screenshot into structured JSON conforming to the requested schema.

CRITICAL RULES:
1. Extract ONLY information that is EXPLICITLY and CLEARLY VISIBLE in the screenshot.
2. NEVER invent, extrapolate, assume, or hallucinate missing dates, names, or locations.
3. If a field is not visible in the screenshot (or is cropped/blurred), set its value to null (or empty list) and add its name to 'unreadable_or_missing_fields'.
4. Identify name changes as purely FACTUAL historical records. Do NOT make accusations of fraud.
5. In 'raw_extracted_text', provide a complete verbatim transcription of all visible text in the screenshot.
6. Every extracted field must be supported by an exact snippet in its corresponding evidence field that matches the raw extracted text.

Target Fields to Extract:
- page_name: The current visible name of the page.
- page_creation_date: The exact text stating when the page was created (e.g., "14 October 2026", "October 14, 2024", "2024-03-01").
- name_changes_count: Integer count of past name changes if stated. If none stated, 0.
- name_changes: List of past name changes, each with 'previous_name', 'change_date' (if visible), and 'evidence_text'.
- merge_history: Details of any merged pages, or null if none mentioned.
- manager_locations: List of manager countries, each with 'country', 'count' (optional int), and 'evidence_text'.
- is_running_ads: true if visible text says page is running ads, false if says not running ads, null if not visible.
- unreadable_or_missing_fields: List of standard fields not found in the image.
- raw_extracted_text: Complete text transcription of the screenshot.
"""


def calculate_page_age_months(creation_date_str: Optional[str]) -> Optional[int]:
    """Calculate approximate page age in months from creation date string if parseable."""
    if not creation_date_str:
        return None

    # Try common date formats
    clean_str = creation_date_str.strip()
    # Match 4-digit year and optional month
    year_match = re.search(r"\b(20\d\d|19\d\d)\b", clean_str)
    if not year_match:
        return None

    year = int(year_match.group(1))
    now = datetime.now(timezone.utc)
    current_year = now.year
    current_month = now.month

    # Check for month names
    months = {
        "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3, "march": 3,
        "apr": 4, "april": 4, "may": 5, "jun": 6, "june": 6, "jul": 7, "july": 7,
        "aug": 8, "august": 8, "sep": 9, "september": 9, "oct": 10, "october": 10,
        "nov": 11, "november": 11, "dec": 12, "december": 12
    }

    month = 1
    lower_str = clean_str.lower()
    for m_name, m_num in months.items():
        if re.search(r"\b" + m_name + r"\b", lower_str):
            month = m_num
            break

    total_months = (current_year - year) * 12 + (current_month - month)
    return max(0, total_months)


class PageTransparencyService:
    """Service for extracting and validating Facebook Page Transparency details from screenshots."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        client: Optional[Any] = None,
    ):
        self.api_key = api_key or settings.GEMINI_API_KEY
        self.model_name = model_name or settings.GEMINI_MODEL
        self._client = client
        self._extractor = ScreenshotExtractorService(api_key=self.api_key, model_name=self.model_name)

    @property
    def client(self) -> genai.Client:
        if self._client is not None:
            return self._client
        if not self.api_key:
            raise ConfigurationError(
                "Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable."
            )
        timeout_ms = max(5000, settings.AI_REQUEST_TIMEOUT_SECONDS * 1000)
        http_options = types.HttpOptions(timeout=timeout_ms)
        self._client = genai.Client(
            api_key=self.api_key,
            http_options=http_options,
        )
        return self._client

    def validate_and_sanitize_image(self, raw_bytes: bytes, declared_content_type: Optional[str] = None) -> Tuple[bytes, int, int]:
        """Delegate image validation and metadata stripping to existing ScreenshotExtractorService."""
        return self._extractor.validate_and_sanitize_image(
            raw_bytes, declared_content_type=declared_content_type
        )

    def extract_page_transparency(
        self,
        raw_bytes: bytes,
        declared_content_type: Optional[str] = None,
    ) -> PageTransparencyResponse:
        """Process screenshot in memory, run Gemini multimodal extraction, and return structured findings."""
        sanitized_bytes, width, height = self.validate_and_sanitize_image(
            raw_bytes, declared_content_type=declared_content_type
        )

        image_part = types.Part.from_bytes(data=sanitized_bytes, mime_type="image/png")
        prompt = (
            f"{PAGE_TRANSPARENCY_PROMPT}\n\n"
            f"Analyze this Page Transparency screenshot and extract all visible fields strictly conforming to schema:"
        )

        client = self.client
        models_to_try = [self.model_name]
        fallback_model = "gemini-3.5-flash-lite" if self.model_name != "gemini-3.5-flash-lite" else "gemini-3.5-flash"
        if fallback_model not in models_to_try:
            models_to_try.append(fallback_model)

        response = None
        last_error = None
        used_model = self.model_name

        for model in models_to_try:
            used_model = model
            for attempt in range(2):
                try:
                    response = client.models.generate_content(
                        model=model,
                        contents=[
                            image_part,
                            prompt,
                        ],
                        config=types.GenerateContentConfig(
                            response_mime_type="application/json",
                            response_schema=PageTransparencyData,
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
                        break
                    elif code in (408, 504):
                        raise AITimeoutError("Gemini Page Transparency request timed out.") from e
                    elif code in (401, 403):
                        raise ConfigurationError("Gemini API authentication failed. Please check GEMINI_API_KEY.") from e
                    elif code == 503:
                        last_error = e
                        if attempt == 0:
                            time.sleep(1.5)
                            continue
                        break
                    raise AIProviderError("AI service provider returned an error.") from e
                except httpx.TimeoutException as e:
                    logger.error("AI provider HTTP timeout: %s", str(e))
                    raise AITimeoutError("Page Transparency AI extraction request timed out.") from e
                except Exception as e:
                    logger.error("Unexpected error during Page Transparency extraction: %s", type(e).__name__)
                    raise AIProviderError("AI service provider is currently unavailable. Please try again later.") from e
            if response and response.text:
                break

        if not response or not response.text:
            if last_error:
                code = getattr(last_error, "code", None)
                if code == 429:
                    raise AIQuotaExhaustedError("Gemini API quota exceeded. Please try again later.") from last_error
                raise AIProviderError("AI service provider returned an error.") from last_error
            raise AIResponseValidationError("AI provider returned an empty Page Transparency response.")

        try:
            data = json.loads(response.text)
            transparency_data = PageTransparencyData(**data)
        except Exception as e:
            logger.error("Failed to parse Page Transparency AI response: %s", type(e).__name__)
            raise AIResponseValidationError("Could not parse AI output into valid Page Transparency schema.") from e

        # Validate extracted claims against raw transcribed text to reject hallucinated dates/names
        transparency_data = self.validate_transparency_evidence(transparency_data)

        # Build standardized evidence findings
        findings, buyer_questions = self.build_findings_and_questions(transparency_data)

        return PageTransparencyResponse(
            status="success",
            transparency_data=transparency_data,
            findings=findings,
            buyer_questions=buyer_questions,
            model_used=used_model,
        )

    def validate_transparency_evidence(self, data: PageTransparencyData) -> PageTransparencyData:
        """Validate extracted fields against raw_extracted_text to prevent fabricated dates or names."""
        raw_text = data.raw_extracted_text or ""
        unreadable = list(data.unreadable_or_missing_fields)

        # Validate page_name
        if data.page_name:
            if not verify_evidence_in_text(data.page_name, raw_text):
                logger.warning("Extracted page_name '%s' not found in raw_extracted_text.", data.page_name)
                if "page_name" not in unreadable:
                    unreadable.append("page_name")

        # Validate creation_date
        if data.page_creation_date:
            if not verify_evidence_in_text(data.page_creation_date, raw_text):
                logger.warning("Extracted creation_date '%s' not found in raw_extracted_text.", data.page_creation_date)
                data.page_creation_date = None
                if "page_creation_date" not in unreadable:
                    unreadable.append("page_creation_date")
            else:
                data.page_age_months = calculate_page_age_months(data.page_creation_date)
        else:
            if "page_creation_date" not in unreadable:
                unreadable.append("page_creation_date")

        # Validate name_changes
        valid_changes: List[PageNameChange] = []
        for nc in data.name_changes:
            if nc.previous_name and verify_evidence_in_text(nc.previous_name, raw_text):
                valid_changes.append(nc)
            else:
                logger.warning("Extracted name change '%s' not supported by raw image text.", nc.previous_name)
        data.name_changes = valid_changes
        data.name_changes_count = len(valid_changes)

        # Validate manager_locations
        valid_locations: List[PageManagerLocation] = []
        for loc in data.manager_locations:
            if loc.country and verify_evidence_in_text(loc.country, raw_text):
                valid_locations.append(loc)
            else:
                logger.warning("Extracted manager country '%s' not found in raw text.", loc.country)
        data.manager_locations = valid_locations

        data.unreadable_or_missing_fields = sorted(list(set(unreadable)))
        return data

    def build_findings_and_questions(
        self, data: PageTransparencyData
    ) -> Tuple[List[EvidenceFinding], List[str]]:
        """Construct structured EvidenceFinding objects and tailored Bangla buyer questions."""
        findings: List[EvidenceFinding] = []
        buyer_questions: List[str] = []
        now_iso = datetime.now(timezone.utc).isoformat()
        disclaimer_note = (
            "Extracted from user-submitted screenshot. Not independently verified with Meta servers. "
            "Screenshots can be edited or outdated. Historical observations do not imply fraud."
        )

        # 1. Page Name Finding
        if data.page_name:
            findings.append(
                EvidenceFinding(
                    field_name="page_name",
                    field_label="Visible Page Name",
                    observed_value=data.page_name,
                    source_type=SourceType.USER_SCREENSHOT,
                    observation_date=None,
                    retrieval_date=now_iso,
                    evidence_text=f"Displayed name: {data.page_name}",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=disclaimer_note,
                )
            )

        # 2. Page Creation Date Finding
        if data.page_creation_date:
            age_desc = f" (~{data.page_age_months} months ago)" if data.page_age_months is not None else ""
            findings.append(
                EvidenceFinding(
                    field_name="page_creation_date",
                    field_label="Page Creation Date",
                    observed_value=f"{data.page_creation_date}{age_desc}",
                    source_type=SourceType.USER_SCREENSHOT,
                    observation_date=data.page_creation_date,
                    retrieval_date=now_iso,
                    evidence_text=f"Visible creation date: {data.page_creation_date}",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=disclaimer_note,
                )
            )

            # Generate age-related buyer questions
            if data.page_age_months is not None and data.page_age_months < 6:
                buyer_questions.append(
                    f"পেজটি অতি সম্প্রতি ({data.page_creation_date}) তৈরি করা হয়েছে। "
                    "কোনো অনির্দিষ্ট বিকাশ/নগদ নম্বরে অগ্রিম সম্পূর্ণ টাকা না দিয়ে কুরিয়ার ডেলিভারিতে পণ্য দেখে মূল্য পরিশোধের সুবিধা নিন।"
                )
            elif data.page_age_months is not None and data.page_age_months < 12:
                buyer_questions.append(
                    f"পেজটির বয়স প্রায় {data.page_age_months} মাস। পূর্বে কেনাকাটা করা কোনো কাস্টমারের রিভিউ বা ডেলিভারি স্লিপ দেখতে চেয়েছেন কি?"
                )
        else:
            findings.append(
                EvidenceFinding(
                    field_name="page_creation_date",
                    field_label="Page Creation Date",
                    observed_value="NOT_VISIBLE_IN_SCREENSHOT",
                    source_type=SourceType.USER_SCREENSHOT,
                    retrieval_date=now_iso,
                    evidence_text="Creation date was blurred, cropped, or not included in the uploaded screenshot",
                    verification_status=VerificationStatus.UNAVAILABLE,
                    limitations="Missing from image. Check Facebook Page Transparency panel directly.",
                )
            )
            buyer_questions.append(
                "আপলোড করা স্ক্রিনশটে পেজ তৈরির তারিখ দেখা যাচ্ছে না। পেজের About > Page Transparency সেকশনটি সরাসরি যাচাই করুন।"
            )

        # 3. Name Changes Finding
        if data.name_changes_count > 0:
            names_summary = ", ".join([f"'{nc.previous_name}'" for nc in data.name_changes])
            findings.append(
                EvidenceFinding(
                    field_name="page_name_changes",
                    field_label="Page Name Change History",
                    observed_value=f"{data.name_changes_count} previous name(s): {names_summary}",
                    source_type=SourceType.USER_SCREENSHOT,
                    retrieval_date=now_iso,
                    evidence_text=f"Recorded {data.name_changes_count} name change(s): {names_summary}",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=(
                        "Name changes are factual historical records. Businesses legitimately rebrand, "
                        "merge, or pivot. This observation does not constitute proof of fraud."
                    ),
                )
            )
            buyer_questions.append(
                f"পেজটির নাম পূর্বে পরিবর্তিত হয়েছে ({names_summary})। "
                "শপটি কি পূর্বে অন্য পণ্যের পেজ ছিল নাকি কেবল রিব্র্যান্ডিং করা হয়েছে, তা নিশ্চিত করুন।"
            )
        else:
            findings.append(
                EvidenceFinding(
                    field_name="page_name_changes",
                    field_label="Page Name Change History",
                    observed_value="NO_NAME_CHANGES_RECORDED",
                    source_type=SourceType.USER_SCREENSHOT,
                    retrieval_date=now_iso,
                    evidence_text="Screenshot indicates no recorded name changes or 0 changes",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=disclaimer_note,
                )
            )

        # 4. Manager Locations Finding
        if data.manager_locations:
            locs_str = ", ".join([
                f"{loc.country}" + (f" ({loc.count})" if loc.count else "")
                for loc in data.manager_locations
            ])
            findings.append(
                EvidenceFinding(
                    field_name="manager_locations",
                    field_label="Page Manager Primary Countries",
                    observed_value=locs_str,
                    source_type=SourceType.USER_SCREENSHOT,
                    retrieval_date=now_iso,
                    evidence_text=f"Reported management locations: {locs_str}",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=disclaimer_note,
                )
            )

            # Check if offshore
            non_bd = [loc for loc in data.manager_locations if loc.country.lower() not in ("bangladesh", "bd")]
            if non_bd:
                offshore_names = ", ".join([loc.country for loc in non_bd])
                buyer_questions.append(
                    f"পেজের অ্যাডমিন/ম্যানেজার লোকেশনে বাংলাদেশের বাইরে ({offshore_names}) দেখা যাচ্ছে। "
                    "পণ্য সরাসরি বাংলাদেশ থেকে কুরিয়ার করা হবে নাকি ড্রপশিপিং, তা জেনে নিন।"
                )

        # 5. Active Ads Finding
        if data.is_running_ads is not None:
            ads_label = "Running active Meta advertisements" if data.is_running_ads else "Not currently running advertisements"
            findings.append(
                EvidenceFinding(
                    field_name="ad_campaign_status",
                    field_label="Meta Advertisement Status",
                    observed_value=ads_label,
                    source_type=SourceType.USER_SCREENSHOT,
                    retrieval_date=now_iso,
                    evidence_text=f"Reported ads status: {ads_label}",
                    verification_status=VerificationStatus.USER_PROVIDED_UNVERIFIED,
                    limitations=disclaimer_note,
                )
            )

        buyer_questions.append(
            "অনলাইন ক্রয়ের পূর্বে বিক্রেতার কোনো স্থায়ী দোকান বা রেজিস্টার্ড ট্রেড লাইসেন্স আছে কি না জেনে নিন।"
        )

        return findings, buyer_questions
