# FoodShare Platform — Complete Project Baseline Audit
**Document ID:** `FS-AUD-00`  
**Date:** November 2026  
**Auditor:** Principal Software Architect & QA Lead  
**Repository:** `Food-Donation-main`  
**Status:** Complete & Verified

---

## 1. Executive Summary & Architectural Overview

The Unified Food Donation Platform (**FoodShare**) is an enterprise-grade food rescue management platform connecting commercial food donors (restaurants, grocers, caterers), certified volunteer couriers, verified non-profit organizations (pantries, soup kitchens, shelters), and platform administrators.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        FOODSHARE ARCHITECTURE                          │
├──────────────────────────┬──────────────────────┬──────────────────────┤
│  Frontend Presentation   │    Backend Services  │  Database & Security │
│  (Port 3000)             │    (Port 5000 / 5002)│                      │
├──────────────────────────┼──────────────────────┼──────────────────────┤
│ • Next.js 15.5.3 (App)   │ • Node.js Express 5  │ • Supabase Postgres  │
│ • React 19.1.0           │ • Supabase JS Client │ • Row Level Security │
│ • TypeScript 5.0         │ • Python 3 Flask     │ • Multi-tenant RLS   │
│ • Tailwind CSS v4        │   Chatbot (Port 5002)│ • Audit Trails       │
│ • Leaflet 1.9.4 Maps     │ • Gemini 2.5 Flash   │ • Isolated Demo Store│
└──────────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 2. Full-Stack Component Directory & Route Catalog

### 2.1 Frontend Route Catalog (`frontend/src/app`)

| Route | Role Access | Primary Purpose | State Management |
| :--- | :--- | :--- | :--- |
| `/` | Public | Public landing page, ecosystem value prop, live demo modal trigger, registration tabs. | Local form state |
| `/login` | Public | Role-aware credentials login & quick demo identity selector. | Auth token |
| `/donordash` | Donor | Operational overview, active dispatch batches, handover telemetry, impact tiles. | `useResource` |
| `/donate` | Donor | 4-step surplus food donation creation wizard, schema-aligned payload staging. | Form ref + validation |
| `/mydonations` | Donor | Complete donation receipts ledger, status timeline inspection, custody tracking. | `useResource` |
| `/volunteerdash` | Volunteer | Available food listings, proximity filtering, claiming interface, duty status. | `useResource` |
| `/volunteer/tasks` | Volunteer | Assigned delivery runs, pickup confirmation dialog, delivery handover proof. | `useResource` |
| `/ngodash` | NGO | Community food intake hub, cargo inspection, delivery confirmation dialog. | `useResource` |
| `/adminpage` | Admin | Multi-tab governance center (Donations, NGO Verifications, Users, Audit log). | Tab state |
| `/notification` | All | Role-scoped transactional notifications with read/unread updates. | `useResource` |
| `/profile` | All | User identity, facility parameters, location coordinates, password updates. | Form state |

### 2.2 Backend API Catalog (`backend/routes`)

| Route Prefix | Controller / Service | Security Policy | Handled Endpoints |
| :--- | :--- | :--- | :--- |
| `/api/v1/auth` | `auth.service.js` | Public / Rate Limited | `POST /login`, `POST /signup`, `GET /me`, `PATCH /me` |
| `/api/v1/demo` | `demo.service.js` | Public / Memory Store | `POST /session`, `GET /identities`, `POST /reset` |
| `/api/v1/donations`| `donation.service.js` | Role-based (Donor/Vol) | `POST /`, `GET /mine`, `GET /available`, `POST /:id/claim` |
| `/api/v1/volunteer`| `donation.service.js` | Volunteer role | `GET /tasks`, `POST /:id/pickup`, `POST /:id/deliver`, `GET /impact` |
| `/api/v1/ngos` | `ngo.service.js` | NGO role | `GET /incoming`, `POST /confirm`, `GET /verification`, `GET /history` |
| `/api/v1/admin` | `admin.service.js` | Admin role | `GET /donations`, `GET /users`, `GET /verifications`, `PATCH /verifications/:id` |
| `/api/v1/impact` | `impact.service.js` | Authenticated | `GET /me`, `GET /donor`, `GET /volunteer`, `GET /aggregate` |
| `/api/v1/health` | System | Public | `GET /health` (Readiness, database connectivity check) |

---

## 3. Database Schema, Lifecycle Rules & Security Architecture

### 3.1 Five-Stage Deterministic Donation Lifecycle

```
[AVAILABLE] ─── volunteer claims ───► [ASSIGNED]
                                          │
                                   courier picks up
                                          ▼
[COMPLETED] ◄─── NGO confirms ────── [DELIVERED] ◄─── courier drops off
```
- **Terminal States:** `COMPLETED`, `CANCELLED` (allowed before pickup only), `EXPIRED`.
- **Transitions Enforced By:** `backend/lib/lifecycle.js` (`canTransition(from, to)`).

### 3.2 Supabase Row Level Security (RLS) Policies
- `donations`: Donors read/write own; Volunteers read `AVAILABLE` or claimed; NGOs read assigned/delivered; Admins read all.
- `assignments`: Volunteers update only their assigned runs; Donors & NGOs read related runs.
- `delivery_confirmations`: NGOs write confirmation upon receipt inspection; immutable thereafter.
- `ngo_profiles`: NGOs manage own verification request; Admins approve/reject.

---

## 4. Chatbot AI Microservice (`chatbot_api`)

- **Host & Port:** `http://127.0.0.1:5002`
- **Framework:** Python 3.12 Flask + Werkzeug.
- **Provider:** Google Gemini 2.5 Flash via REST (`google-generativeai`).
- **Grounded Fallback:** BM25 regulatory knowledge retrieval engine (Good Samaritan Act citations, USDA/FSSAI temperature standards, cold-chain rules).
- **Service Portal:** Serves a dark-mode service portal on `GET /` with health status, routing manifest, and frontend navigation links.

---

## 5. Baseline Test & Verification Suite

All tests executed and verified in the real environment:

1. **TypeScript Typecheck:**
   - Command: `frontend/npx tsc --noEmit`
   - Result: **0 errors (Pass)**
2. **Frontend Unit Tests:**
   - Command: `frontend/npm test`
   - Result: **21 passed, 0 failed** (API envelope, date formatting, donation validation)
3. **Backend Unit Tests:**
   - Command: `backend/npm test`
   - Result: **30 passed, 0 failed** (Cryptographic tokens, lifecycle guards, rate limits)
4. **End-to-End Test Suite:**
   - Command: `node presentation/run-e2e-suite.js`
   - Result: **20/20 assertions passed (100%)**
   - Coverage: Health checks, Landing page, Donor donation creation, Volunteer claim & pickup, NGO delivery confirmation, Admin tabular audit, AI chatbot slide-over, and 390×844 mobile viewport.

---

## 6. Pre-existing Defects Resolved Prior to Transformation
1. **Donor Impact TypeError (`fetch failed`):** Resolved by adding `getDemoDonorStats` to `demo.service.js` and demo auth checks in `impact.routes.js`.
2. **Next.js Dev Overlay Collision:** Resolved by setting `devIndicators: false` in `next.config.ts`.
3. **Monospace Typography Slop:** Standardized on **Geist Sans** across all four roles; restricted **Geist Mono** strictly to batch IDs and numeric tables.
4. **Chatbot 404:** Added `GET /`, `GET /health`, and `GET /api/health` web portal handlers in `chatbot_api/app.py`.

