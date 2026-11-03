# Phase 3: Real Environment Validation & Test Report

**Project**: Unified Food Donation Platform (SIH Hackathon)  
**Date**: November 2, 2026  
**Auditor**: Senior QA Automation Engineer & Release Manager  
**Environment**: Windows 11, Node.js v26.12.1, npm 11.20.0, Python 3.15.1, pip 26.2.2  

---

## 1. Executive Summary

All components of the Unified Food Donation Platform were validated in the real execution environment using the actual dependencies, compilers, linters, and test runners.

### Summary Results Matrix

| Component | Target Check | Command Executed | Result | Count / Metric |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | Dependency Installation | `npm.cmd install` | **PASS** | 418 packages installed |
| **Frontend** | TypeScript Compilation | `npx.cmd tsc --noEmit` | **PASS** | 0 errors |
| **Frontend** | Static Analysis / Linting | `npm.cmd run lint` | **PASS** | 0 errors, 0 warnings |
| **Frontend** | Unit Tests | `npm.cmd test` | **PASS** | 21/21 passed (100%) |
| **Frontend** | Production Build | `npm.cmd run build` | **PASS** | 15/15 pages generated |
| **Backend** | Dependency Installation | `npm.cmd install` | **PASS** | 270 packages installed |
| **Backend** | Unit Tests | `npm.cmd test` | **PASS** | 24/24 passed (100%) |
| **Backend** | Integration Tests | `npm.cmd run test:integration`| **BLOCKED** | External DB container offline |
| **Chatbot** | Dependency Installation | `pip install -r requirements.txt` | **PASS** | 11 packages installed |
| **Chatbot** | Unit Tests & Validation | `python -m unittest test_app.py` | **PASS** | 7/7 passed (100%) |

---

## 2. Detailed Execution Log

### 2.1 Frontend Validation

#### Command 1: `npm.cmd install`
- Status: Exit code 0
- Log: 418 packages added, 419 audited.

#### Command 2: `npx.cmd tsc --noEmit`
- Status: Exit code 0
- Log: Type-checking completed with 0 errors across all TypeScript and TSX files.

#### Command 3: `npm.cmd run lint`
- Status: Exit code 0
- Log: ESLint 9 executed with zero errors and zero warnings. (Resolved minor React hook cleanup ref variable warning in `src/lib/use-resource.ts`).

#### Command 4: `npm.cmd test`
- Status: Exit code 0
- Duration: 355ms
- Suites: 2 (`api-envelope.test.mjs`, `donation-form.test.mjs`)
- Tests: 21 passed, 0 failed:
  - `api-envelope.test.mjs`:
    - unwraps every v1 success shape the app reads
    - leaves non-enveloped bodies untouched
    - preserves status, code, message, details and request id from error envelope
    - maps each status the backend can return
    - falls back to safe copy when body is not an API error envelope
    - distinguishes network failure, timeout and programmer errors
    - does not mutate the error it is given
  - `donation-form.test.mjs`:
    - localInputToIso reads zone-less datetime-local value as donor's LOCAL time
    - instant is pinned to donor's zone
    - localInputToIso rejects non-datetime-local value
    - complete, valid form has no errors
    - validation mirrors server rules, field by field
    - time rules: expiry in future; pickup in future and <= expiry
    - payload: absolute instants, trimmed text, coordinates only when known
    - format: quantities use right singular/plural
    - format: deadlines relative to minute and flag urgency
    - format: location never renders 'undefined'
    - format: formatAgo
    - auth: login requires well-formed email and password
    - auth: signup rules match server (name, email, password 6-72, limits)
    - auth: profile validation exists

#### Command 5: `npm.cmd run build`
- Status: Exit code 0
- Production compilation output:
  ```
  Route (app)                                 Size  First Load JS
  ┌ ○ /                                    6.65 kB         147 kB
  ├ ○ /_not-found                            992 B         103 kB
  ├ ƒ /acceptpage/[id]                     1.78 kB         149 kB
  ├ ○ /adminpage                             19 kB         163 kB
  ├ ○ /donate                              8.22 kB         152 kB
  ├ ○ /donordash                           4.21 kB         148 kB
  ├ ○ /login                               3.83 kB         144 kB
  ├ ○ /mydonations                         3.48 kB         151 kB
  ├ ○ /ngodash                             4.91 kB         153 kB
  ├ ○ /notification                        4.49 kB         148 kB
  ├ ○ /profile                             5.07 kB         149 kB
  ├ ○ /volunteer/tasks                     5.01 kB         153 kB
  └ ○ /volunteerdash                       1.85 kB         150 kB
  + First Load JS shared by all             102 kB
  ```

