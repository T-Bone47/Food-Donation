# FoodShare — System Integration & Architecture Audit

**Date:** November 2026  
**Audience:** Principal Full-Stack Architects, Engineering Leads, Product Designers, QA Leads  
**Document Status:** Complete Phase 0 System Audit  

---

## 1. System Overview & Technology Stack

FoodShare is a unified, multi-role food donation and rescue platform designed to divert commercial and citizen food surplus from landfills directly to verified community shelters and hunger relief organizations.

### Core Stack
- **Frontend Framework:** Next.js 15 (App Router, React 19, TypeScript)
- **Styling & Design System:** Tailwind CSS, Organic Premium FoodTech design tokens (`#123D2B`, `#16865B`, `#FAF8F1`, `#DDAA48`, `#C87552`, `#202B25`)
- **Icons & Motion:** Lucide React icons, Tailwind CSS transitions with tactile `< 16ms` feedback
- **HTTP & State Management:** Axios (`api-client.ts`), SWR-style in-memory resource caching (`use-resource.ts`), zero-flicker session state (`session.ts`)
- **Backend Framework:** Node.js, Express 5 (`backend/app.js`)
- **Database & Persistence:** Supabase PostgreSQL with Row Level Security (RLS) policies
- **Real-Time Layer:** Supabase Realtime + Server-Sent Events (SSE) fallback (`/api/v1/realtime/stream`)
- **AI Microservice:** Python 3.11 Flask service (`chatbot_api/app.py`) powered by Google Gemini API
- **Containerization:** Docker & Docker Compose (`docker-compose.yml`)

---

## 2. Comprehensive Route Architecture

### 2.1. Frontend Routes (Next.js App Router)

| Route | Role Access | Primary Purpose | Navigation Source |
| :--- | :--- | :--- | :--- |
| `/` | Public | Landing page, value proposition, live network metrics, demo triggers | Public root |
| `/login` | Public | Role-aware credentials login & quick demo account picker | Top nav / sign in |
| `/signup` | Public | Donor and volunteer registration | Top nav / register |
| `/donordash` | `Donor` | Operational dispatch hub, active batches, metrics, custody tracker | Donor sidebar |
| `/donate` | `Donor` | 3-step food donation creation wizard with geocoding | Donor sidebar / CTA |
| `/mydonations` | `Donor` | Full donation history, status filtering, cancellation | Donor sidebar |
| `/volunteerdash`| `Volunteer` | Available food listings map/list, atomic donation claiming | Volunteer sidebar |
| `/volunteer/tasks`| `Volunteer`| Active claimed task stepper, pickup and delivery actions | Volunteer sidebar |
| `/acceptpage/[id]`| Multi-role | Permitted manifest detail, digital verification log | Task link / tracking |
| `/ngodash` | `NGO` | Receiving hub, dock verification inspection, received history ledger | NGO sidebar |
| `/adminpage` | `Admin` | Console: overview, donations, verifications, users, audit logs | Admin sidebar |
| `/notification`| All Roles | In-app notification center with read/unread filtering | Header bell / sidebar |
| `/profile` | All Roles | User/organization profile settings, account status | Header / sidebar |

### 2.2. Backend Routes (Express 5 REST API)

All endpoints are mounted under `/api/v1/` with legacy aliases under `/api/`:

| Router Module | Route Base | Key Endpoints | Responsibilities |
| :--- | :--- | :--- | :--- |
| `auth.routes.js` | `/api/v1/auth` | `/login`, `/register`, `/me`, `/logout` | JWT issue, session verification |
| `donations.routes.js`| `/api/v1/donations`| `POST /`, `GET /mine`, `GET /available`, `GET /:id`, `POST /:id/claim`, `POST /:id/pickup`, `POST /:id/deliver`, `POST /:id/confirm-receipt`, `POST /:id/cancel` | Complete lifecycle orchestration |
| `volunteer.routes.js`| `/api/v1/volunteer`| `GET /tasks`, `GET /dashboard`, `GET /impact` | Volunteer active task and impact retrieval |
| `ngos.routes.js` | `/api/v1/ngos` | `POST /verification`, `GET /verification`, `GET /incoming`, `GET /history`, `GET /impact`, `GET /approved` | NGO intake, verification documents, ledger |
| `admin.routes.js` | `/api/v1/admin` | `GET /overview`, `GET /donations`, `GET /users`, `GET /verifications`, `POST /verifications/:id/review`, `GET /activity` | Governance, moderation, audit trail |
| `impact.routes.js` | `/api/v1/impact` | `GET /donor`, `GET /volunteer`, `GET /ngo`, `GET /personal` | Aggregate food rescued, kg diverted, portions |
| `notifications.routes.js`| `/api/v1/notifications`| `GET /`, `POST /:id/read`, `POST /read-all` | In-app alerts and notifications |
| `demo.routes.js` | `/api/v1/demo` | `POST /session`, `POST /reset`, `GET /state` | Isolated in-memory demo operational environment |
| `realtime.routes.js`| `/api/v1/realtime` | `GET /stream`, `POST /broadcast` | Server-Sent Events cross-role broadcast |
| `health.routes.js` | `/api/v1/health` | `GET /`, `GET /live`, `GET /ready` | Microservice liveness and database probe |

---

## 3. Database Architecture & Schema Verification

