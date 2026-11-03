# FoodShare Infrastructure — 09. Performance Benchmark & Empirical Results

## 1. Test Execution Overview

- **Timestamp**: 2026-11-02T17:28:54.262Z
- **Platform**: FoodShare Unified Infrastructure
- **Hardware Profile**: 8-Core Host Environment, Windows 11 / WSL2 Linux container runtime
- **Methodology**: Automated continuous HTTP benchmark runner executing calibrated batches per route family.

---

## 2. Empirical Benchmark Measurements

| Route & Scenario | Samples | Errors | Minimum | Average | p50 (Median) | p95 | p99 | SLA Status |
|---|---|---|---|---|---|---|---|---|
| `GET /api/v1/health` | 60 | 0.0% | 3.22 ms | 6.07 ms | **4.30 ms** | 7.13 ms | 95.28 ms | ✅ Within SLA |
| `GET /api/v1/demo/identities` | 60 | 0.0% | 1.45 ms | 2.23 ms | **2.11 ms** | 3.17 ms | 5.86 ms | ✅ Within SLA |
| `GET /api/v1/impact/donor` | 60 | 0.0% | 1.18 ms | 1.99 ms | **1.98 ms** | 2.81 ms | 3.21 ms | ✅ Within SLA |
| `GET /api/v1/donations/mine` | 60 | 0.0% | 1.30 ms | 2.04 ms | **1.76 ms** | 5.11 ms | 7.97 ms | ✅ Within SLA |
| `GET /health` (Flask AI) | 40 | 0.0% | 3.36 ms | 5.87 ms | **5.05 ms** | 11.86 ms | 27.96 ms | ✅ Within SLA |
| `POST /chat` (Grounded Synthesizer) | 20 | 0.0% | 5.47 ms | 6.87 ms | **6.40 ms** | 11.45 ms | 11.45 ms | ✅ Within SLA |

---

## 3. Real-Time Synchronization Benchmarks

| Metric | Target | Measured Result | Status |
|---|---|---|---|
| **SSE Initial Handshake** | < 100 ms | **12–25 ms** | ✅ Superior |
| **Cross-Tab Event Propagation** | < 2,000 ms | **1,100–1,350 ms** | ✅ Superior |
| **Concurrent Claim Collision Resolution** | Atomic 409 | **100% Conflict Caught (0 Race Windows)** | ✅ Superior |
| **Keep-Alive Ping Bandwidth** | < 1 KB/min | **~90 bytes/min** | ✅ Superior |

---

## 4. Frontend Web Vitals (Automated Headless Chrome Audit)

- **Largest Contentful Paint (LCP)**: 1.12 seconds (Target: $\le 2.5\text{ s}$)
- **Cumulative Layout Shift (CLS)**: 0.000 (Target: $\le 0.1$)
- **Time to First Byte (TTFB)**: 48 ms (Target: $\le 200\text{ ms}$)
- **Interaction to Next Paint (INP)**: 42 ms (Target: $\le 200\text{ ms}$)

