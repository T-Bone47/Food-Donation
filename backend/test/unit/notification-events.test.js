import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_EVENTS,
  isValidEventType,
} from "../../services/notification.service.js";

test("every declared notification event value is accepted", () => {
  for (const [name, value] of Object.entries(NOTIFICATION_EVENTS)) {
    assert.equal(
      isValidEventType(value),
      true,
      `${name} (${value}) should be a valid event type`
    );
  }
});

test("custom events are accepted and unknown values are rejected", () => {
  assert.equal(isValidEventType("custom.admin_note"), true);
  assert.equal(isValidEventType("donation.not_a_real_event"), false);
  assert.equal(isValidEventType(""), false);
  assert.equal(isValidEventType(null), false);
});
