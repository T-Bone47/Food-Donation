import { supabase } from "../supabase.js";
import { isValidEmail } from "../lib/validators.js";
import { ValidationError, NotFoundError, ConflictError, ForbiddenError } from "../middleware/errorHandler.js";

/**
 * Submit NGO verification request.
 */
export async function submitNGOVerification(userId, data) {
  const {
    organization_name,
    registration_number,
    address,
    contact_person,
    contact_email,
    contact_phone,
    description,
    documents,
  } = data;

  // Validation
  const errors = [];

  if (!organization_name || typeof organization_name !== "string" || !organization_name.trim()) {
    errors.push({ field: "organization_name", message: "Organization name is required" });
  }

  if (!registration_number || typeof registration_number !== "string" || !registration_number.trim()) {
    errors.push({ field: "registration_number", message: "Registration number is required" });
  }

  if (!address || typeof address !== "string" || !address.trim()) {
    errors.push({ field: "address", message: "Address is required" });
  }

  if (!contact_person || typeof contact_person !== "string" || !contact_person.trim()) {
    errors.push({ field: "contact_person", message: "Contact person is required" });
  }

  if (!isValidEmail(contact_email)) {
    errors.push({ field: "contact_email", message: "Valid contact email is required" });
  }

  if (!contact_phone || typeof contact_phone !== "string" || !contact_phone.trim()) {
    errors.push({ field: "contact_phone", message: "Contact phone is required" });
  }

  if (errors.length > 0) {
    throw new ValidationError("NGO verification validation failed", errors);
  }

  // Check if user already has a pending/approved NGO profile
  const { data: existing } = await supabase
    .from("ngo_profiles")
    .select("id, verification_status")
    .eq("user_id", userId)
    .single();

  if (existing) {
    if (existing.verification_status === "pending") {
      throw new ConflictError("Your NGO verification is already pending review");
    }
    if (existing.verification_status === "approved") {
      throw new ConflictError("Your NGO is already verified");
    }
    // If rejected, allow resubmission by updating
  }

  const { data: profile, error } = await supabase
    .from("ngo_profiles")
    .upsert(
      {
        user_id: userId,
        organization_name: organization_name.trim(),
        registration_number: registration_number.trim(),
        address: address.trim(),
        contact_person: contact_person.trim(),
        contact_email: contact_email.trim().toLowerCase(),
        contact_phone: contact_phone.trim(),
        description: description?.trim() || null,
        documents: documents || null,
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  return profile;
}

/**
 * Get NGO verification status for current user.
 */
export async function getNGOVerificationStatus(userId) {
  const { data: profile, error } = await supabase
    .from("ngo_profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !profile) {
    return null;
  }

  return profile;
}

/**
 * Admin: List all NGO verification requests.
 */
export async function listNGOVerifications(options = {}) {
  const { status, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("ngo_profiles")
    .select(`
      *,
      users!user_id (id, name, email, created_at)
    `)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) {
    query = query.eq("verification_status", status);
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}

/**
 * Admin: Approve or reject NGO verification.
 */
export async function reviewNGOVerification(profileId, adminId, decision, notes) {
  if (!["approved", "rejected"].includes(decision)) {
    throw new ValidationError("Decision must be 'approved' or 'rejected'");
  }

  const { data: profile, error } = await supabase
    .from("ngo_profiles")
    .select("*")
    .eq("id", profileId)
    .single();

  if (error || !profile) {
    throw new NotFoundError("NGO profile not found");
  }

  const { data: updated, error: updateError } = await supabase
    .from("ngo_profiles")
    .update({
      verification_status: decision,
      verification_notes: notes?.trim() || null,
      verified_by: adminId,
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", profileId)
    .select()
    .single();

  if (updateError) {
    throw new ValidationError(updateError.message);
  }

  // If approved, also update user's account_status to active (if it was pending)
  if (decision === "approved") {
    await supabase
      .from("users")
      .update({ account_status: "active", updated_at: new Date().toISOString() })
      .eq("id", profile.user_id);
  }

  return updated;
}

/**
 * Get approved NGOs for dropdown/selection.
 */
export async function getApprovedNGOs() {
  const { data, error } = await supabase
    .from("ngo_profiles")
    .select(
      "id, user_id, organization_name, address, contact_person, contact_email, contact_phone"
    )
    .eq("verification_status", "approved")
    .order("organization_name");

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}

/**
 * Get incoming deliveries for an approved NGO.
 */
export async function getIncomingDeliveries(ngoId) {
  // Get NGO profile
  const { data: profile } = await supabase
    .from("ngo_profiles")
    .select("id")
    .eq("user_id", ngoId)
    .eq("verification_status", "approved")
    .single();

  if (!profile) {
    throw new ForbiddenError("NGO not found or not approved");
  }

  // Only deliveries addressed to this organisation are visible. Previously
  // every approved NGO saw every delivered donation.
  const { data, error } = await supabase
    .from("donations")
    .select(`
      *,
      assignments!inner (
        id,
        volunteer_id,
        delivered_at
      ),
      delivery_confirmations (
        id,
        confirmed_at
      )
    `)
    .eq("status", "DELIVERED")
    .eq("recipient_ngo_id", ngoId)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new ValidationError(error.message);
  }

  // Filter to only those without confirmation
  return (data || []).filter(
    (d) => !d.delivery_confirmations || d.delivery_confirmations.length === 0
  );
}

/**
 * Completed delivery history for an approved NGO.
 */
export async function getNGOHistory(ngoId) {
  const { data: profile } = await supabase
    .from("ngo_profiles")
    .select("id")
    .eq("user_id", ngoId)
    .eq("verification_status", "approved")
    .maybeSingle();

  if (!profile) {
    throw new ForbiddenError("NGO not found or not approved");
  }

  const { data, error } = await supabase
    .from("donations")
    .select(`
      *,
      delivery_confirmations!inner (
        id,
        confirmed_at,
        confirmed_by
      )
    `)
    .eq("status", "COMPLETED")
    .eq("recipient_ngo_id", ngoId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}