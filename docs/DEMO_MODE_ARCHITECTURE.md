# FoodShare Platform — Demo Mode Architecture & Isolation Specification

## 1. Executive Summary & Purpose

The **Interactive Demo Mode** provides a self-contained, presentation-ready demonstration environment for the Unified Food Donation Platform. Designed for academic reviews, faculty evaluations, stakeholder demonstrations, and product walkthroughs, it showcases the entire food rescue lifecycle across all four platform roles (**Donor**, **Volunteer**, **NGO**, **Administrator**) without requiring manual user registration or external data manipulation.

### Core Architecture Axiom
> **DEMO LOGIN MUST NEVER INTERFERE WITH NORMAL LOGIN.**
> Normal registration, password authentication, session issuance, database records, and role authorization must remain completely intact, isolated, and unmodified. Demo operations must never alter real production data, and demo privileges must never spill over into production administration.

---

## 2. Existing Authentication Architecture Audit

### 2.1 Current Production Authentication Flow
The current platform authentication operates as follows:

```
[ Client Browser ]
        |
        |  1. POST /api/v1/auth/login { email, password }
        v
[ Express Auth Router (routes/auth.routes.js) ]
        |
        |  2. Validate format & rate limit (20 req / 15 min)
        v
[ Auth Service (services/auth.service.js) ]
        |
        |  3. Fetch user by normalized email from Supabase `users`
        |  4. Verify bcrypt hash (12 rounds) & check `account_status === 'active'`
        v
[ Token Library (lib/token.js) ]
        |
        |  5. issueSessionToken({ userId, email, role, jti, iat, exp })
        |     Token format: base64url(payload) + '.' + HMAC-SHA256(payload, SESSION_SECRET)
        v
[ Response Envelope ]
        |
        |  6. Return { data: { user: safeUser, token }, meta: { requestId } }
        v
[ Frontend Storage (localStorage) ]
           - authToken: '<token>'
           - user: '{ id, name, email, role }'
```

### 2.2 Existing Authorization & Verification Middleware
* **`authMiddleware` ([`backend/middleware/authenticate.js`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/backend/middleware/authenticate.js))**:
  - Parses `Authorization: Bearer <token>`.
  - Verifies token signature and checks blocklist revocation.
  - Queries `users` table via `loadCurrentUser()` to verify user exists and `account_status === 'active'`.
  - Attaches `req.auth = { userId, email, role }` and `req.sessionPayload = payload`.
* **`requireRole(...allowedRoles)` ([`backend/middleware/authorize.js`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/backend/middleware/authorize.js))**:
  - Ensures `req.auth.role` matches required roles (`Donor`, `Volunteer`, `NGO`, `Admin`).
* **Resource Ownership Guards**:
  - `requireDonationOwnership()`: Checks that the authenticated donor owns the donation.
  - `requireAssignmentOwnership()`: Checks that the volunteer owns the active claim.
  - `requireApprovedNGO()`: Confirms NGO profile is verified before receipt confirmation.

---

## 3. Demo Mode Isolation Architecture

### 3.1 Dual-Environment Tenant Model

To satisfy the non-negotiable isolation requirements, Demo Mode implements a **Server-Enforced Tenant Isolation Model**:

```
+--------------------------------------------------------------------------------------------------+
|                                        APPLICATION GATEWAY                                       |
+-------------------------------------------------+------------------------------------------------+
                                                  |
                         +------------------------+------------------------+
                         |                                                 |
             [ Normal Credentials ]                               [ Demo Role Request ]
                         |                                                 |
                         v                                                 v
             POST /api/v1/auth/login                            POST /api/v1/demo/session
                         |                                                 |
            Bcrypt Password Check                              Fixed Demo Identity Lookup
                         |                                                 |
            issueSessionToken({                                issueSessionToken({
              userId: realUser.id,                               userId: demoUser.id,
              role: realUser.role,                               role: demoUser.role,
              isDemo: false                                      isDemo: true, demoTenant: 'demo'
            })                                                 })
                         |                                                 |
                         v                                                 v
           [ Normal Session: Bearer ]                         [ Demo Session: Bearer ]
                         |                                                 |
+------------------------v-------------------------------------------------v-----------------------+
|                                    AUTHENTICATED REQUEST LAYER                                    |
|                                                                                                  |
|   authMiddleware inspects session token:                                                         |
|   - req.auth.isDemo = true  --> DEMO MODE CONTEXT (Isolated to demo tenant / seed records)      |
|   - req.auth.isDemo = false --> NORMAL MODE CONTEXT (Real database records, RLS enforced)        |
+--------------------------------------------------------------------------------------------------+
                         |                                                 |
                         v                                                 v
+--------------------------------------------------+  +--------------------------------------------+
|             PRODUCTION / REAL DATA STORE         |  |             DEMO ISOLATED DATA STORE       |
|  - Real users (Donors, NGOs, Admins)             |  |  - 4 Pre-provisioned Demo Accounts         |
|  - Real live donations                           |  |  - Interconnected Demo Scenario Seed       |
|  - Real volunteer assignments                    |  |  - In-memory / Isolated Demo Tenant Tables |
|  - Real audit logs & notifications               |  |  - Resettable state (Zero prod impact)     |
+--------------------------------------------------+  +--------------------------------------------+
```

