import test from "node:test";
import assert from "node:assert/strict";
import {
  isValidEmail,
  isValidPassword,
  isValidQuantity,
  isValidExpiry,
  isValidPickupDeadline,
  isValidUuid,
  isNonEmptyText,
  isWithinLength,
  parseCoordinates,
  isValidPhone,
  isValidPincode,
  LIMITS,
} from "../../lib/validators.js";

test("email validation rejects malformed addresses", () => {
  assert.equal(isValidEmail("donor@example.org"), true);
  assert.equal(isValidEmail(" not-an-email"), false);
  assert.equal(isValidEmail("a@b"), false);
  assert.equal(isValidEmail("a@b.co"), true);
  assert.equal(isValidEmail("a".repeat(250) + "@b.co"), false);
});

test("password validation enforces minimum and bcrypt maximum", () => {
  assert.equal(isValidPassword("123456"), true);
  assert.equal(isValidPassword("12345"), false);
  assert.equal(isValidPassword("x".repeat(LIMITS.passwordMax)), true);
  assert.equal(isValidPassword("x".repeat(LIMITS.passwordMax + 1)), false);
  assert.equal(isValidPassword(null), false);
});

test("quantity accepts only positive bounded numbers", () => {
  assert.equal(isValidQuantity(1), true);
  assert.equal(isValidQuantity("12.5"), true);
  assert.equal(isValidQuantity(0), false);
  assert.equal(isValidQuantity(-5), false);
  assert.equal(isValidQuantity("abc"), false);
  assert.equal(isValidQuantity(LIMITS.quantityMax + 1), false);
});

test("expiry must be a future timestamp", () => {
  const past = new Date(Date.now() - 60_000).toISOString();
  const future = new Date(Date.now() + 60_000).toISOString();
  assert.equal(isValidExpiry(past), false);
  assert.equal(isValidExpiry(future), true);
  assert.equal(isValidExpiry("not-a-date"), false);
});

test("pickup deadline is in the future and no later than expiry", () => {
  const expiry = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  const before = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
  const after = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
  const past = new Date(Date.now() - 60_000).toISOString();

  assert.equal(isValidPickupDeadline(expiry, before), true);
  assert.equal(isValidPickupDeadline(expiry, expiry), true);
  assert.equal(isValidPickupDeadline(expiry, after), false);
  assert.equal(isValidPickupDeadline(expiry, past), false);
});

test("uuid validation distinguishes ids from malformed values", () => {
  assert.equal(isValidUuid("8a5c7c5e-8f1b-4f4e-9f3c-2d6b1a7e9c10"), true);
  assert.equal(isValidUuid("not-a-uuid"), false);
  assert.equal(isValidUuid("123"), false);
  assert.equal(isValidUuid(null), false);
});

test("text length helpers enforce boundaries", () => {
  assert.equal(isNonEmptyText("  ", 10), false);
  assert.equal(isNonEmptyText("ok", 10), true);
  assert.equal(isNonEmptyText("x".repeat(11), 10), false);
  assert.equal(isWithinLength(null, 10), true);
  assert.equal(isWithinLength("x".repeat(11), 10), false);
});

test("coordinates require a complete, in-range pair", () => {
  assert.deepEqual(parseCoordinates(undefined, undefined), {
    lat: null,
    lng: null,
    valid: true,
  });
  assert.equal(parseCoordinates(12.9, 77.5).valid, true);
  assert.equal(parseCoordinates(12.9, undefined).valid, false);
  assert.equal(parseCoordinates(91, 77.5).valid, false);
  assert.equal(parseCoordinates(12.9, 181).valid, false);
  assert.equal(parseCoordinates("abc", 77.5).valid, false);
});

test("phone validation enforces valid formats and length limits", () => {
  assert.equal(isValidPhone(null), true);
  assert.equal(isValidPhone(""), true);
  assert.equal(isValidPhone("+91 9876543210"), true);
  assert.equal(isValidPhone("98765-43210"), true);
  assert.equal(isValidPhone("(123) 456-7890"), true);
  assert.equal(isValidPhone("123"), false); // too short
  assert.equal(isValidPhone("phone-number!"), false);
  assert.equal(isValidPhone("1".repeat(35)), false); // exceeds LIMITS.phone
});

test("pincode validation enforces alphanumeric codes and limits", () => {
  assert.equal(isValidPincode(null), true);
  assert.equal(isValidPincode(""), true);
  assert.equal(isValidPincode("560001"), true);
  assert.equal(isValidPincode("SW1A 1AA"), true);
  assert.equal(isValidPincode("12"), false); // too short
  assert.equal(isValidPincode("!@#$%"), false);
  assert.equal(isValidPincode("1".repeat(25)), false); // exceeds LIMITS.pincode
});
