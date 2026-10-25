import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import {
  api,
  startTestServer,
  stopTestServer,
  createUserFixture,
  loginAs,
  createAndLogin,
  makeApprovedNgo,
  createDonationFixture,
  buildDonationPayload,
  signTestToken,
  getNotifications,
  supabase,
} from "../support/helpers.js";

let donorA;
let donorB;
let volunteerA;
let volunteerB;
let volunteerC;
let ngoApproved;
let ngoOther;
let admin;

let createdDonationId;
let claimedDonationId;
let claimWinner;
let claimLoser;

before(async () => {
  await startTestServer();

  donorA = await createAndLogin({ role: "Donor", name: "Donor A" });
  donorB = await createAndLogin({ role: "Donor", name: "Donor B" });
  volunteerA = await createAndLogin({ role: "Volunteer", name: "Volunteer A" });
  volunteerB = await createAndLogin({ role: "Volunteer", name: "Volunteer B" });
  volunteerC = await createAndLogin({ role: "Volunteer", name: "Volunteer C" });
  ngoApproved = await makeApprovedNgo("Approved Test NGO");
  ngoOther = await makeApprovedNgo("Other Test NGO");
  admin = await createAndLogin({ role: "Admin", name: "Admin User" });
});

after(async () => {
  await stopTestServer();
});

