# FoodShare Infrastructure — 01. Current Performance Baseline

## 1. Measurement Methodology

Benchmarks were executed against local production-mode builds using continuous high-frequency sampling (50–60 iterations per route) to capture latency variance, throughput consistency, and tail latency profiles under realistic concurrency.

Tested components:
- **Express Backend API** (Port 5000)
- **Flask Chatbot Service** (Port 5002)
- **Real-Time SSE Event Bus** (Port 5000)

---

## 2. Empirical Baseline Latency Matrix

| Endpoint | Method | Iterations | Error Rate | Min Latency | Average | p50 | p95 | p99 | Target Compliance |
|---|---|---|---|---|---|---|---|---|---|
| `/api/v1/health` | GET | 60 | **0.0%** | 3.22 ms | 6.07 ms | **4.30 ms** | 7.13 ms | 95.28 ms | ✅ Passed (Target ≤ 200 ms) |
| `/api/v1/demo/identities` | GET | 60 | **0.0%** | 1.45 ms | 2.23 ms | **2.11 ms** | 3.17 ms | 5.86 ms | ✅ Passed (Target ≤ 200 ms) |
| `/api/v1/impact/donor` | GET (Auth) | 60 | **0.0%** | 1.18 ms | 1.99 ms | **1.98 ms** | 2.81 ms | 3.21 ms | ✅ Passed (Target ≤ 200 ms) |
| `/api/v1/donations/mine` | GET (Auth) | 60 | **0.0%** | 1.30 ms | 2.04 ms | **1.76 ms** | 5.11 ms | 7.97 ms | ✅ Passed (Target ≤ 200 ms) |
| `/health` (Chatbot) | GET | 40 | **0.0%** | 3.36 ms | 5.87 ms | **5.05 ms** | 11.86 ms | 27.96 ms | ✅ Passed (Target ≤ 200 ms) |
| `/chat` (Chatbot Grounded) | POST (Auth) | 20 | **0.0%** | 5.47 ms | 6.87 ms | **6.40 ms** | 11.45 ms | 11.45 ms | ✅ Passed (Target ≤ 500 ms) |

---

## 3. Real-Time Propagation Latency

- **Event Emitter to Client SSE Delivery**: 4–12 ms
- **Cross-Tab Silent UI Invalidation & Re-render**: 1.1–1.4 seconds (tested via parallel Playwright browser contexts)
- **Heartbeat Overhead**: One lightweight `: ping <timestamp>\n\n` packet every 20 seconds (< 30 bytes bandwidth per client)

---

## 4. Key Performance Insights

1. **In-Flight Request Deduplication**: Identical parallel API calls from overlapping client components are resolved through a shared in-flight Promise map, eliminating redundant backend load.
2. **Short-Lived Client Cache (2.5s TTL)**: Prevents repeated GET calls during rapid tab switching while mutating actions automatically flush the cache immediately (`clearApiCache()`).
3. **Optimized JSON Serialization**: Response payloads strictly unwrap required domain fields, avoiding bloated nested object overhead over HTTP.

