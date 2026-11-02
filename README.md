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

### ✅ Implemented Features (Working in Task 02)
- **Structured AI Extraction Service:** Uses the official `google-genai` Python SDK to extract standardized claims (Price, Currency, COD availability, Advance requirements, Return terms, Warranty, Delivery conditions, Urgency tactics). Supports **Bangla**, **English**, and **Banglish**.
- **Evidence Quote Verification:** Validates that extracted quotations actually occur in the source text to prevent model hallucination. Unmatched quotes are automatically flagged as unsupported.
- **Deterministic Contradiction Detection:** Evaluates commitments across prices, COD availability, advance fees, return periods, and warranty duration. Classifies each attribute as `CONTRADICTION`, `CONSISTENT`, `INSUFFICIENT_INFORMATION`, or `NEEDS_REVIEW`.
- **Payment Safety Rules Engine:** Evaluates payment risk levels:
  - Detects full advance payment demands on personal wallets.
  - Recognizes standard courier delivery fee advances (৳100–৳250) as normal commerce practice (*does NOT imply fraud*).
  - Flags high advance payment demands (> ৳250).
  - Identifies artificial urgency and sales pressure.
  - Highlights omitted return/warranty terms.
- **Buyer Verification Question Generator:** Generates actionable, copy-pasteable verification questions in clear Bangla (ক্রেতার জন্য যাচাইকারী প্রশ্নমালা).
- **Backend API:** `POST /api/v1/analyze`, `GET /health`, `GET /api/v1/status`, `GET /docs`.
- **Frontend Analysis Interface:** Dual-input responsive interface with 1-click sample scenarios, side-by-side promise cards, payment warnings, and copyable Bangla questions.
- **Automated Testing:** 17 unit and integration tests passing in Pytest.

### 🧪 Experimental Features
- Constrained semantic inference for complex or multi-clause return policies.
- Screenshot upload extension point in API request schemas (`image_urls`).

### 🗺️ Planned Roadmap (Future Phases)
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
│   └── hackathon-vision.md    # Problem statement, DNCRP alignment, and roadmap
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
| **AI / Multimodal** | Official `google-genai` Python SDK (`gemini-2.5-flash`) |
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
GEMINI_MODEL=gemini-2.5-flash
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

## 🧪 Testing & Quality Assurance

### Run Backend Tests (Pytest)
```bash
# In the root directory with virtualenv active
pytest -v tests/
```

All 17 automated tests verify:
1. **Price contradiction:** Differing prices flagged as `CONTRADICTION` with high severity.
2. **COD contradiction:** Ad promising COD while chat denies it flagged as `CONTRADICTION`.
3. **Return policy contradiction:** Offering returns in ad but denying in chat flagged as `CONTRADICTION`.
4. **Consistent promises:** Matching prices, COD, and warranty flagged as `CONSISTENT`.
5. **Missing information:** Omitted attributes marked as `INSUFFICIENT_INFORMATION` (never confused with contradiction).
6. **Legitimate advance delivery charge:** Standard courier fees (৳100–৳250) marked as `info` with clear explanation that this is normal practice.
7. **Bangla & Banglish inputs:** Accurate substring quote matching across Bangla and Banglish scripts.
8. **Unsupported extracted claims:** Claims with evidence not present in source text marked unsupported.
9. **AI API error handling:** Returns 503 when API key is missing, 502 on provider failure, 422 on short text. Never returns fake data.
10. **No hallucinated quotes:** Automated validator rejects hallucinated citations.
11. **Health and OpenAPI specs:** Valid `/health`, `/status`, and `/openapi.json` endpoints.

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
