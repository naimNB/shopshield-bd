"""Historical web content provider for ShopShield BD.

Safely discovers and fetches archived HTML web content from the Internet Archive Wayback Machine.
Enforces strict SSRF protection (including redirect re-validation), size bounds (1 MB),
bounded streaming, MIME type validation, timestamp verification, and redirect domain tracking
to prevent cross-domain or unrelated content confusion.
"""

from contextlib import contextmanager
import logging
import re
from typing import Generator, List, Optional, Tuple
import urllib.parse
import httpx

from backend.app.core.errors import (
    SSRFValidationError,
    WaybackPayloadTooLargeError,
    WaybackRateLimitError,
    WaybackSourceUnavailableError,
    WaybackTimeoutError,
)
from backend.app.schemas.temporal_comparison import HistoricalSnapshotContent
from backend.app.services.html_sanitizer import safe_extract_text_from_html
from backend.app.services.ssrf_validator import validate_and_sanitize_url
from backend.app.services.wayback_service import validate_and_format_timestamp

logger = logging.getLogger(__name__)

WAYBACK_CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx"
WAYBACK_CONTENT_TIMEOUT = 7.0  # seconds per snapshot fetch
MAX_ARCHIVED_HTML_BYTES = 1024 * 1024  # 1 MB cutoff
MAX_REDIRECTS = 3


def detect_page_type(url: str, text: str) -> str:
    """Classify page nature to distinguish homepages, policy documents, and specific products."""
    parsed = urllib.parse.urlsplit(url)
    path = parsed.path.lower().strip("/")
    if not path or path in ("index.html", "index.php", "home"):
        return "homepage"
    if any(k in path for k in ("return", "policy", "refund", "terms", "shipping", "faq", "condition", "delivery-policy")):
        return "policy_page"
    if any(k in path for k in ("product", "item", "p", "shop", "dp")):
        return "product_page"

    text_sample = text[:4000].lower()
    if any(k in text_sample for k in ("return policy", "রিটার্ন পলিসি", "terms and conditions", "শর্তাবলী", "privacy policy")):
        return "policy_page"
    if any(k in text_sample for k in ("add to cart", "buy now", "অর্ডার করুন", "কার্টে যোগ করুন", "in stock", "স্টকে আছে")):
        return "product_page"

    return "general"


