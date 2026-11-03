# 🛡️ ShopShield BD

> **AI-Powered Purchase Promise & Payment Safety Assistant for Bangladesh Digital Commerce**  
> *Built for the **YUNet AIgnite Buildathon 2026***

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Google GenAI](https://img.shields.io/badge/Google_GenAI-SDK_2.0+-4285F4.svg?logo=google&logoColor=white)](https://github.com/googleapis/python-genai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**ShopShield BD** is an open-source consumer protection platform engineered to safeguard online shoppers in Bangladesh—particularly within the massive **Social Commerce (F-Commerce)** ecosystem across Facebook, Instagram, and WhatsApp.

### What ShopShield BD Is:
- An objective **purchase promise comparison tool** that cross-references a seller's public advertisement/caption against private chat conversations before payment.
- A **payment safety rules engine** that highlights advance payment demands, flags high-pressure urgency tactics, and gives clear buyer recommendations.
- A **practical question generator** providing tailored questions in simple Bangla for buyers to ask sellers before sending money.

### What ShopShield BD Is NOT:
- ❌ **NOT a scam classifier:** It never outputs fake "fraud probability scores" or subjective accusations against sellers.
- ❌ **NOT an arbitrary blocklist:** Legitimate practices in Bangladesh (such as asking for a ৳100–৳200 courier fee in advance) are recognized as normal f-commerce logistics, not flagged as fraud.

---

## 🎯 Feature Status & Scope

To ensure transparent engineering and buildathon integrity, features are explicitly divided into implemented, experimental, and planned capabilities:

### ✅ Implemented Features (Verified in Task 02 & Hardened)
- **Structured AI Extraction Service:** Uses the official `google-genai` Python SDK (`gemini-2.5-flash`) with strict Pydantic v2 schema validation. Supports **Bangla**, **English**, and **Banglish**.
- **Evidence Quote Verification & Nullification:** Validates that every extracted evidence quote strictly appears in the original text (accounting for unicode whitespace and Bengali punctuation). Hallucinated or unverified quotes are rejected, stripped from active values to prevent false contradictions, and surfaced to users as discarded claims.
- **Deterministic Contradiction Detection:** Strictly compares prices, Cash on Delivery availability, advance payments, return policies, and warranties. Requires verified evidence from both sides to issue a `CONTRADICTION`; otherwise marks ambiguous comparisons as `NEEDS_REVIEW`.
- **Payment Safety Rules Engine:** Evaluates payment risk levels:
  - Detects full advance payment demands on personal wallets.
  - Recognizes standard courier delivery fee advances (৳100–৳250) as normal commerce practice (*does NOT imply fraud*).
  - Flags high advance payment demands (> ৳250).
  - Identifies artificial urgency and sales pressure.
  - Highlights omitted return/warranty terms.
- **Buyer Verification Question Generator:** Generates actionable, copy-pasteable verification questions in clear Bangla (ক্রেতার জন্য যাচাইকারী প্রশ্নমালা).
- **Backend Reliability & Error Masking:** Configured request timeouts (30s) via `google-genai` `HttpOptions`, explicit 429 quota exhaustion and 504 gateway timeout handlers, and generic user-safe error masking for 500s that logs technical details internally without leaking customer text or API credentials.
- **Frontend Analysis Interface:** Dual-input responsive interface with sample scenarios, active input cancellation via `AbortController`, stale request protection, clear disclaimer that sample scenarios are simulations, and live backend health badge.
- **Automated Testing:** 25 unit, integration, and regression tests passing in Pytest.

### 🔍 Live AI Execution Status
- **With `GEMINI_API_KEY` configured:** The backend connects to Google Gemini via `google-genai` SDK and performs end-to-end extraction and promise comparison on live user requests.
- **Without `GEMINI_API_KEY` (Unconfigured mode):** The backend reports `"unconfigured (missing GEMINI_API_KEY)"` on `/health` (never claiming operational status without verification) and returns clean HTTP 503 guidance on `/api/v1/analyze`. All 25 automated regression tests execute offline without requiring an active key.

### 🧪 Experimental Features
- Constrained semantic inference for complex or multi-clause return policies.
- Screenshot upload extension point in API request schemas (`image_urls`).

### 🗺️ Planned Roadmap (Future Phases — Unimplemented)
- **Multimodal Screenshot OCR (Task 03):** Direct image upload and optical document extraction for Messenger and WhatsApp screenshots.
- **Courier Logistics Parity (Task 03):** Cross-referencing consignment codes with Steadfast, Pathao, and RedX tracking gateways to detect spoofed courier slips.
- **Digital Promise Pass (Task 03):** Downloadable PDF / QR-verified token summarizing agreed commitments.
- **Community Risk Signals (Task 04):** Crowdsourced scam report registry for repeat fraudulent numbers and fake Facebook pages.
- **DNCRP Dossier Export (Task 04):** One-click complaint packaging formatted according to Directorate of National Consumer Rights Protection guidelines.

---

## 🏗️ Monorepo Architecture

```
shopshield-bd/
├── backend/                   # FastAPI backend services
│   ├── app/
│   │   ├── main.py            # FastAPI entry point, CORS, root /health & /docs
│   │   ├── config.py          # Settings management with Pydantic BaseSettings
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes.py  # /health, /status, /analyze endpoints
│   │   ├── schemas/           # Pydantic v2 schemas
│   │   │   ├── analysis.py    # Request/Response payloads
│   │   │   ├── claims.py      # ExtractedClaims & SingleClaim
│   │   │   ├── comparison.py  # ComparisonItem & ContradictionStatus
│   │   │   ├── rules.py       # PaymentWarning & MissingInfoItem
│   │   │   └── health.py      # HealthResponse & ServiceStatus
│   │   └── services/          # Core business & AI logic
│   │       ├── ai_extractor.py        # google-genai extractor + evidence validator
│   │       ├── comparison_service.py  # Deterministic promise comparison
│   │       ├── rules_engine.py        # Payment safety rules & Bangla questions
│   │       └── analyzer.py            # Workflow orchestrator
│   ├── requirements.txt       # Production dependencies
│   └── requirements-dev.txt   # Development and test dependencies
├── frontend/                  # React 19 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── PurchasePromiseAnalyzer.tsx # Real-time interactive promise analyzer
│   │   │   ├── Navbar.tsx             # Navigation & live backend health badge
│   │   │   ├── Hero.tsx               # Value proposition & primary CTA
│   │   │   ├── ProblemSolution.tsx    # F-Commerce problem breakdown
│   │   │   ├── Features.tsx           # Feature showcase
│   │   │   ├── VerificationPreview.tsx# Architectural roadmap preview
│   │   │   ├── ArchitectureSection.tsx# Monorepo architecture visualizer
│   │   │   └── Footer.tsx             # Attributions and developer links
│   │   ├── App.tsx                    # Main layout
│   │   ├── main.tsx                   # React root
│   │   └── index.css                  # Tailwind utility styling
│   ├── vite.config.ts         # Vite bundler config
│   ├── tailwind.config.js     # Emerald/teal & navy color palette
│   └── package.json           # Frontend dependencies
├── docs/                      # Technical documentation
│   ├── architecture.md        # Deep-dive architecture and data flow
│   ├── api-specification.md   # Complete OpenAPI specification
│   ├── hackathon-vision.md    # Problem statement, DNCRP alignment, and roadmap
│   └── vercel-deployment.md   # Production Vercel dashboard & deployment guide
├── tests/                     # Automated testing suite
│   ├── conftest.py            # Pytest client fixtures
│   ├── test_health.py         # System health & docs tests
│   └── test_analysis.py       # 10 core promise analysis tests
├── .env.example               # Safe environment variable template
├── .gitignore                 # Excludes secrets, venvs, and build artifacts
├── pytest.ini                 # Pytest runner configuration
├── LICENSE                    # MIT License
└── README.md                  # Project root guide
```

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5, Vite 6, Tailwind CSS 3.4, Lucide React |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, Uvicorn (ASGI) |
| **AI / Multimodal** | Official `google-genai` Python SDK (`gemini-3.5-flash`) |
| **Deployment** | Vercel (Frontend SPA + Python Serverless Function) |
| **Testing** | Pytest, Starlette TestClient, ESLint 9, TypeScript compiler (`tsc`) |

---

## 🚀 Quick Start & Setup

### Prerequisites
- **Node.js** >= 18.x and **npm** >= 9.x
- **Python** >= 3.12 (or `uv` package manager)
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/naimNB/shopshield-bd.git
cd shopshield-bd
```

### 2. Configure Environment

Copy the example environment file to `.env`:

```bash
cp .env.example .env
```

Open `.env` and configure your Google Gemini API key:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.5-flash
```
*(Obtain a free key from [Google AI Studio](https://aistudio.google.com/)).*

---

### 3. Backend Setup

#### Using standard Python `venv`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
```

#### Or using `uv`:
```bash
uv venv --python 3.12 .venv
source .venv/bin/activate
uv pip install -r backend/requirements-dev.txt
```

#### Start the FastAPI Server:
```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

- **Health Probe:** [http://localhost:8000/health](http://localhost:8000/health)
- **Interactive Swagger Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

### 4. Frontend Setup

In a new terminal window:

```bash
cd frontend
npm install
npm run dev
```

- **Landing Page & Analyzer UI:** [http://localhost:5173](http://localhost:5173)

---

### 5. Production Deployment on Vercel

ShopShield BD is configured for seamless deployment as two connected Vercel projects:
- **`shopshield-bd` (Frontend):** Root Directory: `frontend`, Build: `npm run build`, Output: `dist`. Set `VITE_API_URL` to your backend URL.
- **`shopshield-bd-api` (Backend):** Root Directory: `.`, Serverless entrypoint: `api/index.py`. Set `GEMINI_API_KEY`, `ALLOWED_ORIGINS`, etc.

For exact dashboard settings, environment variables, and verification commands, see the [Vercel Deployment Guide](docs/vercel-deployment.md).

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests (Pytest)
```bash
# In the root directory with virtualenv active
pytest -v tests/
```

All 29 automated tests verify:
1. **Price contradiction:** Differing prices flagged as `CONTRADICTION` with high severity when supported by evidence.
2. **COD contradiction:** Ad promising COD while chat denies it flagged as `CONTRADICTION`.
3. **Return policy contradiction:** Offering returns in ad but denying in chat flagged as `CONTRADICTION`.
4. **Consistent promises:** Matching prices, COD, and warranty flagged as `CONSISTENT`.
5. **Missing information:** Omitted attributes marked as `INSUFFICIENT_INFORMATION` (never confused with contradiction).
6. **Legitimate advance delivery charge:** Standard courier fees (৳100–৳250) marked as `info` with clear explanation that this is normal practice.
7. **Bangla & Banglish inputs:** Accurate substring quote matching across Bangla and Banglish scripts.
8. **Unsupported extracted claims:** Claims with evidence not present in source text marked unsupported.
9. **AI API error handling:** Returns 503 when API key is missing, 502 on provider failure, 422 on short text. Never returns fake data.
10. **Quota exhaustion handling:** Explicit HTTP 429 when Gemini rate limits/quotas are exceeded.
11. **Timeout handling:** Explicit HTTP 504 when AI requests exceed the configured 30s timeout.
12. **Internal error masking:** 500 errors return a safe generic message without leaking customer text, DB info, or API keys.
13. **Unsupported claims do not trigger false contradictions:** Unverified prices and COD claims are discarded.
14. **Unsupported claims do not trigger false payment warnings:** Unverified advance payment claims are discarded.
15. **Evidence requirement for contradictions:** Price discrepancies without verified evidence quotes are downgraded to `NEEDS_REVIEW`.
16. **Edge cases in quotation verification:** Null, empty, and whitespace strings rejected.
17. **Health and OpenAPI specs:** Valid `/health`, `/status`, and `/openapi.json` endpoints.
18. **Vercel Serverless Entrypoints:** Root `api/index.py` and `backend/api/index.py` routing integrity.

### Run Frontend Lint & Production Build
```bash
cd frontend
npm run lint    # ESLint check (0 errors, 0 warnings)
npm run build   # TypeScript strict check + Vite production bundle
```

---

## 🔒 Security & Privacy Notice

- **No Fake Scores:** ShopShield BD does not present fabricated risk scores or simulated AI predictions.
- **Privacy First:** Text submitted for analysis is processed via transient API calls without persistent user data retention.
- **Secrets Management:** `.gitignore` excludes all `.env` files, credentials, and keys.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

Developed by **[naimNB](https://github.com/naimNB)** for the **YUNet AIgnite Buildathon 2026**.
