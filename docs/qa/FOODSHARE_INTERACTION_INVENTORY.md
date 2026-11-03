# FoodShare — Complete Interaction Inventory & Audit

**Date:** November 2026  
**Audience:** QA Engineers, Product Designers, Full-Stack Architects  
**Scope:** Exhaustive catalog of every button, link, modal, tab, and form control across all 4 user roles.

---

## 1. Interaction Inventory Matrix

### Role: Donor

| Page Route | Element | Expected Action | Current Implementation | API / DB Dependency | Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/donordash` | "Create Donation" Button | Navigate to `/donate` wizard | `<Link href="/donate">` | None (Client routing) | **Working** |
| `/donordash` | "Donation Receipts" Button | Navigate to `/mydonations` | `<Link href="/mydonations">` | None (Client routing) | **Working** |
| `/donordash` | "Inspect Custody Tracking" Button | Open in-dashboard slide-over modal | `setTrackingDonation(d)` | `GET /api/v1/donations/:id` | **Working** (< 134ms) |
| `/donordash` | "View Custody Progress" Button | Open in-dashboard slide-over modal | `setTrackingDonation(d)` | `GET /api/v1/donations/:id` | **Working** (< 134ms) |
| `/donordash` | Custody Modal "Close" / `Esc` | Close modal sheet | `onClose()` / `Escape` listener | Local state | **Working** |
| `/donordash` | Custody Modal "Open Permitted Manifest" | Navigate to `/acceptpage/[id]` | `<Link href="/acceptpage/[id]">` | Pre-seeded SWR cache | **Working** |
| `/donate` | Wizard Step 1 Form | Validate title, category, quantity, unit | `setFormValues()`, `validate()` | Local state validation | **Working** |
| `/donate` | Wizard Step 2 Geocode | Address lookup / GPS pin | `lookupLocation()` | Nominatim geocoding | **Working** |
| `/donate` | Wizard Step 3 Submit | Submit surplus donation | `donationsApi.create()` | `POST /api/v1/donations` → `donations` table | **Working** |
| `/mydonations` | Status Filter Select | Filter by status (`AVAILABLE`, `ASSIGNED`, etc.) | `setStatus(val)` | `GET /api/v1/donations/mine` | **Working** |
| `/mydonations` | Pagination Controls | Page next/prev | `setPage(p)` | `GET /api/v1/donations/mine` offset | **Working** |
| `/mydonations` | "Cancel Donation" Button | Cancel uncollected listing | `donationsApi.cancel(id)` | `POST /api/v1/donations/:id/cancel` | **Working** |

---

### Role: Volunteer

| Page Route | Element | Expected Action | Current Implementation | API / DB Dependency | Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/volunteerdash` | "Claim Donation" Button | Claim available donation | `donationsApi.claim(id)` | `POST /api/v1/donations/:id/claim` (Atomic) | **Working** |
| `/volunteerdash` | "View Details" Card Link | Navigate to `/acceptpage/[id]` | `<Link href="/acceptpage/[id]">` | `GET /api/v1/donations/:id` | **Working** |
| `/volunteer/tasks` | "Confirm Pickup" Action | Confirm cargo handover from kitchen | `donationsApi.recordPickup(id)` | `POST /api/v1/donations/:id/pickup` | **Working** |
| `/volunteer/tasks` | "Confirm Delivery" Action | Confirm delivery to NGO dock | `donationsApi.recordDelivery(id)` | `POST /api/v1/donations/:id/deliver` | **Working** |
| `/volunteer/tasks` | NGO Destination Selector | Select destination shelter | Dropdown `ngo_id` | `GET /api/v1/ngos/approved` | **Working** |

---

### Role: NGO (Community Shelter)

| Page Route | Element | Expected Action | Current Implementation | API / DB Dependency | Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/ngodash` | Sidebar "Receiving Hub" | Open Receiving Hub overview | `<Link href="/ngodash">` | None | **Repaired (Tab: `hub`)** |
| `/ngodash` | Sidebar "Incoming Deliveries" | Open Inbound inspection console | `<Link href="/ngodash?tab=incoming">` | `GET /api/v1/ngos/incoming` | **Repaired (Tab: `incoming`)** |
| `/ngodash` | Sidebar "Received History" | Open Verified receipt ledger | `<Link href="/ngodash?tab=history">` | `GET /api/v1/ngos/history` | **Repaired (Tab: `history`)** |
| `/ngodash` | Inflow Queue Item Select | Select consignment for safety check | `setInspectingTarget(d)` | Local state | **Working** |
| `/ngodash` | "Confirm Receipt & Stamp" Button | Open signature modal | `setConfirmingTarget(d)` | Local state | **Working** |
| `/ngodash` | Modal "Confirm Receipt" Action | Finalize donation & issue IRS § 170 | `donationsApi.confirmReceipt(id)` | `POST /api/v1/donations/:id/confirm-receipt` | **Working** |
| `/ngodash` | Verification Form Submit | Submit NGO registration documents | `ngoApi.submitVerification()` | `POST /api/v1/ngos/verification` | **Working** |

---

### Role: Administrator

| Page Route | Element | Expected Action | Current Implementation | API / DB Dependency | Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/adminpage` | Sidebar "Dashboard" | Open Overview tab | `<Link href="/adminpage">` | `GET /api/v1/admin/overview` | **Working** |
| `/adminpage` | Sidebar "All Donations" | Switch to Donations tab | `<Link href="/adminpage?tab=donations">` | `GET /api/v1/admin/donations` | **Repaired (Synced tab)** |
| `/adminpage` | Sidebar "NGO Verifications" | Switch to Verifications tab | `<Link href="/adminpage?tab=verifications">` | `GET /api/v1/admin/verifications` | **Repaired (Synced tab)** |
| `/adminpage` | Sidebar "Audit Logs" | Switch to Activity tab | `<Link href="/adminpage?tab=activity">` | `GET /api/v1/admin/activity` | **Repaired (Synced tab)** |
| `/adminpage` | Sidebar "Users & NGOs" | Switch to Users tab | `<Link href="/adminpage?tab=users">` | `GET /api/v1/admin/users` | **Repaired (Synced tab)** |
| `/adminpage` | "Approve NGO" Action | Approve pending NGO application | `adminApi.reviewVerification(id)` | `POST /api/v1/admin/verifications/:id/review` | **Working** |
| `/adminpage` | "Reject NGO" Action | Reject pending NGO application | `adminApi.reviewVerification(id)` | `POST /api/v1/admin/verifications/:id/review` | **Working** |
| `/adminpage` | Search & Filter Donors/Users | Filter table by keyword/role | `searchQuery` state filter | Monospace tabular view | **Working** |

---

### Global Shell & Utility Controls

| Page Route | Element | Expected Action | Current Implementation | API / DB Dependency | Result / Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| All Pages | Role Switcher Avatar | Open Quick Role Switcher modal | `onOpenDemoSelector()` | `POST /api/v1/demo/session` | **Working** |
| All Pages | Role Card Select | Switch user role & reload context | `handleSelect(role)` | SWR Cache invalidation | **Working** |
| All Pages | "Logistics AI" Button | Open Gemini assistant slide-over | Custom event dispatch | Port 5002 Flask microservice | **Working** |
| All Pages | Notification Bell | Open Notification Center | `<Link href="/notification">` | `GET /api/v1/notifications` | **Working** |
| All Pages | "Sign Out" Link | Terminate session & redirect to login | `signOut()`, `router.push('/login')` | `POST /api/v1/auth/logout` | **Working** |

