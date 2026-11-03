# FoodShare Infrastructure — 08. Security Audit & Hardening Matrix

## 1. Security Architecture Summary

FoodShare employs a defense-in-depth security model across five architectural boundaries:
1. **Network Boundary**: CORS origin restrictions, Docker bridge network isolation, and rate-limiting buckets.
2. **Compute Boundary**: Non-root container process isolation (`node` UID 1000, `appuser` UID 1001, `nextjs` UID 1001).
3. **Session & Auth Boundary**: Cryptographic HMAC-SHA256 session token validation with timing-safe comparison and in-memory blocklists.
4. **Data Isolation Boundary**: Strict separation between production tenant persistence and in-memory Demo Mode state.
5. **Database Boundary**: PostgreSQL Row Level Security (RLS) enforcement on all read/write mutations.

---

## 2. Security Threat & Remediation Matrix

| Category | Potential Threat | Mitigation Mechanism | Verification Status |
|---|---|---|---|
| **Credential Leakage** | Supabase Service Role keys exposed to frontend | All client communications use anon keys; Service Role key is restricted to backend environment variables only. | ✅ Verified |
| **Token Forgery** | Tampered session claims | Cryptographic signature signed with minimum 32-character high-entropy secret; verified with `crypto.timingSafeEqual`. | ✅ Verified |
| **Privilege Escalation** | Unauthorized role spoofing | Roles are re-resolved against authoritative records on every authenticated mutation. | ✅ Verified |
| **Prompt Injection** | LLM manipulation via user inputs | `chatbot_api/security.py` enforces regex sanitization, stripping system prompt delimiters and capping inputs at 1,000 characters. | ✅ Verified |
| **Race Conditions** | Double-claiming donations concurrently | Atomic database status check; concurrent claims return HTTP 409 Conflict with zero race window. | ✅ Verified |
| **Cross-Tenant Leakage** | Demo operations mutating production tables | Demo session tokens flag `isDemo = true`; all mutations execute within an isolated in-memory ACID store. | ✅ Verified |
| **Denial of Service** | Unbounded payload or brute-force requests | Body parser limited to 1 MB; rate limiting enforces max requests per IP window. | ✅ Verified |
| **Container Escapes** | Root privilege execution | Multi-stage Docker builds enforce non-root execution users across all 3 containers. | ✅ Verified |

---

## 3. Secret Management Compliance Checklist

- [x] `.env` excluded from version control via `.gitignore`.
- [x] Docker build contexts exclude local secrets via `.dockerignore`.
- [x] Runtime configuration injected exclusively through environment variables.
- [x] Client bundles contain zero privileged server keys (`NEXT_PUBLIC_` variables contain only public host URLs).

