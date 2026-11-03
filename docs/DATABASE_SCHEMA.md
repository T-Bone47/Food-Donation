# Unified Food Donation Platform — Database Schema & Data Architecture

**Engine**: Supabase PostgreSQL 15+  
**Extensions**: `uuid-ossp`, `pgcrypto`  
**Migration Source of Truth**:
1. `supabase/migrations/001_initial_schema.sql` (Base tables, enums, indexes, initial RLS)
2. `supabase/migrations/002_audit_hardening.sql` (Recipient NGO column, domain check constraints, atomic RPC functions, trigger)
3. `supabase/migrations/003_fix_confirm_receipt_ambiguity.sql` (Ambiguity resolution in `confirm_receipt` stored procedure)

---

## 1. Custom Enum Types

```sql
CREATE TYPE user_role AS ENUM ('Donor', 'Volunteer', 'NGO', 'Admin');
CREATE TYPE account_status AS ENUM ('pending', 'active', 'suspended', 'rejected');
CREATE TYPE donation_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED', 'EXPIRED');
CREATE TYPE assignment_status AS ENUM ('active', 'completed', 'cancelled', 'released');
CREATE TYPE ngo_verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE notification_channel AS ENUM ('in_app', 'push', 'email', 'sms', 'whatsapp');
CREATE TYPE notification_delivery_status AS ENUM ('pending', 'sent', 'failed', 'read');
```

---

## 2. Table Definitions & Constraints

### 2.1 `users`
Core user identity for all platform roles.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique user identifier |
| `name` | `TEXT` | `NOT NULL`, `CHECK (char_length(name) BETWEEN 1 AND 150)` | Full name |
| `email` | `TEXT` | `NOT NULL UNIQUE` | Normalized login email |
| `password_hash` | `TEXT` | `NOT NULL` | Bcrypt hashed password |
| `organization`| `TEXT` | `NULLABLE` | Business or NGO name |
| `phonenumber` | `TEXT` | `NULLABLE`, `CHECK (char_length <= 30)` | Contact phone |
| `role` | `user_role` | `NOT NULL` | `Donor`, `Volunteer`, `NGO`, `Admin` |
| `area` | `TEXT` | `NULLABLE` | Neighborhood / Locality |
| `pincode` | `TEXT` | `NULLABLE` | Postal code |
| `state` | `TEXT` | `NULLABLE` | State or province |
| `country` | `TEXT` | `DEFAULT 'India'` | Country |
| `account_status`| `account_status`| `NOT NULL DEFAULT 'active'` | `active`, `suspended`, `rejected` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Registration timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Last update timestamp |

---

### 2.2 `ngo_profiles`
Organization verification records and reviewer documentation.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique NGO profile ID |
| `user_id` | `UUID` | `NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE`| Linked user account |
| `organization_name`| `TEXT`| `NOT NULL`, `CHECK (char_length BETWEEN 1 AND 200)`| Official legal entity name |
| `registration_number`|`TEXT`| `NOT NULL` | Government registration ID |
| `address` | `TEXT` | `NOT NULL` | Physical headquarters / pantry address |
| `contact_person`| `TEXT` | `NOT NULL` | Primary representative |
| `contact_email` | `TEXT` | `NOT NULL` | Contact email |
| `contact_phone` | `TEXT` | `NOT NULL` | Contact phone |
| `description` | `TEXT` | `NULLABLE` | Mission and meal capacity |
| `documents` | `JSONB`| `NULLABLE` | Uploaded document references |
| `verification_status`|`ngo_verification_status`| `NOT NULL DEFAULT 'pending'`| `pending`, `approved`, `rejected`|
| `verification_notes`| `TEXT`| `NULLABLE` | Admin review rationale |
| `verified_by` | `UUID` | `REFERENCES users(id)` | Admin user ID who reviewed |
| `verified_at` | `TIMESTAMPTZ`| `NULLABLE` | Approval / rejection timestamp |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Submission timestamp |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Last review update timestamp |

---

