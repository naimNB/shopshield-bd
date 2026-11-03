# 🚀 Vercel Production Deployment Guide — ShopShield BD

This guide outlines the production deployment of **ShopShield BD** onto Vercel using the monorepo repository ([https://github.com/naimNB/shopshield-bd](https://github.com/naimNB/shopshield-bd)).

Because ShopShield BD consists of a React 19 frontend and a FastAPI Python backend, it is deployed as **two decoupled Vercel projects** connected to the same GitHub repository:

| Project Name | Role | Technology | Vercel Root Directory |
|---|---|---|---|
| **`shopshield-bd`** | Frontend Web App | React 19 + Vite + Tailwind | `frontend` |
| **`shopshield-bd-api`** | Backend API | Python 3.12 + FastAPI | `.` (Repo Root) |

---

## 📦 Project 1: Frontend Deployment (`shopshield-bd`)

### 1. Create Project in Vercel Dashboard
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select your repository: `naimNB/shopshield-bd`.
3. In **Project Name**, enter: `shopshield-bd`.

### 2. Configure Build & Root Directory
- **Framework Preset:** `Vite`
- **Root Directory:** Click **Edit** and select `frontend`.
- **Build Command:** `npm run build` (Default)
- **Output Directory:** `dist` (Default)
- **Install Command:** `npm install` (Default)

### 3. Environment Variables
Add the following environment variable under the **Environment Variables** section:

| Variable Name | Example Production Value | Purpose |
|---|---|---|
| `VITE_API_URL` | `https://shopshield-bd-api.vercel.app` | Points frontend to the deployed backend URL |

> [!IMPORTANT]
> Never set `GEMINI_API_KEY` on the frontend project. Gemini API calls must only be executed securely on the serverless backend.

### 4. Deploy
Click **Deploy**. Once built, your frontend will be available at:  
`https://shopshield-bd.vercel.app` (or your assigned Vercel URL).

---

## ⚡ Project 2: Backend API Deployment (`shopshield-bd-api`)

### 1. Create Project in Vercel Dashboard
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New...** → **Project**.
2. Select the same repository: `naimNB/shopshield-bd`.
3. In **Project Name**, enter: `shopshield-bd-api`.

### 2. Configure Build & Root Directory
- **Framework Preset:** `Other`
- **Root Directory:** Leave as `.` (Repository Root).
  > **Why repository root?** The FastAPI codebase imports `backend.app.*` from the repository root. Vercel automatically discovers `api/index.py`, installs dependencies from `requirements.txt`, and applies the 60s execution timeout defined in `vercel.json`.
- **Build & Output Settings:** Leave default (No build command needed for Python serverless functions).

### 3. Environment Variables
Add the following production environment variables:

| Variable Name | Recommended Production Value | Description |
|---|---|---|
| `ENVIRONMENT` | `production` | Enables production security controls |
| `DEBUG` | `false` | Disables debug mode |
| `ALLOWED_ORIGINS` | `["https://shopshield-bd.vercel.app"]` | Strict CORS allowing only the deployed frontend |
| `GEMINI_API_KEY` | `AIzaSy...` | Your secret API key from Google AI Studio |
| `GEMINI_MODEL` | `gemini-3.5-flash` | Gemini model for promise extraction |
| `AI_REQUEST_TIMEOUT_SECONDS`| `30` | Request timeout for Gemini API calls |
| `MAX_INPUT_TEXT_LENGTH` | `15000` | Input size limit safeguard |
| `SECRET_KEY` | *(Generate a 32+ character random string)* | Used for session and cryptographic integrity |

### 4. Deploy
Click **Deploy**. Vercel will install Python dependencies and deploy `api/index.py` as an ASGI serverless function at:  
`https://shopshield-bd-api.vercel.app` (or your assigned Vercel URL).

---

## 🔍 Post-Deployment Verification

### Step 1: Verify Backend Endpoints
Run these curl checks against your live backend URL (replace with your actual domain):

```bash
# 1. Root Health Check (Returns 200 with operational status)
curl -s -i https://shopshield-bd-api.vercel.app/health

# 2. API v1 Health Check
curl -s -i https://shopshield-bd-api.vercel.app/api/v1/health

# 3. Interactive OpenAPI Documentation
curl -s -I https://shopshield-bd-api.vercel.app/docs
```

### Step 2: Verify Real AI Extraction on Live Backend
Execute a test analysis request:

```bash
curl -s -X POST https://shopshield-bd-api.vercel.app/api/v1/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "advertisement_text": "স্মার্ট ওয়াচ ২২০০ টাকা। সারা দেশে ক্যাশ অন ডেলিভারি প্রযোজ্য।",
    "seller_chat_text": "দাম ২৬০০ টাকা। সম্পূর্ণ অগ্রিম বিকাশ করতে হবে।"
  }' | jq .
```
Expected output:
- `status`: `"success"`
- `has_contradictions`: `true`
- `contradiction_count`: `2` (Price discrepancy and COD refusal)
- `model_used`: `"gemini-3.5-flash"`

### Step 3: Verify Frontend Live Connection
1. Open `https://shopshield-bd.vercel.app` in your browser.
2. Check the **Backend** badge in the navbar: it should display a green pulsing dot with **Online**.
3. Click one of the sample scenarios (e.g. *Conflicting Smart Watch Deal*).
4. Click **Analyze Promises**: verify that loading indicator appears and real AI results render in the UI without CORS errors.

---

## 🛠️ Architecture & Vercel Configuration Highlights

### Serverless Execution Timeout (`maxDuration: 60`)
AI extraction requests calling Gemini can take 10–20 seconds under normal load. In [`vercel.json`](file:///home/md-naim/shopshield-bd/vercel.json), the serverless function is configured with:
```json
{
  "functions": {
    "api/index.py": {
      "maxDuration": 60,
      "memory": 1024
    }
  }
}
```
This guarantees sufficient headroom within Vercel's standard function runtime limits.

### CORS & Preview Deployments
[`backend/app/main.py`](file:///home/md-naim/shopshield-bd/backend/app/main.py) supports both the explicit `ALLOWED_ORIGINS` array and a regex pattern matching Vercel preview URLs (`https://shopshield-bd-*.vercel.app`), ensuring pull request preview deployments function smoothly without manual origin configuration.

### Single-Page Application (SPA) Fallback
[`frontend/vercel.json`](file:///home/md-naim/shopshield-bd/frontend/vercel.json) directs all non-asset requests to `/index.html` so that deep client-side navigation operates properly without 404s.
