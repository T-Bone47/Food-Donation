# FoodShare — Data Adapter & API Integration Mapping

## 1. Overview
The reference frontend (`SIH-HACKATHON-lastupdate (1).zip`) originally called a prototype backend with simplified payload structures and occasional mock states. The current FoodShare application features a robust production-grade Express 5 backend with Supabase PostgreSQL, JWT authentication, Demo Mode, Row Level Security, and Realtime event broadcast channels.

To achieve flawless visual parity while ensuring full production functionality, all UI forms and data tables communicate via centralized typed adapters in `frontend/src/lib/api-client.ts`.

---

## 2. Authentication & Session Adapters

| Reference Route / Flow | Reference Behavior | FoodShare Production Adapter | Payload & Response Schema |
| :--- | :--- | :--- | :--- |
| `POST /api/auth/register` (Step 2 on `/`) | Minimal JSON posting with role string | `authApi.signup(userData)` | `{ name, email, password, role, phone, address, coordinates }` $\rightarrow$ `{ token, user }`. Sets session cookies & localStorage. |
| `POST /api/auth/login` (`/login`) | Form posting | `authApi.login(credentials)` | `{ email, password }` $\rightarrow$ `{ token, user }`. Automatically routes to role dashboard: `donor` $\rightarrow$ `/donordash`, `volunteer` $\rightarrow$ `/volunteerdash`, `ngo` $\rightarrow$ `/ngodash`, `admin` $\rightarrow$ `/adminpage`. |
| Shared Demo Mode (`page.tsx` & `login/page.tsx`) | Hardcoded test account switches | `authApi.demoLogin(role)` | Synchronizes session state with backend demo seeds (Donor: `donor@demo.com`, Volunteer: `volunteer@demo.com`, NGO: `ngo@demo.com`, Admin: `admin@demo.com`). |
| Session Validation | Client-side cookie read | `authApi.getMe()` | Validates JWT token or demo bearer header against `/api/auth/me`. Restores user profile on cold refresh. |

---

## 3. Donor Operations Adapters

| Reference Form / Component | Method & Route | Adapter Function | Field Transformation / Mapping |
| :--- | :--- | :--- | :--- |
| `/donate` Food Submission | `POST /api/donations` | `donationsApi.create(payload)` | Adapts dynamic form array `foodItems: [{ name, quantity, unit }]`, `servings`, `shelfLifeHours`, `pickupAddress`, `coordinates` to the normalized backend database schema. |
| `/donordash` Impact Summary | `GET /api/impact/summary` | `impactApi.getSummary()` | Computes total meals rescued, active rescue runs, and CO₂ kg diverted. Maps `total_meals_rescued` $\rightarrow$ `totalMealsRescued`. |
| `/mydonations` History & Tracking | `GET /api/donations/my` | `donationsApi.getMine()` | Returns donor's donations with volunteer metadata (`volunteer_name`, `volunteer_phone`) and real-time status (`PENDING`, `ACCEPTED`, `PICKED_UP`, `DELIVERED`). |
| `/mydonations` Cancellation | `POST /api/donations/:id/cancel` | `donationsApi.cancel(id)` | Validates lifecycle state and marks record as cancelled with reason note. |

---

## 4. Volunteer Operations Adapters

| Reference Component | Method & Route | Adapter Function | Field Transformation / Mapping |
| :--- | :--- | :--- | :--- |
| `/volunteerdash` Available Rescues | `GET /api/volunteer/tasks` | `volunteerApi.getTasks()` | Fetches unassigned rescues with geolocation calculation (distance in km from volunteer GPS) and shelf-life countdown. |
| `/volunteerdash` Accept Rescue | `POST /api/volunteer/tasks/:id/claim` | `volunteerApi.claimTask(id)` (alias: `claim(id)`) | Atomic claim operation ensuring no double-assignment race conditions across concurrent volunteers. |
| `/acceptpage` Custody Stepper | `GET /api/volunteer/active` | `volunteerApi.getActiveTask()` | Returns currently active rescue including donor contact, address coordinates, and target NGO drop-off depot. |
| `/acceptpage` "Picked ✅" Action | `POST /api/volunteer/tasks/:id/pickup` | `volunteerApi.confirmPickup(id)` | Updates status to `PICKED_UP`, logs pickup timestamp, and emits realtime notification to Donor and NGO. |
| `/acceptpage` "Delivered 🏁" Action | `POST /api/volunteer/tasks/:id/deliver` | `volunteerApi.confirmDelivery(id)` | Transitions status to `DELIVERED`, ready for NGO verification sign-off. |

---

## 5. NGO Operations Adapters

| Feature / Tab | Method & Route | Adapter Function | Field Transformation / Mapping |
| :--- | :--- | :--- | :--- |
| Receiving Hub (`/ngodash`) | `GET /api/ngos/metrics` | `ngoApi.getMetrics()` | Summarizes inbound packages, pending inspections, storage capacity, and historical received count. |
| Incoming Deliveries Tab | `GET /api/ngos/incoming` | `ngoApi.getIncoming()` | Fetches in-transit and arrived donations awaiting intake quality inspection. |
| Intake History / Ledger Tab | `GET /api/ngos/history` | `ngoApi.getHistory()` | Paginated query of verified food rescues completed by this organization. |
| Safety Verification Modal | `POST /api/donations/:id/confirm-receipt` | `ngoApi.confirmReceipt(id, safetyReport)` | Submits quality report (`temperatureChecked: true`, `packagingSealed: true`, `sensoryPassed: true`, notes) and completes custody transfer to `COMPLETED`. |

---

## 6. Admin & Governance Adapters

| Feature / Component | Method & Route | Adapter Function | Field Transformation / Mapping |
| :--- | :--- | :--- | :--- |
| Global Operational Ledger | `GET /api/admin/donations` | `adminApi.getDonations(filters)` | Supports full-text search, role filters, status filtering (`PENDING`, `ACCEPTED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `CANCELLED`). |
| System Health & Metrics | `GET /api/admin/metrics` | `adminApi.getMetrics()` | Live counters: active donations, active volunteers, total meals rescued, error rate. |
| Admin Force Override | `POST /api/admin/donations/:id/transition` | `adminApi.forceTransition(id, status)` | Emergency override capability for system supervisors with audit logging. |

---

## 7. AI Chatbot Adapter

| Feature / Component | Method & Route | Adapter Function | Notes |
| :--- | :--- | :--- | :--- |
| Circular Floating Widget | `POST http://localhost:5002/chat` | `fetch('/chat')` with port 5002 proxy fallback | Connects to Python Flask backend using Gemini API. Includes immediate local heuristics for common food safety, shelf life, and donation queries when offline. |
