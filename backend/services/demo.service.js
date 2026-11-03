import crypto from "node:crypto";
import { issueSessionToken } from "../lib/token.js";
import { canTransition, transitionErrorMessage } from "../lib/lifecycle.js";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../middleware/errorHandler.js";
import { isNonEmptyText, isWithinLength, LIMITS } from "../lib/validators.js";
import { broadcastRealtimeEvent } from "./realtime.service.js";

// ============================================================================
// DEDICATED DEMO IDENTITIES (Four Platform Roles)
// ============================================================================

export const DEMO_USERS = {
  donor: {
    id: "d0000000-0000-0000-0000-000000000001",
    name: "Demo Food Donor",
    email: "demo-donor@foodshare.local",
    role: "Donor",
    organization: "Community Kitchen Demo",
    phonenumber: "+91 98765 43210",
    area: "Indiranagar",
    pincode: "560038",
    state: "Karnataka",
    country: "India",
    account_status: "active",
    is_demo: true,
    created_at: "2026-01-15T08:00:00.000Z",
  },
  volunteer: {
    id: "d0000000-0000-0000-0000-000000000002",
    name: "Demo Volunteer",
    email: "demo-volunteer@foodshare.local",
    role: "Volunteer",
    organization: "Youth Food Rescue Corps",
    phonenumber: "+91 98765 43211",
    area: "Indiranagar",
    pincode: "560038",
    state: "Karnataka",
    country: "India",
    account_status: "active",
    is_demo: true,
    created_at: "2026-01-15T08:00:00.000Z",
  },
  ngo: {
    id: "d0000000-0000-0000-0000-000000000003",
    name: "Demo NGO",
    email: "demo-ngo@foodshare.local",
    role: "NGO",
    organization: "Hope Shelter Foundation",
    phonenumber: "+91 98765 43212",
    area: "Indiranagar",
    pincode: "560038",
    state: "Karnataka",
    country: "India",
    account_status: "active",
    is_demo: true,
    created_at: "2026-01-15T08:00:00.000Z",
  },
  admin: {
    id: "d0000000-0000-0000-0000-000000000004",
    name: "Demo Administrator",
    email: "demo-admin@foodshare.local",
    role: "Admin",
    organization: "FoodShare Platform Governance",
    phonenumber: "+91 98765 43213",
    area: "Indiranagar",
    pincode: "560038",
    state: "Karnataka",
    country: "India",
    account_status: "active",
    is_demo: true,
    created_at: "2026-01-15T08:00:00.000Z",
  },
};

export const DEMO_ROLES = ["donor", "volunteer", "ngo", "admin"];

export function isDemoUserId(userId) {
  if (!userId) return false;
  return Object.values(DEMO_USERS).some((u) => u.id === userId);
}

export function getDemoUserById(userId) {
  return Object.values(DEMO_USERS).find((u) => u.id === userId) || null;
}

export function getDemoUserByRole(roleSlug) {
  const normalized = String(roleSlug || "").trim().toLowerCase();
  return DEMO_USERS[normalized] || null;
}

// ============================================================================
// INITIAL SEED STATE FACTORY
// ============================================================================

