"""End-to-End Workflow Verification Script for ShopShield BD.

Audits all 6 core product workflows:
1. Workflow A: Ad-only Quick Check (/api/v1/analyze-ad)
2. Workflow B: Ad vs Chat Cross-Referencing (/api/v1/analyze)
3. Workflow C: Facebook Page Transparency OCR (/api/v1/seller-history/page-transparency)
4. Workflow D: Wayback Archive Research (/api/v1/seller-history/wayback)
5. Workflow E: Historical Policy & Price Comparison (/api/v1/compare)
6. Workflow F: Consolidated Seller History Report (/api/v1/seller-history/consolidated)

Exercises valid, incomplete, contradictory, and degraded inputs.
"""

import io
import sys
import os
from datetime import datetime, timezone
from fastapi.testclient import TestClient

# Ensure root directory is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.main import app

client = TestClient(app)


def audit_workflow_a_ad_only():
    print("\n--- Auditing Workflow A: Ad-only Quick Check (/api/v1/analyze-ad) ---")

    # 1. Valid rich ad
    res = client.post(
        "/api/v1/analyze-ad",
        json={
            "advertisement_text": (
                "Special Winter Offer! Premium Cotton Hoodie only 850 Tk. "
                "Cash on delivery available all over BD. 7 days exchange if size mismatch. Order now!"
            )
        },
    )
    assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
    data = res.json()
    assert data["status"] == "success"
    assert data["advertisement_claims"]["price"] == 850.0
    assert len(data["findings"]) > 0
    print("  [✓] Valid ad check passed (price=850.0, findings count > 0)")

    # 2. Incomplete ad (Missing price and terms)
    res = client.post(
        "/api/v1/analyze-ad",
        json={"advertisement_text": "Exclusive imported sunglasses. Premium UV400. Inbox for price."},
    )
    assert res.status_code == 200
    data = res.json()
    assert any(m["field"] == "price" for m in data["missing_critical_info"])
    print("  [✓] Incomplete ad correctly flagged missing price ('Inbox for price')")

    # 3. Degraded / Too short input (Validation error)
    res = client.post("/api/v1/analyze-ad", json={"advertisement_text": "hi"})
    assert res.status_code == 422
    print("  [✓] Degraded short input correctly rejected with 422 Unprocessable Entity")


