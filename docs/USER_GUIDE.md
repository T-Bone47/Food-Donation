# Unified Food Donation Platform — User Guide

**Version**: 1.0.0 Release Candidate  
**Target Roles**: Donors, Volunteers, NGOs, Administrators  

---

## 1. Introduction

FoodShare connects restaurants, caterers, grocery stores, and households with active volunteers and verified NGOs to redirect edible surplus food to community kitchens before it spoils.

Every donation follows an accountable, four-step journey:
1. **Donation Listed**: Donor lists food with a mandatory pickup deadline and expiry time.
2. **Claim & Collection**: A volunteer claims the listing and records physical pickup.
3. **Delivery to NGO**: The volunteer transports food to an approved NGO pantry.
4. **Receipt Confirmation**: The receiving NGO verifies food condition and marks it complete.

---

## 2. Donor Guide

### 2.1 Getting Started
1. Navigate to the platform home page (`/`) and choose **I have food to give (Donor)**.
2. Enter your name, business name (if applicable), email, phone number, password, and location.
3. Click **Create account**. You are immediately logged in and taken to your Donor Dashboard.

### 2.2 Listing Surplus Food
1. Click **Donate Food** in the top navigation or on your dashboard.
2. **Food Information**:
   - Provide a clear title (e.g., "50 Packets Rice & Sambar").
   - Select the food category (`Cooked Meal`, `Fresh Produce`, `Bakery`, `Dairy`, etc.).
   - Enter quantity and select the appropriate unit (`servings`, `kg`, `packets`, `liters`, `boxes`).
3. **Freshness & Timing**:
   - Specify when the food was prepared.
   - Enter the **Expiry Time** (when the food is no longer safe to eat).
   - Enter the **Pickup Deadline** (must be earlier than or equal to the expiry time).
4. **Pickup Location**:
   - Click "Use my current location" or manually enter your street address, area, and pincode.
5. Review the details and click **Publish Donation**. Nearby volunteers are immediately notified.

### 2.3 Tracking and Managing Your Donations
- Open **My Donations** (`/mydonations`) to view active, in-transit, and completed donations.
- **Editing**: You may update quantity, title, or notes while the listing remains in `AVAILABLE` status.
- **Cancelling**: If surplus food is no longer available or was consumed internally, click **Cancel Donation** before a volunteer picks it up. Once picked up, cancellation is disabled.
- **Impact Tracking**: View your cumulative meals served on your dashboard after NGOs confirm deliveries.

---

## 3. Volunteer Guide

### 3.1 Getting Started
1. Sign up choosing **I can collect and deliver (Volunteer)**.
2. Enter your contact details and home/work operating area.

### 3.2 Finding & Claiming Food
1. Open the **Volunteer Dashboard** (`/volunteerdash`) to see donations listed in your area.
2. Review the food type, quantity, donor address, and pickup cutoff time.
3. Click **Claim Pickup**. 
   *Note*: To ensure food is delivered promptly, you can claim one active pickup at a time.

### 3.3 Collecting the Food
1. Navigate to **My Tasks** (`/volunteer/tasks`) to find the donor's address and contact number.
2. Travel to the donor location before the pickup deadline.
3. Inspect the packaging and temperature.
4. Click **Confirm Pickup**. The status updates to `PICKED_UP`, notifying the donor.

### 3.4 Delivering to a Verified NGO
1. Select an approved destination NGO from the recipient dropdown list.
2. Transport the food safely to the NGO's distribution center.
3. Hand over the food containers to the NGO staff.
4. Click **Record Delivery**. The status transitions to `DELIVERED`.

---

## 4. NGO (Receiving Organization) Guide

### 4.1 Registration & Verification
1. Sign up choosing **We receive food (NGO)**.
2. Provide your official organization name, registration number, address, and contact person.
3. Upon registration, your profile enters `Pending Review` status. An administrator verifies your documentation before deliveries can be addressed to you.

### 4.2 Receiving Food Shipments
1. Open the **NGO Dashboard** (`/ngodash`).
2. When a volunteer selects your organization and completes transport, the shipment appears under **Incoming Deliveries** (`DELIVERED` status).
3. Inspect the food temperature, packaging integrity, and quantity upon arrival.
4. Click **Confirm Receipt**.
5. Once confirmed, the donation status advances to `COMPLETED`. Impact statistics update for all participants.

---

## 5. Administrator Guide

### 5.1 Accessing the Admin Console
1. Log in with an authorized Administrator account.
2. Open the **Admin Console** (`/adminpage`).

### 5.2 Reviewing NGO Verifications
1. Select the **Verifications** tab.
2. Review pending NGO applications, registration numbers, and contact details.
3. Click **Approve** to activate the NGO for deliveries, or **Reject** with written feedback.

### 5.3 User Management & Safety Rules
1. Select the **Users** tab.
2. Search and filter users by role (`Donor`, `Volunteer`, `NGO`, `Admin`) or status (`Active`, `Suspended`).
3. **Suspension Safeguards**:
   - Administrators cannot suspend themselves.
   - Administrators cannot suspend or alter other Administrator accounts.
   - Non-admin abusive accounts can be suspended or reactivated with logged audit reasons.

### 5.4 Monitoring & Audit Log Inspection
1. Select the **Activity** tab to view immutable system audit records.
2. Inspect actor IDs, action names (`donation.created`, `donation.claimed`, `donation.completed`), and timestamps.
3. Use the **Donations** tab to manually expire items if reported spoiled.

---
*User guide complete for all four platform roles.*

