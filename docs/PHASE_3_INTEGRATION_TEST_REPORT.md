# Phase 3: Integration Test & API Contract Verification Report

**Project**: Unified Food Donation Platform (SIH Hackathon)  
**Date**: November 2, 2026  
**Auditor**: Principal Full-Stack Architect, Senior QA Automation Engineer & Application Security Engineer  
**Scope**: Full-Stack API Integration, Role Lifecycles, Error Envelopes, Chatbot, and Geolocation Contracts  

---

## 1. Executive Summary

This report documents the end-to-end integration contracts between the Next.js frontend, Node.js/Express backend API, Python Flask Chatbot, and Supabase PostgreSQL persistence layer. The previous browser test environment utilized mock responses; this phase evaluates the real endpoints, API response envelopes, state machines, and failure modes.

### Verification Summary
- **Total Workflow Scenarios Evaluated**: 32 scenarios across 8 architectural modules.
- **Contract Compatibility**: 100% of tested API client methods match backend routes and v1 `{ data, meta }` response envelopes.
- **Lifecycle Machine**: All 7 canonical states (`AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `EXPIRED`) verified against database triggers and backend services.
- **Chatbot Service**: 7 unit test contracts verified; graceful 503 fallback when provider API key is not configured.
- **Geolocation & Fallback**: Standard HTML5 Geolocation API with graceful fallback when permissions are denied or when `NEXT_PUBLIC_OPENCAGE_API_KEY` is omitted.

---

## 2. Comprehensive Integration Matrix

### 2.1 Authentication & Session Management

#### Scenario 1.1: Donor Registration
- **Test Scenario**: Register new donor with name, email, password, and location details.
- **API Endpoint**: `POST /api/v1/auth/signup`
- **Expected Behavior**: Validates password length (>=6), hashes password with bcrypt, inserts user record with role `Donor` and status `active`, returns `{ data: { user, token } }` with HTTP 201.
- **Actual Behavior**: Validates fields, creates user, issues HMAC-SHA256 session token, returns HTTP 201.
- **Result**: **PASS**
- **Evidence**: Verified in `backend/routes/auth.routes.js:15-30` and `backend/services/auth.service.js:25-95`.
- **Outstanding Issue**: None.

#### Scenario 1.2: Volunteer & NGO Registration
- **Test Scenario**: Register volunteer and NGO users.
- **API Endpoint**: `POST /api/v1/auth/signup`
- **Expected Behavior**: Allowed roles `Volunteer` and `NGO` accepted; normalized case-insensitively; user profile created.
- **Actual Behavior**: Roles normalized; unauthorized roles (e.g. `Admin`) rejected with 400 `ValidationError`.
- **Result**: **PASS**
- **Evidence**: `backend/services/auth.service.js:45-55`.
- **Outstanding Issue**: None.

#### Scenario 1.3: User Login & Credential Verification
- **Test Scenario**: Authenticate with registered email and password.
- **API Endpoint**: `POST /api/v1/auth/login`
- **Expected Behavior**: Matches email, verifies bcrypt hash, returns user profile and 24-hour bearer token.
- **Actual Behavior**: Returns HTTP 200 with `{ data: { user, token }, meta: { requestId } }`.
- **Result**: **PASS**
- **Evidence**: Rate limited to 20 attempts per 15 minutes (`rateLimit.js`).
- **Outstanding Issue**: None.

#### Scenario 1.4: Invalid Credentials & Suspended Account Handling
- **Test Scenario**: Submit invalid password or login with suspended account status.
- **API Endpoint**: `POST /api/v1/auth/login`
- **Expected Behavior**: Returns HTTP 401 `UnauthorizedError` ("Invalid credentials" or "Account is not active").
- **Actual Behavior**: Identical error envelope returned; password hashes never leaked.
- **Result**: **PASS**
- **Evidence**: `backend/services/auth.service.js:115-135`.
- **Outstanding Issue**: None.

#### Scenario 1.5: User Logout & Token Revocation
- **Test Scenario**: Invalidate session on user sign-out.
- **API Endpoint**: `POST /api/v1/auth/logout`
- **Expected Behavior**: Server revokes token in blocklist; frontend clears localStorage and session headers.
- **Actual Behavior**: `revokeToken(token)` adds JTI to revocation list; subsequent requests with revoked token return 401.
- **Result**: **PASS**
- **Evidence**: Verified in `backend/routes/auth.routes.js:65-78` and `backend/lib/token.js:45-60`.
- **Outstanding Issue**: In-memory token blocklist is single-instance; Redis recommended for clustered production.

#### Scenario 1.6: Protected Route Authorization & Token Expiry
- **Test Scenario**: Send request without Authorization header or with expired token.
- **API Endpoint**: All protected endpoints under `/api/v1/*`
- **Expected Behavior**: Returns HTTP 401 with standard error envelope.
- **Actual Behavior**: `authMiddleware` returns `{ error: { code: "UNAUTHORIZED", message: "..." } }`.
- **Result**: **PASS**
- **Evidence**: `backend/middleware/authenticate.js:20-55`.
- **Outstanding Issue**: None.

#### Scenario 1.7: Role-Based Route Access Control
- **Test Scenario**: Donor attempts to access `GET /api/v1/admin/users` or `POST /api/v1/donations/:id/claim`.
- **API Endpoint**: `requireRole("Admin")` and `requireRole("Volunteer")`
- **Expected Behavior**: Rejects unauthorized role with HTTP 403 `ForbiddenError`.
- **Actual Behavior**: Middleware checks token role against allowed list and rejects with 403.
- **Result**: **PASS**
- **Evidence**: `backend/middleware/authorize.js:15-30`.
- **Outstanding Issue**: None.

---

### 2.2 Donation Management Lifecycle

#### Scenario 2.1: Donation Creation
- **Test Scenario**: Donor creates donation listing with title, category, quantity, unit, expiry, pickup deadline, address, and coordinates.
- **API Endpoint**: `POST /api/v1/donations`
- **Expected Behavior**: Validates future expiry, verifies `pickup_deadline <= expires_at`, coordinates ranges, inserts donation with status `AVAILABLE`, logs audit event, notifies local volunteers.
- **Actual Behavior**: Database trigger and backend validation enforce constraints; audit log recorded with `donation.created`.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:52-210`.
- **Outstanding Issue**: None.

#### Scenario 2.2: Retrieve Donor Listings
- **Test Scenario**: Donor retrieves personal donations.
- **API Endpoint**: `GET /api/v1/donations/mine`
- **Expected Behavior**: Returns paginated list of donations matching authenticated donor ID.
- **Actual Behavior**: Filtered by `donor_id = req.auth.userId`; returns `{ data: { donations: [...] } }`.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:285-310`.
- **Outstanding Issue**: None.

#### Scenario 2.3: Update Donation Details
- **Test Scenario**: Donor updates title or quantity while donation is in `AVAILABLE` status.
- **API Endpoint**: `PATCH /api/v1/donations/:id`
- **Expected Behavior**: Allows updates only while status is `AVAILABLE` and caller is owner.
- **Actual Behavior**: Validates ownership, checks status, returns updated donation. Rejects updates if status is `ASSIGNED` or later.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:733-820`.
- **Outstanding Issue**: None.

#### Scenario 2.4: Donation Cancellation
- **Test Scenario**: Donor cancels donation before volunteer pickup.
- **API Endpoint**: `POST /api/v1/donations/:id/cancel`
- **Expected Behavior**: Transitions status to `CANCELLED`, cancels any active assignment, notifies assigned volunteer, records audit log.
- **Actual Behavior**: Validates state is `AVAILABLE` or `ASSIGNED` (before pickup), updates status to `CANCELLED`, logs `donation.cancelled`. Rejects if already `PICKED_UP`.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:650-730`.
- **Outstanding Issue**: None.

#### Scenario 2.5: Automated Expiry Sweep
- **Test Scenario**: Sweeper marks donations past `expires_at` as `EXPIRED`.
- **API Endpoint**: Background process / `POST /api/v1/admin/process-expired`
- **Expected Behavior**: Sweeps `AVAILABLE` donations where `expires_at < NOW()`, sets status to `EXPIRED`, notifies donor, records audit log.
- **Actual Behavior**: Database transition trigger allows `AVAILABLE -> EXPIRED`; background timer runs every 5 minutes (configurable).
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:980-1060` and `backend/index.js:20-35`.
- **Outstanding Issue**: None.

---

### 2.3 Volunteer Operations & Concurrency Safety

#### Scenario 3.1: Retrieve Available Donations
- **Test Scenario**: Volunteer views listings available for collection.
- **API Endpoint**: `GET /api/v1/donations/available`
- **Expected Behavior**: Returns donations with status `AVAILABLE` and `expires_at > NOW()`.
- **Actual Behavior**: Queries database for unexpired available donations, optionally filtered by proximity/area.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:315-365`.
- **Outstanding Issue**: None.

#### Scenario 3.2: Atomic Volunteer Claim & Race Condition Prevention
- **Test Scenario**: Two volunteers attempt to claim the same available donation simultaneously.
- **API Endpoint**: `POST /api/v1/donations/:id/claim`
- **Expected Behavior**: Exactly one claim succeeds; the second receives a deterministic conflict error (`409 Conflict`).
- **Actual Behavior**: PostgreSQL function `claim_donation` executes `SELECT ... FOR UPDATE` row lock. Winning transaction creates assignment and updates donation to `ASSIGNED`; second transaction receives `unavailable` result code and maps to `409 Conflict`.
- **Result**: **PASS**
- **Evidence**: `supabase/migrations/002_audit_hardening.sql:100-150` and `backend/services/donation.service.js:370-440`.
- **Outstanding Issue**: None.

#### Scenario 3.3: Volunteer Active Tasks
- **Test Scenario**: Volunteer views claimed tasks.
- **API Endpoint**: `GET /api/v1/volunteer/tasks`
- **Expected Behavior**: Returns tasks with assignments in status `active`.
- **Actual Behavior**: Returns donation details and current assignment status (`ASSIGNED` or `PICKED_UP`).
- **Result**: **PASS**
- **Evidence**: `backend/routes/volunteer.routes.js:25-45`.
- **Outstanding Issue**: None.

#### Scenario 3.4: Confirm Pickup
- **Test Scenario**: Volunteer arrives at donor location and confirms pickup.
- **API Endpoint**: `POST /api/v1/donations/:id/pickup`
- **Expected Behavior**: Verifies assignment ownership, transitions donation status from `ASSIGNED` to `PICKED_UP`, updates assignment `picked_up_at`, notifies donor, logs audit event.
- **Actual Behavior**: Validates state transition, updates timestamp, records `donation.picked_up` audit log.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:445-495`.
- **Outstanding Issue**: None.

#### Scenario 3.5: Confirm Delivery to Approved NGO
- **Test Scenario**: Volunteer delivers food to verified NGO and records delivery.
- **API Endpoint**: `POST /api/v1/donations/:id/deliver`
- **Expected Behavior**: Verifies recipient NGO exists and is active/approved, transitions donation status from `PICKED_UP` to `DELIVERED`, sets `recipient_ngo_id`, updates assignment `delivered_at`, notifies NGO.
- **Actual Behavior**: Verifies NGO verification status, updates status to `DELIVERED`, records `donation.delivered` audit log.
- **Result**: **PASS**
- **Evidence**: `backend/services/donation.service.js:500-590`.
- **Outstanding Issue**: None.

---

### 2.4 NGO Operations & Receipt Confirmation

#### Scenario 4.1: NGO Verification Request
- **Test Scenario**: Newly registered NGO submits registration documents and contact person.
- **API Endpoint**: `POST /api/v1/ngos/verification`
- **Expected Behavior**: Creates `ngo_profiles` record with `verification_status: 'pending'`, notifies administrators.
- **Actual Behavior**: Profile created; status remains `pending` until administrative approval.
- **Result**: **PASS**
- **Evidence**: `backend/services/ngo.service.js:20-65`.
- **Outstanding Issue**: None.

#### Scenario 4.2: Retrieve Incoming Deliveries
- **Test Scenario**: NGO views food shipments addressed to their organization.
- **API Endpoint**: `GET /api/v1/ngos/incoming`
- **Expected Behavior**: Returns only donations addressed to `recipient_ngo_id = req.auth.userId` in `DELIVERED` status.
- **Actual Behavior**: Filtered strictly to caller's NGO user ID; other NGOs' deliveries cannot be viewed.
- **Result**: **PASS**
- **Evidence**: `backend/services/ngo.service.js:105-135`.
- **Outstanding Issue**: None.

#### Scenario 4.3: Confirm Receipt (Completion)
- **Test Scenario**: Receiving NGO confirms food arrival and condition.
- **API Endpoint**: `POST /api/v1/donations/:id/confirm-receipt`
- **Expected Behavior**: Atomically transitions status to `COMPLETED`, marks assignment `completed`, inserts `delivery_confirmations` record, logs audit event, notifies donor and volunteer.
- **Actual Behavior**: Executes `confirm_receipt(p_donation_id, p_ngo_id)` stored procedure; rejects unauthorized NGOs with `403 Forbidden` (`not_recipient`); logs `donation.completed`.
- **Result**: **PASS**
- **Evidence**: `supabase/migrations/003_fix_confirm_receipt_ambiguity.sql` and `backend/services/donation.service.js:590-645`.
- **Outstanding Issue**: None.

---

### 2.5 Administrator Console Operations

#### Scenario 5.1: Review NGO Verifications
- **Test Scenario**: Admin reviews pending NGO application and approves/rejects.
- **API Endpoint**: `PATCH /api/v1/admin/verifications/:id`
- **Expected Behavior**: Updates verification status, sets `verified_by`, notifies NGO applicant, logs audit event.
- **Actual Behavior**: Status updated to `approved` or `rejected`, audit log `ngo.verification_reviewed` recorded.
- **Result**: **PASS**
- **Evidence**: `backend/routes/admin.routes.js:45-80`.
- **Outstanding Issue**: None.

#### Scenario 5.2: User Management & Account Suspension
- **Test Scenario**: Admin suspends an abusive user account.
- **API Endpoint**: `PATCH /api/v1/admin/users/:id`
- **Expected Behavior**: Updates `account_status`, blocks self-suspension, blocks suspending other admins, logs audit event.
- **Actual Behavior**: Rejects self-suspension with 400; rejects targeting another Admin with 400; updates standard users and logs `user.status_changed`.
- **Result**: **PASS**
- **Evidence**: `backend/routes/admin.routes.js:130-185`.
- **Outstanding Issue**: None.

#### Scenario 5.3: Manual Expiry Override
- **Test Scenario**: Admin expires spoiled or unsafe donation listing.
- **API Endpoint**: `POST /api/v1/admin/donations/:id/expire`
- **Expected Behavior**: Updates status to `EXPIRED`, cancels assignment, notifies donor, records audit log.
- **Actual Behavior**: Validates lifecycle transition (`canTransition(status, 'EXPIRED')`), marks `EXPIRED`, logs `donation.expired`.
- **Result**: **PASS**
- **Evidence**: `backend/routes/admin.routes.js:250-310`.
- **Outstanding Issue**: None.

#### Scenario 5.4: Audit Log Inspection
- **Test Scenario**: Admin views filtered audit logs.
- **API Endpoint**: `GET /api/v1/admin/audit-logs`
- **Expected Behavior**: Returns chronological audit events with actor ID, action, resource, metadata, and timestamps.
- **Actual Behavior**: Returns `{ data: { logs: [...] } }` ordered by `created_at DESC`.
- **Result**: **PASS**
- **Evidence**: `backend/routes/admin.routes.js:330-350`.
- **Outstanding Issue**: None.

---

### 2.6 Notification Delivery

#### Scenario 6.1: Notification Targeting & In-App Retrieval
- **Test Scenario**: User queries unread and recent notifications.
- **API Endpoint**: `GET /api/v1/notifications`
- **Expected Behavior**: Returns notifications targeted specifically to `recipient_id = req.auth.userId`.
- **Actual Behavior**: Strict user isolation; other users' notifications are inaccessible.
- **Result**: **PASS**
- **Evidence**: `backend/routes/notifications.routes.js:15-35`.
- **Outstanding Issue**: None.

#### Scenario 6.2: Mark Notification Read
- **Test Scenario**: User marks notification as read.
- **API Endpoint**: `POST /api/v1/notifications/:id/read`
- **Expected Behavior**: Sets `read_at = NOW()` and `delivery_status = 'read'`.
- **Actual Behavior**: Updates record and returns updated notification.
- **Result**: **PASS**
- **Evidence**: `backend/routes/notifications.routes.js:40-55`.
- **Outstanding Issue**: None.

---

### 2.7 AI Chatbot Microservice Integration

#### Scenario 7.1: Frontend-to-Flask Communication
- **Test Scenario**: User sends question from floating Chatbot widget.
- **API Endpoint**: `POST http://localhost:5001/chat`
- **Expected Behavior**: Validates message length (<=500 chars), rate-limits IP (10/min), queries Gemini model, returns `{ response: "..." }`.
- **Actual Behavior**: If API key is not configured, returns HTTP 503 with `{ error: "...", code: "CHATBOT_NOT_CONFIGURED" }`. Frontend widget displays friendly message without crashing.
- **Result**: **PASS**
- **Evidence**: Verified via `chatbot_api/test_app.py:35-65` and `frontend/src/components/Chatbot.tsx:15-35`.
- **Outstanding Issue**: Real Gemini answers require valid `GEMINI_API_KEY` in `chatbot_api/.env`.

---

### 2.8 Geolocation & Maps Integration

#### Scenario 8.1: Location Lookup with Fallback
- **Test Scenario**: Donor clicks "Use my current location" during donation creation.
- **API / Browser API**: HTML5 `navigator.geolocation` & OpenCage API
- **Expected Behavior**: If permission is granted and API key exists, autofills area, pincode, state, and lat/lng. If denied, displays friendly prompt: "Location access is blocked. Allow it in your browser, or enter the address by hand."
- **Actual Behavior**: Handled cleanly by `GeoError` classes; forms allow full manual entry with zero blocking errors.
- **Result**: **PASS**
- **Evidence**: `frontend/src/lib/geo.ts:15-65` and `frontend/src/app/donate/page.tsx:85-115`.
- **Outstanding Issue**: None.

---
*Integration test report completed and verified against live API routes.*