---

### 2.2 Backend Validation

#### Command 1: `npm.cmd install`
- Status: Exit code 0
- Log: 270 packages installed, native `bcrypt` module built successfully.

#### Command 2: `npm.cmd test`
- Status: Exit code 0
- Duration: 401ms
- Tests: 24 passed, 0 failed:
  - `lifecycle.test.js`:
    - canonical happy path allowed
    - cancellation allowed only before pickup
    - out-of-order and self transitions rejected
    - terminal states cannot transition anywhere
    - status input normalized case-insensitively
    - expired only reachable from available
  - `notification-events.test.js`:
    - every declared notification event value accepted
    - custom events accepted and unknown values rejected
  - `rateLimit.test.js`:
    - rate limiter blocks requests beyond configured maximum
    - rate limiter can be explicitly disabled for tests
  - `token.test.js`:
    - issued tokens verify and contain unique jti
    - tampered tokens rejected
    - expired tokens rejected
    - tokens signed with different secret rejected
    - revoked tokens cannot be reused
    - missing or weak session secret fails closed
  - `validators.test.js`:
    - email validation rejects malformed addresses
    - password validation enforces minimum and bcrypt maximum
    - quantity accepts only positive bounded numbers
    - expiry must be a future timestamp
    - pickup deadline is in the future and <= expiry
    - uuid validation distinguishes ids from malformed values
    - text length helpers enforce boundaries
    - coordinates require complete in-range pair

---

### 2.3 Chatbot Validation

#### Command 1: `python -m pip install -r requirements.txt`
- Status: Exit code 0
- Log: Flask 3.1.3, flask-cors 6.0.5, flask-limiter 4.1.1, python-dotenv 1.2.4, requests 2.34.2 installed.

#### Command 2: `python -m unittest test_app.py`
- Status: Exit code 0
- Tests: 7 passed, 0 failed:
  - `test_health_endpoint`: Health endpoint returns status 200 with JSON payload
  - `test_chat_non_json`: Rejects non-JSON content types with 400
  - `test_chat_missing_message`: Rejects empty payload with 400
  - `test_chat_empty_message`: Rejects whitespace-only message with 400
  - `test_chat_non_string_message`: Rejects non-string message types with 400
  - `test_chat_message_too_long`: Rejects messages exceeding 500 characters with 400
  - `test_chat_unconfigured_api_key_returns_503`: Returns 503 and `CHATBOT_NOT_CONFIGURED` when Gemini API key is placeholder

---

## 3. Defects Identified and Resolved During Phase 1

1. **Backend Test Harness Key Prerequisite**:
   - Issue: `backend/test/support/test-env.js` threw an error if `process.env.SUPABASE_KEY` was missing, preventing the 24 offline unit tests from running.
   - Resolution: Configured a safe fallback test credential in `test-env.js` for offline unit testing, enabling zero-friction local validation.
2. **ESLint React Hook Warning**:
   - Issue: `frontend/src/lib/use-resource.ts` had a ref warning during cleanup.
   - Resolution: Preserved local reference to sequence counter, achieving 0 errors and 0 warnings.
3. **Missing Automated Chatbot Test Suite**:
   - Issue: `chatbot_api` lacked automated test coverage.
   - Resolution: Implemented `chatbot_api/test_app.py` testing health, parameter validation, size limits, and unconfigured provider error responses.

---

## 4. Unresolved External Dependencies

- **Local Supabase Docker Container**:
  - `npm.cmd run test:integration` requires a live PostgreSQL Supabase instance on `http://127.0.0.1:54321`.
  - Host machine does not currently run the Docker daemon (`npipe:////./pipe/dockerDesktopLinuxEngine` unavailable).
  - Remediation: Documented in deployment and test guides; unit tests remain 100% offline-executable.

---
*Phase 1 verified and passed.*

