# 02 — Real-Time Event Catalog & Payload Specifications

## 1. Event Envelope Standard
All real-time events transmitted over the Server-Sent Events stream conform to a standard JSON envelope:

```json
{
  "id": "uuid-v4",
  "type": "event.name",
  "entity": "donation | notification | verification | demo",
  "entityId": "d1111111-0000-0000-0000-000000000001",
  "actorId": "user-uuid",
  "actorRole": "Donor | Volunteer | NGO | Admin",
  "isDemo": true,
  "timestamp": "2026-11-02T16:30:00.000Z",
  "data": { ... }
}
```

## 2. Canonical Real-Time Event Catalog

### `donation.created`
- **Trigger:** Donor publishes a new surplus food donation.
- **Entity:** `donation`
- **Recipients:** Donor (self), all active Volunteers in area, Admin.
- **Data Payload:** Full donation object (`id`, `title`, `food_category`, `quantity`, `unit`, `pickup_address`, `status: "AVAILABLE"`).
- **Client Actions:**
  - Donor: Appends to active listings, updates staged count.
  - Volunteer: Inserts into available discovery queue.
  - Admin: Increments total batches, prepends to recent donation activity.

### `donation.assigned`
- **Trigger:** Volunteer claims an available donation.
- **Entity:** `donation`
- **Recipients:** Donor (owner), Volunteer (claimer), other Volunteers (removal), Admin.
- **Data Payload:** `{ donationId, volunteerId, status: "ASSIGNED", assignmentId }`.
- **Client Actions:**
  - Donor: Moves progress stepper to Step 2 (*"Courier Assigned"*).
  - Claiming Volunteer: Transitions item into active duty console.
  - Other Volunteers: Removes item from available list to prevent race conditions.
  - Admin: Updates active assignments counter.

### `donation.pickup_confirmed`
- **Trigger:** Volunteer confirms physical pickup at donor facility.
- **Entity:** `donation`
- **Recipients:** Donor, Volunteer, NGO, Admin.
- **Data Payload:** `{ donationId, volunteerId, status: "PICKED_UP", pickedUpAt }`.
- **Client Actions:**
  - Donor: Stepper moves to Step 3 (*"Collected"*), courier status updates to *"In transit"*.
  - NGO: Displays incoming cargo in transit.

### `donation.delivery_confirmed`
- **Trigger:** Volunteer confirms handover arrival at receiving NGO dock.
- **Entity:** `donation`
- **Recipients:** Donor, Volunteer, NGO, Admin.
- **Data Payload:** `{ donationId, recipientNgoId, status: "DELIVERED", deliveredAt }`.
- **Client Actions:**
  - Donor: Stepper moves to Step 4 (*"Delivered"*).
  - NGO: Inbound cargo alert appears in dock inspection queue with *"Action Required"*.

### `donation.receipt_confirmed`
- **Trigger:** Authorized NGO inspects and confirms receipt of food cargo.
- **Entity:** `donation`
- **Recipients:** Donor, Volunteer, NGO, Admin.
- **Data Payload:** `{ donationId, ngoId, status: "COMPLETED", confirmedAt }`.
- **Client Actions:**
  - Donor: Stepper completes (Step 5 *"Verified"*), moves to completed manifest ledger, notification created.
  - Volunteer: Mission marked completed, total rescued volume incremented.
  - NGO: Receipt record generated, impact meals added.
  - Admin: Completed rescues tally updated.

### `donation.cancelled`
- **Trigger:** Donor or Admin cancels listing before pickup.
- **Entity:** `donation`
- **Recipients:** Donor, Volunteer (if assigned), Admin.
- **Data Payload:** `{ donationId, status: "CANCELLED" }`.

### `notification.created`
- **Trigger:** System generates an operational notification for a specific user.
- **Entity:** `notification`
- **Recipients:** Direct recipient (`userId === recipientId`) and Admin.
- **Data Payload:** `{ id, title, message, event_type, created_at, read: false }`.
- **Client Actions:** Increments unread notification badge, displays in-app toast alert.

### `demo.reset`
- **Trigger:** Administrator resets demo scenario.
- **Entity:** `demo`
- **Recipients:** All active demo sessions across all 4 roles.
- **Data Payload:** `{ message: "Demo state reset to pristine seed scenario" }`.
- **Client Actions:** Triggers full silent invalidation of all cached resources.

