"""Internet Archive Wayback Machine historical research service for ShopShield BD.

Fetches verifiable public historical metadata via the official Wayback CDX API.
Enforces strict SSRF protection, timeouts, and payload limits.
Adheres strictly to the rule that an archive capture is NOT proof of domain registration
or company founding dates.
"""

from datetime import datetime, timezone
import json
import logging
from typing import List, Optional, Tuple
import httpx

from backend.app.schemas.seller_history import (
    EvidenceFinding,
    SourceType,
    VerificationStatus,
    WebsiteArchiveData,
    WebsiteArchiveSnapshot,
    WebsiteHistoryResponse,
)
from backend.app.services.ssrf_validator import (
    validate_and_sanitize_url,
    SSRFValidationError,
)

logger = logging.getLogger(__name__)

WAYBACK_CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx"
WAYBACK_REQUEST_TIMEOUT = 12.0  # seconds
MAX_RESPONSE_BYTES = 1024 * 1024  # 1 MB


class WaybackServiceError(Exception):
    """Base exception for Wayback Machine API errors."""
    pass


class WaybackTimeoutError(WaybackServiceError):
    """Raised when the Wayback Machine API times out."""
    pass


class WaybackRateLimitError(WaybackServiceError):
    """Raised when the Wayback Machine API returns 429 Too Many Requests."""
    pass


def format_wayback_timestamp(ts: str) -> Tuple[str, str]:
    """Convert 14-digit Wayback timestamp (YYYYMMDDhhmmss) to (formatted_date, year).

    Example: '20241104183951' -> ('2024-11-04', '2024')
    """
    if len(ts) >= 8:
        year = ts[:4]
        month = ts[4:6]
        day = ts[6:8]
        return f"{year}-{month}-{day}", year
    return ts, ts[:4] if len(ts) >= 4 else "unknown"


def make_snapshot_url(timestamp: str, original_url: str) -> str:
    """Generate safe, direct public Internet Archive snapshot URL."""
    return f"https://web.archive.org/web/{timestamp}/{original_url}"