function createInitialSeedData() {
  const now = new Date();
  const futureExpiry = new Date(now.getTime() + 18 * 60 * 60 * 1000).toISOString();
  const futurePickup = new Date(now.getTime() + 12 * 60 * 60 * 1000).toISOString();
  const pastTime = new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString();
  const yesterday = new Date(now.getTime() - 26 * 60 * 60 * 1000).toISOString();

  const donations = [
    {
      id: "d1111111-0000-0000-0000-000000000001",
      donor_id: DEMO_USERS.donor.id,
      title: "50 Fresh Biryani Meal Boxes",
      description: "Hygienically packaged warm chicken biryani and raita from community catering.",
      food_category: "Cooked Meals",
      quantity: 50,
      unit: "meals",
      prepared_at: pastTime,
      expires_at: futureExpiry,
      pickup_deadline: futurePickup,
      pickup_address: "12th Main, HAL 2nd Stage, Indiranagar, Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      state: "Karnataka",
      country: "India",
      latitude: 12.9716,
      longitude: 77.5946,
      photo_path: null,
      status: "AVAILABLE",
      is_demo: true,
      created_at: pastTime,
      updated_at: pastTime,
    },
    {
      id: "d1111111-0000-0000-0000-000000000002",
      donor_id: DEMO_USERS.donor.id,
      title: "Fresh Farm Vegetables (25 kg)",
      description: "Crates of organic carrots, potatoes, and spinach harvested this morning.",
      food_category: "Raw Produce",
      quantity: 25,
      unit: "kg",
      prepared_at: pastTime,
      expires_at: futureExpiry,
      pickup_deadline: futurePickup,
      pickup_address: "100ft Road, Indiranagar, Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      state: "Karnataka",
      country: "India",
      latitude: 12.9784,
      longitude: 77.6408,
      photo_path: null,
      status: "ASSIGNED",
      is_demo: true,
      created_at: pastTime,
      updated_at: pastTime,
    },
    {
      id: "d1111111-0000-0000-0000-000000000003",
      donor_id: DEMO_USERS.donor.id,
      title: "Surplus Sourdough & Bakery Bread (15 kg)",
      description: "Freshly baked artisan loaves and whole wheat buns from local bakery surplus.",
      food_category: "Bakery",
      quantity: 15,
      unit: "kg",
      prepared_at: pastTime,
      expires_at: futureExpiry,
      pickup_deadline: futurePickup,
      pickup_address: "CMH Road, Indiranagar, Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      state: "Karnataka",
      country: "India",
      latitude: 12.9792,
      longitude: 77.6391,
      photo_path: null,
      status: "DELIVERED",
      recipient_ngo_id: DEMO_USERS.ngo.id,
      is_demo: true,
      created_at: pastTime,
      updated_at: now.toISOString(),
    },
    {
      id: "d1111111-0000-0000-0000-000000000004",
      donor_id: DEMO_USERS.donor.id,
      title: "Packaged Dry Groceries & Pulses (100 kg)",
      description: "Sealed bags of lentils, rice, and cooking oil donated by corporate pantry.",
      food_category: "Packaged Goods",
      quantity: 100,
      unit: "kg",
      prepared_at: yesterday,
      expires_at: futureExpiry,
      pickup_deadline: pastTime,
      pickup_address: "Embassy GolfLinks, Indiranagar, Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      state: "Karnataka",
      country: "India",
      latitude: 12.9515,
      longitude: 77.6499,
      photo_path: null,
      status: "COMPLETED",
      recipient_ngo_id: DEMO_USERS.ngo.id,
      is_demo: true,
      created_at: yesterday,
      updated_at: pastTime,
    },
    {
      id: "d1111111-0000-0000-0000-000000000005",
      donor_id: DEMO_USERS.donor.id,
      title: "Catering Finger Foods (Expired Window)",
      description: "Cocktail samosas and pastries that reached safe consumption deadline.",
      food_category: "Cooked Meals",
      quantity: 10,
      unit: "meals",
      prepared_at: yesterday,
      expires_at: pastTime,
      pickup_deadline: pastTime,
      pickup_address: "Old Airport Road, Bengaluru",
      area: "Indiranagar",
      pincode: "560038",
      state: "Karnataka",
      country: "India",
      latitude: 12.9592,
      longitude: 77.6534,
      photo_path: null,
      status: "EXPIRED",
      is_demo: true,
      created_at: yesterday,
      updated_at: pastTime,
    },
  ];

  const assignments = [
    {
      id: "a1111111-0000-0000-0000-000000000002",
      donation_id: "d1111111-0000-0000-0000-000000000002",
      volunteer_id: DEMO_USERS.volunteer.id,
      assigned_at: pastTime,
      picked_up_at: null,
      delivered_at: null,
      assignment_status: "active",
      is_demo: true,
    },
    {
      id: "a1111111-0000-0000-0000-000000000003",
      donation_id: "d1111111-0000-0000-0000-000000000003",
      volunteer_id: DEMO_USERS.volunteer.id,
      assigned_at: pastTime,
      picked_up_at: pastTime,
      delivered_at: now.toISOString(),
      assignment_status: "active",
      is_demo: true,
    },
    {
      id: "a1111111-0000-0000-0000-000000000004",
      donation_id: "d1111111-0000-0000-0000-000000000004",
      volunteer_id: DEMO_USERS.volunteer.id,
      assigned_at: yesterday,
      picked_up_at: yesterday,
      delivered_at: pastTime,
      assignment_status: "completed",
      is_demo: true,
    },
  ];

  const deliveryConfirmations = [
    {
      id: "c1111111-0000-0000-0000-000000000004",
      donation_id: "d1111111-0000-0000-0000-000000000004",
      assignment_id: "a1111111-0000-0000-0000-000000000004",
      confirmed_by: DEMO_USERS.ngo.id,
      confirmed_at: pastTime,
      evidence_url: null,
      discrepancy_notes: "Received in pristine sealed condition.",
      is_demo: true,
    },
  ];

  const ngoProfile = {
    id: "n1111111-0000-0000-0000-000000000003",
    user_id: DEMO_USERS.ngo.id,
    organization_name: "Hope Shelter Foundation",
    registration_number: "KA-NGO-2024-9988",
    address: "45 Shelter Road, Indiranagar, Bengaluru",
    contact_person: "Priya Sharma",
    contact_email: "priya@hopeshelter.demo",
    contact_phone: "+91 98765 43212",
    description: "Serving destitute families and shelter residents with hot meals daily.",
    verification_status: "approved",
    verification_notes: "Verified by FoodShare administrator for demo presentation.",
    verified_by: DEMO_USERS.admin.id,
    verified_at: pastTime,
    created_at: yesterday,
    is_demo: true,
  };

  const notifications = [
    {
      id: "notif-001",
      recipient_id: DEMO_USERS.donor.id,
      event_type: "donation_delivered",
      title: "Donation Delivered",
      message: 'Your donation "Surplus Sourdough & Bakery Bread (15 kg)" has been delivered to Hope Shelter Foundation.',
      data: { donationId: "d1111111-0000-0000-0000-000000000003" },
      read: false,
      created_at: now.toISOString(),
      is_demo: true,
    },
    {
      id: "notif-002",
      recipient_id: DEMO_USERS.volunteer.id,
      event_type: "donation_claimed",
      title: "Task Assigned",
      message: 'You have successfully claimed "Fresh Farm Vegetables (25 kg)". Proceed to pickup location.',
      data: { donationId: "d1111111-0000-0000-0000-000000000002" },
      read: false,
      created_at: pastTime,
      is_demo: true,
    },
    {
      id: "notif-003",
      recipient_id: DEMO_USERS.ngo.id,
      event_type: "donation_delivered",
      title: "Incoming Delivery Awaiting Confirmation",
      message: '"Surplus Sourdough & Bakery Bread (15 kg)" has arrived. Please inspect and confirm receipt.',
      data: { donationId: "d1111111-0000-0000-0000-000000000003" },
      read: false,
      created_at: now.toISOString(),
      is_demo: true,
    },
    {
      id: "notif-004",
      recipient_id: DEMO_USERS.admin.id,
      event_type: "ngo_verification_decided",
      title: "Demonstration System Initialized",
      message: "Interactive presentation scenario ready across all 4 platform roles.",
      data: {},
      read: true,
      created_at: pastTime,
      is_demo: true,
    },
  ];

  const auditLogs = [
    {
      id: "audit-001",
      actor_id: DEMO_USERS.donor.id,
      action: "DONATION_CREATED",
      resource_type: "donation",
      resource_id: "d1111111-0000-0000-0000-000000000001",
      reason: "Surplus meal boxes listed for donation.",
      metadata: { title: "50 Fresh Biryani Meal Boxes", quantity: 50 },
      created_at: pastTime,
      is_demo: true,
    },
    {
      id: "audit-002",
      actor_id: DEMO_USERS.volunteer.id,
      action: "DONATION_CLAIMED",
      resource_type: "donation",
      resource_id: "d1111111-0000-0000-0000-000000000002",
      reason: "Volunteer claimed farm vegetables for rescue.",
      metadata: { volunteer_id: DEMO_USERS.volunteer.id },
      created_at: pastTime,
      is_demo: true,
    },
    {
      id: "audit-003",
      actor_id: DEMO_USERS.volunteer.id,
      action: "DONATION_DELIVERED",
      resource_type: "donation",
      resource_id: "d1111111-0000-0000-0000-000000000003",
      reason: "Volunteer delivered bakery bread to Hope Shelter.",
      metadata: { recipient_ngo_id: DEMO_USERS.ngo.id },
      created_at: now.toISOString(),
      is_demo: true,
    },
  ];

  return {
    donations,
    assignments,
    deliveryConfirmations,
    ngoProfile,
    notifications,
    auditLogs,
  };
}

