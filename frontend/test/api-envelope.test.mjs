// Contract tests for src/lib/api-envelope.ts. Fixtures mirror what backend/routes/*.routes.js and
// backend/middleware/errorHandler.js actually emit (source noted per fixture).
// Run: npm test   (needs Node >= 22.6 for --experimental-strip-types)
import test from "node:test";
import assert from "node:assert/strict";
import { unwrapEnvelope, getApiError, errorMessages } from "../src/lib/api-envelope.ts";

const meta = { requestId: "req-1" };

test("unwraps every v1 success shape the app reads", () => {
  const cases = {
    // auth.routes.js POST /login, /signup
    login: { user: { id: "u1", role: "Volunteer" }, token: "t" },
    // donations.routes.js GET /available
    available: { donations: [{ id: "d1" }] },
    // donations.routes.js POST /:id/claim
    claim: { donation: { id: "d1" }, assignment: { id: "a1" } },
    // volunteer.routes.js GET /tasks
    tasks: { tasks: [{ id: "a1", donations: { id: "d1" } }] },
    // ngos.routes.js GET /verification when no profile exists
    noProfile: { profile: null },
    // ngos.routes.js GET /incoming
    deliveries: { deliveries: [] },
    // admin.routes.js GET /impact
    impact: { impact: { totalCompletedDonations: 0 } },
    // notifications.routes.js POST /read-all
    readAll: { success: true },
  };
  for (const [name, payload] of Object.entries(cases)) {
    assert.deepEqual(unwrapEnvelope({ data: payload, meta }), payload, name);
  }
});

test("leaves non-enveloped bodies untouched", () => {
  const health = { status: "healthy", checks: { database: "ok" }, meta }; // health.routes.js:37 (meta, no data)
  assert.equal(unwrapEnvelope(health), health);
  const ready = { ready: true }; // health.routes.js:64
  assert.equal(unwrapEnvelope(ready), ready);
  const onlyData = { data: [1, 2] }; // a payload that merely has a `data` key must not be unwrapped
  assert.equal(unwrapEnvelope(onlyData), onlyData);
  const arr = [{ data: 1, meta: 2 }];
  assert.equal(unwrapEnvelope(arr), arr);
  assert.equal(unwrapEnvelope(null), null);
  assert.equal(unwrapEnvelope(undefined), undefined);
  assert.equal(unwrapEnvelope("<html>502</html>"), "<html>502</html>");
});

const http = (status, body) => ({ isAxiosError: true, response: { status, data: body } });

test("preserves status, code, message, details and request id from the error envelope", () => {
  // middleware/validate.js and donation.service.js ValidationError
  const e = getApiError(
    http(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "Donation validation failed",
        details: [
          { field: "expires_at", message: "Expiry must be a valid future timestamp" },
          { field: "expires_at", message: "second message for same field is ignored for inline use" },
          { field: "title", message: "Title is required and must be at most 200 characters" },
        ],
      },
      meta,
    })
  );
  assert.equal(e.status, 400);
  assert.equal(e.code, "VALIDATION_ERROR");
  assert.equal(e.message, "Donation validation failed");
  assert.equal(e.requestId, "req-1");
  assert.equal(e.details.length, 3, "all details preserved, in order");
  assert.deepEqual(e.fieldErrors, {
    expires_at: "Expiry must be a valid future timestamp",
    title: "Title is required and must be at most 200 characters",
  });
  assert.equal(errorMessages(e).length, 3);
});

test("maps each status the backend can return", () => {
  const server = (status, code, message) => getApiError(http(status, { error: { code, message }, meta }));
  const conflict = server(409, "CONFLICT", "This donation is no longer available to claim."); // claimDonation
  assert.equal(conflict.status, 409);
  assert.equal(conflict.message, "This donation is no longer available to claim.");
  assert.equal(conflict.isAuth, false);

  const badLogin = server(401, "UNAUTHENTICATED", "Invalid credentials"); // auth.service loginUser
  assert.equal(badLogin.message, "Invalid credentials", "server message wins over generic session copy");
  assert.equal(badLogin.isAuth, true);

  assert.equal(server(401, "INVALID_SESSION", "Session expired, revoked, or invalid.").isAuth, true);
  const inactive = server(403, "ACCOUNT_INACTIVE", "This account is not active. Contact an administrator."); // authenticate.js
  assert.equal(inactive.status, 403);
  assert.equal(inactive.isAuth, false);
  assert.equal(server(403, "FORBIDDEN", "NGO not found or not approved").message, "NGO not found or not approved");
  assert.equal(server(429, "RATE_LIMITED", "Too many requests").status, 429);
  const boom = server(500, "INTERNAL_ERROR", "An unexpected error occurred.");
  assert.equal(boom.requestId, "req-1", "request id surfaces so a failure can be traced");
});

test("falls back to safe copy when the body is not an API error envelope", () => {
  assert.equal(getApiError(http(502, "<html>Bad Gateway</html>")).message, "Something went wrong on our side. Try again in a moment.");
  assert.equal(getApiError(http(404, undefined)).message, "We couldn't find that.");
  assert.equal(getApiError(http(401, {})).isAuth, true);
  assert.equal(getApiError(http(418, { error: {} })).message, "Something went wrong. Try again.");
  // details in unexpected shapes never throw
  const odd = getApiError(http(400, { error: { code: "X", message: "m", details: ["plain string", 7, null, { message: "no field" }] } }));
  assert.deepEqual(odd.details, [
    { field: null, message: "plain string" },
    { field: null, message: "no field" },
  ]);
});

test("distinguishes network failure, timeout and programmer errors", () => {
  const net = getApiError({ isAxiosError: true, code: "ERR_NETWORK", request: {} });
  assert.equal(net.code, "NETWORK_ERROR");
  assert.equal(net.status, null);
  assert.equal(net.isNetwork, true);
  const slow = getApiError({ isAxiosError: true, code: "ECONNABORTED", request: {} });
  assert.equal(slow.code, "TIMEOUT");
  const bug = getApiError(new TypeError("x is undefined"));
  assert.equal(bug.code, "UNKNOWN");
  assert.equal(bug.message, "Something went wrong. Try again.", "internal error text is never shown to users");
  assert.equal(getApiError(undefined).code, "UNKNOWN");
});

test("does not mutate the error it is given", () => {
  const original = http(409, { error: { code: "CONFLICT", message: "m", details: [{ field: "a", message: "b" }] }, meta });
  const snapshot = JSON.stringify(original);
  getApiError(original);
  assert.equal(JSON.stringify(original), snapshot);
});
