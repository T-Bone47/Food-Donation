# 07 — Supabase Database Compatibility & Migration Audit

## 1. Schema Specifications
The database comprises 6 core relational entities:
- `users`: Core profile record (`id`, `name`, `email`, `role`, `organization`, `phonenumber`, `area`, `pincode`).
- `donations`: Surplus food listing records (`id`, `donor_id`, `title`, `food_category`, `quantity`, `unit`, `pickup_address`, `status`, `expires_at`).
- `delivery_assignments`: Logistics manifest records (`id`, `donation_id`, `volunteer_id`, `status`, `claimed_at`, `picked_up_at`, `delivered_at`).
- `ngos`: Verified organization directory (`id`, `user_id`, `registration_number`, `verification_status`).
- `notifications`: Operational in-app alerts (`id`, `user_id`, `title`, `message`, `read`, `created_at`).
- `audit_logs`: Immutable compliance audit trail (`id`, `user_id`, `action`, `resource_type`, `resource_id`, `metadata`).

## 2. Status Lifecycle State Machine
```
AVAILABLE  ──(Claim)──>  ASSIGNED  ──(Pickup)──>  PICKED_UP  ──(Deliver)──>  DELIVERED  ──(Confirm)──>  COMPLETED
    │                       │                         │
    └───(Cancel by Donor)───┴──────(Unassign)─────────┘
```

## 3. Demo Mode High-Availability Isolation
To support evaluations and offline demos where external Supabase instances are unreachable:
1. `backend/services/demo.service.js` provides an in-memory clone of the schema with atomic mutation guarantees.
2. In-memory seed scenario includes 4 pre-populated user profiles and 5 active/completed donation manifests.
3. Every database route features a fallback layer that returns structured degraded data rather than throwing unhandled `500` or `fetch failed` exceptions.

