# Unified Food Donation Platform — Production Deployment Guide

**Version**: 1.0.0 Release Candidate  
**Target Environments**: Linux / Docker / Node.js / Vercel / Railway / Supabase  

---

## 1. Prerequisites

- **Node.js**: Version 18.0.0 or higher (v20+ recommended, tested on Node v26).
- **npm**: Version 9.0.0 or higher (tested on npm 11.20.0).
- **Python**: Version 3.10 or higher (tested on Python 3.15.1).
- **Supabase Account / Project**: PostgreSQL database instance with administrative privileges.
- **Google Cloud / Gemini API Key**: For AI chatbot responses.
- **OpenCage API Key** (Optional): For automatic browser reverse-geocoding.

---

## 2. Environment Configuration

### 2.1 Backend (`backend/.env`)
Create `backend/.env` based on `backend/.env.example`:
```ini
NODE_ENV=production
PORT=5000

# Supabase database connection
SUPABASE_URL=https://<your-project-ref>.supabase.co
SUPABASE_KEY=<your-supabase-service-role-key>

# Session security (minimum 32 random characters)
SESSION_SECRET=<generate-a-cryptographically-secure-random-string-at-least-32-chars>

# CORS allowed frontend origin
CORS_ORIGIN=https://app.yourdomain.org

# Background expiry sweeper interval (ms, minimum 60000)
EXPIRY_SWEEP_INTERVAL_MS=300000
EXPIRY_SWEEPER=true
```

### 2.2 Frontend (`frontend/.env.production`)
Create `frontend/.env.production` based on `frontend/.env.example`:
```ini
NEXT_PUBLIC_API_URL=https://api.yourdomain.org
NEXT_PUBLIC_CHATBOT_URL=https://chat.yourdomain.org
NEXT_PUBLIC_OPENCAGE_API_KEY=<your-opencage-key>
NEXT_PUBLIC_MAP_PROVIDER=google
```

### 2.3 Chatbot API (`chatbot_api/.env`)
Create `chatbot_api/.env` based on `chatbot_api/.env.example`:
```ini
GEMINI_API_KEY=<your-google-gemini-api-key>
GEMINI_MODEL=gemini-2.5-flash
CHATBOT_PORT=5001
CHATBOT_RATE_LIMIT_MAX=10
CHATBOT_RATE_LIMIT_WINDOW_SECONDS=60
CORS_ORIGIN=https://app.yourdomain.org
```

---

## 3. Database Setup (Supabase)

1. Open your Supabase Project SQL Editor or connect via the Supabase CLI (`npx supabase db push`).
2. Execute the migrations in exact numerical sequence:
   - `supabase/migrations/001_initial_schema.sql` (Creates enums, tables, foreign keys, base RLS, indexes).
   - `supabase/migrations/002_audit_hardening.sql` (Adds `recipient_ngo_id`, domain check constraints, atomic `claim_donation`, trigger).
   - `supabase/migrations/003_fix_confirm_receipt_ambiguity.sql` (Applies unambiguous table column qualifications to `confirm_receipt`).
3. Verify that the service role key is exported and set in `backend/.env`.

---

## 4. Backend Deployment (Node.js / Express)

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install production dependencies:
   ```bash
   npm ci --omit=dev
   ```
3. Run verification test suite:
   ```bash
   npm test
   ```
4. Start the service with a process supervisor (e.g. PM2, systemd, or container entrypoint):
   ```bash
   npm start
   # Or with PM2:
   pm2 start index.js --name "foodshare-backend"
   ```
5. Verify health:
   ```bash
   curl -f http://localhost:5000/api/v1/health
   ```

---

## 5. Frontend Deployment (Next.js 15)

### Option A: Vercel Deployment
1. Connect repository to Vercel.
2. Set Root Directory to `frontend`.
3. Configure Environment Variables:
   - `NEXT_PUBLIC_API_URL`
   - `NEXT_PUBLIC_CHATBOT_URL`
   - `NEXT_PUBLIC_OPENCAGE_API_KEY`
4. Deploy. Vercel automatically builds static assets and deploys Edge/Node serverless routes.

### Option B: Self-Hosted Node.js / Docker
1. Navigate to frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm ci
   ```
3. Build production bundle:
   ```bash
   npm run build
   ```
4. Start Next.js production server:
   ```bash
   npm start -p 3000
   ```

---

## 6. Chatbot Deployment (Python Flask)

1. Navigate to chatbot directory:
   ```bash
   cd chatbot_api
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate # or .venv\Scripts\activate on Windows
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run validation test suite:
   ```bash
   python -m unittest test_app.py
   ```
5. Run using a production WSGI server (Gunicorn / Waitress):
   ```bash
   # On Linux:
   gunicorn -w 4 -b 0.0.0.0:5001 app:app
   # On Windows:
   waitress-serve --port=5001 app:app
   ```

---

## 7. Production Health & Readiness Checklist

- [ ] HTTPS enabled across all endpoints.
- [ ] `SESSION_SECRET` is at least 32 cryptographically random characters.
- [ ] `SUPABASE_KEY` uses service role key on backend only (never exposed to frontend or browser).
- [ ] `CORS_ORIGIN` matches production frontend domain exactly.
- [ ] Database migrations 001, 002, 003 applied successfully.
- [ ] Background sweeper (`EXPIRY_SWEEPER=true`) verified running.
- [ ] Health endpoint returns status 200: `GET /api/v1/health`.
- [ ] Chatbot health endpoint returns provider configured: `GET /health` (port 5001).

---
*Deployment guide verified for multi-service production architecture.*

