import test from "node:test";
import assert from "node:assert/strict";
import * as demoService from "../../services/demo.service.js";
import { verifySessionToken } from "../../lib/token.js";

test("Demo Identities — all four platform roles exist with valid structures", () => {
  const roles = ["donor", "volunteer", "ngo", "admin"];
  for (const role of roles) {
    const user = demoService.getDemoUserByRole(role);
    assert.ok(user, `User for role ${role} must exist`);
    assert.ok(user.id.startsWith("d0000000-"), "ID must be a demo UUID");
    assert.ok(user.email.includes("@foodshare.local"), "Email must be a demo domain");
    assert.equal(user.account_status, "active");
    assert.equal(user.is_demo, true);
    assert.ok(demoService.isDemoUserId(user.id), "isDemoUserId must return true");
  }

  assert.equal(demoService.isDemoUserId("00000000-0000-0000-0000-000000000000"), false);
  assert.equal(demoService.isDemoUserId(null), false);
});

test("Demo Authentication — issues valid cryptographically signed session tokens", () => {
  for (const role of ["donor", "volunteer", "ngo", "admin"]) {
    const { user, token, isDemo } = demoService.authenticateDemoRole(role);
    assert.equal(isDemo, true);
    assert.ok(token && typeof token === "string");
    assert.equal(user.role.toLowerCase(), role);

    const verified = verifySessionToken(token);
    assert.ok(verified, "Token must be validly signed");
    assert.equal(verified.userId, user.id);
    assert.equal(verified.isDemo, true);
    assert.equal(verified.role, user.role);
  }

  assert.throws(
    () => demoService.authenticateDemoRole("superadmin"),
    /Invalid demo role/
  );
});

test("Demo Lifecycle Scenario — full cycle from creation to NGO receipt", () => {
  // Ensure pristine initial state
  demoService.resetDemoState();

  const donor = demoService.DEMO_USERS.donor;
  const volunteer = demoService.DEMO_USERS.volunteer;
  const ngo = demoService.DEMO_USERS.ngo;

  // 1. Donor creates new donation
  const now = new Date();
  const futureExp = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const futurePickup = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

  const newDonation = demoService.createDemoDonation(donor.id, {
    title: "Test Cooked Rice & Curry",
    description: "Hot meals in foil trays",
    food_category: "Cooked Meals",
    quantity: 30,
    unit: "meals",
    expires_at: futureExp,
    pickup_deadline: futurePickup,
    pickup_address: "Brigade Road, Bengaluru",
  });

  assert.equal(newDonation.status, "AVAILABLE");
  assert.equal(newDonation.donor_id, donor.id);

  // 2. Volunteer claims the donation
  const { donation: claimed, assignment } = demoService.claimDemoDonation(newDonation.id, volunteer.id);
  assert.equal(claimed.status, "ASSIGNED");
  assert.ok(assignment);
  assert.equal(assignment.volunteer_id, volunteer.id);
  assert.equal(assignment.assignment_status, "active");

  // Cannot claim again
  assert.throws(() => {
    demoService.claimDemoDonation(newDonation.id, volunteer.id);
  }, /no longer available/);

  // 3. Volunteer picks up donation
  const pickedUp = demoService.pickupDemoDonation(newDonation.id, volunteer.id);
  assert.equal(pickedUp.status, "PICKED_UP");

  // 4. Volunteer delivers donation to NGO
  const delivered = demoService.deliverDemoDonation(newDonation.id, volunteer.id, ngo.id);
  assert.equal(delivered.status, "DELIVERED");
  assert.equal(delivered.recipient_ngo_id, ngo.id);

  // 5. NGO confirms receipt
  const completed = demoService.confirmDemoReceipt(newDonation.id, ngo.id);
  assert.equal(completed.status, "COMPLETED");

  const detailed = demoService.getDemoDonationById(newDonation.id);
  assert.equal(detailed.status, "COMPLETED");
  assert.ok(detailed.delivery_confirmation, "Delivery confirmation must be linked");
});

test("Demo Reset — reverts state idempotently without side-effects", () => {
  demoService.resetDemoState();
  const initialCount = demoService.getDemoDonations().length;
  assert.equal(initialCount, 5);

  const donor = demoService.DEMO_USERS.donor;
  const now = new Date();
  const futureExp = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const futurePickup = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();

  demoService.createDemoDonation(donor.id, {
    title: "Temporary Donation",
    food_category: "Bakery",
    quantity: 10,
    unit: "kg",
    expires_at: futureExp,
    pickup_deadline: futurePickup,
    pickup_address: "Test Address",
  });

  const mutatedCount = demoService.getDemoDonations().length;
  assert.equal(mutatedCount, 6);

  // Reset
  const summary = demoService.resetDemoState();
  assert.equal(summary.donations, 5);
  assert.equal(demoService.getDemoDonations().length, 5);
});
