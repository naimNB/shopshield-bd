# 🛡️ ShopShield BD

> **AI-Powered Purchase Promise & Payment Safety Assistant for Bangladesh Digital Commerce**  
> *Built for the **YUNet AIgnite Buildathon 2026***

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB.svg?logo=python&logoColor=white)](https://python.org)
[![Pytest](https://img.shields.io/badge/Pytest-Passing-0A9EDC.svg?logo=pytest&logoColor=white)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 📌 Overview

**ShopShield BD** is an open-source consumer protection platform engineered to safeguard online shoppers in Bangladesh—particularly within the massive **Social Commerce (F-Commerce)** ecosystem across Facebook, Instagram, and WhatsApp.

While social commerce has democratized micro-entrepreneurship in Bangladesh, the absence of formal marketplace contracts leaves buyers vulnerable to:
- **Advance Payment Fraud:** Demands for 50%–100% advance payments sent via personal bKash or Nagad numbers, followed by immediate seller blocking.
- **Promise Drift & Denials:** Verbal warranties, return guarantees, and condition promises made in private chat messages are rejected upon delivery.
- **Counterfeit & Delivery Tampering:** Delivery of fake goods via courier services without unboxing inspection permission, often accompanied by forged courier consignment receipts.

ShopShield BD introduces an AI-powered verification layer that transforms informal chat agreements into verifiable digital certificates, flags risky payment transfers, and validates logistics tracking.

---

## 🏗️ Monorepo Architecture

ShopShield BD is organized as a clean, modular monorepo:

```
shopshield-bd/
├── backend/                   # FastAPI backend services
│   ├── app/
│   │   ├── main.py            # FastAPI application entry point & CORS
│   │   ├── config.py          # Pydantic BaseSettings environment loader
│   │   ├── api/
│   │   │   └── v1/
│   │   │       └── routes.py  # /health, /status endpoints
│   │   └── schemas/
│   │       └── health.py      # HealthResponse & ServiceStatus Pydantic models
│   ├── requirements.txt       # Production dependencies
│   └── requirements-dev.txt   # Pytest and test client dependencies
├── frontend/                  # React 19 + Vite + Tailwind CSS frontend
│   ├── src/
│   │   ├── components/        # Navbar, Hero, ProblemSolution, Features,
│   │   │                      # VerificationPreview, ArchitectureSection, Footer
│   │   ├── App.tsx            # Main layout component
│   │   ├── main.tsx           # Application DOM mount
│   │   └── index.css          # Tailwind CSS styles & animations
│   ├── package.json           # Frontend dependencies & scripts
│   ├── vite.config.ts         # Vite bundler configuration
│   └── tailwind.config.js     # Brand Emerald and Dark Navy color system
├── docs/                      # Technical documentation & hackathon vision
│   ├── architecture.md        # Deep-dive architecture and data flow
│   ├── api-specification.md   # Complete OpenAPI specification
│   └── hackathon-vision.md    # Problem statement, DNCRP alignment, and roadmap
├── tests/                     # Automated backend test suite
│   ├── conftest.py            # Pytest test client fixtures
│   └── test_health.py         # Health, status, and OpenAPI smoke tests
├── .env.example               # Safe environment variable template
├── .gitignore                 # Excludes secrets, venvs, and build artifacts
├── pytest.ini                 # Pytest runner configuration
└── README.md                  # Project root guide
```

---

## ⚡ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript 5, Vite 6, Tailwind CSS 3.4, Lucide React |
| **Backend** | Python 3.12+, FastAPI, Pydantic v2, Uvicorn (ASGI) |
| **AI / Multimodal** | Google Gemini 2.5 Flash API (*Integration in Task 02*) |
| **Testing** | Pytest, Starlette TestClient, ESLint 9, TypeScript type checking |
| **Logistics Check** | Steadfast, Pathao, and RedX consignment schemas (*Planned*) |

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
*(Never commit `.env` containing sensitive credentials to Git).*

---

### 3. Backend Setup

#### Using standard Python `venv`:
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements-dev.txt
```

#### Or using `uv` (fastest):
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

- **Landing Page:** [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing & Quality Assurance

### Run Backend Tests (Pytest)
```bash
# In the root directory with virtualenv active
pytest -v tests/
```
All 5 automated tests verify:
- `GET /health` returns 200 with healthy status and service breakdown
- `GET /api/v1/health` matches root diagnostic contract
- `GET /` serves welcome index and docs metadata
- `GET /api/v1/status` returns hackathon phase details
- `GET /docs` and `GET /openapi.json` serve valid OpenAPI 3.1 documentation

### Run Frontend Lint & Production Build
```bash
cd frontend
npm run lint    # ESLint check
npm run build   # TypeScript type check + Vite production bundle
```

---

## 🎯 Hackathon Roadmap (YUNet AIgnite 2026)

- [x] **Task 01: Project Foundation & Monorepo Setup**
  - Clean monorepo structure (`frontend/`, `backend/`, `docs/`, `tests/`)
  - Modern, responsive React 19 + Tailwind CSS landing page
  - FastAPI `/health` endpoint and auto-generated `/docs`
  - Zero-secret `.gitignore` and `.env.example`
  - Automated smoke test and build pipeline passing
- [ ] **Task 02: Multimodal Chat & Promise Extraction Engine**
  - Integrate Google Gemini 2.5 Flash API
  - Extract structured terms from Messenger & WhatsApp screenshots
  - Implement `/api/v1/promises/audit`
- [ ] **Task 03: Payment Risk Radar & Courier Parity Verification**
  - bKash/Nagad P2P vs. Merchant validation rules
  - Steadfast/Pathao tracking ID integrity checks
  - Digital Promise Pass certificate generator
- [ ] **Task 04: Community Risk Signals & DNCRP Consumer Rights Dossier**
  - Community crowdsourced scam alert registry
  - Standardized export for formal consumer complaints
- [ ] **Task 05: Final Evaluation & Demo Deployment**

---

## 🔒 Security & Privacy Notice

- **No Fake Scores:** In compliance with ethical AI principles, ShopShield BD does not present fabricated risk scores or simulated AI predictions prior to model engine integration.
- **Privacy First:** Chat screenshots submitted for promise extraction are processed with privacy guardrails, with PII masking options.
- **Secrets Management:** Environment variables, API keys, and credentials are strictly excluded from source control.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 👤 Author

Developed by **[naimNB](https://github.com/naimNB)** for the **YUNet AIgnite Buildathon 2026**.
