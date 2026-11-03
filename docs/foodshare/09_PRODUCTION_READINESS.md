# 09 — Production Readiness, Deployment & Operations Guide

## 1. Environment Configuration

### Frontend (`frontend/.env.local` / Production Env)
```env
NEXT_PUBLIC_API_URL=https://api.foodshare.org
NEXT_PUBLIC_CHATBOT_URL=https://ai.foodshare.org
```

### Backend (`backend/.env` / Production Env)
```env
NODE_ENV=production
PORT=5000
SUPABASE_URL=https://<your-project>.supabase.co
SUPABASE_KEY=<your-service-role-key>
SESSION_SECRET=<cryptographically-secure-random-string-64-chars>
CORS_ORIGIN=https://app.foodshare.org
EXPIRY_SWEEPER=true
```

### Chatbot Microservice (`chatbot_api/.env`)
```env
CHATBOT_PORT=5002
GEMINI_API_KEY=<your-gemini-api-key>
CORS_ORIGINS=https://app.foodshare.org,http://localhost:3000
BACKEND_API_URL=https://api.foodshare.org/api/v1
FLASK_DEBUG=false
```

## 2. Microservice Deployment Architecture
- **Frontend:** Next.js 15 standalone build deployed on Vercel or Node.js Docker container.
- **Backend API:** Node.js Express 5 microservice on AWS ECS / Render / Railway with health probes pointing to `/api/v1/health`.
- **Chatbot API:** Python 3.12 Flask service deployed with Gunicorn WSGI workers behind Nginx reverse proxy.

## 3. Production Readiness Sign-off Checklist
- [x] Zero mock or fabricated metrics.
- [x] RLS policies enforced on all Supabase tables.
- [x] Strict JWT authentication across all private routes.
- [x] Rate limiting active on all public and authentication endpoints.
- [x] Full mobile responsive support (375px through 1920px).
- [x] 100% passing automated test suite (Jest, Node runner, Playwright E2E).

