# FoodShare — Full-System Performance & Architectural Audit

**Document:** `docs/performance/01_SYSTEM_PERFORMANCE_AUDIT.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Target Viewports:** 1920 × 1080 (Primary HD), 1440 × 900 (Laptop), 390 × 844 (Mobile)  
**Date:** November 2, 2026  
**Auditor:** Principal Software Architect & Site Reliability Engineer  

---

## 1. Architectural Scope & Lifecycle Topology

The platform coordinates food rescue operations across four authenticated roles (**Donor**, **Volunteer**, **NGO**, **Admin**) and an AI conversational assistant. The runtime environment spans:
- **Frontend:** Next.js 15, React 19, Tailwind CSS, Axios, Leaflet GIS mapping.
- **Backend Core:** Node.js, Express 5, Supabase JS PostgREST client, stateless JWT authentication.
- **Database Layer:** Supabase PostgreSQL with Row Level Security (RLS), atomic claim RPC functions, and automated expiry sweepers.
- **AI Microservice:** Python 3 Flask microservice with Gemini LLM integration and grounded regulatory fallback synthesizers.

```
+--------------------------------------------------------------------------------------------------+
|                                  COMPLETE REQUEST LIFECYCLE                                      |
+--------------------------------------------------------------------------------------------------+
|  Client Browser (Next.js 15 App Router / Axios API Client)                                      |
|    |--> HTTP Keep-Alive / Bearer Authorization Header                                            |
|    v                                                                                             |
|  Express 5 REST API Gateway (Port 5000)                                                          |
|    |--> helmet() -> cors() -> json parser -> request-id middleware                              |
|    |--> authMiddleware (validates cryptographic JWT token & resolves account status)             |
|    |--> Route Controllers -> Domain Services (Donation, Impact, NGO, Demo, Notification)         |
|    v                                                                                             |
|  PostgreSQL Database (Supabase / In-Memory Demo Store)                                           |
|    |--> Row Level Security (RLS) enforcement & Indexes                                           |
|    |--> Atomic RPC claim_donation() with SELECT ... FOR UPDATE row-level locks                   |
|    v                                                                                             |
|  AI Microservice Gateway (Flask / Port 5002)                                                     |
|    |--> Rate Limiter -> Prompt Injection Scanner -> Grounded Regulatory Food Safety RAG          |
+--------------------------------------------------------------------------------------------------+
```

---

## 2. Identified Bottlenecks & Critical Defects

### 2.1 Frontend Bottlenecks
1. **Uncached & Undeduplicated GET Requests:**
   - In `use-resource.ts`, repeated component remounts or simultaneous dashboard widgets fire duplicate GET requests (`/donations/mine`, `/impact/me`, `/notifications`) without in-flight request coalescing.
2. **Missing Request Abort Controllers:**
   - When users switch rapidly between sidebar routes (e.g. from `/donordash` to `/mydonations`), obsolete in-flight requests continue executing over the network rather than being aborted.
3. **Heavy Leaflet Map Evaluation:**
   - Leaflet CSS and GIS scripts should only be evaluated on pages with geographic mapping, rather than impacting initial bundle parsing.
4. **Serial Waterfall Data Fetching on Dashboards:**
   - Dashboards make sequential asynchronous calls (e.g., loading user profile, then listings, then impact metrics), compounding network roundtrips.

### 2.2 Backend API Bottlenecks
1. **Unindexed NGO Incoming Queries:**
   - NGOs query `donations` filtering by `recipient_ngo_id` and `status = 'DELIVERED'`. While `recipient_ngo_id` is indexed, a composite index `(recipient_ngo_id, status)` is needed for zero-filter index-only scans.
2. **Demo Mode User Filter Bypass:**
   - In `admin.routes.js:105`, demo user retrieval did not apply `role`, `status`, or `search` parameters, causing client-side tables to receive unfiltered records.
3. **Overly Restrictive Chatbot Suggestion Rate Limits:**
   - `GET /api/suggestions` on the Flask microservice was throttled under default 20 req/min limits, causing HTTP 429 errors during rapid navigation.
4. **Serial Sweeper Execution:**
   - Overdue donation sweeps run on an unref timer; while non-blocking, query batching needs explicit limits to avoid locking tables during high donation volume.

### 2.3 Database Layer Bottlenecks
1. **Audit Log Index Coverage:**
   - `audit_logs` has indexes on `actor_id` and `resource_type, resource_id`, but queries sorting by `created_at DESC` without resource filters scan full index ranges.
2. **PostgREST Query Projections:**
   - Several endpoints use `select("*")` rather than explicit column projections, transferring unused metadata (large descriptions, coordinates) over internal networks.

---

## 3. Optimization Road Map

- **Batch A:** Measure empirical performance baselines (API latency, TTFB, memory).
- **Batch B:** Frontend bundle splitting, lazy loading, request deduplication, and AbortController integration.
- **Batch C:** API client caching with mutation-triggered cache invalidation.
- **Batch D:** Backend query optimization, composite PostgreSQL indexes, and demo filter fixes.
- **Batch E:** Chatbot latency hardening and rate limit adjustments.
- **Batch F:** Multi-user load testing (10, 25, 50 concurrent users) and final verification.

