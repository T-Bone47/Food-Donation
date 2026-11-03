# 00 — Real-Time Architecture & State Synchronization Audit

## 1. Executive Summary
This document conducts a deep architectural audit of the FoodShare platform across its Next.js 15 frontend, Express 5 backend, and Supabase PostgreSQL / in-memory demo data stores. It establishes the technical blueprint for transforming isolated role dashboards into a unified, reactive, cross-role operating system.

## 2. Current Architecture & Boundary Analysis

### Frontend (`frontend/src`)
- **Framework:** Next.js 15 (React 19, TypeScript, Tailwind CSS v4).
- **Current Data Loading Strategy:** `useResource(loadFn)` runs a `fetch` query on component mount. State updates currently require explicit user-initiated actions or manual browser reloads (`F5`).
- **Missing Link:** No persistent event listener or streaming subscriber in `AppShell` or role dashboards.

### Backend (`backend`)
- **Framework:** Express 5 on Node.js 26.
- **Controllers & Routes:**
  - `donations.routes.js`: Core lifecycle transitions (create, claim, pickup, deliver, confirm-receipt, cancel).
  - `impact.routes.js`: Role-specific aggregate statistics and personal impact totals.
  - `ngos.routes.js`: Incoming deliveries, dock inspection queue, verification status.
  - `volunteer.routes.js`: Assigned task manifests, pickup schedules.
  - `notifications.routes.js`: Operational in-app alerts and notifications.
  - `admin.routes.js`: System metrics, pending NGO verification requests, audit logs.
- **Missing Link:** Mutations in `donations.routes.js` and `demo.service.js` execute atomically, but do not broadcast event notifications to connected frontend clients.

### Database & Demo Environments
- **Production Environment:** Supabase PostgreSQL with Row Level Security (RLS) policies and RPC functions (e.g. `claim_donation`).
- **Demo Mode Environment:** In-memory multi-tenant store in `backend/services/demo.service.js` pre-seeded with 4 canonical identities (`Demo Food Donor`, `Demo Volunteer`, `Demo NGO`, `Demo Administrator`) and 5 initial donation batches.
- **Critical Requirement:** All demo users must operate on the *same* shared in-memory records. Role switching must preserve mutations, and live updates must propagate across tabs and sessions.

## 3. Real-Time Transport Decision Matrix

| Mechanism | Browser Support | Server Complexity | Firewall / Proxy Compatibility | Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Server-Sent Events (SSE)** | Native (`EventSource` in all modern browsers) | Extremely clean HTTP/1.1 & HTTP/2 streaming in Express | 100% compatible with standard HTTP ports (3000/5000), corporate proxies, zero extra dependencies | **PRIMARY RECOMMENDED** |
| **WebSockets (ws)** | Native (`WebSocket`) | Requires WS upgrade server, heartbeat tracking, reconnect handling | May encounter proxy blocking or SSL termination hurdles | Secondary |
| **Supabase Realtime (WebSockets)** | Supabase JS Client | Managed by Supabase Cloud | Requires live cloud Supabase project and active network access; unavailable during offline evaluations | Supplementary (Production only) |

**Architectural Decision:** Implement an authoritative Server-Sent Events (SSE) streaming architecture on `GET /api/v1/realtime/stream` backed by an in-memory event bus in the Express service. This ensures 100% guaranteed real-time updates for both the shared demo environment and production deployments without external cloud dependencies.