// In-Memory Demo Tenant State Storage
let demoStore = createInitialSeedData();

// Reset demo store back to original seed data
export function resetDemoState() {
  demoStore = createInitialSeedData();
  return {
    users: Object.keys(DEMO_USERS).length,
    donations: demoStore.donations.length,
    assignments: demoStore.assignments.length,
    notifications: demoStore.notifications.length,
  };
}

// ============================================================================
// AUTHENTICATION & SESSION ISSUANCE
// ============================================================================

export function authenticateDemoRole(roleSlug) {
  const demoUser = getDemoUserByRole(roleSlug);
  if (!demoUser) {
    throw new ValidationError(`Invalid demo role. Allowed roles: ${DEMO_ROLES.join(", ")}`);
  }

  const token = issueSessionToken({
    userId: demoUser.id,
    email: demoUser.email,
    role: demoUser.role,
    isDemo: true,
  });

  return {
    user: { ...demoUser },
    token,
    isDemo: true,
  };
}

// ============================================================================
// DEMO DONATION WORKFLOWS
// ============================================================================

export function getDemoDonations(params = {}) {
  let list = [...demoStore.donations];
  if (params.donorId) {
    list = list.filter((d) => d.donor_id === params.donorId);
  }
  if (params.status) {
    list = list.filter((d) => d.status === params.status);
  }
  return list.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}