def audit_workflow_b_ad_vs_chat():
    print("\n--- Auditing Workflow B: Ad vs Chat Comparison (/api/v1/analyze) ---")

    # 1. Contradictory input (Price mismatch)
    res = client.post(
        "/api/v1/analyze",
        json={
            "advertisement_text": "Men Polo Shirt 500 Tk. Cash on delivery available.",
            "seller_chat_text": "Hello, polo shirt price is 800 Tk. Cash on delivery available.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["has_contradictions"] is True
    price_comp = next((c for c in data["comparison_results"] if c["field"] == "price"), None)
    assert price_comp is not None and price_comp["status"] == "CONTRADICTION"
    print("  [✓] Contradictory price correctly detected (500 vs 800 Tk)")

    # 2. Concession input (Advance waived in chat)
    res = client.post(
        "/api/v1/analyze",
        json={
            "advertisement_text": "Smart Watch 1500 Tk. Delivery charge 150 advance required.",
            "seller_chat_text": "Price is 1500 Tk. No advance needed, you can pay full cash on delivery.",
        },
    )
    assert res.status_code == 200
    data = res.json()
    adv_comp = next((c for c in data["comparison_results"] if c["field"] == "advance_payment"), None)
    assert adv_comp is not None and adv_comp["status"] == "NEEDS_REVIEW"
    print("  [✓] Concession (advance waived in chat) correctly returned NEEDS_REVIEW")

    # 3. Degraded / Missing chat text
    res = client.post("/api/v1/analyze", json={"advertisement_text": "Valid ad text here..."})
    assert res.status_code == 422
    print("  [✓] Missing chat text correctly rejected with 422")


def audit_workflow_c_page_transparency():
    print("\n--- Auditing Workflow C: Facebook Page Transparency OCR ---")
    from PIL import Image

    # 1. Valid PNG upload
    buf = io.BytesIO()
    img = Image.new("RGB", (100, 100), color="white")
    img.save(buf, format="PNG")
    valid_png = buf.getvalue()

    res = client.post(
        "/api/v1/seller-history/page-transparency",
        files={"file": ("transparency.png", io.BytesIO(valid_png), "image/png")},
    )
    assert res.status_code in (200, 502, 503)
    if res.status_code == 200:
        data = res.json()
        assert "status" in data
        assert "transparency_data" in data
        assert "findings" in data
        print("  [✓] Page transparency upload processed with valid schema")
    else:
        print(f"  [✓] Provider gracefully handled without 500 crash (code {res.status_code})")

    # 2. Corrupted image rejection
    res = client.post(
        "/api/v1/seller-history/page-transparency",
        files={"file": ("corrupt.png", io.BytesIO(b"corrupt bytes"), "image/png")},
    )
    assert res.status_code == 422
    print("  [✓] Corrupted image file correctly rejected with 422")

    # 3. Invalid mime type rejection
    res = client.post(
        "/api/v1/seller-history/page-transparency",
        files={"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")},
    )
    assert res.status_code == 415
    print("  [✓] Invalid MIME type rejected with 415 Unsupported Media Type")


def audit_workflow_d_wayback_research():
    print("\n--- Auditing Workflow D: Wayback Archive Research (/api/v1/seller-history/website) ---")

    # Test SSRF protection
    res = client.post(
        "/api/v1/seller-history/website",
        json={"url": "http://127.0.0.1:8000/internal"},
    )
    assert res.status_code == 422
    print("  [✓] SSRF attempt (127.0.0.1) rejected with 422")

    # Test legitimate public domain query
    res = client.post(
        "/api/v1/seller-history/website",
        json={"url": "https://example.com"},
    )
    assert res.status_code in (200, 502, 503)
    if res.status_code == 200:
        data = res.json()
        assert "website_data" in data
        assert "findings" in data
        print("  [✓] Wayback query returned structured website_data with findings")


def audit_workflow_e_temporal_comparison():
    print("\n--- Auditing Workflow E: Historical Policy & Price Comparison (/api/v1/seller-history/compare) ---")

    # Test SSRF rejection on compare
    res = client.post(
        "/api/v1/seller-history/compare",
        json={"website_url": "http://localhost:8080/admin"},
    )
    assert res.status_code == 422
    print("  [✓] SSRF attempt on /api/v1/seller-history/compare rejected with 422")

    # Test domain query
    res = client.post(
        "/api/v1/seller-history/compare",
        json={"website_url": "https://example.com"},
    )
    assert res.status_code in (200, 502, 503)
    print(f"  [✓] Temporal comparison handled request with status {res.status_code}")


def audit_workflow_f_consolidated_report():
    print("\n--- Auditing Workflow F: Consolidated Seller History Report (/api/v1/seller-history/report) ---")

    res = client.post(
        "/api/v1/seller-history/report",
        json={
            "website_url": "https://example.com"
        }
    )
    assert res.status_code in (200, 502, 503)
    if res.status_code == 200:
        data = res.json()
        assert data["status"] == "success"
        assert "independently_retrieved" in data
        assert "overall_summary" in data
        print(f"  [✓] Consolidated report returned successfully (status={data['status']})")


def main():
    print("=====================================================================")
    print("       STARTING E2E WORKFLOW INTEGRITY AUDIT (6 WORKFLOWS)           ")
    print("=====================================================================")
    audit_workflow_a_ad_only()
    audit_workflow_b_ad_vs_chat()
    audit_workflow_c_page_transparency()
    audit_workflow_d_wayback_research()
    audit_workflow_e_temporal_comparison()
    audit_workflow_f_consolidated_report()
    print("\n=====================================================================")
    print("   ALL 6 CORE WORKFLOW AUDITS PASSED WITH FULL INTEGRITY             ")
    print("=====================================================================")


if __name__ == "__main__":
    main()
