import { supabase } from "../supabase.js";
import {
  isValidQuantity,
  isValidExpiry,
  isValidPickupDeadline,
  isNonEmptyText,
  isWithinLength,
  isValidUuid,
  parseCoordinates,
  DONATION_CATEGORIES,
  DONATION_UNITS,
  LIMITS,
} from "../lib/validators.js";
import {
  normalizeDonationStatus,
  canTransition,
  transitionErrorMessage,
} from "../lib/lifecycle.js";
import {
  ValidationError,
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "../middleware/errorHandler.js";
import { notifySafely, NOTIFICATION_EVENTS } from "./notification.service.js";

function isValidTimestamp(value) {
  if (typeof value !== "string" || !value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function normalizePagination(options = {}) {
  const parsedLimit = Number.parseInt(options.limit, 10);
  const parsedOffset = Number.parseInt(options.offset, 10);
  return {
    limit: Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : 50,
    offset: Number.isFinite(parsedOffset) ? Math.max(parsedOffset, 0) : 0,
  };
}

/** Remove PostgREST filter metacharacters from user-controlled location text. */
function sanitizeFilterValue(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[,()%\\"]/g, " ").replace(/\s+/g, " ").trim();
}

/**
 * Create a new donation listing.
 */
export async function createDonation(donorId, input) {
  const {
    title,
    description,
    food_category,
    quantity,
    unit,
    prepared_at,
    expires_at,
    pickup_deadline,
    pickup_address,
    area,
    pincode,
    state,
    country,
    latitude,
    longitude,
    photo_path,
  } = input || {};

  const errors = [];

  if (!isNonEmptyText(title, LIMITS.title)) {
    errors.push({
      field: "title",
      message: `Title is required and must be at most ${LIMITS.title} characters`,
    });
  }

  if (!isWithinLength(description, LIMITS.description)) {
    errors.push({
      field: "description",
      message: `Description must be at most ${LIMITS.description} characters`,
    });
  }

  if (!food_category || !DONATION_CATEGORIES.includes(food_category)) {
    errors.push({
      field: "food_category",
      message: `Invalid category. Allowed: ${DONATION_CATEGORIES.join(", ")}`,
    });
  }

  if (!isValidQuantity(quantity)) {
    errors.push({
      field: "quantity",
      message: `Quantity must be a positive number no greater than ${LIMITS.quantityMax}`,
    });
  }

  if (!DONATION_UNITS.includes(unit)) {
    errors.push({
      field: "unit",
      message: `Invalid unit. Allowed: ${DONATION_UNITS.join(", ")}`,
    });
  }

  if (!isValidExpiry(expires_at)) {
    errors.push({
      field: "expires_at",
      message: "Expiry must be a valid future timestamp",
    });
  }

  if (!isValidPickupDeadline(expires_at, pickup_deadline)) {
    errors.push({
      field: "pickup_deadline",
      message: "Pickup deadline must be in the future and no later than expiry",
    });
  }

  if (!isNonEmptyText(pickup_address, LIMITS.pickupAddress)) {
    errors.push({
      field: "pickup_address",
      message: `Pickup address is required and must be at most ${LIMITS.pickupAddress} characters`,
    });
  }

  if (prepared_at !== undefined && prepared_at !== null && prepared_at !== "") {
    if (!isValidTimestamp(prepared_at)) {
      errors.push({
        field: "prepared_at",
        message: "Prepared time must be a valid timestamp",
      });
    }
  }

  for (const [field, max, value] of [
    ["area", LIMITS.area, area],
    ["pincode", LIMITS.pincode, pincode],
    ["state", LIMITS.state, state],
    ["country", LIMITS.country, country],
    ["photo_path", 500, photo_path],
  ]) {
    if (!isWithinLength(value, max)) {
      errors.push({ field, message: `${field} must be at most ${max} characters` });
    }
  }

  const coordinates = parseCoordinates(latitude, longitude);
  if (!coordinates.valid) {
    errors.push({
      field: "latitude",
      message:
        "Latitude and longitude must both be supplied and be valid coordinates",
    });
  }

  if (errors.length > 0) {
    throw new ValidationError("Donation validation failed", errors);
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .insert([
      {
        donor_id: donorId,
        title: title.trim(),
        description: description?.trim() || null,
        food_category,
        quantity: Number(quantity),
        unit,
        prepared_at:
          prepared_at && String(prepared_at).trim()
            ? new Date(prepared_at).toISOString()
            : null,
        expires_at: new Date(expires_at).toISOString(),
        pickup_deadline: new Date(pickup_deadline).toISOString(),
        pickup_address: pickup_address.trim(),
        area: area?.trim() || null,
        pincode: pincode?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || "India",
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        photo_path: photo_path?.trim() || null,
        status: "AVAILABLE",
      },
    ])
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  return donation;
}

/**
 * Notify active volunteers in the donation's pincode about a new listing.
 * Best effort: a notification failure never fails donation creation.
 */
export async function notifyVolunteersAboutDonation(donation) {
  if (!donation?.id) return { notified: 0 };

  let query = supabase
    .from("users")
    .select("id")
    .eq("role", "Volunteer")
    .eq("account_status", "active")
    .limit(50);

  if (donation.pincode) {
    query = query.eq("pincode", donation.pincode);
  }

  const { data: volunteers, error } = await query;
  if (error || !volunteers?.length) {
    return { notified: 0 };
  }

  await Promise.all(
    volunteers.map((volunteer) =>
      notifySafely({
        recipientId: volunteer.id,
        eventType: NOTIFICATION_EVENTS.DONATION_CREATED,
        title: "New Food Donation Available",
        message: `"${donation.title}" is available for pickup${
          donation.area ? ` in ${donation.area}` : ""
        }.`,
        data: { donationId: donation.id },
        channels: ["in_app"],
      })
    )
  );

  return { notified: volunteers.length };
}

/**
 * Get donation by ID with authorization.
 */
export async function getDonationById(donationId, userId, userRole) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();

  if (error || !donation) {
    throw new NotFoundError("Donation not found");
  }

  const isOwner = donation.donor_id === userId;
  const isAdmin = userRole === "Admin";
  const isRecipientNGO =
    userRole === "NGO" && donation.recipient_ngo_id === userId;

  let isAssignedVolunteer = false;
  if (!isOwner && !isAdmin && !isRecipientNGO) {
    const { data: assignments } = await supabase
      .from("assignments")
      .select("volunteer_id")
      .eq("donation_id", donationId);

    isAssignedVolunteer = (assignments || []).some(
      (assignment) => assignment.volunteer_id === userId
    );
  }

  if (!isOwner && !isAdmin && !isRecipientNGO && !isAssignedVolunteer) {
    throw new ForbiddenError("You do not have permission to view this donation");
  }

  return donation;
}

/**
 * Get donations owned by a donor.
 */
export async function getDonationsByDonor(donorId, options = {}) {
  const { limit, offset } = normalizePagination(options);
  const status = normalizeDonationStatus(options.status);

  let query = supabase
    .from("donations")
    .select("*")
    .eq("donor_id", donorId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}

/**
 * Get available donations for volunteers (AVAILABLE, unexpired, before the
 * pickup deadline), optionally narrowed to the volunteer's location.
 */
export async function getAvailableDonations(userId, userLocation = {}) {
  const now = new Date().toISOString();

  let query = supabase
    .from("donations")
    .select(
      `
      *,
      assignments!donation_id (
        id,
        volunteer_id,
        assignment_status
      )
    `
    )
    .eq("status", "AVAILABLE")
    .gt("expires_at", now)
    .gt("pickup_deadline", now)
    .order("created_at", { ascending: true })
    .limit(100);

  const filters = [];
  const pincode = sanitizeFilterValue(userLocation.pincode);
  const area = sanitizeFilterValue(userLocation.area);
  const state = sanitizeFilterValue(userLocation.state);

  if (pincode) filters.push(`pincode.eq.${pincode}`);
  if (area) filters.push(`area.ilike.%${area}%`);
  if (state) filters.push(`state.ilike.%${state}%`);

  if (filters.length > 0) {
    query = query.or(filters.join(","));
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  // Defensive: ignore listings that somehow still carry an active assignment.
  const available = (data || []).filter((donation) => {
    const activeAssignment = donation.assignments?.find(
      (assignment) => assignment.assignment_status === "active"
    );
    return !activeAssignment;
  });

  return available.map(({ assignments, ...donation }) => donation);
}

/**
 * Atomically claim a donation via the claim_donation database function.
 */
export async function claimDonation(donationId, volunteerId) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const { data, error } = await supabase.rpc("claim_donation", {
    p_donation_id: donationId,
    p_volunteer_id: volunteerId,
  });

  if (error) {
    if (error.code === "23505") {
      throw new ConflictError(
        "You already have an active assignment. Complete it before claiming another."
      );
    }
    if (error.code === "22P02") {
      throw new ValidationError("Invalid donation ID");
    }
    throw new Error(`Claim transaction failed: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error("Claim transaction returned no result");
  }

  const code = result.result_code;
  if (code === "not_found") {
    throw new NotFoundError("Donation not found");
  }
  if (code === "unavailable") {
    throw new ConflictError("This donation is no longer available to claim.");
  }
  if (code === "expired") {
    throw new ConflictError("Donation has expired.");
  }
  if (code === "pickup_deadline_passed") {
    throw new ConflictError("The pickup deadline for this donation has passed.");
  }
  if (code === "volunteer_busy") {
    throw new ConflictError(
      "You already have an active assignment. Complete it before claiming another."
    );
  }
  if (code !== "claimed") {
    throw new Error(`Unexpected claim result: ${code}`);
  }

  const { data: donation, error: donationError } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();

  if (donationError || !donation) {
    throw new NotFoundError("Donation not found after claim");
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("assignments")
    .select("*")
    .eq("id", result.assignment_id)
    .single();

  if (assignmentError || !assignment) {
    throw new Error("Assignment could not be loaded after claim");
  }

  return { donation, assignment };
}

/**
 * Record pickup by the assigned volunteer.
 */
export async function recordPickup(donationId, volunteerId) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const currentStatus = await getDonationStatus(donationId);
  if (!canTransition(currentStatus, "PICKED_UP")) {
    throw new ConflictError(transitionErrorMessage(currentStatus, "PICKED_UP"));
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("donation_id", donationId)
    .eq("volunteer_id", volunteerId)
    .eq("assignment_status", "active")
    .maybeSingle();

  if (!assignment) {
    throw new ForbiddenError("You are not assigned to this donation");
  }

  const pickedUpAt = new Date().toISOString();
  const { data: donation, error } = await supabase
    .from("donations")
    .update({ status: "PICKED_UP", updated_at: pickedUpAt })
    .eq("id", donationId)
    .eq("status", currentStatus)
    .select()
    .maybeSingle();

  if (error) {
    throw new ValidationError(error.message);
  }
  if (!donation) {
    throw new ConflictError(
      "Donation status changed while pickup was being recorded."
    );
  }

  const { error: assignmentError } = await supabase
    .from("assignments")
    .update({ picked_up_at: pickedUpAt })
    .eq("id", assignment.id);

  if (assignmentError) {
    throw new ValidationError(assignmentError.message);
  }

  return donation;
}

/**
 * Record delivery by the assigned volunteer and address it to an approved NGO.
 */
export async function recordDelivery(donationId, volunteerId, ngoId) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }
  if (!isValidUuid(ngoId)) {
    throw new ValidationError("A valid receiving NGO must be selected");
  }

  const currentStatus = await getDonationStatus(donationId);
  if (!canTransition(currentStatus, "DELIVERED")) {
    throw new ConflictError(transitionErrorMessage(currentStatus, "DELIVERED"));
  }

  const { data: assignment } = await supabase
    .from("assignments")
    .select("id")
    .eq("donation_id", donationId)
    .eq("volunteer_id", volunteerId)
    .eq("assignment_status", "active")
    .maybeSingle();

  if (!assignment) {
    throw new ForbiddenError("You are not assigned to this donation");
  }

  const { data: ngoUser } = await supabase
    .from("users")
    .select("id, role, account_status")
    .eq("id", ngoId)
    .maybeSingle();

  if (!ngoUser || ngoUser.role !== "NGO" || ngoUser.account_status !== "active") {
    throw new ValidationError("Selected recipient is not an active NGO");
  }

  const { data: ngoProfile } = await supabase
    .from("ngo_profiles")
    .select("verification_status")
    .eq("user_id", ngoId)
    .maybeSingle();

  if (!ngoProfile || ngoProfile.verification_status !== "approved") {
    throw new ValidationError("Selected NGO is not approved to receive food");
  }

  const { data: existing } = await supabase
    .from("donations")
    .select("recipient_ngo_id")
    .eq("id", donationId)
    .single();

  if (existing?.recipient_ngo_id && existing.recipient_ngo_id !== ngoId) {
    throw new ConflictError("This donation is already addressed to another NGO");
  }

  const deliveredAt = new Date().toISOString();
  const { data: donation, error } = await supabase
    .from("donations")
    .update({
      status: "DELIVERED",
      recipient_ngo_id: ngoId,
      updated_at: deliveredAt,
    })
    .eq("id", donationId)
    .eq("status", currentStatus)
    .select()
    .maybeSingle();

  if (error) {
    throw new ValidationError(error.message);
  }
  if (!donation) {
    throw new ConflictError(
      "Donation status changed while delivery was being recorded."
    );
  }

  const { error: assignmentError } = await supabase
    .from("assignments")
    .update({ delivered_at: deliveredAt })
    .eq("id", assignment.id);

  if (assignmentError) {
    throw new ValidationError(assignmentError.message);
  }

  return donation;
}

/**
 * Confirm receipt by the approved NGO the delivery is addressed to.
 */
export async function confirmReceipt(donationId, ngoId) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const { data, error } = await supabase.rpc("confirm_receipt", {
    p_donation_id: donationId,
    p_ngo_id: ngoId,
  });

  if (error) {
    if (error.code === "22P02") {
      throw new ValidationError("Invalid donation ID");
    }
    throw new Error(`Receipt transaction failed: ${error.message}`);
  }

  const result = Array.isArray(data) ? data[0] : data;
  if (!result) {
    throw new Error("Receipt transaction returned no result");
  }

  switch (result.result_code) {
    case "completed":
      break;
    case "not_found":
      throw new NotFoundError("Donation not found");
    case "invalid_status":
      throw new ConflictError(
        "Only a delivered donation can be confirmed as received."
      );
    case "not_recipient":
      throw new ForbiddenError(
        "This delivery is addressed to a different NGO."
      );
    case "no_active_assignment":
      throw new ConflictError(
        "This donation has no active volunteer assignment."
      );
    default:
      throw new Error(`Unexpected receipt result: ${result.result_code}`);
  }

  const { data: donation, error: fetchError } = await supabase
    .from("donations")
    .select("*")
    .eq("id", donationId)
    .single();

  if (fetchError || !donation) {
    throw new NotFoundError("Donation not found after confirmation");
  }

  return donation;
}

/**
 * Cancel a donation (donor or admin). Notifies the assigned volunteer.
 */
export async function cancelDonation(donationId, userId, userRole) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .select("id, title, status, donor_id")
    .eq("id", donationId)
    .single();

  if (error || !donation) {
    throw new NotFoundError("Donation not found");
  }

  if (donation.donor_id !== userId && userRole !== "Admin") {
    throw new ForbiddenError("You can only cancel your own donations");
  }

  const currentStatus = normalizeDonationStatus(donation.status);
  if (!canTransition(currentStatus, "CANCELLED")) {
    throw new ConflictError(
      transitionErrorMessage(currentStatus, "CANCELLED")
    );
  }

  const { data: activeAssignment } = await supabase
    .from("assignments")
    .select("volunteer_id")
    .eq("donation_id", donationId)
    .eq("assignment_status", "active")
    .maybeSingle();

  const { data: updatedDonation, error: updateError } = await supabase
    .from("donations")
    .update({ status: "CANCELLED", updated_at: new Date().toISOString() })
    .eq("id", donationId)
    .eq("status", currentStatus)
    .select()
    .maybeSingle();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }
  if (!updatedDonation) {
    throw new ConflictError(
      "Donation status changed while cancellation was being processed."
    );
  }

  await supabase
    .from("assignments")
    .update({ assignment_status: "cancelled" })
    .eq("donation_id", donationId)
    .eq("assignment_status", "active");

  await Promise.all([
    notifySafely({
      recipientId: donation.donor_id,
      eventType: NOTIFICATION_EVENTS.DONATION_CANCELLED,
      title: "Donation Cancelled",
      message: `Your donation "${donation.title}" was cancelled.`,
      data: { donationId: donation.id },
      channels: ["in_app"],
    }),
    activeAssignment?.volunteer_id
      ? notifySafely({
          recipientId: activeAssignment.volunteer_id,
          eventType: NOTIFICATION_EVENTS.DONATION_CANCELLED,
          title: "Assigned Donation Cancelled",
          message: `The donation "${donation.title}" assigned to you was cancelled by the donor.`,
          data: { donationId: donation.id },
          channels: ["in_app"],
        })
      : Promise.resolve(null),
  ]);

  return updatedDonation;
}

/**
 * Update a donation (donor only, only while AVAILABLE).
 */
export async function updateDonation(donationId, userId, updates) {
  if (!isValidUuid(donationId)) {
    throw new ValidationError("Invalid donation ID");
  }

  const { data: donation, error } = await supabase
    .from("donations")
    .select("id, status, donor_id, expires_at, pickup_deadline")
    .eq("id", donationId)
    .single();

  if (error || !donation) {
    throw new NotFoundError("Donation not found");
  }

  if (donation.donor_id !== userId) {
    throw new ForbiddenError("You can only update your own donations");
  }

  const currentStatus = normalizeDonationStatus(donation.status);
  if (currentStatus !== "AVAILABLE") {
    throw new ConflictError("Can only update donations that are AVAILABLE");
  }

  const allowedFields = [
    "title",
    "description",
    "food_category",
    "quantity",
    "unit",
    "prepared_at",
    "expires_at",
    "pickup_deadline",
    "pickup_address",
    "area",
    "pincode",
    "state",
    "country",
    "latitude",
    "longitude",
    "photo_path",
  ];

  const filtered = {};
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      filtered[field] = updates[field];
    }
  }

  if (Object.keys(filtered).length === 0) {
    throw new ValidationError("No valid fields to update");
  }

  if (filtered.title !== undefined && !isNonEmptyText(filtered.title, LIMITS.title)) {
    throw new ValidationError(
      `Title is required and must be at most ${LIMITS.title} characters`
    );
  }

  if (
    filtered.description !== undefined &&
    !isWithinLength(filtered.description, LIMITS.description)
  ) {
    throw new ValidationError(
      `Description must be at most ${LIMITS.description} characters`
    );
  }

  if (
    filtered.pickup_address !== undefined &&
    !isNonEmptyText(filtered.pickup_address, LIMITS.pickupAddress)
  ) {
    throw new ValidationError(
      `Pickup address is required and must be at most ${LIMITS.pickupAddress} characters`
    );
  }

  if (filtered.quantity !== undefined && !isValidQuantity(filtered.quantity)) {
    throw new ValidationError(
      `Quantity must be a positive number no greater than ${LIMITS.quantityMax}`
    );
  }

  if (
    filtered.food_category !== undefined &&
    !DONATION_CATEGORIES.includes(filtered.food_category)
  ) {
    throw new ValidationError(
      `Invalid category. Allowed: ${DONATION_CATEGORIES.join(", ")}`
    );
  }

  if (filtered.unit !== undefined && !DONATION_UNITS.includes(filtered.unit)) {
    throw new ValidationError(
      `Invalid unit. Allowed: ${DONATION_UNITS.join(", ")}`
    );
  }

  if (
    filtered.prepared_at !== undefined &&
    filtered.prepared_at !== null &&
    filtered.prepared_at !== "" &&
    !isValidTimestamp(filtered.prepared_at)
  ) {
    throw new ValidationError("Prepared time must be a valid timestamp");
  }

  for (const [field, max] of [
    ["area", LIMITS.area],
    ["pincode", LIMITS.pincode],
    ["state", LIMITS.state],
    ["country", LIMITS.country],
    ["photo_path", 500],
  ]) {
    if (filtered[field] !== undefined && !isWithinLength(filtered[field], max)) {
      throw new ValidationError(`${field} must be at most ${max} characters`);
    }
  }

  const effectiveExpiry = filtered.expires_at ?? donation.expires_at;
  const effectivePickupDeadline =
    filtered.pickup_deadline ?? donation.pickup_deadline;

  if (filtered.expires_at !== undefined && !isValidExpiry(filtered.expires_at)) {
    throw new ValidationError("Expiry must be a valid future timestamp");
  }

  if (
    (filtered.expires_at !== undefined ||
      filtered.pickup_deadline !== undefined) &&
    !isValidPickupDeadline(effectiveExpiry, effectivePickupDeadline)
  ) {
    throw new ValidationError(
      "Pickup deadline must be in the future and no later than expiry"
    );
  }

  if (
    filtered.latitude !== undefined ||
    filtered.longitude !== undefined
  ) {
    const coordinates = parseCoordinates(
      filtered.latitude,
      filtered.longitude
    );
    if (!coordinates.valid) {
      throw new ValidationError(
        "Latitude and longitude must both be supplied and be valid coordinates"
      );
    }
    filtered.latitude = coordinates.lat;
    filtered.longitude = coordinates.lng;
  }

  const normalized = { ...filtered };
  if (normalized.title !== undefined) normalized.title = normalized.title.trim();
  if (normalized.description !== undefined) {
    normalized.description = normalized.description?.trim() || null;
  }
  if (normalized.pickup_address !== undefined) {
    normalized.pickup_address = normalized.pickup_address.trim();
  }
  for (const field of ["area", "pincode", "state", "country", "photo_path"]) {
    if (normalized[field] !== undefined) {
      normalized[field] = normalized[field]?.trim() || null;
    }
  }
  if (normalized.prepared_at !== undefined) {
    normalized.prepared_at =
      normalized.prepared_at && String(normalized.prepared_at).trim()
        ? new Date(normalized.prepared_at).toISOString()
        : null;
  }
  if (normalized.expires_at !== undefined) {
    normalized.expires_at = new Date(normalized.expires_at).toISOString();
  }
  if (normalized.pickup_deadline !== undefined) {
    normalized.pickup_deadline = new Date(
      normalized.pickup_deadline
    ).toISOString();
  }

  const { data: updatedDonation, error: updateError } = await supabase
    .from("donations")
    .update({ ...normalized, updated_at: new Date().toISOString() })
    .eq("id", donationId)
    .eq("status", "AVAILABLE")
    .select()
    .maybeSingle();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }
  if (!updatedDonation) {
    throw new ConflictError(
      "Donation was claimed or changed while the update was being saved."
    );
  }

  return updatedDonation;
}

/**
 * Get current donation status, throwing 404 when it does not exist.
 */
async function getDonationStatus(donationId) {
  const { data, error } = await supabase
    .from("donations")
    .select("status")
    .eq("id", donationId)
    .single();

  if (error || !data) {
    throw new NotFoundError("Donation not found");
  }

  return normalizeDonationStatus(data.status) || "UNKNOWN";
}

/**
 * Get volunteer's assigned tasks.
 */
export async function getVolunteerTasks(volunteerId) {
  const { data, error } = await supabase
    .from("assignments")
    .select(
      `
      *,
      donations (*)
    `
    )
    .eq("volunteer_id", volunteerId)
    .order("assigned_at", { ascending: false });

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}

/**
 * Mark AVAILABLE donations past their expiry as EXPIRED and notify donors.
 * Invoked by the periodic sweeper in index.js and by the admin endpoint.
 */
export async function processExpiredDonations() {
  const now = new Date().toISOString();

  const { data: expiredDonations, error } = await supabase
    .from("donations")
    .select("id")
    .eq("status", "AVAILABLE")
    .lt("expires_at", now);

  if (error) {
    throw new ValidationError(error.message);
  }

  if (!expiredDonations || expiredDonations.length === 0) {
    return { processed: 0 };
  }

  const ids = expiredDonations.map((donation) => donation.id);

  const { data: updated, error: updateError } = await supabase
    .from("donations")
    .update({ status: "EXPIRED", updated_at: new Date().toISOString() })
    .in("id", ids)
    .eq("status", "AVAILABLE")
    .select("id, title, donor_id");

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  const processedDonations = updated || [];

  await supabase
    .from("assignments")
    .update({ assignment_status: "cancelled" })
    .in("donation_id", ids)
    .eq("assignment_status", "active");

  await Promise.all(
    processedDonations.map((donation) =>
      notifySafely({
        recipientId: donation.donor_id,
        eventType: NOTIFICATION_EVENTS.DONATION_EXPIRED,
        title: "Donation Expired",
        message: `Your donation "${donation.title}" expired before it could be delivered.`,
        data: { donationId: donation.id },
        channels: ["in_app"],
      })
    )
  );

  return { processed: processedDonations.length };
}
