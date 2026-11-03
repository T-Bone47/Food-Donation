# 04 — Security Architecture, Authentication & RLS Audit

## 1. Authentication & Session Security
- **JWT Verification:** All authenticated routes require a cryptographically signed Bearer JWT token in the `Authorization` header.
- **Session Expiration:** Standard 24-hour expiration window with revocation checks via `jti` claim.
- **Demo Mode Isolation:** Dedicated in-memory state store with `is_demo: true` context flags preventing test data poisoning of production tables.

## 2. Role-Based Access Control (RBAC) Matrix

| Route Group | Donor | Volunteer | NGO | Admin | Public |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `/donate` | **Allow** | Deny (403) | Deny (403) | **Allow** | Redirect |
| `/donordash` | **Allow** | Deny (403) | Deny (403) | **Allow** | Redirect |
| `/volunteerdash` | Deny (403) | **Allow** | Deny (403) | **Allow** | Redirect |
| `/ngodash` | Deny (403) | Deny (403) | **Allow** | **Allow** | Redirect |
| `/adminpage` | Deny (403) | Deny (403) | Deny (403) | **Allow** | Redirect |
| `/login`, `/register` | **Allow** | **Allow** | **Allow** | **Allow** | **Allow** |

## 3. Database Row Level Security (RLS) Policies
- `donations`: Donors may only update/cancel their own donations (`auth.uid() = donor_id`).
- `delivery_assignments`: Volunteers can only access assignments assigned to their `volunteer_id`.
- `ngos`: Only platform administrators may toggle `verification_status` to `"verified"`.
- `audit_logs`: Append-only table with zero public update/delete permissions.

