# FoodShare Platform — Demo Account Directory & Role Specification

## 1. Directory of Preconfigured Demo Identities

The demonstration environment features four strictly provisioned, immutable demo identities. Each identity represents a core platform stakeholder in the food recovery ecosystem.

---

### Identity 1: Demo Food Donor

* **Display Name**: Demo Food Donor
* **Account Email**: `demo-donor@foodshare.local`
* **Role**: `Donor`
* **Organization**: Community Kitchen Demo
* **Phone**: `+91 98765 43210`
* **Location**: Indiranagar, Bengaluru, Karnataka (560038)
* **Initial Home Route**: `/donordash`
* **Core Capabilities in Demo**:
  - View donor overview dashboard with personal impact statistics.
  - Inspect active and historical listings in **My Donations** (`/mydonations`).
  - Create new surplus food listings (`/donate`) with real-time field validation, preparation instants, and pickup deadlines.
  - Track active delivery stages (Available -> Assigned -> Picked Up -> Delivered -> Completed).
  - Cancel available listings before pickup occurs.
  - Receive automated notifications when a volunteer claims or delivers meals.

---

### Identity 2: Demo Volunteer

* **Display Name**: Demo Volunteer
* **Account Email**: `demo-volunteer@foodshare.local`
* **Role**: `Volunteer`
* **Organization**: Youth Food Rescue Corps
* **Phone**: `+91 98765 43211`
* **Location**: Indiranagar, Bengaluru, Karnataka (560038)
* **Initial Home Route**: `/volunteerdash`
* **Core Capabilities in Demo**:
  - View available unassigned surplus donations in the immediate vicinity (`/volunteerdash`).
  - Inspect detailed donation cards (food safety category, weight/servings, donor pickup address).
  - Atomically claim an available donation task.
  - Access **My Tasks** (`/volunteer/tasks`) with interactive task progression:
    - Log physical pickup from donor.
    - Select receiving NGO (`Hope Shelter Foundation`).
    - Record drop-off delivery.
  - View personal volunteer impact statistics (deliveries completed, kg rescued, meals provided).

---

### Identity 3: Demo NGO

* **Display Name**: Demo NGO
* **Account Email**: `demo-ngo@foodshare.local`
* **Role**: `NGO`
* **Organization**: Hope Shelter Foundation
* **Contact Person**: Priya Sharma
* **Phone**: `+91 98765 43212`
* **Location**: 45 Shelter Road, Indiranagar, Bengaluru, Karnataka (560038)
* **Verification Status**: `approved` (Registration: `KA-NGO-2024-9988`)
* **Initial Home Route**: `/ngodash`
* **Core Capabilities in Demo**:
  - View incoming food deliveries awaiting intake (`/ngodash`).
  - Inspect detailed food logs (baking/cooking time, temperature, volunteer carrier).
  - Perform the digital **Confirm Receipt** action, sealing the delivery confirmation record and completing the donation lifecycle.
  - View historical completed food donations received by the shelter.
  - Review NGO verification profile and platform compliance standing.

---

### Identity 4: Demo Administrator

* **Display Name**: Demo Administrator
* **Account Email**: `demo-admin@foodshare.local`
* **Role**: `Admin`
* **Organization**: FoodShare Platform Governance
* **Phone**: `+91 98765 43213`
* **Location**: Platform Headquarters, Indiranagar, Bengaluru
* **Initial Home Route**: `/adminpage`
* **Core Capabilities in Demo**:
  - View system-wide operational metrics (total donations, active assignments, completed rescues, pending confirmations, kg diverted).
  - Inspect all active and historical demo donations with full assignment trails.
  - Browse all registered demo user accounts and view account statuses.
  - Inspect the real-time **Audit Log** verifying action timestamps, actor user IDs, and transition reasons.
  - Review NGO verification requests.

---

## 2. Least-Privilege & Boundary Enforcement Matrix

To ensure realistic demonstration behavior, each demo role is constrained by the exact same server-side authorization checks as real platform users:

| Operation | Donor | Volunteer | NGO | Admin |
| :--- | :---: | :---: | :---: | :---: |
| **Create Donation** (`POST /donations`) | **YES** | Refused (403) | Refused (403) | Refused (403) |
| **Claim Donation Task** (`POST /donations/:id/claim`) | Refused (403) | **YES** | Refused (403) | Refused (403) |
| **Record Pickup** (`POST /donations/:id/pickup`) | Refused (403) | **YES** (Owner) | Refused (403) | Refused (403) |
| **Record Delivery** (`POST /donations/:id/deliver`) | Refused (403) | **YES** (Owner) | Refused (403) | Refused (403) |
| **Confirm Receipt** (`POST /donations/:id/confirm-receipt`)| Refused (403) | Refused (403) | **YES** (Recipient)| Refused (403) |
| **View Admin Console** (`/adminpage`) | Refused (403) | Refused (403) | Refused (403) | **YES** |
| **View Audit Trail** (`GET /admin/audit-logs`) | Refused (403) | Refused (403) | Refused (403) | **YES** |