class WaybackService:
    """Service for fetching and structuring Internet Archive historical metadata."""

    def __init__(self, client: Optional[httpx.Client] = None):
        self._client = client

    def get_client(self) -> httpx.Client:
        if self._client is not None:
            return self._client
        return httpx.Client(
            timeout=WAYBACK_REQUEST_TIMEOUT,
            headers={
                "User-Agent": "ShopShieldBD/1.0 (Digital Commerce Safety Research; https://shopshield-bd.vercel.app)",
                "Accept": "application/json",
            },
            follow_redirects=False,  # Prevent following any redirects from archive endpoint
        )

    def query_cdx_api(self, domain_or_url: str) -> List[List[str]]:
        """Query Wayback CDX API for snapshots with status 200.

        Returns list of rows, where row 0 is header ['timestamp', 'original', 'statuscode'].
        """
        params = {
            "url": domain_or_url,
            "output": "json",
            "fl": "timestamp,original,statuscode",
            "filter": "statuscode:200",
            "limit": "100",
        }

        client = self.get_client()
        try:
            response = client.get(
                WAYBACK_CDX_ENDPOINT,
                params=params,
            )
        except httpx.TimeoutException as e:
            logger.warning("Wayback CDX API timed out for query '%s'", domain_or_url)
            raise WaybackTimeoutError("Internet Archive Wayback Machine API timed out.") from e
        except httpx.RequestError as e:
            logger.warning("Network error contacting Wayback CDX API: %s", type(e).__name__)
            raise WaybackServiceError("Could not connect to Internet Archive.") from e

        if response.status_code == 429:
            logger.warning("Wayback CDX API rate limit reached (HTTP 429).")
            raise WaybackRateLimitError("Internet Archive rate limit reached. Please try again shortly.")

        if response.status_code != 200:
            logger.info("Wayback CDX API returned status %d for '%s'", response.status_code, domain_or_url)
            return []

        content = response.content
        if len(content) > MAX_RESPONSE_BYTES:
            logger.warning("Wayback CDX response exceeded 1 MB limit.")
            content = content[:MAX_RESPONSE_BYTES]

        try:
            data = json.loads(content.decode("utf-8", errors="replace"))
            if isinstance(data, list):
                return data
            return []
        except Exception as e:
            logger.error("Failed to parse Wayback CDX JSON: %s", e)
            return []

    def fetch_website_history(self, raw_url: str) -> WebsiteHistoryResponse:
        """Analyze historical website archive coverage safely.

        Args:
            raw_url: Website URL to investigate.

        Returns:
            WebsiteHistoryResponse containing verifiable archive data, findings, and buyer questions.
        """
        normalized_url, clean_hostname = validate_and_sanitize_url(raw_url)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Query CDX for the clean hostname/domain
        raw_rows = self.query_cdx_api(clean_hostname)

        # CDX returns [] or [header, row1, row2, ...]
        records: List[WebsiteArchiveSnapshot] = []
        if len(raw_rows) > 1:
            # First row is header
            data_rows = raw_rows[1:]
            for row in data_rows:
                if len(row) >= 2:
                    ts = row[0]
                    orig = row[1]
                    status_code = row[2] if len(row) > 2 else "200"
                    fmt_date, _ = format_wayback_timestamp(ts)
                    records.append(
                        WebsiteArchiveSnapshot(
                            timestamp=ts,
                            formatted_date=fmt_date,
                            snapshot_url=make_snapshot_url(ts, orig),
                            status_code=status_code,
                        )
                    )

        total_observed = len(records)
        archive_available = total_observed > 0

        earliest: Optional[WebsiteArchiveSnapshot] = None
        latest: Optional[WebsiteArchiveSnapshot] = None
        samples: List[WebsiteArchiveSnapshot] = []

        if archive_available:
            earliest = records[0]
            latest = records[-1]

            # Collect a distributed sample across the timeline (up to 6 snapshots)
            if total_observed <= 6:
                samples = records
            else:
                step = total_observed / 5
                indexes = [int(i * step) for i in range(5)]
                if (total_observed - 1) not in indexes:
                    indexes.append(total_observed - 1)
                samples = [records[i] for i in sorted(set(indexes)) if i < total_observed]

        website_data = WebsiteArchiveData(
            target_url=normalized_url,
            cleaned_domain=clean_hostname,
            archive_available=archive_available,
            total_snapshots_observed=total_observed,
            earliest_snapshot=earliest,
            latest_snapshot=latest,
            sample_snapshots=samples,
        )

        findings: List[EvidenceFinding] = []
        buyer_questions: List[str] = []

        if archive_available and earliest:
            findings.append(
                EvidenceFinding(
                    field_name="earliest_archive_capture",
                    field_label="Earliest Recorded Archive Capture",
                    observed_value=earliest.formatted_date,
                    source_type=SourceType.INTERNET_ARCHIVE_CDX,
                    source_url=earliest.snapshot_url,
                    observation_date=earliest.formatted_date,
                    retrieval_date=now_iso,
                    evidence_text=f"First 200 OK capture on {earliest.formatted_date} at {earliest.snapshot_url}",
                    verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                    limitations=(
                        "Earliest archive capture indicates when Internet Archive crawlers first indexed this site. "
                        "It is NOT proof of domain registration date or business founding date."
                    ),
                )
            )

            if latest and latest.timestamp != earliest.timestamp:
                findings.append(
                    EvidenceFinding(
                        field_name="latest_archive_capture",
                        field_label="Most Recent Archive Capture",
                        observed_value=latest.formatted_date,
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        source_url=latest.snapshot_url,
                        observation_date=latest.formatted_date,
                        retrieval_date=now_iso,
                        evidence_text=f"Latest 200 OK capture on {latest.formatted_date} at {latest.snapshot_url}",
                        verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                        limitations="Reflects the latest public crawler snapshot, not current real-time website status.",
                    )
                )

            findings.append(
                EvidenceFinding(
                    field_name="archive_snapshot_count",
                    field_label="Total Archive Captures Sampled",
                    observed_value=total_observed,
                    source_type=SourceType.INTERNET_ARCHIVE_CDX,
                    source_url=f"https://web.archive.org/web/*/{clean_hostname}",
                    observation_date=earliest.formatted_date,
                    retrieval_date=now_iso,
                    evidence_text=f"{total_observed} HTTP 200 snapshots indexed in query sample",
                    verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                    limitations="Represents query limit of 100 successful captures, not all historical crawler passes.",
                )
            )

            # Generate tailored Bangla questions
            try:
                earliest_year = int(earliest.formatted_date[:4])
                current_year = datetime.now(timezone.utc).year
                years_active = current_year - earliest_year
                if years_active >= 3:
                    buyer_questions.append(
                        f"ওয়েবসাইটটি {earliest.formatted_date} থেকে ইন্টারনেটে সংরক্ষিত রয়েছে। "
                        "অর্ডার করার পূর্বে বর্তমান পণ্যের স্টক ও ওয়ারেন্টি পলিসি নিশ্চিত হয়েছেন কি?"
                    )
                else:
                    buyer_questions.append(
                        f"ওয়েবসাইটটির প্রথম আর্কাইভ রেকর্ড {earliest.formatted_date} এর। "
                        "শপটির কোনো ট্রেড লাইসেন্স বা ভেরিফাইড ফেসবুক পেজ আছে কি না যাচাই করুন।"
                    )
            except Exception:
                buyer_questions.append(
                    "ওয়েবসাইটটির পূর্ববর্তী আর্কাইভ রয়েছে। পণ্য অর্ডারের পূর্বে রিফান্ড ও রিটার্ন পলিসি সরাসরি কনফার্ম করুন।"
                )
        else:
            findings.append(
                EvidenceFinding(
                    field_name="archive_presence",
                    field_label="Archive Coverage Status",
                    observed_value="NO_SNAPSHOTS_FOUND",
                    source_type=SourceType.INTERNET_ARCHIVE_CDX,
                    source_url=None,
                    observation_date=None,
                    retrieval_date=now_iso,
                    evidence_text="No HTTP 200 captures indexed for this domain in Internet Archive CDX",
                    verification_status=VerificationStatus.UNAVAILABLE,
                    limitations=(
                        "Absence of snapshots means the site was not crawled or is newly established. "
                        "It does NOT automatically prove a business is fraudulent."
                    ),
                )
            )

            buyer_questions.append(
                "ওয়েবসাইটটির কোনো পূর্ববর্তী আর্কাইভ রেকর্ড খুঁজে পাওয়া যায়নি। "
                "সম্পূর্ণ অগ্রিম মূল্য পরিশোধ না করে কুরিয়ার ক্যাশ-অন-ডেলিভারি (পণ্য দেখে মূল্য পরিশোধ) সুবিধা নিন।"
            )

        buyer_questions.append(
            "অনলাইন কেনাকাটায় কোনো ব্যক্তিগত বিকাশ/নগদ অ্যাকাউন্টে অযাচিত অগ্রিম পরিশোধ করা থেকে সতর্ক থাকুন।"
        )

        return WebsiteHistoryResponse(
            status="success",
            website_data=website_data,
            findings=findings,
            buyer_questions=buyer_questions,
        )
