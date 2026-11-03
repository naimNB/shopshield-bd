"""Internet Archive Wayback Machine historical research service for ShopShield BD.

Fetches verifiable public historical metadata via the official Wayback CDX API.
Enforces strict SSRF protection, timeouts, and bounded streaming payload limits.
Accurately queries independent earliest and latest captures using documented CDX sorting.
Maintains clear separation between historical sample captures and total capture volume.
Replaces misleading 'COMPLETE' status with precise 'DATE_RANGE_VERIFIED' / 'PARTIAL_COVERAGE'.
Adheres strictly to the rule that an archive capture is NOT proof of domain registration
or company founding dates.
"""

from datetime import datetime, date, timezone
import json
import logging
import re
from typing import List, Optional, Tuple, Iterator
from contextlib import contextmanager
import uuid
import httpx

from backend.app.core.errors import (
    WaybackServiceError,
    WaybackTimeoutError,
    WaybackRateLimitError,
    WaybackSourceUnavailableError,
    WaybackPayloadTooLargeError,
)
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

# Re-export for module consumers
__all__ = [
    "WaybackService",
    "WaybackServiceError",
    "WaybackTimeoutError",
    "WaybackRateLimitError",
    "WaybackSourceUnavailableError",
    "WaybackPayloadTooLargeError",
    "validate_and_format_timestamp",
    "make_snapshot_url",
]

WAYBACK_CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx"
WAYBACK_REQUEST_TIMEOUT = 12.0  # seconds
MAX_RESPONSE_BYTES = 1024 * 1024  # 1 MB streaming cutoff


def validate_and_format_timestamp(ts: str) -> Tuple[bool, Optional[str], Optional[str]]:
    """Validate 14-digit Wayback timestamp (YYYYMMDDhhmmss) and return (is_valid, formatted_date, year).

    Ensures the timestamp is composed of digits, has valid calendar bounds, and is not in the future.
    """
    if not ts or not ts.isdigit() or len(ts) < 8:
        return False, None, None

    year_str = ts[:4]
    month_str = ts[4:6]
    day_str = ts[6:8]

    try:
        year = int(year_str)
        month = int(month_str)
        day = int(day_str)

        # Internet Archive was founded in 1996
        current_year = datetime.now(timezone.utc).year
        if year < 1996 or year > current_year + 1:
            return False, None, None

        if not (1 <= month <= 12):
            return False, None, None

        if not (1 <= day <= 31):
            return False, None, None

        # Verify parsed calendar date
        parsed_date = date(year, month, day)
        today = datetime.now(timezone.utc).date()
        if parsed_date > today:
            # Timestamp indicates future date beyond current observation
            return False, None, None

        formatted_date = f"{year_str}-{month_str}-{day_str}"
        return True, formatted_date, year_str
    except ValueError:
        return False, None, None


def make_snapshot_url(timestamp: str, original_url: str) -> str:
    """Generate safe, direct public Internet Archive snapshot URL with sanitization."""
    safe_ts = re.sub(r"[^0-9]", "", timestamp)
    safe_url = re.sub(r"[\r\n\t]", "", original_url)
    return f"https://web.archive.org/web/{safe_ts}/{safe_url}"