### 2.3 `donations`
Surplus food listings and lifecycle records.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique donation ID |
| `donor_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE RESTRICT`| Listing creator |
| `recipient_ngo_id` | `UUID` | `REFERENCES users(id) ON DELETE SET NULL` | Addressed NGO recipient |
| `title` | `TEXT` | `NOT NULL`, `CHECK (char_length BETWEEN 1 AND 200)` | Food item title |
| `description` | `TEXT` | `CHECK (description IS NULL OR char_length <= 2000)`| Description |
| `food_category`| `TEXT` | `NOT NULL` | Category (Cooked Meal, etc.) |
| `quantity` | `NUMERIC` | `NOT NULL`, `CHECK (quantity > 0 AND quantity <= 1000000)` | Quantity amount |
| `unit` | `TEXT` | `NOT NULL` | Unit of measure |
| `prepared_at` | `TIMESTAMPTZ`| `NULLABLE` | Food preparation instant |
| `expires_at` | `TIMESTAMPTZ`| `NOT NULL` | Food expiry timestamp |
| `pickup_deadline`| `TIMESTAMPTZ`| `NOT NULL`, `CHECK (pickup_deadline <= expires_at)`| Final pickup cutoff |
| `pickup_address`| `TEXT` | `NOT NULL`, `CHECK (char_length BETWEEN 1 AND 500)` | Collection address |
| `area` | `TEXT` | `NULLABLE` | Neighborhood |
| `pincode` | `TEXT` | `NULLABLE` | Postal code |
| `state` | `TEXT` | `NULLABLE` | State |
| `country` | `TEXT` | `DEFAULT 'India'` | Country |
| `latitude` | `DOUBLE PRECISION`| `CHECK (latitude IS NULL OR (latitude >= -90 AND latitude <= 90))` | Coordinate latitude |
| `longitude` | `DOUBLE PRECISION`| `CHECK (longitude IS NULL OR (longitude >= -180 AND longitude <= 180))` | Coordinate longitude |
| `photo_path` | `TEXT` | `NULLABLE` | Food image reference |
| `status` | `donation_status`| `NOT NULL DEFAULT 'AVAILABLE'` | Current lifecycle stage |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Creation timestamp |
| `updated_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Last state transition |

---

### 2.4 `assignments`
Volunteer claim and delivery transit tracking.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique assignment ID |
| `donation_id` | `UUID` | `NOT NULL REFERENCES donations(id) ON DELETE CASCADE`| Target donation |
| `volunteer_id`| `UUID` | `NOT NULL REFERENCES users(id) ON DELETE RESTRICT` | Claiming volunteer |
| `assignment_status`| `assignment_status`| `NOT NULL DEFAULT 'active'` | `active`, `completed`, `cancelled` |
| `assigned_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Claim instant |
| `picked_up_at` | `TIMESTAMPTZ`| `NULLABLE` | Pickup confirmation instant |
| `delivered_at` | `TIMESTAMPTZ`| `NULLABLE` | Arrival at NGO instant |
| `cancelled_at` | `TIMESTAMPTZ`| `NULLABLE` | Cancellation instant |

**Unique Partial Index**:
```sql
CREATE UNIQUE INDEX idx_assignments_active ON assignments (donation_id, assignment_status)
WHERE assignment_status = 'active';
```

---

