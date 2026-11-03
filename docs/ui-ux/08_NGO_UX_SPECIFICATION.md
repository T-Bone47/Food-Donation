# FoodShare — NGO Intake & Distribution UX Specification

**Document:** `docs/ui-ux/08_NGO_UX_SPECIFICATION.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Desktop HD), 1440 × 900 (Laptop), 1024 × 768 (Tablet), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Architect:** Senior UX Architect & Community Logistics Lead  

---

## 1. Overview & Operational Mandate

Receiving Non-Governmental Organizations (shelters, soup kitchens, food pantries, and community relief centers) serve as the terminal intake point for rescued food.

Their interface must clearly distinguish between:
1. **`DELIVERED BY VOLUNTEER`:** Food physically dropped off at the facility, awaiting staff inspection and digital receipt signature.
2. **`AWAITING NGO CONFIRMATION`:** Pending verification of quantity, packaging integrity, and temperature safety.
3. **`RECEIPT CONFIRMED / COMPLETED`:** Terminal successful lifecycle state, releasing impact metrics to donor and volunteer records.

---

## 2. Key Pages & Workflows (`/ngodash`)

### 1. Inbound Cargo Manifest
- **Awaiting Confirmation Section (`#awaiting`):**
  - Highlighted card list of incoming deliveries dropped off by volunteers.
  - Manifest breakdown: food category, portion volume, donor source, and volunteer transporter.
  - "Confirm Receipt" primary action button opening the digital receipt signature dialog.

### 2. Digital Receipt Signature Modal
- Accessible modal built with native HTML `<dialog role="dialog">`.
- Staff verification checklist:
  - Packaging seal intact
  - Temperature safety within limits
  - Quantity matches manifest
- "Confirm and Complete Delivery" action sends `POST /api/v1/ngos/confirm/:donationId`, atomically completing the donation lifecycle.

### 3. Community Distribution Ledger (`#completed`)
- Historical distribution archive detailing recipient counts, dates received, and cumulative impact.
- Per-unit totals formatted accurately without aggregating non-interchangeable units (servings, kilograms, liters).

