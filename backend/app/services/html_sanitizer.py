"""Safe HTML sanitization and visible text extraction for ShopShield BD.

Safely parses archived HTML documents using Python's built-in HTMLParser.
Strips scripts, styles, metadata, iframes, and comments without executing JavaScript.
Enforces strict size limits and neutralizes prompt injection markers from untrusted web pages.
"""

from html.parser import HTMLParser
import html
import logging
import re
from typing import Tuple
from backend.app.core.errors import WaybackPayloadTooLargeError

logger = logging.getLogger(__name__)

# Security and performance boundaries
DEFAULT_MAX_HTML_BYTES = 1024 * 1024  # 1 MB
DEFAULT_MAX_EXTRACTED_CHARS = 40_000   # 40k characters of visible text


class SafeHTMLTextStripper(HTMLParser):
    """Event-driven parser that extracts only visible human-readable text."""

    # Container tags whose child contents must be completely discarded
    DISCARD_CONTAINER_TAGS = {
        "script",
        "style",
        "noscript",
        "svg",
        "canvas",
        "iframe",
        "template",
        "object",
        "embed",
    }

    # Block tags that warrant inserting line breaks
    BLOCK_TAGS = {
        "p", "div", "h1", "h2", "h3", "h4", "h5", "h6",
        "li", "tr", "td", "th", "section", "article",
        "header", "footer", "blockquote", "aside", "br",
    }

    def __init__(self, max_chars: int = DEFAULT_MAX_EXTRACTED_CHARS):
        super().__init__(convert_charrefs=True)
        self.max_chars = max_chars
        self.text_chunks: list[str] = []
        self.current_length = 0
        self.discard_depth = 0

    def handle_starttag(self, tag: str, attrs: list[Tuple[str, str | None]]):
        tag_lower = tag.lower()
        if tag_lower in self.DISCARD_CONTAINER_TAGS:
            self.discard_depth += 1
        elif tag_lower == "body":
            # Safety reset for unclosed tags in head
            self.discard_depth = 0
        elif tag_lower in self.BLOCK_TAGS and self.current_length < self.max_chars:
            self.text_chunks.append("\n")

    def handle_endtag(self, tag: str):
        tag_lower = tag.lower()
        if tag_lower in self.DISCARD_CONTAINER_TAGS:
            if self.discard_depth > 0:
                self.discard_depth -= 1
        elif tag_lower in self.BLOCK_TAGS and self.current_length < self.max_chars:
            self.text_chunks.append("\n")

    def handle_data(self, data: str):
        if self.discard_depth == 0 and self.current_length < self.max_chars:
            cleaned = data.strip()
            if cleaned:
                # Discard raw prompt injection escape markers
                safe_text = cleaned.replace("<UNTRUSTED_", "&lt;UNTRUSTED_")
                self.text_chunks.append(safe_text + " ")
                self.current_length += len(safe_text) + 1

    def handle_comment(self, data: str):
        # Ignore comments completely
        pass


def safe_extract_text_from_html(
    html_content: bytes | str,
    max_bytes: int = DEFAULT_MAX_HTML_BYTES,
    max_chars: int = DEFAULT_MAX_EXTRACTED_CHARS,
) -> Tuple[str, int]:
    """Safely decode and parse HTML to extract visible text with strict bounding.

    Returns:
        Tuple of (cleaned_visible_text, original_byte_size)
    """
    if isinstance(html_content, bytes):
        byte_size = len(html_content)
        if byte_size > max_bytes:
            raise WaybackPayloadTooLargeError(
                f"Archived page content ({byte_size} bytes) exceeded maximum allowable size of {max_bytes} bytes."
            )
        try:
            html_str = html_content.decode("utf-8", errors="replace")
        except Exception:
            html_str = html_content.decode("latin-1", errors="replace")
    else:
        byte_size = len(html_content.encode("utf-8", errors="ignore"))
        if byte_size > max_bytes:
            raise WaybackPayloadTooLargeError(
                f"Archived page content ({byte_size} bytes) exceeded maximum allowable size of {max_bytes} bytes."
            )
        html_str = html_content

    parser = SafeHTMLTextStripper(max_chars=max_chars)
    try:
        parser.feed(html_str)
        parser.close()
    except Exception as e:
        logger.warning("HTMLParser encountered non-fatal syntax error: %s", type(e).__name__)

    raw_text = "".join(parser.text_chunks)
    # Normalize multiple whitespaces and excessive line breaks
    normalized_lines = [
        re.sub(r"[ \t]+", " ", line).strip()
        for line in raw_text.splitlines()
    ]
    # Remove excessive blank lines
    filtered_lines = [line for line in normalized_lines if line]
    final_text = "\n".join(filtered_lines)

    return final_text[:max_chars], byte_size
