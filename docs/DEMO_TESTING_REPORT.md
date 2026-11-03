# FoodShare Platform — Demo Mode Verification & Testing Report

## 1. Test Suite Summary & Pass Rate

All components of the Interactive Demo Mode have been validated through automated unit tests, integration assertions, TypeScript compilation, and linting.

```
=================================================================================
COMPONENT                         TEST SUITE                   TESTS     RESULT
=================================================================================
Backend Unit & Lifecycle          test/unit/lifecycle.test.js  6/6       PASSED
Backend Tokens & Cryptography     test/unit/token.test.js      6/6       PASSED
Backend Rate Limiting             test/unit/rateLimit.test.js  2/2       PASSED
Backend Notifications             test/unit/notification...    2/2       PASSED
Backend Validation Helpers        test/unit/validators.test.js 10/10     PASSED
Backend Demo Architecture         test/unit/demo.test.js       4/4       PASSED
---------------------------------------------------------------------------------
TOTAL BACKEND TESTS:                                           30/30     PASSED (100%)
---------------------------------------------------------------------------------
Frontend API Envelopes & Mappings test/api-envelope.test.mjs   7/7       PASSED
Frontend Donation Forms & Dates   test/donation-form.test.mjs  14/14     PASSED
Frontend TypeScript Compilation   npx tsc --noEmit             —         0 ERRORS
Frontend ESLint Verification      npm run lint                 —         0 ERRORS
---------------------------------------------------------------------------------
TOTAL FRONTEND TESTS:                                          21/21     PASSED (100%)
=================================================================================
```

---

## 2. Test Execution Logs

### 2.1 Backend Test Run (`npm test`)
```text
> backend@1.0.0 test
> node --test --test-concurrency=1 --import ./test/support/test-env.js test/unit

✔ Demo Identities — all four platform roles exist with valid structures (2.9145ms)
✔ Demo Authentication — issues valid cryptographically signed session tokens (8.7124ms)
✔ Demo Lifecycle Scenario — full cycle from creation to NGO receipt (2.031ms)
✔ Demo Reset — reverts state idempotently without side-effects (0.8075ms)
✔ the canonical happy path is allowed (3.6754ms)
✔ cancellation is allowed only before pickup (0.3411ms)
✔ out-of-order and self transitions are rejected (0.5797ms)
✔ terminal states cannot transition anywhere (0.7652ms)
✔ status input is normalized case-insensitively (0.3368ms)
✔ expired is only reachable from available (0.2598ms)
✔ every declared notification event value is accepted (2.5332ms)
✔ custom events are accepted and unknown values are rejected (0.365ms)
✔ rate limiter blocks requests beyond the configured maximum (4.6586ms)
✔ rate limiter can be explicitly disabled for tests (0.7254ms)
✔ issued tokens verify and contain a unique jti (8.5652ms)
✔ tampered tokens are rejected (0.7929ms)
✔ expired tokens are rejected (0.7561ms)
✔ tokens signed with a different secret are rejected (0.4365ms)
✔ revoked tokens cannot be reused (0.5824ms)
✔ a missing or weak session secret fails closed (1.39ms)
✔ email validation rejects malformed addresses (2.2758ms)
✔ password validation enforces minimum and bcrypt maximum (0.4012ms)
✔ quantity accepts only positive bounded numbers (0.3297ms)
✔ expiry must be a future timestamp (1.7687ms)
✔ pickup deadline is in the future and no later than expiry (0.4516ms)
✔ uuid validation distinguishes ids from malformed values (0.4873ms)
✔ text length helpers enforce boundaries (0.4057ms)
✔ coordinates require a complete, in-range pair (1.4554ms)
✔ phone validation enforces valid formats and length limits (0.6527ms)
✔ pincode validation enforces alphanumeric codes and limits (0.6408ms)
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1087.0672
```

### 2.2 Frontend Test Run (`npm test`)
```text
> frontend@0.1.0 test
> node --experimental-strip-types --test "test/*.test.mjs"

✔ unwraps every v1 success shape the app reads (4.0608ms)
✔ leaves non-enveloped bodies untouched (0.5396ms)
✔ preserves status, code, message, details and request id from the error envelope (3.4651ms)
✔ maps each status the backend can return (0.5681ms)
✔ falls back to safe copy when the body is not an API error envelope (0.5715ms)
✔ distinguishes network failure, timeout and programmer errors (3.7197ms)
✔ does not mutate the error it is given (0.4288ms)
✔ localInputToIso reads a zone-less datetime-local value as the donor's LOCAL time (2.8415ms)
✔ the instant is pinned to the donor's zone, whatever zone the server runs in (518.8354ms)
✔ localInputToIso rejects anything that is not a datetime-local value (0.2811ms)
✔ a complete, valid form has no errors (1.5193ms)
✔ validation mirrors the server's rules, field by field (0.9151ms)
✔ time rules: expiry in the future; pickup in the future and no later than expiry (1.471ms)
✔ payload: absolute instants, trimmed text, optional fields omitted, coordinates only when known (0.7274ms)
✔ format: quantities use the right singular/plural and never sum across units (0.5582ms)
✔ format: deadlines are relative to the minute and flag urgency (1.0591ms)
✔ format: location never renders 'undefined' and has a fallback (0.4045ms)
✔ format: formatAgo (0.3226ms)
✔ auth: login requires a well-formed email and a password (0.3294ms)
✔ auth: signup rules match the server (name, email, password 6–72, limits) (0.7311ms)
✔ auth: profile validation exists because PATCH /auth/me validates nothing server-side (0.5039ms)
ℹ tests 21
ℹ suites 0
ℹ pass 21
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1147.7467
```

---

## 3. End-to-End Walkthrough Matrix

| Action / Verification Step | Expected Behavior | Actual Observed Result | Status |
| :--- | :--- | :--- | :---: |
| 1. Navigate to `/login` | Shows standard login form & "Explore Interactive Demo" button | Matches design specification | **PASS** |
| 2. Click "Select Demo Role" | Opens 4-role modal (Donor, Volunteer, NGO, Admin) | Modal renders cleanly | **PASS** |
| 3. Click "Enter Donor Demo" | Authenticates demo donor, redirects to `/donordash` | Redirects to `/donordash` with demo badge | **PASS** |
| 4. Click "Guided Demo" | Opens side presentation drawer with 10 presentation stages | Drawer slides in from right | **PASS** |
| 5. Create donation on `/donate` | Validates dates; listing appears in `/mydonations` | Listing appears in `AVAILABLE` status | **PASS** |
| 6. Switch to Volunteer via Guide | Advances session to Volunteer; redirects to `/volunteerdash` | Shows available listings | **PASS** |
| 7. Claim and pick up donation | Advances status to `ASSIGNED` then `PICKED_UP` | Status updates instantaneously | **PASS** |
| 8. Deliver donation to NGO | Selects Hope Shelter; advances to `DELIVERED` | Status updates to `DELIVERED` | **PASS** |
| 9. Switch to NGO via Guide | Advances session to NGO; `/ngodash` shows delivery | Shows intake card ready for receipt | **PASS** |
| 10. Click "Confirm Receipt" | Closes lifecycle loop; status becomes `COMPLETED` | Success toast & status `COMPLETED` | **PASS** |
| 11. Switch to Admin via Guide | Shows live demo metrics and full audit trail | Metrics accurately reflect demo records | **PASS** |
| 12. Click "Exit Demo" | Clears session; returns to `/login` | Storage purged, redirected to `/login` | **PASS** |

