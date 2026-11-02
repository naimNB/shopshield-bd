# ShopShield BD — System Architecture

**Project:** ShopShield BD — AI-Powered Purchase Promise & Payment Safety Assistant  
**Event:** YUNet AIgnite Buildathon 2026  
**Repository:** [https://github.com/naimNB/shopshield-bd](https://github.com/naimNB/shopshield-bd)

---

## 1. Executive Summary

In Bangladesh, over 60% of social media e-commerce transactions (F-Commerce) occur over unstructured Messenger and WhatsApp conversations. Buyers routinely suffer from three primary vulnerabilities:
1. **Advance Payment Fraud:** Demands for 50%–100% advance payments via personal bKash/Nagad/Rocket wallets, followed by seller ghosting.
2. **Promise Drift & Denials:** Verbal warranties and return agreements made in chat messages are rejected upon product defect.
3. **Counterfeit & Delivery Tampering:** Non-inspected parcels delivered with fake or spoofed courier slips (Steadfast, Pathao, RedX).

**ShopShield BD** provides an AI-augmented safety assistant that codifies purchase promises, evaluates payment transaction risks, verifies logistics integrity, and produces verifiable digital promise tokens.

---

## 2. Monorepo Organization

The project is structured as a modular, production-ready monorepo:

```
shopshield-bd/
├── backend/                   # High-performance Python backend service
│   ├── app/
│   │   ├── __init__.py        # Package versioning
│   │   ├── main.py            # FastAPI entry point, CORS, routers, /health
│   │   ├── config.py          # Settings management with Pydantic BaseSettings
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── __init__.py
│   │   │       └── routes.py  # Health and status endpoints
│   │   └── schemas/
│   │       ├── __init__.py
│   │       └── health.py      # HealthResponse and ServiceStatus schemas
│   ├── requirements.txt       # Production dependencies
│   └── requirements-dev.txt   # Development and test dependencies
├── frontend/                  # Modern React 19 web application
│   ├── src/
│   │   ├── components/        # Navbar, Hero, ProblemSolution, Features, Preview, Architecture, Footer
│   │   ├── App.tsx            # Main layout wrapper
│   │   ├── main.tsx           # React DOM root entry
│   │   └── index.css          # Tailwind CSS styling with dark palette
│   ├── index.html             # HTML5 document
│   ├── vite.config.ts         # Vite bundler configuration
│   ├── tailwind.config.js     # Brand Emerald and Dark Navy palette
│   ├── tsconfig.json          # TypeScript strict configuration
│   └── package.json           # Frontend dependencies and build scripts
├── docs/                      # Architectural and technical documentation
│   ├── architecture.md        # System architecture and data flow
│   ├── api-specification.md   # OpenAPI endpoints and contracts
│   └── hackathon-vision.md    # Buildathon problem statement and roadmap
├── tests/                     # Pytest automated testing suite
│   ├── conftest.py            # TestClient fixtures
│   └── test_health.py         # Smoke tests for health, status, and docs endpoints
├── .env.example               # Template for environment configuration
├── .gitignore                 # Exclusion rules for secrets, virtualenvs, and node_modules
├── pytest.ini                 # Pytest configuration and warning filters
└── README.md                  # Comprehensive root documentation
```

---

## 3. Component Details

### 3.1 Frontend (React 19 + Vite + Tailwind CSS)
- **Framework:** React 19 with TypeScript 5.
- **Styling:** Tailwind CSS with an emerald/teal trust palette and dark navy background.
- **Iconography:** Lucide React icons.
- **Build Tool:** Vite 6 with sub-second hot module replacement and production tree-shaking.
- **Safety Policy:** Displays interactive architectural and UX previews without generating simulated or misleading AI scores prior to engine integration.

### 3.2 Backend (FastAPI + Pydantic v2)
- **Framework:** FastAPI running on ASGI Uvicorn server.
- **Validation:** Pydantic v2 schemas providing strict request/response validation and OpenAPI 3.1 documentation generation.
- **Configuration:** `pydantic-settings` reading from `.env` with sensible development defaults.
- **Observability:** Health probe at `/health` and `/api/v1/health` providing service readiness status.
- **Documentation:** Interactive Swagger UI at `/docs` and ReDoc at `/redoc`.

### 3.3 AI Multimodal Engine (Planned for Task 02+)
- **Model:** Google Gemini Multimodal API (gemini-2.5-flash).
- **Capabilities:**
  - Multi-image OCR and text segmentation (Messenger screenshots, WhatsApp chats, paper memos).
  - Entity extraction: Seller identity, phone numbers, product model, agreed price, warranty duration, return window, courier terms.
  - Risk classification based on empirical Bangladesh commerce patterns (e.g., personal vs. merchant payment channel, unreasonable advance requests).

---

## 4. Security & Privacy

1. **Zero Secret Leakage:** `.gitignore` excludes all `.env` files, private keys (`.pem`, `.key`), credentials, and tokens.
2. **Stateless Analysis Option:** Chat screenshots can be processed in-memory without persistent user identifiable information (PII) retention.
3. **CORS Governance:** Backend restricts allowed origins to explicit frontend hosts.
