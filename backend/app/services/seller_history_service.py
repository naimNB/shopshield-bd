"""Consolidated Seller History Intelligence service for ShopShield BD.

Integrates verifiable signals across Facebook Page Transparency screenshots and
Internet Archive Wayback Machine historical captures into an evidence-based report.
Separates independently retrieved web evidence from user-provided unverified evidence.
Never produces arbitrary fraud scores, scam percentages, or accusations.
"""

from datetime import datetime, timezone
import hashlib
import logging
from typing import List, Optional

from backend.app.core.errors import (
    SSRFValidationError,
    WaybackPayloadTooLargeError,
    WaybackRateLimitError,
    WaybackSourceUnavailableError,
    WaybackTimeoutError,
)
from backend.app.schemas.seller_history import (
    EvidenceFinding,
    PageTransparencyData,
    SellerHistoryReportResponse,
    SourceType,
    VerificationStatus,
)
from backend.app.services.page_transparency_service import PageTransparencyService
from backend.app.services.wayback_service import WaybackService

logger = logging.getLogger(__name__)


class SellerHistoryService:
    """Service orchestrating multi-source seller history verification."""

    def __init__(
        self,
        wayback_service: Optional[WaybackService] = None,
        transparency_service: Optional[PageTransparencyService] = None,
    ):
        self.wayback_service = wayback_service or WaybackService()
        self.transparency_service = transparency_service or PageTransparencyService()

    def generate_report(
        self,
        transparency_data: Optional[PageTransparencyData] = None,
        website_url: Optional[str] = None,
    ) -> SellerHistoryReportResponse:
        """Combine available seller evidence sources into a consolidated report."""
        independently_retrieved: List[EvidenceFinding] = []
        user_provided_screenshots: List[EvidenceFinding] = []
        unverified_or_unavailable: List[EvidenceFinding] = []
        buyer_questions: List[str] = []
        summary_points: List[str] = []
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Process Page Transparency Data if available
        if transparency_data:
            transparency_data = self.transparency_service.validate_transparency_evidence(transparency_data)
            findings, questions = self.transparency_service.build_findings_and_questions(transparency_data)
            for f in findings:
                if f.verification_status == VerificationStatus.INDEPENDENTLY_RETRIEVED:
                    independently_retrieved.append(f)
                elif f.verification_status == VerificationStatus.UNAVAILABLE:
                    unverified_or_unavailable.append(f)
                else:
                    user_provided_screenshots.append(f)
            buyer_questions.extend(questions)

            # Generate factual summary point
            if transparency_data.page_name:
                summary_points.append(f"Facebook Page: {transparency_data.page_name}")
            if transparency_data.page_creation_date:
                summary_points.append(f"Reported Created: {transparency_data.page_creation_date}")
            if transparency_data.name_changes_count > 0:
                summary_points.append(f"Recorded Name Changes: {transparency_data.name_changes_count}")

        # 2. Process Website Archive Data if URL provided
        if website_url and website_url.strip():
            clean_url = website_url.strip()
            domain_hash = hashlib.md5(clean_url.lower().encode("utf-8")).hexdigest()[:8]
            try:
                web_resp = self.wayback_service.fetch_website_history(clean_url)
                for f in web_resp.findings:
                    if f.verification_status == VerificationStatus.INDEPENDENTLY_RETRIEVED:
                        independently_retrieved.append(f)
                    elif f.verification_status == VerificationStatus.USER_PROVIDED_UNVERIFIED:
                        user_provided_screenshots.append(f)
                    else:
                        unverified_or_unavailable.append(f)
                buyer_questions.extend(web_resp.buyer_questions)

                if web_resp.website_data.archive_available and web_resp.website_data.earliest_snapshot:
                    summary_points.append(
                        f"Website First Archived: {web_resp.website_data.earliest_snapshot.formatted_date}"
                    )
                else:
                    summary_points.append("Website: No historical archive snapshots found")
            except WaybackRateLimitError:
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="RATE_LIMITED",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Internet Archive rate limit reached.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="Archive rate limit reached",
                        limitations="Internet Archive rate limit reached. Historical lookup temporarily throttled.",
                    )
                )
            except WaybackTimeoutError:
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="TIMEOUT",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Archive query connection timed out.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="Archive query timed out",
                        limitations="Internet Archive connection timed out while querying CDX index.",
                    )
                )
            except WaybackPayloadTooLargeError:
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="PAYLOAD_TOO_LARGE",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Archive index payload exceeded safe limit.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="Archive response too large",
                        limitations="Internet Archive CDX response exceeded the maximum safe limit of 1 MB.",
                    )
                )
            except SSRFValidationError:
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="INVALID_DESTINATION",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Destination address failed security verification.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="Restricted or invalid destination address",
                        limitations="The provided website address failed destination security validation.",
                    )
                )
            except WaybackSourceUnavailableError:
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="SOURCE_UNAVAILABLE",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Archive source service error or malformed response.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="Archive source unavailable",
                        limitations="Internet Archive service returned a server error or malformed response.",
                    )
                )
            except Exception as e:
                logger.warning("Could not fetch website history for '%s': %s", clean_url, type(e).__name__)
                unverified_or_unavailable.append(
                    EvidenceFinding(
                        finding_id=f"wb_presence_{domain_hash}",
                        field_name="website_archive_presence",
                        field_label="Website Archive Presence",
                        observed_value="SOURCE_UNAVAILABLE",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        retrieval_date=now_iso,
                        evidence_text="Failed to query external archive service.",
                        verification_status=VerificationStatus.UNAVAILABLE,
                        evidence_confidence="DATA_UNAVAILABLE",
                        review_reason="External archive query could not be completed",
                        limitations="Internet Archive service was temporarily unavailable.",
                    )
                )

        # 3. Add standard unverified markers if not provided
        if not transparency_data:
            unverified_or_unavailable.append(
                EvidenceFinding(
                    finding_id="page_transparency_unprovided",
                    field_name="page_transparency",
                    field_label="Facebook Page Transparency",
                    observed_value="NOT_PROVIDED",
                    source_type=SourceType.UNVERIFIED_INPUT,
                    retrieval_date=now_iso,
                    evidence_text="No Page Transparency screenshot was uploaded for this seller",
                    verification_status=VerificationStatus.UNAVAILABLE,
                    evidence_confidence="UNVERIFIED_INPUT",
                    review_reason=None,
                    limitations="Upload a screenshot of the Page Transparency card to analyze historical page records.",
                )
            )

        if not website_url:
            unverified_or_unavailable.append(
                EvidenceFinding(
                    finding_id="website_archive_unprovided",
                    field_name="website_archive",
                    field_label="E-Commerce Website Archive",
                    observed_value="NOT_PROVIDED",
                    source_type=SourceType.UNVERIFIED_INPUT,
                    retrieval_date=now_iso,
                    evidence_text="No independent website URL was provided for archive research",
                    verification_status=VerificationStatus.UNAVAILABLE,
                    evidence_confidence="UNVERIFIED_INPUT",
                    review_reason=None,
                    limitations="Provide an e-commerce website domain to check Internet Archive Wayback history.",
                )
            )

        # Deduplicate buyer questions preserving order
        seen_q = set()
        deduped_questions: List[str] = []
        for q in buyer_questions:
            clean_q = q.strip()
            if clean_q and clean_q not in seen_q:
                seen_q.add(clean_q)
                deduped_questions.append(clean_q)

        # Build overall objective summary
        if summary_points:
            overall_summary = "Factual observations: " + "; ".join(summary_points) + "."
        else:
            overall_summary = "No verified seller history records provided. Submit a Page Transparency screenshot or website URL."

        return SellerHistoryReportResponse(
            status="success",
            independently_retrieved=independently_retrieved,
            user_provided_screenshots=user_provided_screenshots,
            unverified_or_unavailable=unverified_or_unavailable,
            buyer_verification_questions=deduped_questions,
            overall_summary=overall_summary,
        )