export function getDemoDonationById(id) {
  const donation = demoStore.donations.find((d) => d.id === id);
  if (!donation) return null;

  const assignment = demoStore.assignments.find((a) => a.donation_id === id && a.assignment_status === "active");
  const confirmation = demoStore.deliveryConfirmations.find((c) => c.donation_id === id);

  return {
    ...donation,
    assignment: assignment || null,
    delivery_confirmation: confirmation || null,
    donor: DEMO_USERS.donor,
    recipient_ngo: donation.recipient_ngo_id ? DEMO_USERS.ngo : null,
  };
}

export function createDemoDonation(donorId, data) {
  const { title, description, food_category, quantity, unit, pickup_deadline, expires_at, pickup_address } = data;

  if (!title || !food_category || !quantity || !unit || !pickup_deadline || !expires_at || !pickup_address) {
    throw new ValidationError("Missing required donation fields.");
  }

  const now = new Date();
  const expDate = new Date(expires_at);
  const pickupDate = new Date(pickup_deadline);

  if (expDate <= now) {
    throw new ValidationError("Expiry date must be in the future.");
  }
  if (pickupDate > expDate) {
    throw new ValidationError("Pickup deadline cannot be later than expiry.");
  }

  const newDonation = {
    id: `d1111111-${crypto.randomUUID().slice(9)}`,
    donor_id: donorId,
    title: title.trim(),
    description: description?.trim() || null,
    food_category: food_category.trim(),
    quantity: Number(quantity),
    unit: unit.trim(),
    prepared_at: data.prepared_at ? new Date(data.prepared_at).toISOString() : now.toISOString(),
    expires_at: expDate.toISOString(),
    pickup_deadline: pickupDate.toISOString(),
    pickup_address: pickup_address.trim(),
    area: data.area || "Indiranagar",
    pincode: data.pincode || "560038",
    state: data.state || "Karnataka",
    country: data.country || "India",
    latitude: data.latitude ? Number(data.latitude) : 12.9716,
    longitude: data.longitude ? Number(data.longitude) : 77.5946,
    photo_path: null,
    status: "AVAILABLE",
    is_demo: true,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };

  demoStore.donations.unshift(newDonation);

  demoStore.auditLogs.unshift({
    id: `audit-${crypto.randomUUID().slice(0, 8)}`,
    actor_id: donorId,
    action: "DONATION_CREATED",
    resource_type: "donation",
    resource_id: newDonation.id,
    reason: "New demonstration food listing created.",
    metadata: { title: newDonation.title, quantity: newDonation.quantity },
    created_at: now.toISOString(),
    is_demo: true,
  });

  return newDonation;
}

