// Unit tests for src/lib/donation-form.ts. Run: npm test
import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { buildDonationPayload, EMPTY_DONATION_FORM, localInputToIso, validateDonation } from "../src/lib/donation-form.ts";

const NOW = Date.parse("2026-10-26T10:00:00.000Z");
const valid = { ...EMPTY_DONATION_FORM, title: "Vegetable biryani", food_category: "Cooked Meal", quantity: "40", pickup_address: "12 MG Road" };
const inHours = (h) => { const d = new Date(NOW + h * 3600e3); const p = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`; };

test("localInputToIso reads a zone-less datetime-local value as the donor's LOCAL time", () => {
  assert.equal(localInputToIso("2026-10-26T18:30"), new Date(2026, 9, 26, 18, 30).toISOString());
  assert.equal(localInputToIso("2026-10-26T18:30:15"), new Date(2026, 9, 26, 18, 30, 15).toISOString());
});

test("the instant is pinned to the donor's zone, whatever zone the server runs in", () => {
  const run = (tz) => execFileSync(process.execPath, ["--experimental-strip-types", "--no-warnings", "-e",
    `import("${new URL("../src/lib/donation-form.ts", import.meta.url).href}").then(m => console.log(m.localInputToIso("2026-10-26T18:30")))`], { env: { ...process.env, TZ: tz } }).toString().trim();
  assert.equal(run("Asia/Kolkata"), "2026-10-26T13:00:00.000Z", "18:30 IST is 13:00 UTC; sent raw, a UTC server would have stored 18:30Z (5.5 h late)");
  assert.equal(run("UTC"), "2026-10-26T18:30:00.000Z");
  assert.equal(run("America/New_York"), "2026-10-26T22:30:00.000Z");
});

test("localInputToIso rejects anything that is not a datetime-local value", () => {
  for (const bad of ["", "2026-10-26", "garbage", "2026-13-40T99:99", "2026-10-26T18:30Z", "26/10/2026 18:30"]) assert.equal(localInputToIso(bad), null, bad);
});

test("a complete, valid form has no errors", () => {
  assert.deepEqual(validateDonation({ ...valid, expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW), {});
});

test("validation mirrors the server's rules, field by field", () => {
  const e = validateDonation({ ...EMPTY_DONATION_FORM }, NOW);
  for (const f of ["title", "food_category", "quantity", "expires_at", "pickup_deadline", "pickup_address"]) assert.ok(e[f], `${f} required`);
  assert.equal(validateDonation({ ...valid, quantity: "0", expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).quantity !== undefined, true);
  assert.equal(validateDonation({ ...valid, quantity: "1000001", expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).quantity !== undefined, true);
  assert.equal(validateDonation({ ...valid, quantity: "abc", expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).quantity !== undefined, true);
  assert.ok(validateDonation({ ...valid, title: "x".repeat(201), expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).title);
  assert.ok(validateDonation({ ...valid, pickup_address: "x".repeat(501), expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).pickup_address);
  assert.ok(validateDonation({ ...valid, description: "x".repeat(2001), expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).description);
  assert.ok(validateDonation({ ...valid, food_category: "Cooked Meals", expires_at: inHours(6), pickup_deadline: inHours(3) }, NOW).food_category, "category must be one of the server's 8");
});

test("time rules: expiry in the future; pickup in the future and no later than expiry", () => {
  const past = validateDonation({ ...valid, expires_at: inHours(-1), pickup_deadline: inHours(-2) }, NOW);
  assert.match(past.expires_at, /already passed/);
  assert.match(past.pickup_deadline, /already passed/);
  const late = validateDonation({ ...valid, expires_at: inHours(2), pickup_deadline: inHours(3) }, NOW);
  assert.equal(late.expires_at, undefined);
  assert.match(late.pickup_deadline, /no later than the expiry/);
  assert.equal(validateDonation({ ...valid, expires_at: inHours(3), pickup_deadline: inHours(3) }, NOW).pickup_deadline, undefined, "equal is allowed (server uses >)");
});

test("payload: absolute instants, trimmed text, optional fields omitted, coordinates only when known", () => {
  const form = { ...valid, title: "  Vegetable biryani ", expires_at: inHours(6), pickup_deadline: inHours(3), prepared_at: inHours(-1) };
  const p = buildDonationPayload(form, null);
  assert.equal(p.title, "Vegetable biryani");
  for (const k of ["expires_at", "pickup_deadline", "prepared_at"]) assert.match(p[k], /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, `${k} must be an absolute ISO instant`);
  assert.equal(p.description, undefined);
  assert.equal(p.pincode, undefined);
  assert.equal(p.latitude, undefined);
  assert.equal(p.quantity, 40);
  const withGeo = buildDonationPayload({ ...form, pincode: "516001" }, { lat: 14.47, lng: 78.82 });
  assert.equal(withGeo.latitude, 14.47);
  assert.equal(withGeo.longitude, 78.82);
  assert.equal(withGeo.pincode, "516001");
});

// ── format helpers used across the migrated pages ─────────────────────────────────────────────
import { deadlineInfo, formatAgo, formatLocation, formatQuantity, formatUnitTotals } from "../src/lib/format.ts";

test("format: quantities use the right singular/plural and never sum across units", () => {
  assert.equal(formatQuantity(1, "servings"), "1 serving");
  assert.equal(formatQuantity(40, "servings"), "40 servings");
  assert.equal(formatQuantity(1, "boxes"), "1 box");
  assert.equal(formatQuantity(12, "kg"), "12 kg");
  assert.equal(formatUnitTotals({ servings: 40, kg: 12, liters: 0 }), "40 servings · 12 kg");
  assert.equal(formatUnitTotals({}), "None yet");
  assert.equal(formatUnitTotals(null), "None yet");
});

test("format: deadlines are relative to the minute and flag urgency", () => {
  const now = Date.parse("2026-10-26T10:00:00Z");
  const at = (m) => new Date(now + m * 60_000).toISOString();
  assert.deepEqual(deadlineInfo(at(40), now), { label: "in 40 min", urgency: "urgent" });
  assert.deepEqual(deadlineInfo(at(140), now), { label: "in 2 h 20 min", urgency: "soon" });
  assert.deepEqual(deadlineInfo(at(600), now), { label: "in 10 h", urgency: "ok" });
  assert.deepEqual(deadlineInfo(at(-25), now), { label: "passed 25 min ago", urgency: "passed" });
  assert.equal(deadlineInfo(null, now), null);
  assert.equal(deadlineInfo("not a date", now), null);
});

test("format: location never renders 'undefined' and has a fallback", () => {
  assert.equal(formatLocation({ pickup_address: "12 MG Road", area: "Kadapa", state: "Andhra Pradesh", pincode: "516001" }), "12 MG Road, Kadapa, Andhra Pradesh (516001)");
  assert.equal(formatLocation({ pickup_address: "12 MG Road", area: null, state: null, pincode: null }), "12 MG Road");
  assert.equal(formatLocation({}), "Location not specified");
});

test("format: formatAgo", () => {
  const now = Date.parse("2026-10-26T10:00:00Z");
  const ago = (m) => new Date(now - m * 60_000).toISOString();
  assert.equal(formatAgo(ago(0), now), "Just now");
  assert.equal(formatAgo(ago(5), now), "5 min ago");
  assert.equal(formatAgo(ago(180), now), "3 h ago");
  assert.equal(formatAgo(ago(3 * 24 * 60), now), "3 d ago");
  assert.equal(formatAgo(undefined, now), "—");
});

// ── auth form validation mirrors backend/lib/validators.js ────────────────────────────────────
import { validateLogin, validateProfile, validateSignup } from "../src/lib/auth-form.ts";

test("auth: login requires a well-formed email and a password", () => {
  assert.deepEqual(validateLogin({ email: "ravi@example.org", password: "x" }), {});
  assert.ok(validateLogin({ email: "", password: "x" }).email);
  assert.ok(validateLogin({ email: "no-at-sign", password: "x" }).email);
  assert.ok(validateLogin({ email: "a@b.c", password: "x" }).email, "server needs a 2+ letter TLD");
  assert.ok(validateLogin({ email: "ravi@example.org", password: "" }).password);
});

test("auth: signup rules match the server (name, email, password 6–72, limits)", () => {
  const ok = { name: "Ravi", organization: "", email: "ravi@example.org", phonenumber: "9000000002", password: "secret1", pincode: "", area: "", state: "", country: "India" };
  assert.deepEqual(validateSignup(ok), {});
  assert.ok(validateSignup({ ...ok, name: "  " }).name);
  assert.ok(validateSignup({ ...ok, name: "x".repeat(151) }).name);
  assert.ok(validateSignup({ ...ok, password: "12345" }).password);
  assert.equal(validateSignup({ ...ok, password: "123456" }).password, undefined);
  assert.equal(validateSignup({ ...ok, password: "x".repeat(72) }).password, undefined);
  assert.ok(validateSignup({ ...ok, password: "x".repeat(73) }).password);
  assert.ok(validateSignup({ ...ok, phonenumber: "" }).phonenumber);
  assert.ok(validateSignup({ ...ok, phonenumber: "1".repeat(31) }).phonenumber);
  assert.ok(validateSignup({ ...ok, organization: "x".repeat(201) }).organization);
});

test("auth: profile validation exists because PATCH /auth/me validates nothing server-side", () => {
  const ok = { name: "Ravi", organization: "", phonenumber: "", area: "", pincode: "", state: "", country: "India" };
  assert.deepEqual(validateProfile(ok), {});
  assert.ok(validateProfile({ ...ok, name: "" }).name, "a blank name must not be savable");
  assert.ok(validateProfile({ ...ok, pincode: "1".repeat(21) }).pincode);
});
