# ShopShield BD — System Architecture

**Project:** ShopShield BD — AI-Powered Purchase Promise & Payment Safety Assistant  
**Event:** YUNet AIgnite Buildathon 2026  
**Repository:** [https://github.com/naimNB/shopshield-bd](https://github.com/naimNB/shopshield-bd)  
**Author:** naimNB  

---

## 1. System Mission & Boundary

ShopShield BD assists Bangladeshi consumers before they send payments to social commerce (F-Commerce) sellers.

### Architectural Boundary:
- **Core Function:** Extract explicit commercial promises from advertisements and private conversations, detect factual contradictions, evaluate payment safety rules, and generate practical verification questions.
- **Explicit Non-Goal:** This system is **NOT** a scam classifier. It does not predict fraud probabilities, assign subjective seller risk scores, or level accusations against merchants.

---

## 2. Monorepo Organization

```
shopshield-bd/
├── backend/                   # Python FastAPI service
│   ├── app/
│   │   ├── main.py            # FastAPI entry point, CORS, root /health & /docs
│   │   ├── config.py          # Settings management with Pydantic BaseSettings
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes.py  # /health, /status, /analyze endpoints
│   │   ├── schemas/           # Pydantic v2 data models
│   │   │   ├── analysis.py    # Request/Response models & AnalysisMetadata
│   │   │   ├── claims.py      # ExtractedClaims & SingleClaim
│   │   │   ├── comparison.py  # ComparisonItem & ContradictionStatus
│   │   │   ├── rules.py       # PaymentWarning & MissingInfoItem
│   │   │   └── health.py      # HealthResponse & ServiceStatus
│   │   └── services/          # Core business & AI logic
│   │       ├── ai_extractor.py        # google-genai extractor + evidence validator
│   │       ├── comparison_service.py  # Deterministic promise comparison
│   │       ├── rules_engine.py        # Payment safety rules & Bangla questions
│   │       └── analyzer.py            # Orchestrator
│   ├── requirements.txt       # Production dependencies
│   └── requirements-dev.txt   # Test dependencies
├── frontend/                  # React 19 + TypeScript + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── PurchasePromiseAnalyzer.tsx # Real-time analysis UI
│   │   │   ├── Navbar.tsx             # Navigation & backend health indicator
│   │   │   ├── Hero.tsx               # Value proposition & primary CTA
│   │   │   ├── ProblemSolution.tsx    # Problem vs. Protection breakdown
│   │   │   ├── Features.tsx           # Feature cards
│   │   │   ├── VerificationPreview.tsx# Architectural roadmap preview
│   │   │   ├── ArchitectureSection.tsx# Monorepo visualizer
│   │   │   └── Footer.tsx             # Attributions and links
│   │   ├── App.tsx                    # Main layout
│   │   ├── main.tsx                   # DOM mount
│   │   └── index.css                  # Tailwind styles
│   ├── vite.config.ts         # Vite bundler config
│   ├── tailwind.config.js     # Brand colors
│   └── package.json           # Dependencies and build scripts
├── docs/                      # Technical documentation
│   ├── architecture.md        # This document
│   ├── api-specification.md   # OpenAPI contract
│   └── hackathon-vision.md    # Phased buildathon roadmap
├── tests/                     # Automated Pytest suite
│   ├── conftest.py            # TestClient fixtures
│   ├── test_health.py         # System health tests
│   └── test_analysis.py       # 10 core analysis tests
├── .env.example               # Safe environment configuration template
├── .gitignore                 # Excludes secrets, venvs, and build artifacts
├── pytest.ini                 # Pytest runner configuration
├── LICENSE                    # MIT License
└── README.md                  # Project root guide
```

---

## 3. Data Flow & Processing Pipeline

```
[Buyer Input]
     │
     ├── 1. Advertisement Text (Facebook Post / Caption)
     └── 2. Seller Chat Text (Messenger / WhatsApp Conversation)
     │
     ▼
[POST /api/v1/analyze]
     │
     ├── Step 1: Input Validation
     │     └── Check length (5 to 15,000 characters)
     │
     ├── Step 2: AI Claim Extraction (AIExtractorService)
     │     ├── google-genai SDK call (Gemini 2.5 Flash)
     │     ├── Prompt tailored for Bangla, English, and Banglish
     │     ├── Structured output validated into ExtractedClaims Pydantic schema
     │     └── Evidence Quote Verification (strips/flags quotes not in source text)
     │
     ├── Step 3: Deterministic Comparison (ComparisonService)
     │     ├── Price Comparison (Numeric tolerance)
     │     ├── Cash on Delivery (Explicit boolean check)
     │     ├── Advance Payment (Zero-advance vs. demand)
     │     ├── Return Policy (Return offered vs. denied)
     │     ├── Warranty (Warranty promised vs. denied)
     │     └── Delivery Conditions (Free vs. paid, inspection allowed)
     │     └── Output: CONTRADICTION | CONSISTENT | INSUFFICIENT_INFO | NEEDS_REVIEW
     │
     ├── Step 4: Payment Safety Rules (PaymentRulesEngine)
     │     ├── Detects full advance payment demands (Warning)
     │     ├── Identifies standard courier fee advances (Info, not fraud)
     │     ├── Flags high advance payment demands (Caution)
     │     ├── Detects artificial urgency / pressure
     │     ├── Surfaces omitted terms (Missing Information)
     │     └── Generates practical Bangla Buyer Verification Questions
     │
     ▼
[AnalyzeResponse JSON] -> [React 19 Frontend Dashboard]
```

---

## 4. Feature Taxonomy: Implemented vs. Planned

| Feature | Category | Implementation Status |
|---|---|---|
| **AI Claim Extraction** | Core | **Implemented** (google-genai SDK, Gemini 2.5 Flash) |
| **Evidence Validation** | Quality Assurance | **Implemented** (Substring quotation verification) |
| **Contradiction Detection** | Analysis | **Implemented** (Deterministic comparison) |
| **Payment Safety Rules** | Advisory | **Implemented** (Rules engine with buyer actions) |
| **Bangla Buyer Questions** | Consumer Aid | **Implemented** (Context-aware Bengali question generator) |
| **Interactive UI** | Frontend | **Implemented** (Dual text areas, sample scenarios) |
| **API Endpoints** | Backend | **Implemented** (`/api/v1/analyze`, `/health`, `/status`) |
| **Screenshot OCR** | Multimodal | *Planned (Task 03)* |
| **Courier API Parity** | Logistics | *Planned (Task 03)* |
| **Promise Pass PDF** | Verification | *Planned (Task 03)* |
| **Community Risk Database**| Crowdsourcing | *Planned (Task 04)* |
| **DNCRP Dossier Export** | Legal Readiness | *Planned (Task 04)* |

---

## 5. Security & Privacy Model

1. **Zero Secret Leakage:** Gemini API keys are never exposed in responses or client code. Frontend uses an environment-configurable `VITE_API_URL` pointing only to the backend proxy.
2. **Stateless Processing:** Input text is evaluated on-the-fly without persistent database storage of chat transcripts.
3. **Evidence Integrity:** Automated quote verification prevents hallucinated statements from being attributed to either party.
4. **CORS Hardening:** Configurable allowed origins preventing unauthorized cross-origin requests.