export function claimDemoDonation(donationId, volunteerId) {
  const donation = demoStore.donations.find((d) => d.id === donationId);
  if (!donation) throw new NotFoundError("Donation not found.");
  if (donation.status !== "AVAILABLE") {
    throw new ConflictError("This donation is no longer available for claim.");
  }

  const now = new Date().toISOString();
  donation.status = "ASSIGNED";
  donation.updated_at = now;

  const assignment = {
    id: `a1111111-${crypto.randomUUID().slice(9)}`,
    donation_id: donationId,
    volunteer_id: volunteerId,
    assigned_at: now,
    picked_up_at: null,
    delivered_at: null,
    assignment_status: "active",
    is_demo: true,
  };
  demoStore.assignments.unshift(assignment);

  const notif = {
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    recipient_id: donation.donor_id,
    event_type: "donation_claimed",
    title: "Donation Claimed",
    message: `Your donation "${donation.title}" was claimed by volunteer Demo Volunteer.`,
    data: { donationId, assignmentId: assignment.id },
    read: false,
    created_at: now,
    is_demo: true,
  };
  demoStore.notifications.unshift(notif);
  broadcastRealtimeEvent("notification.created", notif, { isDemo: true, actorId: volunteerId, entityId: notif.id });

  demoStore.auditLogs.unshift({
    id: `audit-${crypto.randomUUID().slice(0, 8)}`,
    actor_id: volunteerId,
    action: "DONATION_CLAIMED",
    resource_type: "donation",
    resource_id: donationId,
    reason: "Volunteer claimed demonstration donation.",
    metadata: { assignmentId: assignment.id },
    created_at: now,
    is_demo: true,
  });

  return { donation, assignment };
}

export function pickupDemoDonation(donationId, volunteerId) {
  const donation = demoStore.donations.find((d) => d.id === donationId);
  if (!donation) throw new NotFoundError("Donation not found.");
  if (donation.status !== "ASSIGNED") {
    throw new ValidationError(`Cannot pick up donation with status: ${donation.status}`);
  }

  const assignment = demoStore.assignments.find(
    (a) => a.donation_id === donationId && a.volunteer_id === volunteerId && a.assignment_status === "active"
  );
  if (!assignment) throw new ForbiddenError("You are not assigned to this donation.");

  const now = new Date().toISOString();
  donation.status = "PICKED_UP";
  donation.updated_at = now;
  assignment.picked_up_at = now;

  const notif = {
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    recipient_id: donation.donor_id,
    event_type: "donation_picked_up",
    title: "Donation Picked Up",
    message: `Volunteer picked up "${donation.title}". It is on the way to the NGO.`,
    data: { donationId },
    read: false,
    created_at: now,
    is_demo: true,
  };
  demoStore.notifications.unshift(notif);
  broadcastRealtimeEvent("notification.created", notif, { isDemo: true, actorId: volunteerId, entityId: notif.id });

  return donation;
}

export function deliverDemoDonation(donationId, volunteerId, targetNgoId = null) {
  const donation = demoStore.donations.find((d) => d.id === donationId);
  if (!donation) throw new NotFoundError("Donation not found.");
  if (donation.status !== "PICKED_UP") {
    throw new ValidationError(`Cannot deliver donation with status: ${donation.status}`);
  }

  const assignment = demoStore.assignments.find(
    (a) => a.donation_id === donationId && a.volunteer_id === volunteerId && a.assignment_status === "active"
  );
  if (!assignment) throw new ForbiddenError("You are not assigned to this donation.");

  const now = new Date().toISOString();
  const ngoId = targetNgoId || DEMO_USERS.ngo.id;
  donation.status = "DELIVERED";
  donation.recipient_ngo_id = ngoId;
  donation.updated_at = now;
  assignment.delivered_at = now;

  const notif = {
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    recipient_id: ngoId,
    event_type: "donation_delivered",
    title: "Incoming Delivery",
    message: `"${donation.title}" has arrived. Please confirm receipt.`,
    data: { donationId },
    read: false,
    created_at: now,
    is_demo: true,
  };
  demoStore.notifications.unshift(notif);
  broadcastRealtimeEvent("notification.created", notif, { isDemo: true, actorId: volunteerId, entityId: notif.id });

  return donation;
}

