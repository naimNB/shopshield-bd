# ShopShield BD — API Specification (v1)

**Service:** ShopShield BD REST API  
**Base URL (Local):** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Interactive Swagger Docs:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`  
**OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 1. Endpoints

### 1.1 Analyze Purchase Promises & Detect Contradictions
- **Path:** `POST /api/v1/analyze`
- **Summary:** Analyze Purchase Promises & Detect Contradictions
- **Status:** **Implemented**
- **Description:** Compares an advertisement text against a conversation transcript to extract structured claims, detect factual discrepancies, evaluate payment safety, and generate buyer questions in Bangla.
- **Request Body (`application/json`):**
```json
{
  "advertisement_text": "Special Offer! Wireless Earbuds only 1200 Tk. Cash on delivery available. 7 days replacement. 1 year warranty.",
  "seller_chat_text": "Hello, price is 1500 Tk. Send 200 Tk advance to 017XXXXXXXX via bKash to confirm booking. Rest on COD.",
  "image_urls": null
}
```
- **Response `200 OK` (`application/json`):**
```json
{
  "status": "success",
  "advertisement_claims": {
    "source_type": "advertisement",
    "product_name": "Wireless Earbuds",
    "price": 1200.0,
    "currency": "BDT",
    "price_evidence": "only 1200 Tk",
    "cod_available": true,
    "cod_evidence": "Cash on delivery available",
    "advance_payment_required": null,
    "advance_payment_amount": null,
    "advance_payment_purpose": null,
    "advance_payment_evidence": null,
    "payment_methods": [],
    "payment_methods_evidence": null,
    "return_policy_available": true,
    "return_policy_terms": "7 days replacement",
    "return_policy_evidence": "7 days replacement",
    "warranty_available": true,
    "warranty_terms": "1 year warranty",
    "warranty_evidence": "1 year warranty",
    "delivery_conditions": null,
    "delivery_evidence": null,
    "urgency_or_pressure": null,
    "urgency_evidence": null,
    "claims_list": []
  },
  "seller_chat_claims": {
    "source_type": "seller_chat",
    "product_name": null,
    "price": 1500.0,
    "currency": "BDT",
    "price_evidence": "price is 1500 Tk",
    "cod_available": true,
    "cod_evidence": "Rest on COD",
    "advance_payment_required": true,
    "advance_payment_amount": 200.0,
    "advance_payment_purpose": "delivery_charge",
    "advance_payment_evidence": "Send 200 Tk advance to 017XXXXXXXX via bKash to confirm booking",
    "payment_methods": ["bKash", "COD"],
    "payment_methods_evidence": "via bKash",
    "return_policy_available": null,
    "return_policy_terms": null,
    "return_policy_evidence": null,
    "warranty_available": null,
    "warranty_terms": null,
    "warranty_evidence": null,
    "delivery_conditions": null,
    "delivery_evidence": null,
    "urgency_or_pressure": null,
    "urgency_evidence": null,
    "claims_list": []
  },
  "comparison_results": [
    {
      "field": "price",
      "field_label": "Product Price",
      "status": "CONTRADICTION",
      "ad_evidence": "only 1200 Tk",
      "chat_evidence": "price is 1500 Tk",
      "explanation": "Price contradiction: Advertisement advertised ৳1,200.00, but seller in chat quoted ৳1,500.00 (difference: ৳300.00).",
      "severity": "high"
    },
    {
      "field": "cod_availability",
      "field_label": "Cash on Delivery (COD)",
      "status": "CONSISTENT",
      "ad_evidence": "Cash on delivery available",
      "chat_evidence": "Rest on COD",
      "explanation": "Cash on delivery status is consistent: Both sources indicate COD is available.",
      "severity": "info"
    }
  ],
  "has_contradictions": true,
  "contradiction_count": 1,
  "needs_review_count": 0,
  "payment_warnings": [
    {
      "type": "ADVANCE_DELIVERY_CHARGE",
      "severity": "info",
      "supporting_evidence": "Send 200 Tk advance to 017XXXXXXXX via bKash to confirm booking",
      "explanation": "The seller requested ৳200.00 advance, which corresponds to standard courier delivery charges in Bangladesh. Bangladeshi online shops commonly request delivery fees in advance to safeguard against uncollected returns. This is normal practice and does not imply fraud.",
      "suggested_buyer_action": "কুরিয়ার চার্জ অগ্রিম পাঠানোর আগে বিক্রেতার ফেসবুক পেজ/শপের রিভিউ দেখুন এবং সম্ভব হলে অফিসিয়াল মার্চেন্ট একাউন্টে পেমেন্ট করুন।"
    }
  ],
  "missing_information": [],
  "buyer_questions_bangla": [
    "অগ্রিম কুরিয়ার চার্জ পাঠানোর জন্য আপনাদের কি অফিসিয়াল বিকাশ/নগদ মার্চেন্ট নম্বর বা পেমেন্ট লিংক আছে?",
    "কুরিয়ার থেকে পার্সেল রিসিভ করার সময় ডেলিভারিম্যানের সামনে খুলে দেখার (Open-box inspection) অনুমতি থাকবে কি?"
  ],
  "metadata": {
    "timestamp": "2026-11-02T17:30:00.000Z",
    "model_used": "gemini-2.5-flash",
    "ad_char_count": 105,
    "chat_char_count": 92,
    "execution_time_ms": 780.5
  }
}
```
- **Error Responses:**
  - `422 Unprocessable Entity`: Input is too short (< 5 characters) or invalid.
  - `413 Request Entity Too Large`: Input exceeds 15,000 characters.
  - `503 Service Unavailable`: `GEMINI_API_KEY` is not configured on the backend.
  - `502 Bad Gateway`: AI provider failure, timeout, or invalid output format.

---

### 1.2 Root Health Check
- **Path:** `GET /health`
- **Summary:** Root Health Check
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "project": "ShopShield BD",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-11-02T17:30:00.000Z",
  "services": {
    "api": "operational",
    "database": "configured",
    "ai_engine": "operational"
  },
  "docs_url": "/docs"
}
```

### 1.3 Service Index
- **Path:** `GET /`
- **Summary:** Service Index
- **Response `200 OK`:**
```json
{
  "message": "Welcome to ShopShield BD API — Purchase Promise & Payment Safety Assistant",
  "event": "YUNet AIgnite Buildathon 2026",
  "documentation": "/docs",
  "health": "/health",
  "api_v1_health": "/api/v1/health",
  "api_v1_analyze": "/api/v1/analyze"
}
```

### 1.4 Platform Status
- **Path:** `GET /api/v1/status`
- **Summary:** Platform Status
- **Response `200 OK`:**
```json
{
  "project": "ShopShield BD",
  "phase": "Task 02 — Purchase Promise Extraction & Contradiction Detection",
  "event": "YUNet AIgnite Buildathon 2026",
  "ai_engine": {
    "model": "gemini-2.5-flash",
    "configured": true
  },
  "features": {
    "purchase_promise_extraction": "implemented",
    "contradiction_detection": "implemented",
    "payment_safety_advisory": "implemented",
    "buyer_questions_generator": "implemented",
    "multimodal_screenshot_ocr": "planned (Task 03)",
    "courier_parity_verification": "planned (Task 03)",
    "community_risk_signals": "planned (Task 04)"
  },
  "documentation": "/docs"
}
```