### 3.2 Principles of Demo Mode Isolation

1. **Server-Side Authority**:
   - The client never decides whether an operation is in Demo Mode.
   - `isDemo: true` is embedded in the cryptographically signed session token issued by `POST /api/v1/demo/session`.
   - Modifying browser storage or adding query parameters cannot convert a demo session into a normal session or elevate privileges.
2. **Strict Identity Binding**:
   - The demo endpoint only issues sessions for the **four preconfigured demo identities**:
     - `demo-donor@foodshare.local` (`Donor`)
     - `demo-volunteer@foodshare.local` (`Volunteer`)
     - `demo-ngo@foodshare.local` (`NGO`)
     - `demo-admin@foodshare.local` (`Admin`)
   - Arbitrary roles or user IDs passed in the body are rejected with HTTP 400.
3. **Database & Record Segregation**:
   - All demo data records (users, donations, assignments, confirmations, notifications, audit logs) carry an explicit demo marker (`is_demo = true` or dedicated demo tenant partition).
   - Normal queries automatically filter out demo records (`WHERE is_demo = false`).
   - Demo queries strictly restrict queries to demo records (`WHERE is_demo = true`).
   - Under no circumstances can a demo user read or write production records.
4. **Idempotent Demo Reset**:
   - Resetting demo data (`POST /api/v1/demo/reset`) requires an active demo session.
   - The reset handler purges only records tagged with `is_demo = true` and re-seeds the pristine 4-role lifecycle scenario.
   - Production records are physically excluded from the deletion criteria.

---

## 4. Demo Authentication Flow & API Contract

### 4.1 Endpoint: `POST /api/v1/demo/session`

* **Purpose**: Issue an authenticated demo session token for one of the four official demo roles.
* **Access**: Public / Unauthenticated entry point.
* **Rate Limiting**: 30 requests per 15 minutes per IP.

#### Request Body
```json
{
  "role": "donor" // Allowed values: "donor", "volunteer", "ngo", "admin"
}
```

#### Validation Rules
1. Role must be normalized and matched against `["donor", "volunteer", "ngo", "admin"]`.
2. Any unrecognized string is rejected with `400 VALIDATION_ERROR`.
3. The server locates the designated demo account corresponding to the requested role.
4. Generates a signed session token:
   ```json
   {
     "userId": "d0000000-0000-0000-0000-000000000001",
     "email": "demo-donor@foodshare.local",
     "role": "Donor",
     "isDemo": true,
     "jti": "<uuid>",
     "iat": 1762080000,
     "exp": 1762166400
   }
   ```

#### Response Envelope (200 OK)
```json
{
  "data": {
    "user": {
      "id": "d0000000-0000-0000-0000-000000000001",
      "name": "Demo Food Donor",
      "email": "demo-donor@foodshare.local",
      "role": "Donor",
      "organization": "Community Kitchen Demo",
      "phonenumber": "+91 98765 43210",
      "area": "Indiranagar",
      "pincode": "560038",
      "state": "Karnataka",
      "country": "India",
      "account_status": "active",
      "isDemo": true
    },
    "token": "<base64payload>.<signature>",
    "isDemo": true
  },
  "meta": {
    "requestId": "c1f7a22e-e47b-402a-9cb0-394c5d5a2d1e"
  }
}
```

---

### 4.2 Endpoint: `POST /api/v1/demo/reset`

* **Purpose**: Revert demo scenario state back to initial seed data.
* **Access**: Authenticated demo session (`req.auth.isDemo === true`).
* **Protection**: If invoked with a non-demo token or unauthenticated, returns `403 FORBIDDEN`.

