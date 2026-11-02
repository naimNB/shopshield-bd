# ShopShield BD — Hackathon Vision & Roadmap

**Hackathon:** YUNet AIgnite Buildathon 2026  
**Track:** AI for Consumer Protection & Digital Commerce Safety  
**Project Lead:** naimNB  
**Date:** November 2026  

---

## 1. The Core Problem

Bangladesh is witnessing unprecedented growth in social-first e-commerce (commonly termed **F-Commerce**). Driven by Facebook Pages, Groups, Instagram shops, and WhatsApp catalogs, millions of transactions take place every month without the governance of formal marketplace platforms (e.g. Daraz, Chaldal).

While this empowers thousands of micro-entrepreneurs, it creates severe consumer vulnerabilities:

1. **Advance Payment Traps:** Scammers open sleek Facebook pages, run targeted ads for trending gadgets or clothing, ask for full or partial advance payment via personal bKash/Nagad accounts, and vanish after receiving funds.
2. **Broken Verbal Promises:** Sellers readily commit to "1 year replacement warranty", "free returns", or "original export quality" inside private chats, but renege once delivery is completed.
3. **Counterfeit Delivery without Inspection:** Couriers frequently deliver parcels under conditions where opening the parcel before payment is forbidden by the courier policy unless the merchant expressly enables it.

---

## 2. The ShopShield BD Solution

ShopShield BD acts as an AI-powered safety layer that empowers buyers **before** money changes hands:

1. **Multimodal Promise Auditor:** An AI engine powered by Google Gemini that analyzes messy chat screenshots, extracts every agreed promise, and codifies it into a tamper-evident digital certificate.
2. **Payment Safety Advisory:** An intelligent rulebook that flags risky payment demands (such as full advance requests on personal bKash wallets) and advises safe payment practices.
3. **Logistics Parity Check:** Integration with Bangladesh courier APIs (Steadfast, Pathao, RedX) to prevent fake parcel tracking numbers.
4. **DNCRP Legal Readiness:** In cases where fraud occurs, ShopShield BD packages chat logs, promise tokens, and payment receipts into a standardized dossier aligned with Directorate of National Consumer Rights Protection (DNCRP) guidelines.

---

## 3. Phased Implementation Roadmap

- [x] **Task 01: Project Foundation & Monorepo Setup (Completed)**
  - Initialize clean monorepo (`frontend/`, `backend/`, `docs/`, `tests/`).
  - Deploy responsive React 19 + Vite + Tailwind landing page.
  - Set up FastAPI backend with working `/health`, `/status`, and OpenAPI `/docs`.
  - Configure `.env.example`, secure `.gitignore`, and passing pytest smoke tests.
- [x] **Task 02: Purchase Promise Extraction & Contradiction Detection (Completed)**
  - Integrated official `google-genai` Python SDK with Gemini 2.5 Flash.
  - Implemented structured Pydantic extraction for price, COD, advance payments, return policy, warranty, delivery terms, and urgency tactics (supporting Bangla, English, Banglish).
  - Built strict Evidence Quote Verification rejecting hallucinated citations.
  - Implemented deterministic Contradiction Detection (`CONTRADICTION`, `CONSISTENT`, `INSUFFICIENT_INFORMATION`, `NEEDS_REVIEW`).
  - Created deterministic Payment Safety Rules Engine distinguishing normal courier advances (not fraud) from high-risk full advance demands.
  - Implemented practical Buyer Verification Question generator in simple Bangla.
  - Deployed `POST /api/v1/analyze` endpoint with error handling for missing keys, quotas, and short/oversized payloads.
  - Created interactive frontend analyzer dashboard with 1-click test scenarios and side-by-side comparison cards.
  - Authored comprehensive test suite (17 pytest tests) covering all 10 evaluation criteria.
- [ ] **Task 03: Multimodal Screenshot OCR & Logistics Parity Verification**
  - Implement direct image upload and OCR preprocessing for Messenger and WhatsApp screenshots.
  - Integrate Steadfast, Pathao, and RedX consignment tracking schemas.
  - Generate digital downloadable "Promise Pass" (tamper-evident PDF/QR token).
- [ ] **Task 04: Community Signal Registry & DNCRP Dossier Generator**
  - Community crowdsourced report submission and warning lookup.
  - One-click DNCRP complaint file export for formal consumer rights dispute filing.
- [ ] **Task 05: End-to-End Evaluation & Demo Packaging**
  - Live deployment, demo recording, and submission readiness.
