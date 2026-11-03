# Phase 3: Repository Reconnaissance & Baseline Audit Report

**Project**: Unified Food Donation Platform (SIH Hackathon)  
**Date**: November 2, 2026  
**Auditor**: Principal Full-Stack Architect, Senior QA Automation Engineer, Application Security Engineer, Database Engineer & Release Manager  
**Repository Location**: `Food-Donation-main` (Active Workspace: `Food-Donation-main (1)/Food-Donation-main`)  
**Status**: Release Candidate Reconnaissance Baseline  

---

## 1. Executive Summary

This audit establishes the ground-truth baseline of the Unified Food Donation Platform prior to Batch 3 verification and hardening. Historical claims from prior phases were verified against the live repository code and execution environment.

### Verified Baseline Findings:
1. **Frontend Architecture**: Modern Next.js 15.5.3 (React 19.1.0, Tailwind CSS 4.1.13, TypeScript 5). A unified, role-aware navigation shell (`AppNav.tsx`, `AppShell.tsx`, `AuthLayout.tsx`) and centralized API client with standard envelope handling (`api-client.ts`, `api-envelope.ts`) are in place. The production build was executed and verified (`15 static/dynamic pages compiled successfully`).
2. **Backend Architecture**: Node.js v26.12.1 with Express 5.1.0 and Supabase client (`@supabase/supabase-js` 2.57.4). Both `/api/v1` and legacy `/api` routes are mounted. Token-based stateless authentication with HMAC-SHA256 and revocation blocklist is implemented.
3. **Database Architecture**: Supabase PostgreSQL with 3 SQL migration files (`001_initial_schema.sql`, `002_audit_hardening.sql`, `003_fix_confirm_receipt_ambiguity.sql`). Atomic database functions for volunteer claiming (`claim_donation`) and NGO receipt confirmation (`confirm_receipt`) provide concurrency safety and lifecycle enforcement.
4. **Chatbot Service**: Standalone Python (Flask 3.1.3, Python 3.15.1) microservice integrating with Google Gemini API (`gemini-2.5-flash`), with in-memory rate limiting and project knowledge base.
5. **Verified Unit Test Status**:
   - Frontend unit tests: 21 passing out of 21 tests (`frontend/test/*.test.mjs`).
   - Backend unit tests: 24 passing out of 24 tests (`backend/test/unit/*.test.js`).
   - TypeScript checks: Zero errors (`npx tsc --noEmit`).
   - Production Build: 15 routes generated with zero errors.

---

## 2. Actual Repository Structure

```
Food-Donation-main/
├── .agents/                      # Agent skill definitions & references
├── .github/                      # Workflow stubs
├── backend/                      # Node.js + Express 5 API Server
│   ├── config/
│   │   └── env.js                # Environment loading, parsing & validation
│   ├── lib/
│   │   ├── lifecycle.js          # Donation state machine (7 canonical states)
│   │   ├── token.js              # HMAC-SHA256 JWT tokens & revocation list
│   │   └── validators.js         # Domain validation rules & regex limits
│   ├── middleware/
│   │   ├── authenticate.js       # Bearer token extractor & validation
│   │   ├── authorize.js          # Role-based & ownership authorization guards
│   │   ├── errorHandler.js       # Centralized error handler & envelope serializer
│   │   ├── rateLimit.js          # In-memory sliding-window rate limiter
│   │   └── validate.js           # Express request validation helpers
│   ├── routes/
│   │   ├── admin.routes.js       # Admin oversight, users, verifications, audit logs
│   │   ├── auth.routes.js        # Signup, login, logout, profile endpoints
│   │   ├── donations.routes.js   # Donation lifecycle endpoints
│   │   ├── health.routes.js      # Liveness and database readiness checks
│   │   ├── impact.routes.js      # Aggregated & personal impact metrics
│   │   ├── ngos.routes.js         # NGO registration, verification & deliveries
│   │   ├── notifications.routes.js # In-app notification management
│   │   └── volunteer.routes.js   # Tasks, assignments & volunteer dashboard
│   ├── services/                 # Business logic & Supabase database interactions
│   ├── test/                     # Unit and integration test suites
│   ├── app.js                    # Express application factory & middleware stack
│   ├── index.js                  # Server entry point with background expiry sweeper
│   └── supabase.js               # Supabase JS client initialization
├── chatbot_api/                  # Python Flask Gemini Chatbot Microservice
│   ├── app.py                    # Flask server, rate limiter & Gemini prompt pipeline
│   └── requirements.txt          # Python dependencies
├── design-system/                # Design tokens and specifications
│   └── unified-food-donation/
│       └── MASTER.md             # Design system documentation
├── docs/                         # Architecture, reports & technical documentation
├── frontend/                     # Next.js 15 + React 19 Frontend
│   ├── public/                   # Static assets (SVGs and images)
│   ├── src/
│   │   ├── app/                  # App Router pages (12 views + dynamic routes)
│   │   ├── components/           # UI components, Shell, and Admin panels
│   │   └── lib/                  # API client, envelope unwrap, validation, geo
│   ├── test/                     # Frontend unit tests
│   └── package.json              # Frontend dependencies and scripts
└── supabase/                     # Database migrations & local configuration
    ├── config.toml               # Supabase local environment config
    └── migrations/               # SQL schema definitions
```

