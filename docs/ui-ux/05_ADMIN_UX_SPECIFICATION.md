# FoodShare — Admin Console UX Specification

**Document:** `docs/ui-ux/05_ADMIN_UX_SPECIFICATION.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Primary HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Architect:** Senior UX Architect & Application Security Engineer  

---

## 1. Overview & Operational Mandate

The Administrator Console (`/adminpage`) is the central governance, security, and operational monitoring command center for FoodShare.

It operates across four critical domains:
1. **System Health & Throughput (Overview Panel):** Real-time monitoring of food recovery volume, active donor engagement, verified volunteer fleets, and approved receiving NGO centers.
2. **Food Dispatch Lifecycle Oversight (Donations Panel):** End-to-end monitoring of every listing across its 7 lifecycle states (`AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`, `COMPLETED`, `CANCELLED`, `EXPIRED`).
3. **Identity & Access Governance (Users Panel):** Full lifecycle management of all platform accounts with immediate suspension and reactivation controls.
4. **Non-Repudiation Audit Trail (Activity Panel):** Chronological ledger of state transitions, administrative interventions, and security actions.

---

## 2. Redesigned User Management Workspace (`UsersPanel.tsx`)

The Users tab was redesigned from the ground up to solve the previous basic table defects:

### 1. Workspace Header & Live Telemetry
- **Header:** "User Directory & Access Control" with clear operational description.
- **Telemetry Counter Pills:**
  - Total Accounts Listed
  - Active Accounts (with green status indicator)
  - Suspended Accounts (with crimson warning indicator)

### 2. Multi-Filter Operational Toolbar
- **Role Filter Dropdown:** All Roles, Donor, Volunteer, NGO, Admin.
- **Account Status Filter:** All Statuses, Active, Suspended, Rejected.
- **Keyword Search:** Rapid search across user names, email addresses, and affiliated organization names with a 1-click clear button.
- **Reset Button:** Quickly clears all active filters.

### 3. High-Density Tabular Layout
- **Column 1 — User Identity (30% width):** Two-letter monogram avatar in muted frame, user name in `font-semibold text-foreground`, email address in `text-xs text-muted-foreground`, and organization badge with `<Building2>` vector icon.
- **Column 2 — Role Badge (15% width):** High-contrast pill badge with role-specific Lucide icon:
  - Donor: `HandHeart` in Emerald
  - Volunteer: `Truck` in Sky Blue
  - NGO: `Building2` in Teal
  - Admin: `ShieldCheck` in Amber
- **Column 3 — Status (15% width):** Semantic status indicator with solid dot for Active, `Ban` icon for Suspended, and `ShieldAlert` for Rejected.
- **Column 4 — Joined Date (20% width):** Monospace formatted timestamp (`formatDate(u.created_at)`).
- **Column 5 — Actions (20% width):** Contextual Suspend / Reactivate action button. Self-account and fellow Admin accounts are automatically protected with read-only badges ("Your account", "Protected Admin").

### 4. Reversible Suspension Workflow
Clicking "Suspend User" or "Reactivate User" triggers an accessible `<dialog role="dialog">` modal (`ConfirmDialog.tsx`):
- Explicitly warns of immediate session termination upon suspension.
- Focus is trapped on "Cancel" for destructive actions to prevent accidental key-presses.
- Real-time toast confirmation upon API execution.

---

## 3. Data Integrity & Anti-Fabrication Principles

In strict adherence to product rules:
- All telemetry numbers represent real database records or pristine demo seed records. Zero hardcoded mock numbers.
- Tables support offset-based pagination (`Pager.tsx`) with clear boundary indicators.
- Empty states provide actionable instructions rather than dead space.
