# Phase 7: End-to-End Acceptance Test & Lifecycle Verification Report

**Project**: Unified Food Donation Platform (SIH Hackathon)  
**Date**: November 2, 2026  
**Auditor**: Senior QA Automation Engineer, Principal Full-Stack Architect & Release Manager  
**Scope**: Full User Journey Acceptance, Edge Cases, State Machines & Impact Integrity  

---

## 1. Executive Summary

This acceptance evaluation validates the full donation and delivery lifecycle across all participant roles: Donor, Volunteer, Receiving NGO, and Administrator. All test scenarios were verified against actual application code, PostgreSQL constraints, atomic stored procedures, and error handling middleware.

### Lifecycle Status Machine:
```
DONOR: Create Listing [AVAILABLE]
           │
           ▼
VOLUNTEER: Atomic Claim [ASSIGNED]
           │
           ▼
VOLUNTEER: Physical Collection [PICKED_UP]
           │
           ▼
VOLUNTEER: Handover to NGO [DELIVERED]
           │
           ▼
NGO: Receipt Confirmation [COMPLETED]
```

---

## 2. Primary Workflow Verification (Happy Path)

### Step 1: Donor Lists Surplus Food
- **Actor**: Registered Donor (`user_role = 'Donor'`)
- **Initial State**: None
- **Action**: Submits form on `/donate` with title, food category, positive quantity, valid units, future expiry timestamp, pickup deadline (`pickup_deadline <= expires_at`), and address.
- **Backend Execution**: `POST /api/v1/donations` calls `createDonation()`.
- **Database Mutation**: Record inserted in `donations` table with `status = 'AVAILABLE'`.
- **Audit & Notification**:
  - `audit_logs` records `donation.created` with food metadata.
  - Active volunteers in matching area/pincode receive notification.
- **Dashboard Reflection**: Listing appears immediately in Donor's dashboard and `/mydonations` with live countdown timer.
- **Acceptance Status**: **ACCEPTED**

### Step 2: Volunteer Claims Available Donation
- **Actor**: Registered Volunteer (`user_role = 'Volunteer'`)
- **Initial State**: Donation status is `AVAILABLE` and `expires_at > NOW()`.
- **Action**: Clicks "Claim Pickup" on `/volunteerdash`.
- **Backend Execution**: `POST /api/v1/donations/:id/claim` executes `claim_donation(p_donation_id, p_volunteer_id)` stored procedure.
- **Database Mutation**:
  - Row lock `FOR UPDATE` prevents concurrent claims.
  - `donations.status` transitions from `AVAILABLE` to `ASSIGNED`.
  - Active assignment record created in `assignments` table (`assignment_status = 'active'`).
- **Audit & Notification**:
  - `audit_logs` records `donation.claimed`.
  - Donor is notified that their donation has been claimed.
- **Dashboard Reflection**: Listing disappears from general available pool; moves to Volunteer's `/volunteer/tasks`.
- **Acceptance Status**: **ACCEPTED**

### Step 3: Volunteer Confirms Physical Pickup
- **Actor**: Assigned Volunteer
- **Initial State**: Donation status is `ASSIGNED`.
- **Action**: Clicks "Confirm Pickup" on task card in `/volunteer/tasks`.
- **Backend Execution**: `POST /api/v1/donations/:id/pickup` calls `recordPickup()`.
- **Database Mutation**:
  - `donations.status` transitions from `ASSIGNED` to `PICKED_UP`.
  - `assignments.picked_up_at` set to current timestamp.
- **Audit & Notification**:
  - `audit_logs` records `donation.picked_up`.
  - Donor receives notification: "Your donation has been collected."
- **Dashboard Reflection**: Progress bar advances to `IN TRANSIT`; donor cancellation is now blocked.
- **Acceptance Status**: **ACCEPTED**

### Step 4: Volunteer Delivers to Approved NGO
- **Actor**: Assigned Volunteer
- **Initial State**: Donation status is `PICKED_UP`.
- **Action**: Selects verified destination NGO and clicks "Record Delivery".
- **Backend Execution**: `POST /api/v1/donations/:id/deliver` calls `recordDelivery(donationId, volunteerId, ngoId)`.
- **Database Mutation**:
  - Validates recipient NGO is active and approved (`verification_status = 'approved'`).
  - Sets `donations.recipient_ngo_id = ngoId`.
  - `donations.status` transitions from `PICKED_UP` to `DELIVERED`.
  - `assignments.delivered_at` set to current timestamp.
- **Audit & Notification**:
  - `audit_logs` records `donation.delivered`.
  - Addressed NGO receives notification: "Incoming food delivery arrived."