---

## 3. Implemented Features Inventory

| Role / Domain | Feature | Route / Endpoint | Backend Service | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Auth** | User Signup | `POST /api/v1/auth/signup` | `auth.service.js` | Implemented |
| **Auth** | User Login | `POST /api/v1/auth/login` | `auth.service.js` | Implemented |
| **Auth** | User Logout | `POST /api/v1/auth/logout` | `token.js` | Implemented (Token revocation) |
| **Auth** | Get Profile | `GET /api/v1/auth/me` | `auth.service.js` | Implemented |
| **Auth** | Update Profile | `PATCH /api/v1/auth/me` | `auth.service.js` | Needs Server-Side Validation |
| **Donor** | Create Donation | `POST /api/v1/donations` | `donation.service.js` | Implemented |
| **Donor** | View My Donations | `GET /api/v1/donations/mine` | `donation.service.js` | Implemented |
| **Donor** | Cancel Donation | `POST /api/v1/donations/:id/cancel` | `donation.service.js` | Implemented (Before pickup only) |
| **Donor** | Donor Impact Stats | `GET /api/v1/impact/donor` | `impact.service.js` | Implemented (From COMPLETED only) |
| **Volunteer** | Available Donations | `GET /api/v1/donations/available` | `donation.service.js` | Implemented |
| **Volunteer** | Atomic Claim | `POST /api/v1/donations/:id/claim` | `donation.service.js` | Implemented (`claim_donation` RPC) |
| **Volunteer** | Confirm Pickup | `POST /api/v1/donations/:id/pickup` | `donation.service.js` | Implemented |
| **Volunteer** | Confirm Delivery | `POST /api/v1/donations/:id/deliver` | `donation.service.js` | Implemented |
| **Volunteer** | View Active Tasks | `GET /api/v1/volunteer/tasks` | `volunteer.routes.js` | Implemented |
| **Volunteer** | Volunteer Dashboard | `GET /api/v1/volunteer/dashboard` | `volunteer.routes.js` | Implemented |
| **NGO** | Submit Verification | `POST /api/v1/ngos/verification` | `ngo.service.js` | Implemented |
| **NGO** | Verification Status | `GET /api/v1/ngos/verification` | `ngo.service.js` | Implemented |
| **NGO** | Incoming Deliveries | `GET /api/v1/ngos/incoming` | `ngo.service.js` | Implemented |
| **NGO** | Confirm Receipt | `POST /api/v1/donations/:id/confirm-receipt` | `donation.service.js` | Implemented (`confirm_receipt` RPC) |
| **Admin** | NGO Verifications | `GET /api/v1/admin/verifications` | `ngo.service.js` | Implemented |
| **Admin** | Review Verification | `PATCH /api/v1/admin/verifications/:id` | `ngo.service.js` | Implemented |
| **Admin** | User Management | `GET /api/v1/admin/users` | `admin.routes.js` | Implemented |
| **Admin** | User Status Change | `PATCH /api/v1/admin/users/:id` | `admin.routes.js` | Needs Protection Guard |
| **Admin** | Manage Donations | `GET /api/v1/admin/donations` | `admin.routes.js` | Implemented |
| **Admin** | Manual Expiry | `POST /api/v1/admin/donations/:id/expire` | `admin.routes.js` | Implemented |
| **Admin** | Audit Logs | `GET /api/v1/admin/audit-logs` | `notification.service.js`| Implemented (Limited coverage) |
| **System** | Background Expiry Sweeper | In-process timer (`index.js`) | `donation.service.js` | Implemented |
| **AI** | Chatbot Assistance | `POST /chat` (Port 5001) | `chatbot_api/app.py` | Implemented (Gemini 2.5 Flash) |

---

## 4. Database Schema Inventory

The database is built on Supabase PostgreSQL with extensions `uuid-ossp` and `pgcrypto`.

### Tables and Key Constraints:
1. `users`:
   - Primary key: `id UUID DEFAULT uuid_generate_v4()`
   - Fields: `name`, `email UNIQUE`, `password_hash`, `organization`, `phonenumber`, `role ENUM`, `area`, `pincode`, `state`, `country`, `account_status ENUM`, timestamps.
   - Enums: `user_role` (`Donor`, `Volunteer`, `NGO`, `Admin`), `account_status` (`pending`, `active`, `suspended`, `rejected`).