### 3.1. Tables & Relationships
- `users`: Primary identity table (`id`, `name`, `email`, `role`, `account_status`, `organization`, `area`, `pincode`).
- `ngo_profiles`: 1-to-1 extension of `users` (`user_id`, `organization_name`, `registration_number`, `verification_status`, `documents`, `verified_by`).
- `donations`: Core operational record (`id`, `donor_id`, `title`, `food_category`, `quantity`, `unit`, `pickup_deadline`, `status`, `recipient_ngo_id`).
- `assignments`: Volunteer courier link (`id`, `donation_id`, `volunteer_id`, `assigned_at`, `picked_up_at`, `delivered_at`, `assignment_status`).
  - *Partial Unique Constraint:* At most one `active` assignment per donation and per volunteer.
- `delivery_confirmations`: NGO intake record (`id`, `donation_id`, `assignment_id`, `confirmed_by`, `confirmed_at`, `evidence_url`, `discrepancy_notes`).
- `notifications`: User notifications (`id`, `recipient_id`, `event_type`, `title`, `message`, `data`, `channels`).
- `audit_logs`: Immutable governance ledger (`id`, `user_id`, `action`, `entity_type`, `entity_id`, `metadata`, `created_at`).

### 3.2. Authoritative Donation Lifecycle Rules
```
AVAILABLE ──(Volunteer Claims)──> ASSIGNED ──(Volunteer Pick Up)──> PICKED_UP 
──(Volunteer Arrives at NGO)──> DELIVERED ──(NGO Confirms Receipt)──> COMPLETED
       │                                                                  │
       └──(Donor/Admin Cancels)──> CANCELLED                              │
       └──(Pickup Window Passes)──> EXPIRED                               │
```
- Transition to `ASSIGNED` requires atomic claim to prevent race conditions.
- Transition to `PICKED_UP` requires `assigned_at` and volunteer ownership.
- Transition to `DELIVERED` records volunteer arrival and assigns `recipient_ngo_id`.
- Transition to `COMPLETED` requires verified NGO sign-off and generates compliance certificate.

---

## 4. Root Cause Analysis: NGO Dashboard Navigation Bug

### 4.1. Defect Description
In the NGO dashboard:
- URL: `http://localhost:3000/ngodash#awaiting`
- Sidebar Navigation Items:
  1. Receiving Hub (`/ngodash`)
  2. Incoming Deliveries (`/ngodash#awaiting`)
  3. Received History (`/ngodash#completed`)
- **Observed Failure:** Clicking "Incoming Deliveries" (`#awaiting`) or "Received History" (`#completed`) leaves the full monolithic Receiving Hub content visible. The view does not switch, and the sidebar active indicator does not properly highlight.

### 4.2. Exact Root Causes Identified
1. **Monolithic Page Layout Without Section Routing:**
   `frontend/src/app/ngodash/page.tsx` was structured as one uninterrupted vertical column containing all elements (metrics, inspection, inflow queue, and archive). It had no state variable (`activeTab`), no URL query/hash listener, and no conditional rendering separating the Receiving Hub, Incoming Deliveries, and Received History views.
2. **Hash-Based vs Pathname URL Mismatch in Sidebar:**
   In `frontend/src/components/shell/AppSidebar.tsx`:
   ```typescript
   function isItemActive(href: string) {
     const [pathPart] = href.split("?");
     if (pathname === pathPart) return true;
     if (pathPart !== "/" && pathname.startsWith(`${pathPart}/`)) return true;
     return false;
   }
   ```
   When `href` is `"/ngodash#awaiting"`, `pathPart` evaluates to `"/ngodash#awaiting"`. Because `pathname` in Next.js is strictly `"/ngodash"`, `pathname === pathPart` evaluates to `false`. Therefore, the "Incoming Deliveries" link was never styled as active!
3. **Missing DOM Target Anchor IDs:**
   None of the containers in `ngodash/page.tsx` had `id="awaiting"` or `id="completed"`, meaning standard browser hash jumping failed silently.
4. **Similar Defect on Admin Page (`/adminpage`):**
   In `frontend/src/app/adminpage/page.tsx`, `tab` was managed via local `useState("overview")` without synchronizing with the URL query parameter (`?tab=donations`, `?tab=verifications`), causing sidebar clicks to update the address bar without switching the rendered panel.

---

## 5. Architectural Solution & Repair Blueprint

1. **Tab & Section Routing in `/ngodash`:**
   - Introduce top-level tab switcher:
     - `hub` (Receiving Hub overview: operational banner, 4 metrics, live dock pipeline summary, distribution schedule).
     - `incoming` (Incoming Deliveries: safety inspection console, dock inflow queue, inspection checklist, receipt confirmation modal).
     - `history` (Received History: verified completed receipts ledger, tax certificates, search & export).
     - `verification` (Organization profile verification documents & status).
   - Sync active tab with URL search parameter (`?tab=...`) and hash (`#awaiting`, `#completed`, `#hub`).
2. **Unified Navigation Matching in `AppSidebar.tsx`:**
   - Update `isItemActive(href)` to compare base path, search query params, and hash fragments.
   - Synchronize sidebar items for both NGO and Admin.
3. **Admin Tab Synchronization:**
   - Connect `adminpage/page.tsx` `tab` state to `useSearchParams()` or URL query listener.
4. **Full Concurrency & Lifecycle Verification:**
   - Validate atomic claims, realtime broadcasts, and demo mode persistence across all 4 roles.

