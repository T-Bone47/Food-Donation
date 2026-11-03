# 01 — Cross-Role Data Flow & Synchronization Matrix

## 1. Overview
The FoodShare platform connects four distinct roles across an interconnected surplus food custody lifecycle. This matrix defines how every action performed by one role flows to all other authorized roles.

## 2. End-to-End Lifecycle Data Flow Matrix

```
[Donor] ──── Create Donation ────► [Express / Database]
                                          │
       ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Donor Dashboard]  [Volunteer Hub]                         [Admin Console]    [Notifications]
- New Active Card  - In Available Discovery                - New Listing Log  - Volunteers alerted
- Metrics +1       - Nearby Count +1                       - Total Batches +1

[Volunteer] ──── Claim Donation ────► [Express / Database]
                                            │
       ┌──────────────────┬─────────────────┴─────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Donor Dashboard]  [Volunteer Hub]                         [Admin Console]    [Notifications]
- Status: ASSIGNED - Moved to Active Tasks                 - Status: ASSIGNED - Donor notified:
- Courier assigned - Removed from Available               - Assignment Log     "Claimed by Volunteer"

[Volunteer] ──── Confirm Pickup ────► [Express / Database]
                                            │
       ┌──────────────────┬─────────────────┴─────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Donor Dashboard]  [NGO Intake Hub]                        [Admin Console]    [Notifications]
- Status: PICKED_UP - In Transit Alert                     - Status: PICKED_UP - Donor notified:
- Stepper: Step 3   - Expected Arrival Window              - Transit Log       "Collected"

[Volunteer] ──── Confirm Delivery ──► [Express / Database]
                                            │
       ┌──────────────────┬─────────────────┴─────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Donor Dashboard]  [NGO Intake Hub]                        [Admin Console]    [Notifications]
- Status: DELIVERED - Dock Inspection Ready                - Status: DELIVERED- NGO notified:
- Stepper: Step 4   - Action Required: 1 At Dock           - Delivery Log      "Incoming Cargo Arrived"

[NGO] ──────── Confirm Receipt ─────► [Express / Database]
                                            │
       ┌──────────────────┬─────────────────┴─────────────┬──────────────────┐
       ▼                  ▼                               ▼                  ▼
[Donor Dashboard]  [Volunteer Hub]                         [Admin Console]    [Notifications]
- Status: COMPLETED- Completed Mission                     - Status: COMPLETED- Donor & Volunteer:
- Stepper: Step 5  - Total Diverted kg +1                  - Completed Rescues- Digital Receipt
- Impact Meals +1                                          - Verified Intake   Generated
```

## 3. Real-Time Mutation Invalidation Rules

| Triggering Action | Mutating Actor | Primary Route | Role Dashboards Invalidated & Refreshed Live |
| :--- | :--- | :--- | :--- |
| **Create Surplus** | Donor | `POST /api/v1/donations` | **Donor** (`/donordash`), **Volunteer** (`/volunteerdash`), **Admin** (`/adminpage`) |
| **Claim Surplus** | Volunteer | `POST /api/v1/donations/:id/claim` | **Donor** (`/donordash`), **Volunteer** (all couriers), **Admin** (`/adminpage`) |
| **Confirm Pickup**| Volunteer | `POST /api/v1/donations/:id/pickup` | **Donor** (`/donordash`), **Volunteer** (`/volunteer/tasks`), **Admin** (`/adminpage`), **NGO** (`/ngodash`) |
| **Confirm Delivery**| Volunteer | `POST /api/v1/donations/:id/deliver`| **Donor** (`/donordash`), **Volunteer** (`/volunteer/tasks`), **NGO** (`/ngodash`), **Admin** (`/adminpage`) |
| **Verify Receipt** | NGO | `POST /api/v1/donations/:id/confirm-receipt` | **Donor** (`/donordash`), **Volunteer** (`/volunteerdash`), **NGO** (`/ngodash`), **Admin** (`/adminpage`) |
| **Cancel Surplus** | Donor/Admin | `POST /api/v1/donations/:id/cancel` | **Donor** (`/donordash`), **Volunteer** (`/volunteerdash`), **Admin** (`/adminpage`) |
| **Reset Demo** | Admin | `POST /api/v1/demo/reset` | **All Demo Roles** (Global sync back to initial seed scenario) |