2. `ngo_profiles`:
   - Primary key: `id UUID`
   - Relational link: `user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE`
   - Fields: `organization_name`, `registration_number`, `address`, `contact_person`, `contact_email`, `contact_phone`, `description`, `documents JSONB`, `verification_status ENUM`, `verified_by REFERENCES users(id)`.
3. `donations`:
   - Primary key: `id UUID`
   - Foreign key: `donor_id UUID NOT NULL REFERENCES users(id) RESTRICT`
   - Recipient link: `recipient_ngo_id UUID REFERENCES users(id) ON DELETE SET NULL`
   - Status Enum: `AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `EXPIRED`.
   - Constraints: `pickup_deadline <= expires_at`, coordinates boundary checks (`-90 <= lat <= 90`, `-180 <= lng <= 180`), positive quantity.
   - Database Trigger: `enforce_donation_status_transition_trigger` enforces valid lifecycle transitions directly in Postgres.
4. `assignments`:
   - Primary key: `id UUID`
   - Foreign keys: `donation_id UUID NOT NULL REFERENCES donations(id) ON DELETE CASCADE`, `volunteer_id UUID NOT NULL REFERENCES users(id) RESTRICT`.
   - Unique active assignment constraint: `UNIQUE (donation_id, assignment_status) WHERE assignment_status = 'active'`.
5. `delivery_confirmations`:
   - Primary key: `id UUID`
   - Constraints: `donation_id UUID NOT NULL REFERENCES donations(id)`, `confirmed_by UUID NOT NULL REFERENCES users(id)`, `UNIQUE (donation_id)`.
6. `notifications`:
   - Primary key: `id UUID`
   - Fields: `recipient_id UUID REFERENCES users(id)`, `event_type`, `title`, `message`, `data JSONB`, `channel ENUM`, `delivery_status ENUM`, `read_at TIMESTAMPTZ`.
7. `audit_logs`:
   - Primary key: `id UUID`
   - Fields: `actor_id UUID REFERENCES users(id)`, `action TEXT NOT NULL`, `resource_type TEXT NOT NULL`, `resource_id UUID`, `details JSONB`, `ip_address TEXT`, `created_at TIMESTAMPTZ`.

### Atomic Database Functions:
- `claim_donation(p_donation_id, p_volunteer_id)`: Implements row-level locking (`FOR UPDATE`) to prevent race conditions during volunteer claim.
- `confirm_receipt(p_donation_id, p_ngo_id)`: Atomically validates recipient matching, marks donation `COMPLETED`, completes assignment, and records delivery confirmation.
- `is_admin()`: Helper function for Supabase RLS security policies.

---

## 5. Existing Test Suites & Current Execution Results

### Frontend Test Suite (`npm test` in `frontend`):
- Framework: Node.js Test Runner with `--experimental-strip-types`
- Test files:
  - `frontend/test/api-envelope.test.mjs` (7 tests)
  - `frontend/test/donation-form.test.mjs` (14 tests)
- **Result**: **21 passed, 0 failed, duration: ~355ms**.

### Backend Unit Test Suite (`npm test` in `backend`):
- Framework: Node.js Built-in Test Runner (`node --test`)
- Test files:
  - `backend/test/unit/lifecycle.test.js` (6 tests)
  - `backend/test/unit/notification-events.test.js` (2 tests)
  - `backend/test/unit/rateLimit.test.js` (2 tests)
  - `backend/test/unit/token.test.js` (6 tests)
  - `backend/test/unit/validators.test.js` (8 tests)
- **Result**: **24 passed, 0 failed, duration: ~400ms** (when `SUPABASE_KEY` test stub is configured).

### Backend Integration Test Suite (`backend/test/integration/api.test.js`):
- 16 integration scenarios covering the full user journey.
- **Current execution**: Fails with `TypeError: fetch failed` because local Supabase container is not running on port 54321 on this host machine.

---

## 6. Known Defects and Gap Inventory

1. **Defect 1: Profile Update Missing Server Validation (Security / Reliability)**:
   - Location: `backend/routes/auth.routes.js` (`PATCH /api/v1/auth/me`)
   - Severity: High
   - Analysis: The endpoint copies permitted fields directly without validating string types, length boundaries, phone number formats, or trimming whitespace.
2. **Defect 2: Admin Self-Suspension & Cross-Admin Privilege Exposure (Security)**:
   - Location: `backend/routes/admin.routes.js` (`PATCH /api/v1/admin/users/:id`)
   - Severity: High
   - Analysis: An administrator can inadvertently or maliciously set their own `account_status` to `suspended` (locking themselves out), or suspend another administrator without multi-admin quorum or safety checks.
3. **Defect 3: Incomplete Audit Logging Coverage (Compliance / Auditability)**:
   - Location: Across `backend/routes/` and `backend/services/`
   - Severity: Medium
   - Analysis: `createAuditLog` is currently invoked in only two locations (`user.status_changed` and `donation.expired`). Key lifecycle transitions (`donation.created`, `donation.claimed`, `donation.picked_up`, `donation.delivered`, `donation.completed`, `donation.cancelled`, `ngo.verification_reviewed`) are not captured in `audit_logs`.
4. **Defect 4: Outdated Design System Tokens in MASTER.md (Documentation)**:
   - Location: `design-system/unified-food-donation/MASTER.md`
   - Severity: Medium
   - Analysis: Document ends with outdated Indigo/Purple `#4F46E5` tokens from an early prototype, contradicting the implemented "Organic Modern / Indian Kitchens" palette (`#1d5c3a`, `#f3f4ee`, `#e7a91b`, `#a8321c`) declared in `frontend/src/app/globals.css`.