test("health endpoint reports a working database", async () => {
  const res = await api("/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "healthy");
  assert.equal(res.body.checks.database, "ok");
});

test("registration, login, logout, and malformed auth input", async () => {
  const email = `signup.${Date.now()}@example.test`;

  const missing = await api("/auth/signup", {
    method: "POST",
    body: { email },
  });
  assert.equal(missing.status, 400);
  assert.equal(missing.body.error.code, "VALIDATION_ERROR");

  const invalidRole = await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Bad Role",
      email: `badrole.${Date.now()}@example.test`,
      password: "Password123!",
      role: "Admin",
    },
  });
  assert.equal(invalidRole.status, 400);

  const shortPassword = await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Short Password",
      email: `short.${Date.now()}@example.test`,
      password: "12345",
      role: "Donor",
    },
  });
  assert.equal(shortPassword.status, 400);

  const longPassword = await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Long Password",
      email: `long.${Date.now()}@example.test`,
      password: "x".repeat(73),
      role: "Donor",
    },
  });
  assert.equal(longPassword.status, 400);

  const valid = await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Signup Test",
      email,
      password: "Password123!",
      role: "Donor",
      area: "Test Area",
      pincode: "560001",
      state: "Karnataka",
    },
  });
  assert.equal(valid.status, 201);
  assert.ok(valid.body.data.token);
  assert.equal(valid.body.data.user.email, email);
  assert.equal(valid.body.data.user.password_hash, undefined);
  assert.equal(valid.body.data.user.passwordHash, undefined);

  const duplicate = await api("/auth/signup", {
    method: "POST",
    body: {
      name: "Signup Test",
      email,
      password: "Password123!",
      role: "Donor",
    },
  });
  assert.equal(duplicate.status, 409);

  const wrongPassword = await api("/auth/login", {
    method: "POST",
    body: { email, password: "WrongPassword123!" },
  });
  assert.equal(wrongPassword.status, 401);
  assert.equal(wrongPassword.body.error.message, "Invalid credentials");

  const unknownUser = await api("/auth/login", {
    method: "POST",
    body: { email: "nobody@example.test", password: "Password123!" },
  });
  assert.equal(unknownUser.status, 401);
  assert.equal(unknownUser.body.error.message, "Invalid credentials");

  const login = await api("/auth/login", {
    method: "POST",
    body: { email, password: "Password123!" },
  });
  assert.equal(login.status, 200);
  const token = login.body.data.token;

  const me = await api("/auth/me", { token });
  assert.equal(me.status, 200);
  assert.equal(me.body.data.user.email, email);

  const logout = await api("/auth/logout", { method: "POST", token });
  assert.equal(logout.status, 200);

  const afterLogout = await api("/auth/me", { token });
  assert.equal(afterLogout.status, 401);

  const malformedJson = await fetch(
    `${(await startTestServer()).replace("/api/v1", "")}/api/v1/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{not-json",
    }
  );
  assert.equal(malformedJson.status, 400);
});

test("missing, invalid, expired, forged, and deleted-user tokens are rejected", async () => {
  const noToken = await api("/auth/me");
  assert.equal(noToken.status, 401);

  const badToken = await api("/auth/me", { token: "garbage.token" });
  assert.equal(badToken.status, 401);

  const expired = signTestToken(
    { userId: donorA.user.id, email: donorA.user.email, role: "Donor" },
    { expiresInSeconds: -60 }
  );
  const expiredRes = await api("/auth/me", { token: expired });
  assert.equal(expiredRes.status, 401);

  const deletedUserToken = signTestToken(
    {
      userId: "11111111-1111-4111-8111-111111111111",
      email: "ghost@example.test",
      role: "Donor",
    },
    { expiresInSeconds: 3600 }
  );
  const deletedRes = await api("/auth/me", { token: deletedUserToken });
  assert.equal(deletedRes.status, 401);

  // A correctly signed token claiming Admin must not be trusted; the role is
  // re-read from the database on every authenticated request.
  const forgedRole = signTestToken(
    { userId: donorA.user.id, email: donorA.user.email, role: "Admin" },
    { expiresInSeconds: 3600 }
  );
  const forgedRes = await api("/admin/users", { token: forgedRole });
  assert.equal(forgedRes.status, 403);
});

test("role-based access control blocks cross-role operations", async () => {
  const donorToAvailable = await api("/donations/available", {
    token: donorA.token,
  });
  assert.equal(donorToAvailable.status, 403);

  const volunteerToCreate = await api("/donations", {
    method: "POST",
    token: volunteerA.token,
    body: buildDonationPayload(),
  });
  assert.equal(volunteerToCreate.status, 403);

  const donorToAdmin = await api("/admin/users", { token: donorA.token });
  assert.equal(donorToAdmin.status, 403);

  const volunteerToAdmin = await api("/admin/users", {
    token: volunteerA.token,
  });
  assert.equal(volunteerToAdmin.status, 403);

  const ngoToAdmin = await api("/admin/users", { token: ngoApproved.token });
  assert.equal(ngoToAdmin.status, 403);

  const adminUsers = await api("/admin/users", { token: admin.token });
  assert.equal(adminUsers.status, 200);
  assert.ok(Array.isArray(adminUsers.body.data.users));
});

test("profile updates only allow safe fields for the authenticated user", async () => {
  const original = await api("/auth/me", { token: donorA.token });
  const originalEmail = original.body.data.user.email;
  const originalRole = original.body.data.user.role;

  const update = await api("/auth/me", {
    method: "PATCH",
    token: donorA.token,
    body: {
      name: "Donor A Updated",
      area: "Updated Area",
      email: "attacker@example.test",
      role: "Admin",
      account_status: "suspended",
    },
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.user.name, "Donor A Updated");
  assert.equal(update.body.data.user.email, originalEmail);
  assert.equal(update.body.data.user.role, originalRole);

  const persisted = await api("/auth/me", { token: donorA.token });
  assert.equal(persisted.body.data.user.area, "Updated Area");
  assert.equal(persisted.body.data.user.email, originalEmail);

  const empty = await api("/auth/me", {
    method: "PATCH",
    token: donorA.token,
    body: {},
  });
  assert.equal(empty.status, 400);

  const tooLong = await api("/auth/me", {
    method: "PATCH",
    token: donorA.token,
    body: { name: "x".repeat(151) },
  });
  assert.equal(tooLong.status, 400);

  await api("/auth/me", {
    method: "PATCH",
    token: donorA.token,
    body: { name: "Donor A" },
  });
});

test("donation creation validates input, persists location, and enforces ownership", async () => {
  const invalidCases = [
    { name: "missing title", body: { ...buildDonationPayload(), title: "" } },
    { name: "zero quantity", body: { ...buildDonationPayload(), quantity: 0 } },
    {
      name: "negative quantity",
      body: { ...buildDonationPayload(), quantity: -3 },
    },
    {
      name: "past expiry",
      body: {
        ...buildDonationPayload(),
        expires_at: new Date(Date.now() - 60_000).toISOString(),
        pickup_deadline: new Date(Date.now() - 120_000).toISOString(),
      },
    },
    {
      name: "pickup after expiry",
      body: {
        ...buildDonationPayload(),
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        pickup_deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      },
    },
    {
      name: "invalid coordinates",
      body: { ...buildDonationPayload(), latitude: 95, longitude: 77 },
    },
    {
      name: "unknown category",
      body: { ...buildDonationPayload(), food_category: "Rocks" },
    },
    {
      name: "overlong title",
      body: { ...buildDonationPayload(), title: "x".repeat(201) },
    },
  ];

  for (const item of invalidCases) {
    const res = await api("/donations", {
      method: "POST",
      token: donorA.token,
      body: item.body,
    });
    assert.equal(res.status, 400, `${item.name} should be rejected`);
  }

  const validBody = buildDonationPayload();
  const created = await api("/donations", {
    method: "POST",
    token: donorA.token,
    body: validBody,
  });
  assert.equal(created.status, 201);
  const donation = created.body.data.donation;
  createdDonationId = donation.id;

  assert.equal(donation.status, "AVAILABLE");
  assert.equal(donation.donor_id, donorA.user.id);
  assert.equal(donation.area, "Test Area");
  assert.equal(donation.pincode, "560001");
  assert.equal(donation.state, "Karnataka");

  const row = await supabase
    .from("donations")
    .select("*")
    .eq("id", donation.id)
    .single();
  assert.equal(row.error, null);
  assert.equal(row.data.donor_id, donorA.user.id);
  assert.equal(row.data.title, validBody.title);

  const mine = await api("/donations/mine", { token: donorA.token });
  assert.equal(mine.status, 200);
  assert.ok(mine.body.data.donations.some((d) => d.id === donation.id));

  const available = await api("/donations/available", {
    token: volunteerA.token,
  });
  assert.equal(available.status, 200);
  assert.ok(available.body.data.donations.some((d) => d.id === donation.id));

  const otherDonor = await api(`/donations/${donation.id}`, {
    token: donorB.token,
  });
  assert.equal(otherDonor.status, 403);

  const unassignedVolunteer = await api(`/donations/${donation.id}`, {
    token: volunteerC.token,
  });
  assert.equal(unassignedVolunteer.status, 403);

  const unrelatedNgo = await api(`/donations/${donation.id}`, {
    token: ngoApproved.token,
  });
  assert.equal(unrelatedNgo.status, 403);

  const owner = await api(`/donations/${donation.id}`, {
    token: donorA.token,
  });
  assert.equal(owner.status, 200);

  const otherDonorUpdate = await api(`/donations/${donation.id}`, {
    method: "PATCH",
    token: donorB.token,
    body: { title: "Hijacked" },
  });
  assert.equal(otherDonorUpdate.status, 403);

  // Status and donor_id supplied by a client must be ignored.
  const spoofed = await api("/donations", {
    method: "POST",
    token: donorA.token,
    body: {
      ...buildDonationPayload({ title: "Spoof Attempt" }),
      status: "COMPLETED",
      donor_id: donorB.user.id,
    },
  });
  assert.equal(spoofed.status, 201);
  assert.equal(spoofed.body.data.donation.status, "AVAILABLE");
  assert.equal(spoofed.body.data.donation.donor_id, donorA.user.id);

  const update = await api(`/donations/${donation.id}`, {
    method: "PATCH",
    token: donorA.token,
    body: { title: "Updated API Meal", quantity: 30, status: "COMPLETED" },
  });
  assert.equal(update.status, 200);
  assert.equal(update.body.data.donation.title, "Updated API Meal");
  assert.equal(update.body.data.donation.quantity, 30);
  assert.equal(update.body.data.donation.status, "AVAILABLE");

  // The volunteer notification for the created listing is persisted.
  const volunteerNotifications = await getNotifications(volunteerA.token);
  assert.ok(
    volunteerNotifications.some(
      (n) =>
        n.event_type === "donation.created" &&
        n.data?.donationId === donation.id
    )
  );
});

test("donation cancellation is owner-only, terminal, and notifies the assigned volunteer", async () => {
  const donation = await createDonationFixture(donorA.user.id, {
    title: "Cancellation Test",
  });

  const claimed = await api(`/donations/${donation.id}/claim`, {
    method: "POST",
    token: volunteerC.token,
  });
  assert.equal(claimed.status, 201);

  const otherDonorCancel = await api(`/donations/${donation.id}/cancel`, {
    method: "POST",
    token: donorB.token,
  });
  assert.equal(otherDonorCancel.status, 403);

  const cancel = await api(`/donations/${donation.id}/cancel`, {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(cancel.status, 200);
  assert.equal(cancel.body.data.donation.status, "CANCELLED");

  const cancelAgain = await api(`/donations/${donation.id}/cancel`, {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(cancelAgain.status, 409);

  const updateAfterCancel = await api(`/donations/${donation.id}`, {
    method: "PATCH",
    token: donorA.token,
    body: { title: "Should Not Change" },
  });
  assert.equal(updateAfterCancel.status, 409);

  const volunteerNotifications = await getNotifications(volunteerC.token);
  assert.ok(
    volunteerNotifications.some(
      (n) =>
        n.event_type === "donation.cancelled" &&
        n.data?.donationId === donation.id
    )
  );

  const assignment = await supabase
    .from("assignments")
    .select("*")
    .eq("donation_id", donation.id)
    .single();
  assert.equal(assignment.data.assignment_status, "cancelled");

  await api(`/donations/${createdDonationId}/cancel`, {
    method: "POST",
    token: donorA.token,
  });
});

test("two volunteers claiming one donation concurrently produce exactly one assignment", async () => {
  const donation = await createDonationFixture(donorA.user.id, {
    title: "Concurrency Test",
  });
  claimedDonationId = donation.id;

  const [first, second] = await Promise.all([
    api(`/donations/${donation.id}/claim`, {
      method: "POST",
      token: volunteerA.token,
    }),
    api(`/donations/${donation.id}/claim`, {
      method: "POST",
      token: volunteerB.token,
    }),
  ]);

  const statuses = [first.status, second.status].sort();
  assert.deepEqual(statuses, [201, 409]);

  const winnerResponse = first.status === 201 ? first : second;
  claimWinner = first.status === 201 ? volunteerA : volunteerB;
  claimLoser = first.status === 201 ? volunteerB : volunteerA;

  assert.equal(winnerResponse.body.data.donation.status, "ASSIGNED");
  assert.equal(
    winnerResponse.body.data.assignment.volunteer_id,
    claimWinner.user.id
  );

  const assignments = await supabase
    .from("assignments")
    .select("*")
    .eq("donation_id", donation.id)
    .eq("assignment_status", "active");
  assert.equal(assignments.error, null);
  assert.equal(assignments.data.length, 1);
  assert.equal(assignments.data[0].volunteer_id, claimWinner.user.id);

  const donationRow = await supabase
    .from("donations")
    .select("status")
    .eq("id", donation.id)
    .single();
  assert.equal(donationRow.data.status, "ASSIGNED");

  const loserClaimAgain = await api(`/donations/${donation.id}/claim`, {
    method: "POST",
    token: claimLoser.token,
  });
  assert.equal(loserClaimAgain.status, 409);

  const donorNotifications = await getNotifications(donorA.token);
  assert.ok(
    donorNotifications.some(
      (n) =>
        n.event_type === "donation.claimed" &&
        n.data?.donationId === donation.id
    )
  );
});

test("pickup, delivery, NGO receipt, terminal states, and notifications form one consistent journey", async () => {
  const donorId = donorA.user.id;

  const loserPickup = await api(`/donations/${claimedDonationId}/pickup`, {
    method: "POST",
    token: claimLoser.token,
  });
  assert.equal(loserPickup.status, 403);

  const donorPickup = await api(`/donations/${claimedDonationId}/pickup`, {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(donorPickup.status, 403);

  const pickup = await api(`/donations/${claimedDonationId}/pickup`, {
    method: "POST",
    token: claimWinner.token,
  });
  assert.equal(pickup.status, 200);
  assert.equal(pickup.body.data.donation.status, "PICKED_UP");

  const duplicatePickup = await api(
    `/donations/${claimedDonationId}/pickup`,
    { method: "POST", token: claimWinner.token }
  );
  assert.equal(duplicatePickup.status, 409);

  const deliverWithoutNgo = await api(
    `/donations/${claimedDonationId}/deliver`,
    { method: "POST", token: claimWinner.token, body: {} }
  );
  assert.equal(deliverWithoutNgo.status, 400);

  const unapprovedNgo = await createUserFixture({ role: "NGO" });
  const deliverToUnapproved = await api(
    `/donations/${claimedDonationId}/deliver`,
    {
      method: "POST",
      token: claimWinner.token,
      body: { ngo_id: unapprovedNgo.id },
    }
  );
  assert.equal(deliverToUnapproved.status, 400);

  const deliver = await api(`/donations/${claimedDonationId}/deliver`, {
    method: "POST",
    token: claimWinner.token,
    body: { ngo_id: ngoApproved.user.id },
  });
  assert.equal(deliver.status, 200);
  assert.equal(deliver.body.data.donation.status, "DELIVERED");
  assert.equal(
    deliver.body.data.donation.recipient_ngo_id,
    ngoApproved.user.id
  );

  const incomingOther = await api("/ngos/incoming", {
    token: ngoOther.token,
  });
  assert.equal(incomingOther.status, 200);
  assert.ok(
    !incomingOther.body.data.deliveries.some(
      (d) => d.id === claimedDonationId
    )
  );

  const incomingRecipient = await api("/ngos/incoming", {
    token: ngoApproved.token,
  });
  assert.equal(incomingRecipient.status, 200);
  assert.ok(
    incomingRecipient.body.data.deliveries.some(
      (d) => d.id === claimedDonationId
    )
  );

  const otherNgoConfirm = await api(
    `/donations/${claimedDonationId}/confirm-receipt`,
    { method: "POST", token: ngoOther.token }
  );
  assert.equal(otherNgoConfirm.status, 403);

  const donorConfirm = await api(
    `/donations/${claimedDonationId}/confirm-receipt`,
    { method: "POST", token: donorA.token }
  );
  assert.equal(donorConfirm.status, 403);

  const confirm = await api(
    `/donations/${claimedDonationId}/confirm-receipt`,
    { method: "POST", token: ngoApproved.token }
  );
  assert.equal(confirm.status, 200);
  assert.equal(confirm.body.data.donation.status, "COMPLETED");

  const duplicateConfirm = await api(
    `/donations/${claimedDonationId}/confirm-receipt`,
    { method: "POST", token: ngoApproved.token }
  );
  assert.equal(duplicateConfirm.status, 409);

  const cancelCompleted = await api(`/donations/${claimedDonationId}/cancel`, {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(cancelCompleted.status, 409);

  const expireCompleted = await api(
    `/admin/donations/${claimedDonationId}/expire`,
    { method: "POST", token: admin.token }
  );
  assert.equal(expireCompleted.status, 409);

  const assignment = await supabase
    .from("assignments")
    .select("*")
    .eq("donation_id", claimedDonationId)
    .single();
  assert.equal(assignment.data.assignment_status, "completed");
  assert.ok(assignment.data.picked_up_at);
  assert.ok(assignment.data.delivered_at);

  const confirmations = await supabase
    .from("delivery_confirmations")
    .select("*")
    .eq("donation_id", claimedDonationId);
  assert.equal(confirmations.data.length, 1);
  assert.equal(confirmations.data[0].confirmed_by, ngoApproved.user.id);

  const donationRow = await supabase
    .from("donations")
    .select("*")
    .eq("id", claimedDonationId)
    .single();
  assert.equal(donationRow.data.status, "COMPLETED");
  assert.equal(donationRow.data.donor_id, donorId);

  const recipientView = await api(`/donations/${claimedDonationId}`, {
    token: ngoApproved.token,
  });
  assert.equal(recipientView.status, 200);

  const otherNgoView = await api(`/donations/${claimedDonationId}`, {
    token: ngoOther.token,
  });
  assert.equal(otherNgoView.status, 403);

  const volunteerView = await api(`/donations/${claimedDonationId}`, {
    token: claimWinner.token,
  });
  assert.equal(volunteerView.status, 200);

  const donorNotifications = await getNotifications(donorA.token);
  for (const event of [
    "donation.claimed",
    "donation.pickup_recorded",
    "donation.delivered",
    "donation.completed",
  ]) {
    assert.ok(
      donorNotifications.some(
        (n) =>
          n.event_type === event &&
          n.data?.donationId === claimedDonationId
      ),
      `donor should have ${event}`
    );
  }

  const volunteerNotifications = await getNotifications(claimWinner.token);
  assert.ok(
    volunteerNotifications.some(
      (n) =>
        n.event_type === "donation.completed" &&
        n.data?.donationId === claimedDonationId
    )
  );

  const ngoNotifications = await getNotifications(ngoApproved.token);
  assert.ok(
    ngoNotifications.some(
      (n) =>
        n.event_type === "donation.delivered" &&
        n.data?.donationId === claimedDonationId
    )
  );

  const otherNgoNotifications = await getNotifications(ngoOther.token);
  assert.ok(
    !otherNgoNotifications.some(
      (n) =>
        n.event_type === "donation.delivered" &&
        n.data?.donationId === claimedDonationId
    )
  );

  const history = await api("/ngos/history", { token: ngoApproved.token });
  assert.equal(history.status, 200);
  assert.ok(history.body.data.history.some((d) => d.id === claimedDonationId));
});

test("impact metrics are derived from COMPLETED donations only", async () => {
  const dbCompleted = await supabase
    .from("donations")
    .select("id, quantity")
    .eq("donor_id", donorA.user.id)
    .eq("status", "COMPLETED");

  const expectedCount = dbCompleted.data.length;
  const expectedQuantity = dbCompleted.data.reduce(
    (sum, d) => sum + Number(d.quantity),
    0
  );

  const donorStats = await api("/impact/donor", { token: donorA.token });
  assert.equal(donorStats.status, 200);
  assert.equal(donorStats.body.data.stats.completedDonations, expectedCount);
  assert.equal(donorStats.body.data.stats.completedQuantity, expectedQuantity);

  const donorImpact = await api("/impact/me", { token: donorA.token });
  assert.equal(donorImpact.status, 200);
  assert.equal(
    donorImpact.body.data.impact.totalCompletedDonations,
    expectedCount
  );

  const volunteerImpact = await api("/impact/volunteer", {
    token: claimWinner.token,
  });
  assert.equal(volunteerImpact.status, 200);
  assert.ok(volunteerImpact.body.data.stats.totalPickups >= 1);

  const ngoImpact = await api("/ngos/impact", { token: ngoApproved.token });
  assert.equal(ngoImpact.status, 200);
  assert.ok(ngoImpact.body.data.impact.totalCompletedDonations >= 1);

  const adminImpact = await api("/admin/impact", { token: admin.token });
  assert.equal(adminImpact.status, 200);
  assert.ok(adminImpact.body.data.impact.totalCompletedDonations >= 1);
  assert.ok(adminImpact.body.data.impact.approvedNGOs >= 2);
});

test("NGO verification workflow is admin-controlled and notifies the applicant", async () => {
  const applicant = await createAndLogin({ role: "NGO", name: "Applicant NGO" });

  const payload = {
    organization_name: "Applicant Organization",
    registration_number: `REG-${Date.now()}`,
    address: "Applicant Street 5",
    contact_person: "Applicant Person",
    contact_email: applicant.user.email,
    contact_phone: "8888888888",
    description: "Test application",
  };

  const submitted = await api("/ngos/verification", {
    method: "POST",
    token: applicant.token,
    body: payload,
  });
  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.data.profile.verification_status, "pending");
  const profileId = submitted.body.data.profile.id;

  const duplicate = await api("/ngos/verification", {
    method: "POST",
    token: applicant.token,
    body: payload,
  });
  assert.equal(duplicate.status, 409);

  const applicantIncoming = await api("/ngos/incoming", {
    token: applicant.token,
  });
  assert.equal(applicantIncoming.status, 403);

  const nonAdminReview = await api(`/admin/verifications/${profileId}`, {
    method: "PATCH",
    token: donorA.token,
    body: { decision: "approved" },
  });
  assert.equal(nonAdminReview.status, 403);

  const list = await api("/admin/verifications", { token: admin.token });
  assert.equal(list.status, 200);
  assert.ok(
    list.body.data.verifications.some((v) => v.id === profileId)
  );

  const invalidDecision = await api(`/admin/verifications/${profileId}`, {
    method: "PATCH",
    token: admin.token,
    body: { decision: "maybe" },
  });
  assert.equal(invalidDecision.status, 400);

  const approve = await api(`/admin/verifications/${profileId}`, {
    method: "PATCH",
    token: admin.token,
    body: { decision: "approved", notes: "Verified by test" },
  });
  assert.equal(approve.status, 200);
  assert.equal(approve.body.data.profile.verification_status, "approved");

  const notifications = await getNotifications(applicant.token);
  assert.ok(
    notifications.some(
      (n) =>
        n.event_type === "ngo.verification_decided" &&
        n.data?.ngoProfileId === profileId
    )
  );

  const afterApproval = await api("/ngos/incoming", {
    token: applicant.token,
  });
  assert.equal(afterApproval.status, 200);
});

test("admin can suspend and reactivate accounts, effective immediately", async () => {
  const suspend = await api(`/admin/users/${donorB.user.id}`, {
    method: "PATCH",
    token: admin.token,
    body: { account_status: "suspended" },
  });
  assert.equal(suspend.status, 200);
  assert.equal(suspend.body.data.user.account_status, "suspended");

  const suspendedRequest = await api("/auth/me", { token: donorB.token });
  assert.equal(suspendedRequest.status, 403);
  assert.equal(suspendedRequest.body.error.code, "ACCOUNT_INACTIVE");

  const suspendedLogin = await api("/auth/login", {
    method: "POST",
    body: { email: donorB.user.email, password: donorB.user.password },
  });
  assert.equal(suspendedLogin.status, 401);

  const invalidStatus = await api(`/admin/users/${donorB.user.id}`, {
    method: "PATCH",
    token: admin.token,
    body: { account_status: "deleted" },
  });
  assert.equal(invalidStatus.status, 400);

  const reactivate = await api(`/admin/users/${donorB.user.id}`, {
    method: "PATCH",
    token: admin.token,
    body: { account_status: "active" },
  });
  assert.equal(reactivate.status, 200);

  const activeAgain = await api("/auth/me", { token: donorB.token });
  assert.equal(activeAgain.status, 200);
});

test("expiry sweeper marks overdue donations and blocks claim attempts", async () => {
  const now = Date.now();

  const expiredDonation = await createDonationFixture(donorA.user.id, {
    title: "Already Expired",
    expires_at: new Date(now - 60 * 60 * 1000).toISOString(),
    pickup_deadline: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
  });

  const available = await api("/donations/available", {
    token: volunteerB.token,
  });
  assert.equal(available.status, 200);
  assert.ok(
    !available.body.data.donations.some((d) => d.id === expiredDonation.id)
  );

  const sweep = await api("/admin/process-expired", {
    method: "POST",
    token: admin.token,
  });
  assert.equal(sweep.status, 200);
  assert.ok(sweep.body.data.result.processed >= 1);

  const expiredRow = await supabase
    .from("donations")
    .select("status")
    .eq("id", expiredDonation.id)
    .single();
  assert.equal(expiredRow.data.status, "EXPIRED");

  const notifications = await getNotifications(donorA.token);
  assert.ok(
    notifications.some(
      (n) =>
        n.event_type === "donation.expired" &&
        n.data?.donationId === expiredDonation.id
    )
  );

  const claimExpired = await api(`/donations/${expiredDonation.id}/claim`, {
    method: "POST",
    token: volunteerB.token,
  });
  assert.equal(claimExpired.status, 409);

  const deadlinePassed = await createDonationFixture(donorA.user.id, {
    title: "Deadline Passed",
    expires_at: new Date(now + 4 * 60 * 60 * 1000).toISOString(),
    pickup_deadline: new Date(now - 60 * 60 * 1000).toISOString(),
  });

  const claimPastDeadline = await api(
    `/donations/${deadlinePassed.id}/claim`,
    { method: "POST", token: volunteerB.token }
  );
  assert.equal(claimPastDeadline.status, 409);

  const deadlineRow = await supabase
    .from("donations")
    .select("status")
    .eq("id", deadlinePassed.id)
    .single();
  assert.equal(deadlineRow.data.status, "AVAILABLE");

  const manual = await createDonationFixture(donorA.user.id, {
    title: "Manual Expiry",
  });
  const expire = await api(`/admin/donations/${manual.id}/expire`, {
    method: "POST",
    token: admin.token,
  });
  assert.equal(expire.status, 200);
  assert.equal(expire.body.data.donation.status, "EXPIRED");

  const expireAgain = await api(`/admin/donations/${manual.id}/expire`, {
    method: "POST",
    token: admin.token,
  });
  assert.equal(expireAgain.status, 409);
});

test("notifications are isolated to their recipient", async () => {
  const donorNotifications = await getNotifications(donorA.token);
  assert.ok(donorNotifications.length > 0);

  const target = donorNotifications[0];
  const otherRead = await api(`/notifications/${target.id}/read`, {
    method: "POST",
    token: donorB.token,
  });
  assert.equal(otherRead.status, 404);

  const ownRead = await api(`/notifications/${target.id}/read`, {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(ownRead.status, 200);
  assert.equal(ownRead.body.data.notification.read, true);

  const donorBList = await getNotifications(donorB.token);
  assert.ok(!donorBList.some((n) => n.id === target.id));
});

test("admin-only user lookup does not expose profiles to ordinary users", async () => {
  const path = `/auth/users/${encodeURIComponent(donorA.user.email)}`;

  const anonymous = await api(path);
  assert.equal(anonymous.status, 401);

  const donorAttempt = await api(path, { token: donorA.token });
  assert.equal(donorAttempt.status, 403);

  const adminLookup = await api(path, { token: admin.token });
  assert.equal(adminLookup.status, 200);
  assert.equal(adminLookup.body.data.user.id, donorA.user.id);
});

test("malformed identifiers return client errors rather than 500", async () => {
  const invalidGet = await api("/donations/not-a-uuid", {
    token: donorA.token,
  });
  assert.equal(invalidGet.status, 400);

  const invalidClaim = await api("/donations/not-a-uuid/claim", {
    method: "POST",
    token: volunteerA.token,
  });
  assert.equal(invalidClaim.status, 400);

  const invalidNotification = await api("/notifications/not-a-uuid/read", {
    method: "POST",
    token: donorA.token,
  });
  assert.equal(invalidNotification.status, 404);
});
