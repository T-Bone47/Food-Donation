import test from "node:test";
import assert from "node:assert/strict";
import {
  canTransition,
  normalizeDonationStatus,
  transitionErrorMessage,
  DONATION_STATUSES,
  TERMINAL_STATUSES,
} from "../../lib/lifecycle.js";

test("the canonical happy path is allowed", () => {
  assert.equal(canTransition("AVAILABLE", "ASSIGNED"), true);
  assert.equal(canTransition("ASSIGNED", "PICKED_UP"), true);
  assert.equal(canTransition("PICKED_UP", "DELIVERED"), true);
  assert.equal(canTransition("DELIVERED", "COMPLETED"), true);
});

test("cancellation is allowed only before pickup", () => {
  assert.equal(canTransition("AVAILABLE", "CANCELLED"), true);
  assert.equal(canTransition("ASSIGNED", "CANCELLED"), true);
  assert.equal(canTransition("PICKED_UP", "CANCELLED"), false);
  assert.equal(canTransition("DELIVERED", "CANCELLED"), false);
});

test("out-of-order and self transitions are rejected", () => {
  assert.equal(canTransition("AVAILABLE", "PICKED_UP"), false);
  assert.equal(canTransition("AVAILABLE", "DELIVERED"), false);
  assert.equal(canTransition("ASSIGNED", "COMPLETED"), false);
  assert.equal(canTransition("PICKED_UP", "COMPLETED"), false);
  assert.equal(canTransition("DELIVERED", "ASSIGNED"), false);
  assert.equal(canTransition("AVAILABLE", "AVAILABLE"), false);
});

test("terminal states cannot transition anywhere", () => {
  for (const terminal of TERMINAL_STATUSES) {
    for (const next of DONATION_STATUSES) {
      assert.equal(
        canTransition(terminal, next),
        false,
        `${terminal} -> ${next} must be rejected`
      );
    }
    assert.match(
      transitionErrorMessage(terminal, "COMPLETED"),
      /terminal status/
    );
  }
});

test("status input is normalized case-insensitively", () => {
  assert.equal(normalizeDonationStatus("available"), "AVAILABLE");
  assert.equal(normalizeDonationStatus("Delivered"), "DELIVERED");
  assert.equal(normalizeDonationStatus("nonsense"), null);
  assert.equal(normalizeDonationStatus(null), null);
});

test("expired is only reachable from available", () => {
  assert.equal(canTransition("AVAILABLE", "EXPIRED"), true);
  assert.equal(canTransition("ASSIGNED", "EXPIRED"), false);
  assert.equal(canTransition("PICKED_UP", "EXPIRED"), false);
});
