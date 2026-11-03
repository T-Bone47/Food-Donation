# FoodShare Platform — 10-Stage Interactive Presentation Script

## 1. Overview for Presenters

This presentation script guides evaluators, faculty reviewers, and product stakeholders through the complete end-to-end lifecycle of the **FoodShare Unified Food Donation Platform**. 

The walkthrough utilizes the **Guided Demo Assistant** (accessible via the `Guided Demo` button in the navigation header) to switch roles without manual logout/login cycles.

---

## 2. 10-Stage Walkthrough Execution Plan

```
STAGE 1: Introduce Ecosystem  --->  STAGE 2: Donor Onboarding  --->  STAGE 3: Post Surplus Meal
                                                                               |
                                                                               v
STAGE 6: Deliver to Shelter   <---  STAGE 5: Pickup from Donor <---  STAGE 4: Volunteer Claim
      |
      v
STAGE 7: Switch to NGO        --->  STAGE 8: Confirm Receipt   --->  STAGE 9: Admin Dashboard
                                                                               |
                                                                               v
                                                                     STAGE 10: Complete Audit Log
```

---

### Stage 1: Introduce Platform Architecture & Mission
* **Role**: Donor Demo (`Demo Food Donor`)
* **URL**: `/donordash`
* **Presenter Script**:
  > *"Welcome to FoodShare. Our platform bridges the gap between surplus food generators—such as banquet halls, restaurants, and corporate cafeterias—and local hunger relief organizations through a real-time, volunteer-powered dispatch network."*
* **On-Screen Action**:
  - Show the clean green-and-white header with the `[ DEMO MODE: DONOR ]` indicator.
  - Review the donor overview dashboard and impact metrics.

---

### Stage 2: Conceptual Donor Profile & Food Safety
* **Role**: Donor Demo (`Demo Food Donor`)
* **URL**: `/donordash` -> Click **Profile**
* **Presenter Script**:
  > *"Food donors must provide explicit pickup addresses and organization details. All operations conform to safe food handling guidelines and state health regulations."*
* **On-Screen Action**:
  - Point to organization name `Community Kitchen Demo`, verified area `Indiranagar`, and phone number.

---

### Stage 3: Create a Surplus Food Listing
* **Role**: Donor Demo (`Demo Food Donor`)
* **URL**: Click **Donate food** (`/donate`)
* **Presenter Script**:
  > *"When surplus food becomes available, speed is essential. Let's create a fresh donation listing. Notice the real-time validation: pickup deadlines must precede expiry, and expiry must be in the future."*
* **On-Screen Action**:
  - Enter Title: `Fresh Veg Pulao & Raita (40 Servings)`
  - Food Category: `Cooked Meals`
  - Quantity: `40`, Unit: `meals`
  - Set Expiry: `Tomorrow, 12:00 PM`
  - Set Pickup Deadline: `Today, 8:00 PM`
  - Click **Create Donation**.
  - System redirects to `/mydonations`, displaying the new card in `AVAILABLE` status.

---

### Stage 4: Volunteer Discovers Available Rescue
* **Role**: Volunteer Demo (`Demo Volunteer`)
* **Action**: In `Guided Demo Assistant`, click **Step 4 -> Switch to Volunteer View**
* **URL**: `/volunteerdash`
* **Presenter Script**:
  > *"Now let's switch to the perspective of a volunteer on the road. On the volunteer dashboard, unassigned donations in the neighborhood appear with pickup distance, food type, and expiry urgency."*
* **On-Screen Action**:
  - Notice the listing `50 Fresh Biryani Meal Boxes` and the newly created pulao.

---

### Stage 5: Volunteer Claims & Records Physical Pickup
* **Role**: Volunteer Demo (`Demo Volunteer`)
* **URL**: Click **Claim Task** on `50 Fresh Biryani Meal Boxes` -> Navigate to `/volunteer/tasks`
* **Presenter Script**:
  > *"Volunteers claim tasks with a single tap. Our backend uses atomic row-locking to ensure two volunteers can never claim the same food item simultaneously. Once claimed, the task moves into active status."*
* **On-Screen Action**:
  - On `/volunteer/tasks`, click **Confirm Pickup**.
  - Status immediately advances to `PICKED_UP`.
  - The donor receives an automated notification that food has been collected.

---

### Stage 6: Transportation & Delivery to Receiving Shelter
* **Role**: Volunteer Demo (`Demo Volunteer`)
* **URL**: `/volunteer/tasks`
* **Presenter Script**:
  > *"The volunteer drives to the designated charity—Hope Shelter Foundation. Upon arrival, the volunteer logs the drop-off."*
* **On-Screen Action**:
  - Select recipient NGO: `Hope Shelter Foundation`.
  - Click **Confirm Delivery**.
  - Status transitions to `DELIVERED`. The receiving shelter is notified of arrival.

---

### Stage 7: NGO Intake Queue Inspection
* **Role**: NGO Demo (`Demo NGO`)
* **Action**: In `Guided Demo Assistant`, click **Step 7 -> Switch to NGO View**
* **URL**: `/ngodash`
* **Presenter Script**:
  > *"Now we view the shelter intake manager's screen. Unverified NGOs cannot access food distributions. Here, Hope Shelter Foundation is verified and sees the delivered food waiting at their intake dock."*
* **On-Screen Action**:
  - Inspect the card `Surplus Sourdough & Bakery Bread` and the newly delivered biryani boxes.

---

### Stage 8: Digital Receipt Confirmation
* **Role**: NGO Demo (`Demo NGO`)
* **URL**: `/ngodash`
* **Presenter Script**:
  > *"The NGO staff inspects the temperature and packaging seal. Once verified, they click Confirm Receipt. This closes the lifecycle loop."*
* **On-Screen Action**:
  - Click **Confirm Receipt**.
  - A success toast appears. The status changes to `COMPLETED`.
  - The donor, volunteer, and NGO dashboards immediately update their cumulative meal counters.

---

### Stage 9: Administrator Console & Impact Analytics
* **Role**: Admin Demo (`Demo Administrator`)
* **Action**: In `Guided Demo Assistant`, click **Step 9 -> Switch to Admin View**
* **URL**: `/adminpage`
* **Presenter Script**:
  > *"Finally, platform administrators oversee city-wide food recovery operations. The console displays aggregate food diverted, active assignments, and account statuses across all four user groups."*
* **On-Screen Action**:
  - Review the KPI metrics: Total Donations, Active Assignments, Pending Confirmations, and Total Meals Served.

---

### Stage 10: Non-Repudiation & Audit Trail
* **Role**: Admin Demo (`Demo Administrator`)
* **URL**: `/adminpage` -> Click **Audit Activity**
* **Presenter Script**:
  > *"Every critical event in the platform—creation, claim, pickup, delivery, and receipt—is permanently recorded in an immutable audit log with cryptographic request tracking. This concludes our live lifecycle demonstration."*
* **On-Screen Action**:
  - Display the audit entries with timestamps, actors, and state transition reasons.

---

## 3. Post-Presentation Demo Reset

To return the environment to its pristine starting state for the next demonstration:
1. Open the **Guided Demo Assistant** (or use the footer in the drawer).
2. Click **Reset Demo to Initial Seed Data**.
3. Confirm the prompt.
4. The system restores the 5 original seed donations and 4 user profiles in under $10\text{ ms}$.