5. **Defect 5: Unverified Asset `signupbg.png` (Branding / Legal)**:
   - Location: `frontend/public/images/signupbg.png`
   - Severity: Medium
   - Analysis: Asset contains third-party "FEED CHAIN" branding. It is completely unreferenced by the current application code (`AuthLayout.tsx` uses semantic CSS). It must be reviewed, removed, or replaced with an authentic asset.
6. **Defect 6: Backend Test Configuration Friction (Testing)**:
   - Location: `backend/test/support/test-env.js` and `backend/package.json`
   - Severity: Medium
   - Analysis: `test-env.js` unconditionally requires `SUPABASE_KEY` even for pure unit tests that do not use Supabase. Providing a default offline key stub for the unit test runner allows zero-friction verification.

---

## 7. Dependency Status

- **Frontend**:
  - `next`: 15.5.3 (Compatible)
  - `react`: 19.1.0 (Compatible)
  - `tailwindcss`: 4.1.13 (PostCSS plugin `@tailwindcss/postcss`)
  - `axios`: 1.12.2
  - `leaflet`: 1.9.4 & `react-leaflet`: 5.0.0
  - Status: All 418 packages installed cleanly via `npm.cmd install`.
- **Backend**:
  - `express`: 5.1.0 (Express 5 with native async error handling)
  - `@supabase/supabase-js`: 2.57.4
  - `bcrypt`: 6.0.0
  - `cors`: 2.8.5, `helmet`: 8.1.0, `dotenv`: 17.2.2
  - Status: All 270 packages installed cleanly via `npm.cmd install`.
- **Chatbot**:
  - `Flask`: 3.1.3
  - `flask-cors`: 6.0.5
  - `flask-limiter`: 4.1.1
  - `python-dotenv`: 1.2.4
  - `requests`: 2.34.2
  - Status: All packages installed cleanly via `pip install`.

---

## 8. Environment Requirements

| Variable | Component | Purpose | Requirement |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Backend | Runtime mode | `development` / `production` / `test` |
| `PORT` | Backend | HTTP port | Default: `5000` |
| `SUPABASE_URL` | Backend | Supabase API endpoint | Required in all environments |
| `SUPABASE_KEY` | Backend | Service role / anon key | Required in all environments |
| `SESSION_SECRET` | Backend | HMAC session signing key | Required (min 32 chars) |
| `CORS_ORIGIN` | Backend | Allowed browser origins | Default: `http://localhost:3000` |
| `EXPIRY_SWEEPER` | Backend | Run background timer | `true` (default) or `false` |
| `NEXT_PUBLIC_API_URL` | Frontend | Backend base URL | Default: `http://localhost:5000` |
| `NEXT_PUBLIC_CHATBOT_URL` | Frontend | Chatbot base URL | Default: `http://localhost:5001` |
| `NEXT_PUBLIC_OPENCAGE_API_KEY` | Frontend | Geocoding API key | Optional (graceful fallback) |
| `GEMINI_API_KEY` | Chatbot | Google Gemini API key | Required for LLM responses |
| `CHATBOT_PORT` | Chatbot | Chatbot HTTP port | Default: `5001` |

---

## 9. Critical Release Blockers

1. **Server-Side Profile Validation**: Must enforce strict sanitization and validation on `PATCH /api/v1/auth/me`.
2. **Admin Account Protection**: Must prevent administrators from suspending themselves or mutating other administrator accounts.
3. **Comprehensive Audit Logging**: Must log critical donation lifecycle transitions and administrative reviews with actor identity.
4. **Third-Party Brand Removal**: Must purge unreferenced third-party image `signupbg.png`.
5. **Design System Alignment**: Must update `MASTER.md` to accurately reflect the implemented palette and typography.
6. **Integration Validation**: Must validate frontend-to-backend API contracts and error envelopes.

---
*Report completed and verified against live code and environment.*