#### Response Envelope (200 OK)
```json
{
  "data": {
    "message": "Demo data successfully reset to initial seed state.",
    "seedSummary": {
      "users": 4,
      "donations": 5,
      "assignments": 2,
      "notifications": 4
    }
  },
  "meta": {
    "requestId": "d2f8b33f-f58c-413b-8dc1-405d6e6b3e2f"
  }
}
```

---

## 5. Preconfigured Demonstration Scenario (Seed Data)

The demo environment is populated with an interconnected, realistic scenario illustrating the full lifecycle:

```
[ Active Demo Scenario State ]

1. Donor (Demo Food Donor)
   - Created: "50 Meal Boxes - Fresh Biryani & Raita" (Status: AVAILABLE)
   - Created: "Fresh Farm Vegetables (25 kg)" (Status: ASSIGNED -> Claimed by Demo Volunteer)
   - Created: "Surplus Sourdough & Bakery Bread (15 kg)" (Status: DELIVERED -> Awaiting NGO Receipt)
   - Created: "Packaged Dry Groceries (100 kg)" (Status: COMPLETED -> Receipt confirmed by Demo NGO)
   - Created: "Catering Leftovers (Expired)" (Status: EXPIRED)

2. Volunteer (Demo Volunteer)
   - Active Claim: "Fresh Farm Vegetables (25 kg)" (Ready for pickup from Donor)
   - Completed Delivery: "Surplus Sourdough & Bakery Bread (15 kg)" to Demo NGO
   - Historical Delivery: "Packaged Dry Groceries (100 kg)" (Completed & Confirmed)

3. NGO (Demo NGO - Hope Shelter)
   - Verification Status: Approved
   - Incoming Delivery: "Surplus Sourdough & Bakery Bread" (Status: DELIVERED, button active: "Confirm Receipt")
   - Received History: "Packaged Dry Groceries (100 kg)" (Completed)

4. Administrator (Demo Administrator)
   - Console Overview: 5 total donations, 1 active assignment, 1 awaiting confirmation, 1 completed.
   - User Management: 4 demo accounts visible (Donor, Volunteer, NGO, Admin).
   - Audit Log: Verified entries for claim, pickup, delivery, and receipt.
```

---

## 6. Frontend Presentation UX Architecture

### 6.1 Login Page Integration ([`frontend/src/app/login/page.tsx`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/frontend/src/app/login/page.tsx))
* The existing email and password login form is 100% preserved.
* A prominent **"Explore Interactive Demo"** card is added below or adjacent to the form:
  - Header: *"Experience FoodShare in Demo Mode"*
  - Description: *"Instantly explore all four platform roles with pre-seeded demonstration data. No sign-up required."*
  - Action: Opens the **Role Selection Modal** featuring distinct role cards for Donor, Volunteer, NGO, and Administrator.

### 6.2 Persistent Demo Mode Badge & Quick Role Switcher
* When `user.isDemo === true`:
  - **Top Banner / Navigation Pill**: An elegant non-intrusive badge `[ DEMO MODE: <ROLE> ]` is rendered in `AppNav.tsx`.
  - **Quick Role Switcher & Presentation Guide**: A collapsible "Guided Demo" assistant allowing one-click switching between demo roles.
  - **Exit Demo**: A dedicated button in `AppNav` and the user dropdown that terminates the demo session and redirects cleanly to `/login`.

---

## 7. Security & Threat Modeling

| Attack Vector | Vulnerability | Demo Architecture Mitigation |
| :--- | :--- | :--- |
| **Privilege Escalation** | Demo Donor sends `"role": "admin"` to access console. | **Server-side check**: Role is verified from the HMAC-signed token. `requireRole("Admin")` rejects any token where `role !== 'Admin'`. |
| **Data Pollution** | Demo user creates real donations that real volunteers attempt to pick up. | **Tenant Isolation**: Demo records are flagged with `is_demo = true` and only visible to demo sessions. Real users never see demo listings. |
| **Production Corruption** | Demo reset deletes real production donations. | **Physical Query Scoping**: `POST /api/v1/demo/reset` explicitly deletes ONLY records matching `is_demo = true` or demo user IDs. |
| **Normal Session Interference** | Demo login overwrites or invalidates a real administrator's session. | **Session Key Cleanliness**: Switching modes revokes and purges local session storage completely before initializing the new mode. |