class HistoricalContentProvider:
    """Provider for discovering and fetching verified historical web page content from Wayback Machine."""

    def __init__(
        self,
        timeout: float = WAYBACK_CONTENT_TIMEOUT,
        max_bytes: int = MAX_ARCHIVED_HTML_BYTES,
        client: Optional[httpx.Client] = None,
    ):
        self.timeout = timeout
        self.max_bytes = max_bytes
        self._client = client

    @contextmanager
    def _client_context(self) -> Generator[httpx.Client, None, None]:
        if self._client is not None:
            yield self._client
        else:
            with httpx.Client(
                timeout=self.timeout,
                follow_redirects=False,  # Handle redirects manually to re-verify SSRF
                headers={
                    "User-Agent": "ShopShieldBD-Research/1.0 (+https://shopshield-bd.vercel.app)",
                    "Accept": "text/html,application/xhtml+xml",
                },
            ) as client:
                yield client

    def discover_comparable_snapshots(
        self,
        target_url: str,
        earlier_ts: Optional[str] = None,
        later_ts: Optional[str] = None,
    ) -> Tuple[Optional[dict], Optional[dict], str]:
        """Find earlier and later 200 OK HTML snapshots from the CDX API.

        Distinguishes page-level history from domain-level history to prevent unrelated
        pages from being compared against each other.

        Returns:
            Tuple of (earlier_snapshot_meta, later_snapshot_meta, status_string)
        """
        # 1. Validate target URL and destination safety
        normalized_url, clean_domain = validate_and_sanitize_url(target_url)

        # If user explicitly supplied both timestamps, validate them strictly
        if earlier_ts and later_ts:
            is_valid_earlier, _, _ = validate_and_format_timestamp(earlier_ts)
            is_valid_later, _, _ = validate_and_format_timestamp(later_ts)
            if not is_valid_earlier or not is_valid_later:
                raise ValueError(f"Invalid or out-of-range Wayback timestamp: '{earlier_ts}' or '{later_ts}'.")

            clean_earlier = "".join([c for c in earlier_ts if c.isdigit()])[:14]
            clean_later = "".join([c for c in later_ts if c.isdigit()])[:14]

            if clean_earlier == clean_later:
                return (
                    {"timestamp": clean_earlier, "original": normalized_url},
                    None,
                    "SINGLE_SNAPSHOT",
                )

            return (
                {"timestamp": clean_earlier, "original": normalized_url},
                {"timestamp": clean_later, "original": normalized_url},
                "EXPLICIT_TIMESTAMPS",
            )

        # Determine if target is a specific subpath (e.g. /product/123 or /return-policy)
        parsed = urllib.parse.urlsplit(normalized_url)
        clean_path = parsed.path.strip("/")

        # First query for the specific target URL if a path is present
        earliest_record = None
        latest_record = None

        if clean_path and clean_path not in ("index.html", "index.php", "home"):
            # Target has a specific path: query exact URL or hostname+path
            query_target = f"{clean_domain}/{clean_path}"
            earliest_record = self._query_cdx_snapshot(query_target, reverse=False)
            latest_record = self._query_cdx_snapshot(query_target, reverse=True)

            if not earliest_record and not latest_record:
                # Also try querying with full normalized_url
                earliest_record = self._query_cdx_snapshot(normalized_url, reverse=False)
                latest_record = self._query_cdx_snapshot(normalized_url, reverse=True)

            # If specific page has no archives, return NO_ARCHIVES for this page
            # DO NOT fall back to comparing the homepage, as that violates page/product identity!
            if not earliest_record and not latest_record:
                return None, None, "NO_PAGE_ARCHIVES"
        else:
            # Domain-level query for homepage / root
            earliest_record = self._query_cdx_snapshot(clean_domain, reverse=False)
            latest_record = self._query_cdx_snapshot(clean_domain, reverse=True)

        if not earliest_record and not latest_record:
            return None, None, "NO_ARCHIVES"

        if earliest_record and not latest_record:
            return earliest_record, None, "SINGLE_SNAPSHOT"

        if not earliest_record and latest_record:
            return None, latest_record, "SINGLE_SNAPSHOT"

        # Check if timestamps are identical
        if earliest_record["timestamp"] == latest_record["timestamp"]:
            return earliest_record, None, "SINGLE_SNAPSHOT"

        return earliest_record, latest_record, "DATE_RANGE_AVAILABLE"

    def _query_cdx_snapshot(self, domain_or_url: str, reverse: bool = False) -> Optional[dict]:
        """Query CDX API for a single 200 OK text/html capture."""
        params = {
            "url": domain_or_url,
            "output": "json",
            "fl": "timestamp,original,statuscode,mimetype",
            "filter": ["statuscode:200", "mimetype:text/html"],
            "limit": "1",
        }
        if reverse:
            params["sort"] = "reverse"

        try:
            with self._client_context() as client:
                r = client.get(WAYBACK_CDX_ENDPOINT, params=params, timeout=self.timeout)
                if r.status_code == 429:
                    raise WaybackRateLimitError("Wayback CDX query rate limited.")
                if r.status_code >= 500:
                    raise WaybackSourceUnavailableError(f"Wayback CDX returned HTTP {r.status_code}.")
                r.raise_for_status()

                # Bounded size check
                if len(r.content) > self.max_bytes:
                    raise WaybackPayloadTooLargeError("Wayback CDX response exceeded size limit.")

                data = r.json()
                if isinstance(data, list) and len(data) > 1:
                    row = data[1]
                    raw_ts = row[0]
                    is_valid, _, _ = validate_and_format_timestamp(raw_ts)
                    if not is_valid:
                        logger.warning("CDX record contained invalid timestamp: %s", raw_ts)
                        return None
                    return {
                        "timestamp": raw_ts,
                        "original": row[1],
                        "statuscode": row[2] if len(row) > 2 else "200",
                        "mimetype": row[3] if len(row) > 3 else "text/html",
                    }
        except (WaybackRateLimitError, WaybackSourceUnavailableError, WaybackPayloadTooLargeError):
            raise
        except httpx.TimeoutException as e:
            raise WaybackTimeoutError("Wayback CDX query timed out.") from e
        except httpx.RequestError as e:
            raise WaybackSourceUnavailableError(f"Network error querying CDX API: {type(e).__name__}") from e
        except Exception as e:
            logger.warning("CDX snapshot query failed for '%s': %s", domain_or_url, type(e).__name__)
            return None

        return None

    def fetch_snapshot_content(
        self,
        timestamp: str,
        original_url: str,
    ) -> HistoricalSnapshotContent:
        """Fetch raw archived HTML for a verified snapshot, enforcing SSRF, bounds, and redirect tracking."""
        # Clean timestamp (keep first 14 digits)
        clean_ts = "".join([c for c in timestamp if c.isdigit()])[:14]
        is_valid, formatted_date, _ = validate_and_format_timestamp(clean_ts)
        if not is_valid or not formatted_date:
            raise ValueError(f"Invalid or out-of-range Wayback timestamp: '{timestamp}'.")

        # Validate original URL to ensure no SSRF destination is queried
        normalized_url, clean_domain = validate_and_sanitize_url(original_url)

        # Build raw archive content URL using the 'id_' modifier to exclude Wayback injection scripts
        raw_content_url = f"https://web.archive.org/web/{clean_ts}id_/{normalized_url}"
        public_snapshot_url = f"https://web.archive.org/web/{clean_ts}/{normalized_url}"

        content_chunks: list[bytes] = []
        total_bytes = 0
        current_url = raw_content_url
        final_status_code = 200
        final_content_type = "text/html"
        is_off_domain = False
        redirect_domain: Optional[str] = None

        try:
            with self._client_context() as client:
                for redirect_hop in range(MAX_REDIRECTS + 1):
                    # Validate redirect target if redirected
                    if redirect_hop > 0:
                        # Extract the target URL if redirected
                        if current_url.startswith("https://web.archive.org/web/") or current_url.startswith("http://web.archive.org/web/"):
                            # Extract target url after /web/{timestamp}/ or /web/{timestamp}id_/
                            m_target = re.search(r"/web/[0-9]+(?:id_)?/(https?://.+)$", current_url)
                            if m_target:
                                dest_target = m_target.group(1)
                                try:
                                    _, dest_host = validate_and_sanitize_url(dest_target)
                                    orig_base = re.sub(r"^www\.", "", clean_domain.lower())
                                    dest_base = re.sub(r"^www\.", "", dest_host.lower())
                                    if orig_base != dest_base:
                                        is_off_domain = True
                                        redirect_domain = dest_host
                                except SSRFValidationError:
                                    raise
                        else:
                            # External redirect out of archive
                            _, dest_host = validate_and_sanitize_url(current_url)
                            orig_base = re.sub(r"^www\.", "", clean_domain.lower())
                            dest_base = re.sub(r"^www\.", "", dest_host.lower())
                            if orig_base != dest_base:
                                is_off_domain = True
                                redirect_domain = dest_host

                    with client.stream("GET", current_url) as response:
                        final_status_code = response.status_code
                        final_content_type = response.headers.get("content-type", "text/html").lower()

                        # Handle redirect status codes safely
                        if response.status_code in (301, 302, 303, 307, 308):
                            location = response.headers.get("Location")
                            if not location:
                                raise WaybackSourceUnavailableError("Redirect without Location header from archive.")
                            if redirect_hop == MAX_REDIRECTS:
                                raise WaybackSourceUnavailableError(f"Exceeded max redirects ({MAX_REDIRECTS}) fetching archive.")
                            # Resolve relative redirects
                            if location.startswith("/"):
                                current_url = f"https://web.archive.org{location}"
                            else:
                                current_url = location
                            continue

                        if response.status_code == 429:
                            raise WaybackRateLimitError("Internet Archive rate limit reached.")
                        if response.status_code in (404, 410):
                            return HistoricalSnapshotContent(
                                timestamp=clean_ts,
                                formatted_date=formatted_date,
                                snapshot_url=public_snapshot_url,
                                raw_content_url=raw_content_url,
                                status_code=response.status_code,
                                content_bytes=0,
                                extracted_text_chars=0,
                                claims=None,
                                fetch_status="ARCHIVE_UNAVAILABLE",
                                final_url=current_url,
                                is_off_domain_redirect=is_off_domain,
                                redirect_domain=redirect_domain,
                                content_type=final_content_type,
                            )
                        if response.status_code >= 500:
                            raise WaybackSourceUnavailableError(f"Wayback server error HTTP {response.status_code}.")

                        # Validate MIME type on 200 response
                        is_html = any(t in final_content_type for t in ("text/html", "application/xhtml+xml", "text/plain"))
                        if final_content_type and not is_html:
                            logger.warning("Snapshot at %s returned non-HTML MIME type: %s", current_url, final_content_type)
                            return HistoricalSnapshotContent(
                                timestamp=clean_ts,
                                formatted_date=formatted_date,
                                snapshot_url=public_snapshot_url,
                                raw_content_url=raw_content_url,
                                status_code=response.status_code,
                                content_bytes=0,
                                extracted_text_chars=0,
                                claims=None,
                                fetch_status="UNSUPPORTED_MEDIA_TYPE",
                                final_url=current_url,
                                is_off_domain_redirect=is_off_domain,
                                redirect_domain=redirect_domain,
                                content_type=final_content_type,
                            )

                        # Stream response chunks bounded by max_bytes
                        for chunk in response.iter_bytes(chunk_size=65536):
                            total_bytes += len(chunk)
                            if total_bytes > self.max_bytes:
                                logger.warning("Snapshot HTML from %s exceeded %d bytes limit.", current_url, self.max_bytes)
                                raise WaybackPayloadTooLargeError(
                                    f"Archived page content exceeded maximum allowable size of {self.max_bytes // 1024} KB."
                                )
                            content_chunks.append(chunk)

                        break  # Response successfully consumed

        except (WaybackRateLimitError, WaybackPayloadTooLargeError, WaybackSourceUnavailableError):
            raise
        except httpx.TimeoutException as e:
            raise WaybackTimeoutError("Archived page content fetch timed out.") from e
        except SSRFValidationError:
            raise
        except Exception as e:
            logger.warning("Failed to fetch historical snapshot %s: %s", raw_content_url, type(e).__name__)
            raise WaybackSourceUnavailableError("Could not retrieve historical page from archive.") from e

        raw_bytes = b"".join(content_chunks)
        clean_text, byte_size = safe_extract_text_from_html(raw_bytes, max_bytes=self.max_bytes)
        page_type = detect_page_type(normalized_url, clean_text)

        snap = HistoricalSnapshotContent(
            timestamp=clean_ts,
            formatted_date=formatted_date,
            snapshot_url=public_snapshot_url,
            raw_content_url=raw_content_url,
            status_code=final_status_code,
            content_bytes=byte_size,
            extracted_text_chars=len(clean_text),
            claims=None,
            fetch_status="FETCHED",
            page_type=page_type,
            final_url=current_url,
            redirect_domain=redirect_domain,
            is_off_domain_redirect=is_off_domain,
            content_type=final_content_type,
        )
        snap._extracted_text = clean_text
        return snap
