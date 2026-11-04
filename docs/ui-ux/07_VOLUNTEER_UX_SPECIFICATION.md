# FoodShare — Volunteer Logistics UX Specification

**Document:** `docs/ui-ux/07_VOLUNTEER_UX_SPECIFICATION.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Desktop HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Architect:** Principal Product Designer & Field Logistics Specialist  

---

## 1. Overview & Operational Mandate

Volunteer field responders require an interface optimized for rapid triage, turn-by-turn routing, and two-stage physical handover verification:
1. **Available Rescue Missions:** Discovering unassigned surplus food listings within geographical radius.
2. **Urgency Sorting:** Highlighting listings nearing collection deadlines (`urgent` < 2h, `soon` < 4h, `ok`).
3. **Execution Workflow:** Two-stage state confirmation:
   - `Claim Task` -> assigns mission exclusively to volunteer.
   - `Mark Picked Up` -> triggers confirmation dialog and transitions status to `PICKED_UP`.
   - `Deliver to NGO` -> drops food at approved NGO and transitions status to `DELIVERED`.

---

## 2. Key Pages & Workflows

### 1. Dispatch Console (`/volunteerdash`)
- **Duty Console Header:** Real-time volunteer rescue KPIs (Completed Pickups, Total Hours, Personal Impact).
- **Available Rescues Feed:** 3-column feed on desktop widescreen with clear urgency chips, distance calculation, donor address snippet, and 1-tap "Claim Mission" button.
- **Active Mission Sticky Card:** Highlighted top card when a mission is currently in progress, providing one-click phone dial and map routing links.

### 2. Assigned Tasks Workspace (`/volunteer/tasks`)
- **Active Task Handover Card:**
  - Complete pickup address with turn-by-turn navigation.
  - Safe handling temperature guidance for cooked meals.
  - Two-stage confirmation dialog:
    - Step 1: "Mark as picked up" button triggers modal: "Confirm physical handover from donor".
    - Step 2: "Deliver to NGO" dropdown selector listing only verified, approved NGOs (`/api/v1/ngos/approved`).
- **Completed History Ledger:** Archival ledger of past successful rescues with recipient NGO acknowledgments.
