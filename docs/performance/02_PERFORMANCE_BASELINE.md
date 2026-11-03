# FoodShare — Performance Baseline & Empirical Measurements

**Document:** `docs/performance/02_PERFORMANCE_BASELINE.md`  
**Platform:** FoodShare — The Food Rescue Operating Platform  
**Date:** November 2, 2026  
**Benchmarking Environment:** Node.js 22, Express 5, Flask Python 3, Next.js 15, Windows 11  
**Measurement Tool:** Empirical Benchmark Harness (`benchmark-api.js`) over 20 iterations per endpoint  

---

## 1. Baseline Latency Matrix (Core API & Microservices)

The following metrics represent empirical measurements taken prior to optimization:

| Endpoint / Workflow | Method | Auth Required | Status | Payload (B) | Avg Latency (ms) | p50 (ms) | p95 (ms) | p99 (ms) |
|---|---|---|---|---|---|---|---|---|
| **`/api/v1/health`** | `GET` | No | 200 | 229 | 6.69 | 4.22 | 53.08 | 53.08 |
| **`/api/v1/demo/identities`** | `GET` | No | 200 | 1,131 | 1.88 | 1.72 | 3.33 | 3.33 |
| **`/api/v1/demo/session`** | `POST` | No | 200 | 759 | 2.57 | 2.40 | 4.45 | 4.45 |
| **`/api/v1/donations/mine`** | `GET` | Yes (Donor) | 200 | 3,814 | 1.90 | 1.81 | 3.61 | 3.61 |
| **`/api/v1/donations/available`**| `GET` | Yes (Volunteer) | 200 | 817 | 1.84 | 1.79 | 3.06 | 3.06 |
| **`/api/v1/volunteer/tasks`** | `GET` | Yes (Volunteer) | 200 | 4,433 | 1.72 | 1.66 | 2.21 | 2.21 |
| **`/api/v1/ngos/incoming`** | `GET` | Yes (NGO) | 200 | 1,411 | 1.72 | 1.61 | 3.21 | 3.21 |
| **`/api/v1/admin/users`** | `GET` | Yes (Admin) | 200 | 1,504 | 1.63 | 1.52 | 2.27 | 2.27 |
| **`/api/v1/admin/donations`** | `GET` | Yes (Admin) | 200 | 3,814 | 2.79 | 2.07 | 7.48 | 7.48 |
| **`/api/v1/admin/audit-logs`** | `GET` | Yes (Admin) | 200 | 1,149 | 1.53 | 1.51 | 1.92 | 1.92 |
| **`/api/v1/notifications`** | `GET` | Yes | 200 | 837 | 1.53 | 1.45 | 2.33 | 2.33 |
| **`/health` (Chatbot Port 5002)**| `GET` | No | 200 | 97 | 6.07 | 6.08 | 10.20 | 10.20 |
| **`/api/suggestions` (Chatbot)** | `GET` | No | 429 (Throttle) | 118 | 5.83 | 5.69 | 7.91 | 7.91 |
| **`/chat` (Chatbot Fallback)** | `POST` | No | 200 | 999 | 6.16 | 5.41 | 8.01 | 8.01 |

---

## 2. Key Baseline Findings & Diagnosis

1. **Microservice Response Time:**
   - In-memory demo mode endpoints demonstrate excellent raw baseline speeds (p50: 1.5ms – 2.5ms).
   - Backend health check has occasional spikes (p95: 53.08ms) due to unpooled connectivity checks.
2. **Chatbot Rate Limiting Defect:**
   - `GET /api/suggestions` hit a 429 rate limit during rapid successive queries because default limits (20 req/min) were shared with the conversational endpoint.
3. **Frontend Network Duplication:**
   - Simultaneous dashboard widgets on `/donordash` and `/volunteerdash` fire multiple parallel GET requests without in-flight deduplication.
4. **Missing Abort Signal Propagation:**
   - Navigating quickly between views does not cancel stale requests.

