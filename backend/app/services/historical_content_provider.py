"""Historical web content provider for ShopShield BD.

Safely fetches archived HTML web content from the Internet Archive Wayback Machine.
Enforces strict SSRF protection (including redirect re-validation), size bounds (1 MB),
bounded streaming, and connection timeouts to fit within Vercel serverless execution limits.
"""

from contextlib import contextmanager
import logging
from typing import Generator, List, Optional, Tuple
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

logger = logging.getLogger(__name__)

WAYBACK_CDX_ENDPOINT = "https://web.archive.org/cdx/search/cdx"
WAYBACK_CONTENT_TIMEOUT = 7.0  # seconds per snapshot fetch
MAX_ARCHIVED_HTML_BYTES = 1024 * 1024  # 1 MB cutoff
MAX_REDIRECTS = 3


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

        Returns:
            Tuple of (earlier_snapshot_meta, later_snapshot_meta, status_string)
        """
        # 1. Validate target URL
        normalized_url, clean_domain = validate_and_sanitize_url(target_url)

        # If user explicitly supplied both timestamps, return them directly
        if earlier_ts and later_ts:
            return (
                {"timestamp": earlier_ts, "original": normalized_url},
                {"timestamp": later_ts, "original": normalized_url},
                "EXPLICIT_TIMESTAMPS",
            )

        # Query CDX index for earliest and latest text/html snapshots
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
                data = r.json()
                if isinstance(data, list) and len(data) > 1:
                    row = data[1]
                    return {
                        "timestamp": row[0],
                        "original": row[1],
                        "statuscode": row[2] if len(row) > 2 else "200",
                        "mimetype": row[3] if len(row) > 3 else "text/html",
                    }
        except (WaybackRateLimitError, WaybackSourceUnavailableError):
            raise
        except httpx.TimeoutException as e:
            raise WaybackTimeoutError("Wayback CDX query timed out.") from e
        except Exception as e:
            logger.warning("CDX snapshot query failed for '%s': %s", domain_or_url, type(e).__name__)
            return None

        return None

    def fetch_snapshot_content(
        self,
        timestamp: str,
        original_url: str,
    ) -> HistoricalSnapshotContent:
        """Fetch raw archived HTML for a verified snapshot, enforcing SSRF and bounded streaming."""
        # Clean timestamp (keep first 14 digits)
        clean_ts = "".join([c for c in timestamp if c.isdigit()])[:14]
        if len(clean_ts) < 8:
            raise ValueError(f"Invalid Wayback timestamp: {timestamp}")

        # Validate original URL to ensure no SSRF destination is queried
        normalized_url, _ = validate_and_sanitize_url(original_url)

        # Build raw archive content URL using the 'id_' modifier to exclude Wayback injection scripts
        raw_content_url = f"https://web.archive.org/web/{clean_ts}id_/{normalized_url}"
        public_snapshot_url = f"https://web.archive.org/web/{clean_ts}/{normalized_url}"
        formatted_date = f"{clean_ts[:4]}-{clean_ts[4:6]}-{clean_ts[6:8]}"

        content_chunks: list[bytes] = []
        total_bytes = 0
        current_url = raw_content_url
        final_status_code = 200

        try:
            with self._client_context() as client:
                for redirect_hop in range(MAX_REDIRECTS + 1):
                    # Validate redirect target if redirected
                    if redirect_hop > 0:
                        # Ensure redirect stays within safe archive boundaries or target domain
                        if not current_url.startswith("https://web.archive.org/web/") and not current_url.startswith("http://web.archive.org/web/"):
                            # If it redirected to an external domain, validate via SSRF
                            validate_and_sanitize_url(current_url)

                    with client.stream("GET", current_url) as response:
                        final_status_code = response.status_code

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
                            )
                        if response.status_code >= 500:
                            raise WaybackSourceUnavailableError(f"Wayback server error HTTP {response.status_code}.")

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
        )
        snap._extracted_text = clean_text
        return snap