### 2.5 `delivery_confirmations`
Final NGO receipt and meal completion verifications.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique confirmation ID |
| `donation_id` | `UUID` | `NOT NULL UNIQUE REFERENCES donations(id) ON DELETE CASCADE`| Verified donation |
| `assignment_id`| `UUID`| `NOT NULL REFERENCES assignments(id) ON DELETE CASCADE`| Associated assignment |
| `confirmed_by`| `UUID` | `NOT NULL REFERENCES users(id) ON DELETE RESTRICT` | Confirming NGO user ID |
| `confirmed_at`| `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Receipt instant |

---

### 2.6 `notifications`
In-app alert records with user targeting.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique notification ID |
| `recipient_id` | `UUID` | `NOT NULL REFERENCES users(id) ON DELETE CASCADE` | Target user |
| `event_type` | `TEXT` | `NOT NULL` | Lifecycle event key |
| `title` | `TEXT` | `NOT NULL` | Display headline |
| `message` | `TEXT` | `NOT NULL` | Body text |
| `data` | `JSONB` | `DEFAULT '{}'` | Deep link metadata |
| `channel` | `notification_channel` | `DEFAULT 'in_app'` | Delivery channel |
| `delivery_status`|`notification_delivery_status`| `DEFAULT 'pending'` | `pending`, `sent`, `read` |
| `read_at` | `TIMESTAMPTZ`| `NULLABLE` | User read instant |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Notification timestamp |

---

### 2.7 `audit_logs`
Immutable security and administrative audit trail.

| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT uuid_generate_v4()` | Unique audit event ID |
| `actor_id` | `UUID` | `REFERENCES users(id) ON DELETE SET NULL` | Performing user ID or NULL (system) |
| `action` | `TEXT` | `NOT NULL` | E.g. `donation.created`, `donation.claimed` |
| `resource_type`| `TEXT` | `NOT NULL` | `donation`, `user`, `ngo_profile` |
| `resource_id` | `UUID` | `NULLABLE` | Target entity UUID |
| `reason` | `TEXT` | `NULLABLE` | Administrative or cancellation rationale |
| `metadata` | `JSONB` | `DEFAULT '{}'` | Operational details (excluding credentials) |
| `request_id` | `UUID` | `NULLABLE` | HTTP request correlation ID |
| `created_at` | `TIMESTAMPTZ`| `NOT NULL DEFAULT NOW()` | Event recording instant |

---

## 3. Database Indexes

```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_account_status ON users(account_status);

CREATE INDEX idx_ngo_profiles_user_id ON ngo_profiles(user_id);
CREATE INDEX idx_ngo_profiles_verification_status ON ngo_profiles(verification_status);

CREATE INDEX idx_donations_donor_id ON donations(donor_id);
CREATE INDEX idx_donations_recipient_ngo_id ON donations(recipient_ngo_id);
CREATE INDEX idx_donations_status ON donations(status);
CREATE INDEX idx_donations_expires_at ON donations(expires_at);
CREATE INDEX idx_donations_pickup_deadline ON donations(pickup_deadline);
CREATE INDEX idx_donations_created_at ON donations(created_at DESC);
CREATE INDEX idx_donations_location ON donations(pincode, area, state);
CREATE INDEX idx_donations_donor_status ON donations(donor_id, status);

CREATE INDEX idx_assignments_donation_id ON assignments(donation_id);
CREATE INDEX idx_assignments_volunteer_id ON assignments(volunteer_id);
CREATE INDEX idx_notifications_recipient_read ON notifications(recipient_id, read_at);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);
```

---

## 4. Functions & Triggers

### 4.1 Transition Trigger (`enforce_donation_status_transition`)
Enforces valid state machine progressions at the database engine level:
```sql
CREATE OR REPLACE FUNCTION enforce_donation_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        IF NOT (
            (OLD.status = 'AVAILABLE' AND NEW.status IN ('ASSIGNED', 'CANCELLED', 'EXPIRED'))
            OR (OLD.status = 'ASSIGNED' AND NEW.status IN ('PICKED_UP', 'CANCELLED'))
            OR (OLD.status = 'PICKED_UP' AND NEW.status = 'DELIVERED')
            OR (OLD.status = 'DELIVERED' AND NEW.status = 'COMPLETED')
        ) THEN
            RAISE EXCEPTION 'Invalid donation status transition from % to %',
                OLD.status, NEW.status
                USING ERRCODE = '23514';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 4.2 Stored Procedure: `claim_donation(p_donation_id, p_volunteer_id)`
Serializes concurrent claim attempts and creates assignment atomically.

### 4.3 Stored Procedure: `confirm_receipt(p_donation_id, p_ngo_id)`
Verifies NGO recipient ownership, completes donation and assignment, and creates delivery confirmation atomically.

---
*Database schema documentation verified against Supabase SQL migrations.*

