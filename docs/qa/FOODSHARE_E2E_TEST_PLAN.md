# FoodShare — Comprehensive End-to-End (E2E) Test Plan

**Date:** November 2026  
**Audience:** QA Leads, Staff Automation Engineers, Principal Architects  
**Scope:** Automated headless browser and API testing across public, Donor, Volunteer, NGO, and Admin roles.

---

## 1. Test Architecture & Execution Framework

Testing is orchestrated via Playwright Chromium headless runner (`presentation/run-e2e-suite.js` and `presentation/test-cross-role-realtime.js`) interacting with live services on ports `3000` (Next.js), `5000` (Express), and `5002` (Flask AI Assistant).

### Test Environment Matrix
- **Desktop High-Definition:** `1920 × 1080` (Presentation view)
- **Standard Laptop:** `1440 × 900`
- **Mobile Standard:** `390 × 844` (iPhone portrait)

---

## 2. Test Suites & Lifecycle Stages

### Phase 1: Microservice Health & Baseline Setup
1. Backend API (`localhost:5000/api/v1/health`) probe.
2. AI Chatbot microservice (`localhost:5002/api/v1/chat/health`) probe.
3. Demo environment seed reset via `POST /api/v1/demo/reset`.

### Phase 2: Public Navigation & Authentication
1. Landing page render (`/`) and hero assertion.
2. Demo mode quick switcher trigger.
3. Role authentication and session storage verification.

### Phase 3: Complete Donor Lifecycle Journey
1. Donor dashboard (`/donordash`) metrics and active batch list.
2. 3-step donation wizard (`/donate`):
   - Form inputs validation (title, quantity, unit, category).
   - Geolocation address resolution.
   - Successful server confirmation.
3. My donations list (`/mydonations`) and status filtering.
4. Instant In-Dashboard Custody Tracking sheet (`<CustodyTrackingModal />`).

### Phase 4: Volunteer Claim & Transit Journey
1. Available donations duty console (`/volunteerdash`).
2. Atomic claim verification (`POST /api/v1/donations/:id/claim`).
3. Concurrency race-condition test: 2 parallel claims → Exactly 1 HTTP 201, 1 HTTP 409.
4. Active delivery task (`/volunteer/tasks`):
   - Handover pickup confirmation (`status: PICKED_UP`).
   - Delivery to receiving NGO dock (`status: DELIVERED`).

### Phase 5: NGO Dock Operations & Intake Journey
1. Receiving Hub overview tab (`/ngodash?tab=hub` or `/ngodash`).
2. Incoming Deliveries tab (`/ngodash?tab=incoming` / `#awaiting`):
   - Quality & Food Safety checklist rendering.
   - Dock inflow pipeline list.
   - Receipt confirmation modal and IRS § 170 digital sign-off.
3. Received History ledger tab (`/ngodash?tab=history` / `#completed`):
   - Completed intakes table.
   - Historical certificate verification.

### Phase 6: Admin Governance & Moderation Journey
1. Admin Overview (`/adminpage`): platform rescue metrics.
2. Donations management (`/adminpage?tab=donations`): full ledger.
3. Users & NGOs directory (`/adminpage?tab=users`): account status.
4. NGO verification queue (`/adminpage?tab=verifications`): review & approve.
5. System audit log (`/adminpage?tab=activity`): immutable event log.

### Phase 7: Realtime SSE Cross-Role Propagation
1. Parallel browser contexts (Donor, Volunteer, NGO, Admin).
2. SSE event stream (`/api/v1/realtime/stream`) connection verification.
3. Lifecycle state propagation without manual page reloads:
   - Donor posts → Volunteer list updates (< 1.2s).
   - Volunteer claims → Donor status reflects `ASSIGNED`.
   - Volunteer delivers → NGO dock reflects incoming delivery.
   - NGO confirms receipt → Donor & Admin reflect `COMPLETED`.

### Phase 8: AI Chatbot Microservice Verification
1. Open slide-over drawer via Logistics AI trigger button.
2. Send query regarding temperature compliance or Good Samaritan protections.
3. Assert grounded Gemini response returned without error.

### Phase 9: Mobile Responsive & Visual Stability
1. Viewport resize to `390 × 844`.
2. Assert zero horizontal overflow (`scrollWidth <= clientWidth`).
3. Verify mobile drawer navigation functionality.