export function confirmDemoReceipt(donationId, ngoId) {
  const donation = demoStore.donations.find((d) => d.id === donationId);
  if (!donation) throw new NotFoundError("Donation not found.");
  if (donation.status !== "DELIVERED") {
    throw new ValidationError(`Cannot confirm receipt for donation with status: ${donation.status}`);
  }

  const now = new Date().toISOString();
  donation.status = "COMPLETED";
  donation.updated_at = now;

  const assignment = demoStore.assignments.find((a) => a.donation_id === donationId && a.assignment_status === "active");
  if (assignment) {
    assignment.assignment_status = "completed";
  }

  const confirmation = {
    id: `c1111111-${crypto.randomUUID().slice(9)}`,
    donation_id: donationId,
    assignment_id: assignment?.id || null,
    confirmed_by: ngoId,
    confirmed_at: now,
    evidence_url: null,
    discrepancy_notes: "Demonstration receipt verified by Demo NGO.",
    is_demo: true,
  };
  demoStore.deliveryConfirmations.push(confirmation);

  demoStore.notifications.unshift({
    id: `notif-${crypto.randomUUID().slice(0, 8)}`,
    recipient_id: donation.donor_id,
    event_type: "donation_completed",
    title: "Donation Completed",
    message: `Your donation "${donation.title}" has been confirmed received by Hope Shelter Foundation!`,
    data: { donationId },
    read: false,
    created_at: now,
    is_demo: true,
  });

  return donation;
}

export function cancelDemoDonation(donationId, userId, role) {
  const donation = demoStore.donations.find((d) => d.id === donationId);
  if (!donation) throw new NotFoundError("Donation not found.");

  if (role !== "Admin" && donation.donor_id !== userId) {
    throw new ForbiddenError("You can only cancel your own donations.");
  }
  if (!["AVAILABLE", "ASSIGNED"].includes(donation.status)) {
    throw new ValidationError("Cannot cancel a donation that has already been picked up.");
  }

  const now = new Date().toISOString();
  donation.status = "CANCELLED";
  donation.updated_at = now;

  const activeAssignment = demoStore.assignments.find(
    (a) => a.donation_id === donationId && a.assignment_status === "active"
  );
  if (activeAssignment) {
    activeAssignment.assignment_status = "cancelled";
  }

  return donation;
}

// ============================================================================
// VOLUNTEER & NGO SPECIFIC RETRIEVALS
// ============================================================================

export function getDemoVolunteerTasks(volunteerId) {
  const activeAssignments = demoStore.assignments.filter(
    (a) => a.volunteer_id === volunteerId && ["active", "completed"].includes(a.assignment_status)
  );

  return activeAssignments.map((assignment) => {
    const donation = demoStore.donations.find((d) => d.id === assignment.donation_id);
    return {
      ...assignment,
      donations: donation ? { ...donation, donor: DEMO_USERS.donor } : null,
    };
  });
}

