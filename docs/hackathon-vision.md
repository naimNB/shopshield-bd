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
  - Deploy responsive React 19 + Vite + Tailwind landing page with architectural preview.
  - Set up FastAPI backend with working `/health`, `/status`, and OpenAPI `/docs`.
  - Configure `.env.example`, secure `.gitignore`, and passing pytest smoke tests.
- [ ] **Task 02: Multimodal Chat & Promise Extraction Engine**
  - Integrate Google Gemini 2.5 Flash API with Python backend.
  - Implement `/api/v1/promises/audit` to accept multi-image chat screenshots.
  - Build structured extraction prompt and Pydantic schemas for purchase promise terms.
  - Connect frontend file upload interface to backend audit endpoint.
- [ ] **Task 03: Payment Risk Engine & Courier Parity Verification**
  - Implement heuristic rules engine for bKash/Nagad account categorization.
  - Integrate mock and sandbox courier tracking verification (Steadfast/Pathao).
  - Generate digital downloadable "Promise Pass" (PDF / QR code summary).
- [ ] **Task 04: Community Signal Registry & DNCRP Dossier Generator**
  - Community crowdsourced report submission and warning lookup.
  - One-click DNCRP complaint file export for consumer rights disputes.
- [ ] **Task 05: End-to-End Evaluation & Buildathon Demo Readiness**
  - Comprehensive integration tests, performance optimization, and final deployment.
