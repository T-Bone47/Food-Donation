# Unified Food Donation Platform — API Documentation

**Version**: 1.0.0 Release Candidate  
**Base URL**: `http://localhost:5000/api/v1` (Legacy routes also mounted under `/api/*`)  
**Chatbot Base URL**: `http://localhost:5001`  
**Envelope Format**: All v1 responses return standard `{ data: ..., meta: { requestId } }` on success, or `{ error: { code, message, details }, meta: { requestId } }` on failure.

---

## 1. Global Standards & Conventions

### Authentication Header
Protected endpoints require a Bearer token in the `Authorization` HTTP header:
```http
Authorization: Bearer <session_token>
```

### HTTP Status Codes
- `200 OK`: Request succeeded.
- `201 Created`: Resource successfully created.
- `400 Bad Request`: Validation failure (`ValidationError`).
- `401 Unauthorized`: Missing, invalid, revoked, or expired token (`UnauthorizedError`).
- `403 Forbidden`: Authenticated user lacks required role or resource ownership (`ForbiddenError`).
- `404 Not Found`: Target resource does not exist (`NotFoundError`).
- `409 Conflict`: Invalid state machine transition or concurrent action conflict (`ConflictError`).
- `429 Too Many Requests`: Rate limit threshold exceeded.
- `500 Internal Server Error`: Unhandled server exception.

---

## 2. Authentication API (`/api/v1/auth`)

### 2.1 User Registration
- **Method**: `POST`
- **Path**: `/auth/signup`
- **Auth**: None
- **Rate Limit**: 10 requests / hour / IP
- **Request Body**:
  ```json
  {
    "name": "Arun Kumar",
    "email": "arun@example.org",
    "password": "Password123",
    "role": "Donor",
    "organization": "Green Leaf Bistro",
    "phonenumber": "+91 9876543210",
    "area": "Indiranagar",
    "pincode": "560038",
    "state": "Karnataka",
    "country": "India"
  }
  ```
- **Response `201 Created`**:
  ```json
  {
    "data": {
      "user": {
        "id": "8a5c7c5e-8f1b-4f4e-9f3c-2d6b1a7e9c10",
        "name": "Arun Kumar",
        "email": "arun@example.org",
        "role": "Donor",
        "organization": "Green Leaf Bistro",
        "phonenumber": "+91 9876543210",
        "accountStatus": "active"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    },
    "meta": { "requestId": "d290f1ee-6c54-4b01-90e6-d701748f0851" }
  }
  ```

### 2.2 User Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Auth**: None
- **Rate Limit**: 20 requests / 15 minutes / IP
- **Request Body**:
  ```json
  {
    "email": "arun@example.org",
    "password": "Password123"
  }
  ```
- **Response `200 OK`**: Returns user profile and 24-hour session token.

### 2.3 User Logout
- **Method**: `POST`
- **Path**: `/auth/logout`
- **Auth**: Bearer token
- **Response `200 OK`**: Revokes token in server blocklist.

### 2.4 Get Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me`
- **Auth**: Bearer token
- **Response `200 OK`**: Returns authenticated user profile.

### 2.5 Update Current User Profile
- **Method**: `PATCH`
- **Path**: `/auth/me`
- **Auth**: Bearer token
- **Request Body** (Allowed fields only; immutable fields like `email` or `role` are rejected):
  ```json
  {
    "name": "Arun Kumar",
    "phonenumber": "+91 9876543210",
    "area": "Koramangala"
  }
  ```
- **Response `200 OK`**: Returns updated user profile.

---

## 3. Donations API (`/api/v1/donations`)

### 3.1 Create Donation Listing
- **Method**: `POST`
- **Path**: `/donations`
- **Auth**: Donor role
- **Request Body**:
  ```json
  {
    "title": "Fresh Vegetable Curry & Rice",
    "description": "Packed in food-grade containers, kept warm.",
    "food_category": "Cooked Meal",
    "quantity": 25,
    "unit": "servings",
    "prepared_at": "2026-11-02T12:00:00.000Z",
    "expires_at": "2026-11-02T18:00:00.000Z",
    "pickup_deadline": "2026-11-02T16:30:00.000Z",
    "pickup_address": "12 100 Feet Rd, Indiranagar",
    "area": "Indiranagar",
    "pincode": "560038",
    "state": "Karnataka",
    "country": "India",
    "latitude": 12.9716,
    "longitude": 77.5946
  }
  ```
- **Response `201 Created`**: Returns created donation record with `status: "AVAILABLE"`.

### 3.2 Get My Donations
- **Method**: `GET`
- **Path**: `/donations/mine`
- **Auth**: Donor role
- **Query Params**: `status`, `limit`, `offset`
- **Response `200 OK`**: Returns list of donor's listings.

### 3.3 Get Available Donations
- **Method**: `GET`
- **Path**: `/donations/available`
- **Auth**: Volunteer role
- **Response `200 OK`**: Returns unexpired donations in `AVAILABLE` status.

### 3.4 Get Donation Details
- **Method**: `GET`
- **Path**: `/donations/:id`
- **Auth**: Bearer token (Accessible to Donor owner, assigned Volunteer, addressed NGO, or Admin)
- **Response `200 OK`**: Returns full donation object, assignment history, and confirmation state.