export function getDemoDonorStats(donorId) {
  const myDonations = demoStore.donations.filter((d) => !donorId || d.donor_id === donorId);
  const byStatus = {};
  for (const d of myDonations) {
    const status = d.status || "UNKNOWN";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  const completedQuantity = myDonations
    .filter((d) => d.status === "COMPLETED")
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  const activeDonations =
    (byStatus.AVAILABLE || 0) +
    (byStatus.ASSIGNED || 0) +
    (byStatus.PICKED_UP || 0) +
    (byStatus.DELIVERED || 0);

  return {
    totalDonations: myDonations.length,
    byStatus,
    completedQuantity,
    activeDonations,
    completedDonations: byStatus.COMPLETED || 0,
  };
}

export function getDemoVolunteerStats(volunteerId) {
  const myAssignments = demoStore.assignments.filter((a) => a.volunteer_id === volunteerId);
  const completed = myAssignments.filter((a) => a.assignment_status === "completed").length;
  const active = myAssignments.filter((a) => a.assignment_status === "active").length;

  return {
    totalDeliveries: completed,
    activeTasks: active,
    totalKgRescued: completed * 25,
    mealsProvided: completed * 75,
  };
}

export function getDemoIncomingDeliveries(ngoId) {
  return demoStore.donations
    .filter((d) => d.status === "DELIVERED" && (!d.recipient_ngo_id || d.recipient_ngo_id === ngoId))
    .map((donation) => {
      const task = (demoStore.assignments || []).find((t) => t.donation_id === donation.id);
      return {
        ...donation,
        donor: DEMO_USERS.donor,
        assignments: task
          ? [{ id: task.id, volunteer_id: task.volunteer_id, delivered_at: task.delivered_at || donation.updated_at }]
          : [{ id: "mock-assign", volunteer_id: DEMO_USERS.volunteer.id, delivered_at: donation.updated_at }],
        delivery_confirmations: [],
      };
    });
}

export function getDemoNGOVerificationStatus(userId) {
  return demoStore.ngoProfile;
}

// ============================================================================
// ADMIN SPECIFIC RETRIEVALS & STATS
// ============================================================================

export function getDemoAdminStats() {
  const totalDonations = demoStore.donations.length;
  const activeDonations = demoStore.donations.filter((d) => ["AVAILABLE", "ASSIGNED", "PICKED_UP"].includes(d.status)).length;
  const completedDonations = demoStore.donations.filter((d) => d.status === "COMPLETED").length;
  const pendingConfirmations = demoStore.donations.filter((d) => d.status === "DELIVERED").length;

  return {
    totalUsers: Object.keys(DEMO_USERS).length,
    totalDonations,
    activeDonations,
    completedDonations,
    pendingConfirmations,
    totalMealsServed: completedDonations * 120 + 50,
    totalKgDiverted: completedDonations * 45 + 25,
  };
}

export function getDemoAdminUsers() {
  return Object.values(DEMO_USERS).map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    organization: u.organization,
    phonenumber: u.phonenumber,
    area: u.area,
    pincode: u.pincode,
    state: u.state,
    country: u.country,
    account_status: u.account_status,
    created_at: u.created_at,
    is_demo: true,
  }));
}

export function getDemoAdminAuditLogs() {
  return [...demoStore.auditLogs];
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export function getDemoNotifications(userId) {
  return demoStore.notifications.filter((n) => n.recipient_id === userId);
}

export function markDemoNotificationRead(notifId, userId) {
  const notif = demoStore.notifications.find((n) => n.id === notifId && n.recipient_id === userId);
  if (notif) notif.read = true;
  return notif;
}

export function getDemoPersonalImpact(userId, userRole) {
  const completed = demoStore.donations.filter((d) => d.status === "COMPLETED");
  let userCompleted = [];
  if (userRole === "Donor") {
    userCompleted = completed.filter((d) => d.donor_id === userId);
  } else if (userRole === "Volunteer") {
    const assignedIds = demoStore.assignments
      .filter((a) => a.volunteer_id === userId)
      .map((a) => a.donation_id);
    userCompleted = completed.filter((d) => assignedIds.includes(d.id));
  } else if (userRole === "NGO") {
    userCompleted = completed.filter((d) => d.recipient_ngo_id === userId);
  } else {
    userCompleted = completed;
  }

  let totalQuantity = 0;
  const byUnit = {};
  const byCategory = {};

  for (const d of userCompleted) {
    const qty = Number(d.quantity) || 0;
    const unit = d.unit || "servings";
    totalQuantity += qty;
    byUnit[unit] = (byUnit[unit] || 0) + qty;
    const cat = d.food_category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  return {
    totalCompletedDonations: userCompleted.length,
    totalQuantity,
    byUnit,
    byCategory,
    recentActivity: {
      last30Days: userCompleted.length,
      donations: userCompleted.map((d) => ({
        id: d.id,
        quantity: d.quantity,
        unit: d.unit,
        foodCategory: d.food_category,
        completedAt: d.updated_at || new Date().toISOString(),
      })),
    },
  };
}