class WaybackService:
    """Service for fetching and structuring Internet Archive historical metadata."""

    def __init__(self, client: Optional[httpx.Client] = None):
        self._client = client

    @contextmanager
    def _client_context(self) -> Iterator[httpx.Client]:
        """Yield a managed HTTP client, ensuring socket and connection pool cleanup."""
        if self._client is not None:
            yield self._client
        else:
            with httpx.Client(
                timeout=WAYBACK_REQUEST_TIMEOUT,
                headers={
                    "User-Agent": "ShopShieldBD/1.0 (Digital Commerce Safety Research; https://shopshield-bd.vercel.app)",
                    "Accept": "application/json",
                },
                follow_redirects=False,
            ) as client:
                yield client

    def query_cdx_raw(self, params: dict) -> List[List[str]]:
        """Execute a single streaming query against Wayback CDX API.

        Enforces bounded memory reading up to MAX_RESPONSE_BYTES and handles error status codes
        without falsely disguising API failures as empty archive records.
        """
        try:
            with self._client_context() as client:
                with client.stream("GET", WAYBACK_CDX_ENDPOINT, params=params) as response:
                    if response.status_code == 429:
                        logger.warning("Wayback CDX API rate limit reached (HTTP 429).")
                        raise WaybackRateLimitError("Internet Archive rate limit reached. Please try again shortly.")

                    if response.status_code in (408, 504):
                        logger.warning("Wayback CDX API gateway timeout (HTTP %d).", response.status_code)
                        raise WaybackTimeoutError("Internet Archive Wayback Machine API timed out.")

                    if response.status_code >= 500:
                        logger.warning("Wayback CDX API returned server error (HTTP %d).", response.status_code)
                        raise WaybackSourceUnavailableError(
                            f"Internet Archive CDX server error (HTTP {response.status_code}). Service temporarily unavailable."
                        )

                    if response.status_code != 200:
                        logger.info("Wayback CDX API returned status %d for query %s", response.status_code, params.get("url"))
                        raise WaybackSourceUnavailableError(
                            f"Internet Archive CDX returned unexpected HTTP {response.status_code}."
                        )

                    chunks: List[bytes] = []
                    total_bytes = 0
                    for chunk in response.iter_bytes(chunk_size=8192):
                        total_bytes += len(chunk)
                        if total_bytes > MAX_RESPONSE_BYTES:
                            logger.warning("Wayback CDX response exceeded maximum size limit of %d bytes.", MAX_RESPONSE_BYTES)
                            raise WaybackPayloadTooLargeError(
                                f"Internet Archive response exceeded maximum allowable size of {MAX_RESPONSE_BYTES // 1024} KB."
                            )
                        chunks.append(chunk)

                    raw_content = b"".join(chunks)

        except (WaybackTimeoutError, WaybackRateLimitError, WaybackSourceUnavailableError, WaybackPayloadTooLargeError):
            raise
        except httpx.TimeoutException as e:
            logger.warning("Wayback CDX API timed out for params %s", params)
            raise WaybackTimeoutError("Internet Archive Wayback Machine API timed out.") from e
        except httpx.RequestError as e:
            logger.warning("Network error contacting Wayback CDX API: %s", type(e).__name__)
            raise WaybackSourceUnavailableError("Could not connect to Internet Archive.") from e

        try:
            decoded_text = raw_content.decode("utf-8")
            if not decoded_text.strip():
                return []
            data = json.loads(decoded_text)
            if isinstance(data, list):
                return data
            raise WaybackSourceUnavailableError("Wayback CDX API returned non-list JSON structure.")
        except json.JSONDecodeError as e:
            logger.error("Failed to parse Wayback CDX JSON: %s", e)
            raise WaybackSourceUnavailableError("Internet Archive returned malformed or unparseable JSON.") from e

    def get_single_snapshot(self, domain: str, sort_reverse: bool = False) -> Optional[WebsiteArchiveSnapshot]:
        """Query for a single capture (earliest if sort_reverse=False, latest if sort_reverse=True)."""
        params = {
            "url": domain,
            "output": "json",
            "fl": "timestamp,original,statuscode",
            "filter": "statuscode:200",
            "limit": "1",
        }
        if sort_reverse:
            params["sort"] = "reverse"

        rows = self.query_cdx_raw(params)
        if len(rows) > 1:
            row = rows[1]
            if len(row) >= 2:
                ts = row[0]
                orig = row[1]
                status_code = row[2] if len(row) > 2 else "200"
                is_valid, fmt_date, _ = validate_and_format_timestamp(ts)
                if is_valid and fmt_date:
                    return WebsiteArchiveSnapshot(
                        timestamp=ts,
                        formatted_date=fmt_date,
                        snapshot_url=make_snapshot_url(ts, orig),
                        status_code=status_code,
                    )
        return None

    def get_sample_snapshots(self, domain: str, max_samples: int = 15) -> List[WebsiteArchiveSnapshot]:
        """Query for distributed sample snapshots across the domain's historical presence."""
        params = {
            "url": domain,
            "output": "json",
            "fl": "timestamp,original,statuscode",
            "filter": "statuscode:200",
            "collapse": "timestamp:4",
            "limit": str(max_samples),
        }
        rows = self.query_cdx_raw(params)

        # If yearly collapse yielded <= 2 snapshots, try monthly collapse to give richer sample
        if len(rows) <= 3:
            params["collapse"] = "timestamp:6"
            rows = self.query_cdx_raw(params)

        snapshots: List[WebsiteArchiveSnapshot] = []
        if len(rows) > 1:
            for row in rows[1:]:
                if len(row) >= 2:
                    ts = row[0]
                    orig = row[1]
                    status_code = row[2] if len(row) > 2 else "200"
                    is_valid, fmt_date, _ = validate_and_format_timestamp(ts)
                    if is_valid and fmt_date:
                        snapshots.append(
                            WebsiteArchiveSnapshot(
                                timestamp=ts,
                                formatted_date=fmt_date,
                                snapshot_url=make_snapshot_url(ts, orig),
                                status_code=status_code,
                            )
                        )
        return snapshots

    def fetch_website_history(self, raw_url: str) -> WebsiteHistoryResponse:
        """Analyze historical website archive coverage safely, accurately, and without false claims.

        Queries independent earliest and latest captures using documented CDX API sorting,
        ensuring that result limits do not truncate or distort the newest observed date.
        """
        normalized_url, clean_hostname = validate_and_sanitize_url(raw_url)
        now_iso = datetime.now(timezone.utc).isoformat()

        # Execute queries; let genuine provider exceptions propagate
        earliest = self.get_single_snapshot(clean_hostname, sort_reverse=False)
        latest = self.get_single_snapshot(clean_hostname, sort_reverse=True)
        samples = self.get_sample_snapshots(clean_hostname, max_samples=15)

        # Determine archive availability and honest coverage status
        archive_available = earliest is not None or latest is not None or len(samples) > 0

        if not archive_available:
            coverage_status = "NO_ARCHIVES"
        elif earliest is not None and latest is not None:
            # Replaced misleading "COMPLETE" with precise "DATE_RANGE_VERIFIED"
            coverage_status = "DATE_RANGE_VERIFIED"
        else:
            coverage_status = "PARTIAL_COVERAGE"

        sample_count = len(samples)
        total_captures_estimate: Optional[str] = None
        if archive_available and earliest and latest:
            earliest_yr = earliest.formatted_date[:4]
            latest_yr = latest.formatted_date[:4]
            total_captures_estimate = (
                f"Historical captures observed spanning from {earliest_yr} to {latest_yr}. "
                f"Sample includes {sample_count} snapshots (does not represent total capture volume)."
            )

        website_data = WebsiteArchiveData(
            target_url=normalized_url,
            cleaned_domain=clean_hostname,
            archive_available=archive_available,
            coverage_status=coverage_status,
            earliest_snapshot=earliest,
            latest_snapshot=latest,
            sample_snapshots_count=sample_count,
            sample_snapshots=samples,
            total_snapshots_observed=sample_count,  # Legacy alias compatibility
            total_captures_estimate=total_captures_estimate,
        )

        findings: List[EvidenceFinding] = []
        buyer_questions: List[str] = []

        if archive_available and earliest:
            findings.append(
                EvidenceFinding(
                    finding_id=f"wb_earliest_{uuid.uuid4().hex[:6]}",
                    field_name="earliest_archive_capture",
                    field_label="Earliest Recorded Archive Capture",
                    observed_value=earliest.formatted_date,
                    source_type=SourceType.INTERNET_ARCHIVE_CDX,
                    source_url=earliest.snapshot_url,
                    observation_date=earliest.formatted_date,
                    retrieval_date=now_iso,
                    evidence_text=f"First 200 OK capture on {earliest.formatted_date} at {earliest.snapshot_url}",
                    verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                    evidence_confidence="INDEPENDENT_ARCHIVE_VERIFIED",
                    limitations=(
                        "Earliest archive capture indicates when Internet Archive crawlers first indexed this site. "
                        "It is NOT proof of domain registration date or business founding date."
                    ),
                )
            )

            if latest:
                findings.append(
                    EvidenceFinding(
                        finding_id=f"wb_latest_{uuid.uuid4().hex[:6]}",
                        field_name="latest_archive_capture",
                        field_label="Most Recent Archive Capture",
                        observed_value=latest.formatted_date,
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        source_url=latest.snapshot_url,
                        observation_date=latest.formatted_date,
                        retrieval_date=now_iso,
                        evidence_text=f"Latest 200 OK capture on {latest.formatted_date} at {latest.snapshot_url}",
                        verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                        evidence_confidence="INDEPENDENT_ARCHIVE_VERIFIED",
                        limitations="Reflects the latest public crawler snapshot, not current real-time website status.",
                    )
                )

            if sample_count > 0:
                findings.append(
                    EvidenceFinding(
                        finding_id=f"wb_samples_{uuid.uuid4().hex[:6]}",
                        field_name="archive_sample_snapshots",
                        field_label="Timeline Sample Snapshots",
                        observed_value=f"{sample_count} historical snapshot(s) sampled",
                        source_type=SourceType.INTERNET_ARCHIVE_CDX,
                        source_url=f"https://web.archive.org/web/*/{clean_hostname}",
                        observation_date=earliest.formatted_date,
                        retrieval_date=now_iso,
                        evidence_text=f"{sample_count} distinct snapshots sampled across historical timeline",
                        verification_status=VerificationStatus.INDEPENDENTLY_RETRIEVED,
                        evidence_confidence="INDEPENDENT_ARCHIVE_VERIFIED",
                        limitations="Represents a sampled timeline cross-section, not the complete historical crawl archive.",
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
                    finding_id=f"wb_presence_{uuid.uuid4().hex[:6]}",
                    field_name="archive_presence",
                    field_label="Archive Coverage Status",
                    observed_value="NO_SNAPSHOTS_FOUND",
                    source_type=SourceType.INTERNET_ARCHIVE_CDX,
                    source_url=None,
                    observation_date=None,
                    retrieval_date=now_iso,
                    evidence_text="No HTTP 200 captures indexed for this domain in Internet Archive CDX",
                    verification_status=VerificationStatus.UNAVAILABLE,
                    evidence_confidence="DATA_UNAVAILABLE",
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
