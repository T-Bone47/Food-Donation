# FoodShare Design System — Page Patterns & Role Workflows

**Version:** 2.0.0  
**Updated:** November 2026  

---

## 1. Pattern 1: Public Onboarding & Demo Role Gateway (`/`, `/login`)

### Layout Anatomy
- **Left Panel (Desktop):** Editorial hero communicating the 4-step food recovery journey (Listing -> Volunteer Claim -> NGO Delivery -> Verified Receipt).
- **Right Panel (Desktop):** Multi-role registration form or sign-in card.
- **Academic Demo Gateway:** Prominent, non-intrusive demo selector banner allowing evaluators to bypass credential generation and experience any role with isolated test data.

### Interaction Rules
- Role selection immediately updates form fields (e.g. NGO role reveals organization verification fields; Donor role offers location lookup).
- Successful registration redirects to login with pre-populated confirmation toast.

---

## 2. Pattern 2: Donor Surplus Listing & Management (`/donordash`, `/donate`, `/mydonations`)

### Layout Anatomy
- **Dashboard Overview:** Metric banner ("At a glance") reporting live surplus counts and total redistributed quantities broken down by unit.
- **Listing Form (`/donate`):** 2-column manifest grid dividing item details, chronological collection constraints, and pickup coordinates. Includes single-click geolocation auto-fill.
- **Listing Feed (`/mydonations`):** 3-column responsive card grid displaying each donation's status, collection countdown, and direct Journey link.

---

## 3. Pattern 3: Volunteer Discovery & Delivery Handover (`/volunteerdash`, `/volunteer/tasks`)

### Layout Anatomy
- **Pickup Feed (`/volunteerdash`):** Real-time grid of open donations. Each card prominently highlights pickup urgency (`urgent`, `soon`, `ok`) and distance.
- **Active Task Banner (`/volunteer/tasks`):** Fixed operational card at top of page displaying donor address, Google Maps directions, and 2-step state buttons:
  - Step A: `Mark as picked up` (opens confirmation dialog).
  - Step B: `Deliver to NGO` (selects verified NGO destination and records handover).

---

## 4. Pattern 4: NGO Intake & Receipt Confirmation (`/ngodash`)

### Layout Anatomy
- **Incoming Deliveries Queue:** Top priority section listing food currently in transit or delivered to the shelter by volunteers.
- **Inspection & Receipt Confirmation:** Detailed intake card showing meal quantities and food categories. One-click "Confirm Receipt" button triggers confirmation dialog, officially closing the donation lifecycle and adding meals to the verified redistribution total.
- **Completed Archive:** Tabular history of accepted deliveries with verified timestamps.

---

## 5. Pattern 5: Platform Governance Console (`/adminpage`)

### Layout Anatomy
- **Platform Overview:** High-level KPI tiles + urgent alerts (e.g. pending NGO verifications waiting for review).
- **Tabbed Governance Tables:** Full-width multi-column tables for Donations, Users, Verifications, and Audit Activity.
- **Table Features:** Instant status filtering, text search, pagination, right-aligned numbers, and detail inspection modals.
