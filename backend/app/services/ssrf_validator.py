"""Server-Side Request Forgery (SSRF) validation and safe URL sanitizer.

Protects against internal network scanning, loopback probing, cloud metadata access,
and unsafe protocol redirection when processing user-submitted website links.
"""

import ipaddress
import logging
import socket
import urllib.parse
from typing import Tuple

logger = logging.getLogger(__name__)


class SSRFValidationError(ValueError):
    """Raised when a user-provided URL targets a private, loopback, or unsafe destination."""
    pass


FORBIDDEN_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",
    "instance-data",
    "169.254.169.254",
}

CLOUD_METADATA_IPS = {
    "169.254.169.254",
    "169.254.169.123",
    "fd00:ec2::254",
}


def validate_and_sanitize_url(raw_url: str) -> Tuple[str, str]:
    """Validate that a URL is a legitimate, publicly accessible HTTP/HTTPS destination.

    Args:
        raw_url: The raw URL submitted by the user.

    Returns:
        Tuple of (normalized_url, clean_hostname)

    Raises:
        SSRFValidationError: If URL scheme is not http/https, targets a private/reserved/cloud-metadata
                             IP address, includes credentials, or targets restricted hostnames.
    """
    if not raw_url or not raw_url.strip():
        raise SSRFValidationError("URL cannot be empty.")

    cleaned_url = raw_url.strip()

    # Prepend https:// only if no scheme is specified (no '://' present)
    if "://" not in cleaned_url:
        cleaned_url = "https://" + cleaned_url

    try:
        parsed = urllib.parse.urlsplit(cleaned_url)
    except Exception as e:
        raise SSRFValidationError(f"Invalid URL structure: {str(e)}") from e

    scheme = (parsed.scheme or "").lower()
    if scheme not in ("http", "https"):
        raise SSRFValidationError(
            f"Unsupported URL scheme '{scheme}'. Only http and https protocols are permitted."
        )

    if not parsed.netloc or not parsed.hostname:
        raise SSRFValidationError("URL is missing a valid hostname.")

    if parsed.username or parsed.password:
        raise SSRFValidationError("URLs containing embedded user credentials are not permitted.")

    hostname = parsed.hostname.lower().strip(".")
    if not hostname:
        raise SSRFValidationError("Invalid empty hostname.")

    # Check forbidden hostnames
    if (
        hostname in FORBIDDEN_HOSTNAMES
        or hostname.endswith(".localhost")
        or hostname.endswith(".local")
        or hostname.endswith(".internal")
    ):
        raise SSRFValidationError(f"Access to restricted hostname '{hostname}' is not permitted.")

    # If hostname is an IP literal, validate directly
    try:
        ip_obj = ipaddress.ip_address(hostname)
        if hostname in CLOUD_METADATA_IPS:
            raise SSRFValidationError("Access to cloud metadata IP addresses is strictly blocked.")
        if (
            ip_obj.is_private
            or ip_obj.is_loopback
            or ip_obj.is_link_local
            or ip_obj.is_reserved
            or ip_obj.is_multicast
            or ip_obj.is_unspecified
        ):
            raise SSRFValidationError(
                f"Destination resolves to restricted/internal IP address ({hostname}). Access blocked."
            )
    except ValueError:
        # Not a raw IP literal; proceed to domain DNS check
        pass

    # Perform DNS resolution and validate all returned IP addresses
    try:
        addr_info = socket.getaddrinfo(hostname, None, proto=socket.IPPROTO_TCP)
        for family, _, _, _, sockaddr in addr_info:
            ip_str = sockaddr[0]
            try:
                ip_obj = ipaddress.ip_address(ip_str)
            except ValueError:
                continue

            if ip_str in CLOUD_METADATA_IPS:
                raise SSRFValidationError("Access to cloud metadata IP addresses is strictly blocked.")

            if (
                ip_obj.is_private
                or ip_obj.is_loopback
                or ip_obj.is_link_local
                or ip_obj.is_reserved
                or ip_obj.is_multicast
                or ip_obj.is_unspecified
            ):
                raise SSRFValidationError(
                    f"Hostname '{hostname}' resolves to restricted/internal IP address ({ip_str}). Access blocked."
                )
    except socket.gaierror:
        # Hostname does not currently resolve in DNS (e.g. defunct, expired, or offline shop domain).
        # Since ShopShield BD only queries public archive indexes on web.archive.org,
        # an unresolved domain cannot target internal network resources.
        logger.info("DNS resolution unconfirmed for hostname '%s'; allowing archive lookup.", hostname)
    except SSRFValidationError:
        raise
    except Exception as e:
        logger.warning("DNS resolution check for '%s' encountered error: %s", hostname, e)

    normalized_url = urllib.parse.urlunsplit((
        scheme,
        parsed.netloc,
        parsed.path or "/",
        parsed.query,
        ""  # strip fragment
    ))

    return normalized_url, hostname