### 3.5 Cancel Donation
- **Method**: `POST`
- **Path**: `/donations/:id/cancel`
- **Auth**: Donor owner or Admin
- **Response `200 OK`**: Cancels donation if in `AVAILABLE` or `ASSIGNED` status.

### 3.6 Claim Donation (Atomic)
- **Method**: `POST`
- **Path**: `/donations/:id/claim`
- **Auth**: Volunteer role
- **Response `200 OK`**: Claims donation and creates assignment. Returns `409 Conflict` if already claimed.

### 3.7 Confirm Pickup
- **Method**: `POST`
- **Path**: `/donations/:id/pickup`
- **Auth**: Assigned Volunteer
- **Response `200 OK`**: Transitions status from `ASSIGNED` to `PICKED_UP`.

### 3.8 Confirm Delivery to NGO
- **Method**: `POST`
- **Path**: `/donations/:id/deliver`
- **Auth**: Assigned Volunteer
- **Request Body**:
  ```json
  {
    "ngo_id": "8a5c7c5e-8f1b-4f4e-9f3c-2d6b1a7e9c10"
  }
  ```
- **Response `200 OK`**: Transitions status from `PICKED_UP` to `DELIVERED`.

### 3.9 Confirm NGO Receipt
- **Method**: `POST`
- **Path**: `/donations/:id/confirm-receipt`
- **Auth**: Addressed NGO or Admin
- **Response `200 OK`**: Transitions status from `DELIVERED` to `COMPLETED` and completes assignment.

---

## 4. Volunteer API (`/api/v1/volunteer`)

### 4.1 Get Active Tasks
- **Method**: `GET`
- **Path**: `/volunteer/tasks`
- **Auth**: Volunteer role
- **Response `200 OK`**: Returns current active assignments.

### 4.2 Volunteer Dashboard Stats
- **Method**: `GET`
- **Path**: `/volunteer/dashboard`
- **Auth**: Volunteer role
- **Response `200 OK`**: Returns summary counts of assigned, in-transit, and completed deliveries.

---

## 5. NGO API (`/api/v1/ngos`)

### 5.1 Submit NGO Verification
- **Method**: `POST`
- **Path**: `/ngos/verification`
- **Auth**: NGO role
- **Request Body**:
  ```json
  {
    "organization_name": "Hope Feeding Foundation",
    "registration_number": "NGO-KA-2024-8841",
    "address": "45 Mission Rd, Bangalore",
    "contact_person": "Priya Sharma",
    "contact_email": "priya@hopefeeding.org",
    "contact_phone": "+91 9123456780",
    "description": "Serving community meals across East Bangalore."
  }
  ```
- **Response `201 Created`**: Returns pending NGO profile.

### 5.2 Get Incoming Deliveries
- **Method**: `GET`
- **Path**: `/ngos/incoming`
- **Auth**: NGO role
- **Response `200 OK`**: Returns deliveries addressed to this NGO currently in `DELIVERED` status.

### 5.3 Get Approved NGOs List
- **Method**: `GET`
- **Path**: `/ngos/approved`
- **Auth**: Bearer token (Volunteer or Admin)
- **Response `200 OK`**: Returns list of verified NGOs available as delivery destinations.

---

## 6. Admin API (`/api/v1/admin`)

### 6.1 List NGO Verifications
- **Method**: `GET`
- **Path**: `/admin/verifications`
- **Auth**: Admin role
- **Query Params**: `status` (`pending`, `approved`, `rejected`), `limit`, `offset`

### 6.2 Review NGO Verification
- **Method**: `PATCH`
- **Path**: `/admin/verifications/:id`
- **Auth**: Admin role
- **Request Body**:
  ```json
  {
    "decision": "approved",
    "notes": "Verified government registration certificate."
  }
  ```

### 6.3 List Users
- **Method**: `GET`
- **Path**: `/admin/users`
- **Auth**: Admin role
- **Query Params**: `role`, `status`, `search`, `limit`, `offset`

### 6.4 Update User Account Status
- **Method**: `PATCH`
- **Path**: `/admin/users/:id`
- **Auth**: Admin role
- **Request Body**:
  ```json
  {
    "account_status": "suspended"
  }
  ```
- **Rules**: Self-suspension and modifying other Admin accounts are strictly blocked.

### 6.5 Admin Manual Expiry
- **Method**: `POST`
- **Path**: `/admin/donations/:id/expire`
- **Auth**: Admin role
- **Response `200 OK`**: Manually marks donation as `EXPIRED`.

### 6.6 Admin Audit Logs
- **Method**: `GET`
- **Path**: `/admin/audit-logs`
- **Auth**: Admin role
- **Query Params**: `actorId`, `action`, `resourceType`, `limit`, `offset`

---

## 7. AI Chatbot API (`http://localhost:5001`)

### 7.1 Send Chat Message
- **Method**: `POST`
- **Path**: `/chat`
- **Rate Limit**: 10 requests / minute / IP
- **Request Body**:
  ```json
  {
    "message": "How does volunteer pickup work?"
  }
  ```
- **Response `200 OK`**:
  ```json
  {
    "response": "Volunteers browse available donations, claim one at a time, collect it from the donor before the pickup deadline, and then deliver it to a verified NGO."
  }
  ```

---
*API documentation matches all currently implemented backend routes.*