- **Dashboard Reflection**: Shipment appears in designated NGO's `/ngodash` under "Incoming Deliveries".
- **Acceptance Status**: **ACCEPTED**

### Step 5: NGO Confirms Receipt (Completion)
- **Actor**: Receiving NGO (`user_role = 'NGO'`, matching `recipient_ngo_id`)
- **Initial State**: Donation status is `DELIVERED`.
- **Action**: Clicks "Confirm Receipt" on `/ngodash`.
- **Backend Execution**: `POST /api/v1/donations/:id/confirm-receipt` executes `confirm_receipt(p_donation_id, p_ngo_id)`.
- **Database Mutation**:
  - `donations.status` transitions from `DELIVERED` to `COMPLETED`.
  - `assignments.assignment_status` set to `'completed'`.
  - Record inserted into `delivery_confirmations`.
- **Audit & Notification**:
  - `audit_logs` records `donation.completed`.
  - Donor and volunteer receive completion notifications.
- **Dashboard Reflection**:
  - Status updates to `COMPLETED`.
  - Verified meal count and food quantity are credited to participant impact statistics.
- **Acceptance Status**: **ACCEPTED**

---

## 3. Alternative & Edge Case Workflows

### 3.1 Donation Cancellation (`CANCELLED`)
- **Scenario A (Permitted)**: Donor cancels while listing is `AVAILABLE`.
  - Outcome: Donation transitions to `CANCELLED`; status is terminal; audit log recorded. **PASS**
- **Scenario B (Permitted)**: Donor cancels while listing is `ASSIGNED` (before pickup).
  - Outcome: Donation transitions to `CANCELLED`; active assignment marked `cancelled`; assigned volunteer notified. **PASS**
- **Scenario C (Rejected)**: Donor attempts to cancel after volunteer confirms pickup (`PICKED_UP`).
  - Outcome: Backend rejects with `409 Conflict` ("Cannot cancel a donation that has already been picked up"). **PASS**

### 3.2 Automated Expiry (`EXPIRED`)
- **Scenario**: Listing passes `expires_at` without being claimed.
  - Outcome: Background sweeper (`processExpiredDonations`) marks donation `EXPIRED`; donor notified; item cannot be claimed. **PASS**
- **Lifecycle Guard**: Database trigger allows `AVAILABLE -> EXPIRED`, but strictly blocks `PICKED_UP -> EXPIRED` or `DELIVERED -> EXPIRED` (food already in transit or delivered cannot silently expire). **PASS**

### 3.3 Concurrent Volunteer Claims (Race Condition)
- **Scenario**: Two volunteers click "Claim" on the same donation within milliseconds.
  - Outcome: The PostgreSQL row lock (`SELECT ... FOR UPDATE`) in `claim_donation` serializes the claims. The first caller claims the item; the second caller receives `409 Conflict` ("This donation is no longer available"). No duplicate assignments occur. **PASS**

### 3.4 Unauthorized Receipt Confirmation
- **Scenario**: An NGO attempts to confirm receipt of a delivery addressed to a different NGO.
  - Outcome: `confirm_receipt` stored procedure verifies `donations.recipient_ngo_id = p_ngo_id`. Rejects with `403 Forbidden` (`not_recipient`). **PASS**

### 3.5 Invalid State Machine Transitions
- **Scenario**: An API call attempts an out-of-order transition (e.g., `AVAILABLE -> DELIVERED` or `ASSIGNED -> COMPLETED`).
  - Outcome: Both `lifecycle.js` and PostgreSQL trigger `enforce_donation_status_transition_trigger` reject the update with `400 / 409` and database error code `23514`. **PASS**

### 3.6 Session Restoration & Expired Authentication
- **Scenario**: User reloads page with stored token; or token expires after 24 hours.
  - Outcome: `session.ts` restores user session on mount. Expired or tampered tokens are rejected with `401 Unauthorized` by Axios response interceptor, clearing local storage and redirecting cleanly to `/login`. **PASS**

---

## 4. Impact Analytics Integrity Verification

- **Rule**: Impact metrics must derive strictly from persisted `COMPLETED` donations. In-progress (`AVAILABLE`, `ASSIGNED`, `PICKED_UP`, `DELIVERED`), `CANCELLED`, and `EXPIRED` donations are never credited as served meals.
- **Verification**:
  - `backend/services/impact.service.js`:
    ```javascript
    query = query.eq("status", "COMPLETED");
    ```
  - Total meals served, kilograms saved, and active donor/volunteer metrics reflect true database records. No synthetic impact metrics exist in production code.

---
*End-to-End Acceptance Report approved across all lifecycle paths.*

