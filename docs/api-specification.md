# ShopShield BD — API Specification (v1)

**Service:** ShopShield BD REST API  
**Base URL (Local):** `http://localhost:8000`  
**API Prefix:** `/api/v1`  
**Interactive Docs:** `http://localhost:8000/docs`  
**ReDoc:** `http://localhost:8000/redoc`  
**OpenAPI JSON:** `http://localhost:8000/openapi.json`

---

## 1. System Endpoints (Implemented in Task 01)

### 1.1 Root Health Check
- **Path:** `GET /health`
- **Summary:** Root Health Check
- **Description:** Direct health endpoint suitable for container orchestration health checks and load balancer probes.
- **Response `200 OK`:**
```json
{
  "status": "healthy",
  "project": "ShopShield BD",
  "version": "0.1.0",
  "environment": "development",
  "timestamp": "2026-11-02T16:30:00.000000Z",
  "services": {
    "api": "operational",
    "database": "configured",
    "ai_engine": "standby"
  },
  "docs_url": "/docs"
}
```

### 1.2 API v1 Health Check
- **Path:** `GET /api/v1/health`
- **Summary:** System Health & Diagnostic Check
- **Description:** Returns the operational status and subsystem readiness under the versioned route.
- **Response `200 OK`:** Same as Root Health Check schema.

### 1.3 Service Index
- **Path:** `GET /`
- **Summary:** Root Welcome & Index
- **Response `200 OK`:**
```json
{
  "message": "Welcome to ShopShield BD API — Purchase Promise & Payment Safety Assistant",
  "event": "YUNet AIgnite Buildathon 2026",
  "documentation": "/docs",
  "health": "/health",
  "api_v1": "/api/v1/health"
}
```

### 1.4 Platform Status
- **Path:** `GET /api/v1/status`
- **Summary:** Platform Status Summary
- **Response `200 OK`:**
```json
{
  "project": "ShopShield BD",
  "phase": "Foundation & Monorepo Setup (Task 01)",
  "event": "YUNet AIgnite Buildathon 2026",
  "features": {
    "purchase_promise_audit": "planned",
    "payment_safety_advisory": "planned",
    "multimodal_ocr_verification": "planned",
    "community_risk_signals": "planned"
  },
  "documentation": "/docs"
}
```

---

## 2. Planned Multimodal AI Endpoints (Scheduled for Task 02+)

### 2.1 Promise Audit & Screenshot Extraction
- **Path:** `POST /api/v1/promises/audit`
- **Method:** `multipart/form-data`
- **Payload:**
  - `screenshots`: List of image files (PNG/JPEG) containing chat or invoice photos.
  - `seller_identifier`: Optional Facebook page URL or phone number.
- **Expected Response Schema (Draft):**
```json
{
  "token_id": "SSP-2026-DH-XXXX",
  "extracted_promise": {
    "product_name": "string",
    "agreed_price_bdt": 0.0,
    "warranty_duration": "string",
    "return_policy": "string",
    "advance_required_bdt": 0.0,
    "delivery_terms": "string"
  },
  "payment_advisory": {
    "account_type": "personal_p2p | merchant",
    "risk_level": "low | medium | high",
    "advisory_rules": ["string"]
  },
  "verification_status": "audited"
}
```

### 2.2 Courier Parity Verification
- **Path:** `POST /api/v1/courier/verify`
- **Method:** `application/json`
- **Payload:**
```json
{
  "courier_provider": "steadfast | pathao | redx",
  "consignment_id": "string",
  "expected_recipient_phone": "string"
}
```
