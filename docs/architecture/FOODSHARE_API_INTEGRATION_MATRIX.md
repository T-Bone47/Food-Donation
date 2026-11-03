# FoodShare — End-to-End API Integration Matrix

**Date:** November 2026  
**Audience:** Backend Engineers, Security Auditors, Distributed Systems Architects  
**Scope:** Complete map from UI action → Client call → Express route → Middleware → Service → Supabase SQL → Realtime event.

---

## 1. Complete API Integration Matrix

| UI Feature / Action | Client Method | Express Route | Auth & Guard | Service & Logic | Database Tables | Realtime Broadcast |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **User Sign In** | `authApi.login()` | `POST /api/v1/auth/login` | Public / Rate-limited | `authService.login()` | `users` | — |
| **Quick Demo Session** | `demoApi.createSession()` | `POST /api/v1/demo/session` | Public (Isolated) | `demoService.createDemoSession()` | In-memory store | — |
| **Get Donor Dashboard Stats** | `impactApi.getDonorStats()` | `GET /api/v1/impact/donor` | `authMiddleware`, `requireRole('Donor')` | `impactService.getDonorDashboardStats()` | `donations` | — |
| **Create Surplus Donation** | `donationsApi.create()` | `POST /api/v1/donations` | `authMiddleware`, `requireRole('Donor')` | `donationService.createDonation()` | `donations`, `audit_logs` | `donation.created` |
| **Cancel Surplus Donation** | `donationsApi.cancel()` | `POST /api/v1/donations/:id/cancel` | `authMiddleware`, `requireDonationOwnership` | `donationService.cancelDonation()` | `donations`, `audit_logs` | `donation.cancelled` |
| **List Available Deliveries** | `donationsApi.getAvailable()` | `GET /api/v1/donations/available` | `authMiddleware`, `requireRole('Volunteer')` | `donationService.getAvailableDonations()` | `donations` | — |
| **Claim Donation (Atomic)** | `donationsApi.claim()` | `POST /api/v1/donations/:id/claim` | `authMiddleware`, `requireRole('Volunteer')` | `donationService.claimDonation()` | `donations`, `assignments`, `audit_logs` | `donation.assigned` |
| **Confirm Food Pickup** | `donationsApi.recordPickup()` | `POST /api/v1/donations/:id/pickup` | `authMiddleware`, `requireAssignmentOwnership` | `donationService.recordPickup()` | `donations`, `assignments`, `audit_logs` | `donation.pickup_confirmed` |
| **Confirm Food Delivery** | `donationsApi.recordDelivery()` | `POST /api/v1/donations/:id/deliver` | `authMiddleware`, `requireAssignmentOwnership` | `donationService.recordDelivery()` | `donations`, `assignments`, `audit_logs` | `donation.delivery_confirmed` |
| **Get NGO Incoming Deliveries** | `ngoApi.getIncomingDeliveries()` | `GET /api/v1/ngos/incoming` | `authMiddleware`, `requireRole('NGO')` | `ngoService.getIncomingDeliveries()` | `donations`, `assignments`, `users` | — |
| **Confirm NGO Intake Receipt** | `donationsApi.confirmReceipt()` | `POST /api/v1/donations/:id/confirm-receipt` | `authMiddleware`, `requireApprovedNGO` | `donationService.confirmReceipt()` | `donations`, `delivery_confirmations`, `audit_logs` | `donation.receipt_confirmed` |
| **Get NGO Receipt History** | `ngoApi.getHistory()` | `GET /api/v1/ngos/history` | `authMiddleware`, `requireRole('NGO')` | `ngoService.getNGOHistory()` | `donations`, `delivery_confirmations` | — |
| **Submit NGO Verification** | `ngoApi.submitVerification()` | `POST /api/v1/ngos/verification` | `authMiddleware`, `requireRole('NGO')` | `ngoService.submitVerification()` | `ngo_profiles`, `audit_logs` | `ngo.verification_submitted` |
| **Review NGO Verification** | `adminApi.reviewVerification()` | `POST /api/v1/admin/verifications/:id/review` | `authMiddleware`, `requireRole('Admin')` | `adminService.reviewVerification()` | `ngo_profiles`, `audit_logs` | `ngo.verification_reviewed` |
| **List Admin Governance Data** | `adminApi.getDonations()` | `GET /api/v1/admin/donations` | `authMiddleware`, `requireRole('Admin')` | `adminService.getAllDonations()` | `donations`, `users`, `assignments` | — |
| **Admin Audit Trail** | `adminApi.getActivity()` | `GET /api/v1/admin/activity` | `authMiddleware`, `requireRole('Admin')` | `adminService.getAuditLogs()` | `audit_logs`, `users` | — |
| **Realtime Event Stream** | `EventSource` | `GET /api/v1/realtime/stream` | `optionalAuthMiddleware` | SSE connection manager | Client SSE pool | All system events |
| **AI Logistics Query** | `chatbotApi.query()` | `POST :5002/api/v1/chat/message` | Optional Bearer JWT | Flask Gemini Retrieval Pipeline | In-memory context | — |

---

## 2. Integrity Verification
- **Atomic Operations:** Claiming uses database-level transactions ensuring at most 1 active assignment per donation (`idx_assignments_one_active_per_donation`).
- **Authorization Enforcement:** Strict middleware verification guarantees non-volunteers cannot claim, non-donors cannot cancel, and unapproved NGOs cannot confirm intake.
- **Auditing:** All lifecycle transitions record immutable rows in `audit_logs` containing `actor_id`, `action`, `entity_type`, and `metadata`.

