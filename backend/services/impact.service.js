import { supabase } from "../supabase.js";
import { ValidationError } from "../middleware/errorHandler.js";

/**
 * Calculate personal impact metrics for a user.
 * Metrics are derived from COMPLETED donations only.
 */
export async function getPersonalImpact(userId, userRole) {
  let donationsQuery = supabase
    .from("donations")
    .select("id, quantity, unit, food_category, created_at, updated_at")
    .eq("status", "COMPLETED");

  if (userRole === "Donor") {
    donationsQuery = donationsQuery.eq("donor_id", userId);
  } else if (userRole === "Volunteer") {
    // Get completed assignments for this volunteer
    const { data: assignments } = await supabase
      .from("assignments")
      .select("donation_id")
      .eq("volunteer_id", userId)
      .eq("assignment_status", "completed");

    const donationIds = (assignments || []).map((a) => a.donation_id);
    if (donationIds.length === 0) {
      return getEmptyImpact();
    }
    donationsQuery = donationsQuery.in("id", donationIds);
  } else if (userRole === "NGO") {
    // Get completed deliveries confirmed by this NGO
    const { data: confirmations } = await supabase
      .from("delivery_confirmations")
      .select("donation_id")
      .eq("confirmed_by", userId);

    const donationIds = (confirmations || []).map((c) => c.donation_id);
    if (donationIds.length === 0) {
      return getEmptyImpact();
    }
    donationsQuery = donationsQuery.in("id", donationIds);
  } else {
    throw new ValidationError("Unsupported role for impact calculation");
  }

  const { data: donations, error } = await donationsQuery;

  if (error) {
    throw new ValidationError(error.message);
  }

  const completedDonations = donations || [];
  const totalCompleted = completedDonations.length;

  // Aggregate by unit
  const byUnit = {};
  let totalQuantity = 0;

  for (const d of completedDonations) {
    const qty = Number(d.quantity) || 0;
    const unit = d.unit || "servings";
    totalQuantity += qty;
    byUnit[unit] = (byUnit[unit] || 0) + qty;
  }

  // Aggregate by category
  const byCategory = {};
  for (const d of completedDonations) {
    const cat = d.food_category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const recentDonations = completedDonations.filter((d) => d.updated_at >= thirtyDaysAgo);

  return {
    totalCompletedDonations: totalCompleted,
    totalQuantity,
    byUnit,
    byCategory,
    recentActivity: {
      last30Days: recentDonations.length,
      donations: recentDonations.map((d) => ({
        id: d.id,
        quantity: d.quantity,
        unit: d.unit,
        foodCategory: d.food_category,
        completedAt: d.updated_at,
      })),
    },
  };
}

/**
 * Calculate aggregate impact metrics (admin only).
 */
export async function getAggregateImpact(options = {}) {
  const { startDate, endDate, groupBy = "day" } = options;

  let query = supabase
    .from("donations")
    .select("id, quantity, unit, food_category, status, created_at, updated_at")
    .eq("status", "COMPLETED");

  if (startDate) {
    query = query.gte("updated_at", startDate);
  }
  if (endDate) {
    query = query.lte("updated_at", endDate);
  }

  const { data: donations, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  const completedDonations = donations || [];
  const totalCompleted = completedDonations.length;

  let totalQuantity = 0;
  const byUnit = {};
  const byCategory = {};

  for (const d of completedDonations) {
    const qty = Number(d.quantity) || 0;
    const unit = d.unit || "servings";
    totalQuantity += qty;
    byUnit[unit] = (byUnit[unit] || 0) + qty;
    const cat = d.food_category || "Other";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }

  // Active donors (donors with at least one completed donation)
  const { data: donorData } = await supabase
    .from("donations")
    .select("donor_id")
    .eq("status", "COMPLETED");
  const activeDonors = new Set((donorData || []).map((d) => d.donor_id)).size;

  // Active volunteers (volunteers with at least one completed assignment)
  const { data: volunteerData } = await supabase
    .from("assignments")
    .select("volunteer_id")
    .eq("assignment_status", "completed");
  const activeVolunteers = new Set((volunteerData || []).map((v) => v.volunteer_id)).size;

  // Approved NGOs
  const { count: approvedNGOs } = await supabase
    .from("ngo_profiles")
    .select("id", { count: "exact", head: true })
    .eq("verification_status", "approved");

  // Time series data
  const timeSeries = buildTimeSeries(completedDonations, groupBy);

  return {
    totalCompletedDonations: totalCompleted,
    totalQuantity,
    byUnit,
    byCategory,
    activeDonors,
    activeVolunteers,
    approvedNGOs: approvedNGOs || 0,
    timeSeries,
  };
}

/**
 * Get dashboard stats for donor dashboard.
 */
export async function getDonorDashboardStats(donorId) {
  const { data: stats, error } = await supabase
    .from("donations")
    .select("status, quantity")
    .eq("donor_id", donorId);

  if (error) {
    throw new ValidationError(error.message);
  }

  const donations = stats || [];
  const byStatus = {};

  for (const d of donations) {
    const status = d.status || "UNKNOWN";
    byStatus[status] = (byStatus[status] || 0) + 1;
  }

  const totalQuantity = donations
    .filter((d) => d.status === "COMPLETED")
    .reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);

  return {
    totalDonations: donations.length,
    byStatus,
    completedQuantity: totalQuantity,
    activeDonations: byStatus.AVAILABLE || 0,
    completedDonations: byStatus.COMPLETED || 0,
  };
}

/**
 * Get dashboard stats for volunteer dashboard.
 */
export async function getVolunteerDashboardStats(volunteerId) {
  // Completed assignments
  const { data: assignments } = await supabase
    .from("assignments")
    .select("donation_id, assignment_status, picked_up_at, delivered_at")
    .eq("volunteer_id", volunteerId);

  const completedAssignments = (assignments || []).filter(
    (a) => a.assignment_status === "completed"
  );

  // Get quantities from completed donations
  let totalQuantity = 0;
  if (completedAssignments.length > 0) {
    const donationIds = completedAssignments.map((a) => a.donation_id);
    const { data: donations } = await supabase
      .from("donations")
      .select("quantity")
      .in("id", donationIds);
    totalQuantity = (donations || []).reduce((sum, d) => sum + (Number(d.quantity) || 0), 0);
  }

  const activeAssignment = (assignments || []).find(
    (a) => a.assignment_status === "active"
  );

  return {
    totalPickups: completedAssignments.length,
    totalQuantity,
    activeAssignment: activeAssignment ? {
      donationId: activeAssignment.donation_id,
      pickedUp: !!activeAssignment.picked_up_at,
      delivered: !!activeAssignment.delivered_at,
    } : null,
  };
}

function getEmptyImpact() {
  return {
    totalCompletedDonations: 0,
    totalQuantity: 0,
    byUnit: {},
    byCategory: {},
    recentActivity: {
      last30Days: 0,
      donations: [],
    },
  };
}

function buildTimeSeries(donations, groupBy) {
  const groups = {};

  for (const d of donations) {
    const date = new Date(d.updated_at);
    let key;

    if (groupBy === "day") {
      key = date.toISOString().split("T")[0];
    } else if (groupBy === "week") {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split("T")[0];
    } else if (groupBy === "month") {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    } else {
      key = date.toISOString().split("T")[0];
    }

    if (!groups[key]) {
      groups[key] = { count: 0, quantity: 0 };
    }
    groups[key].count += 1;
    groups[key].quantity += Number(d.quantity) || 0;
  }

  return Object.entries(groups)
    .map(([period, data]) => ({ period, ...data }))
    .sort((a, b) => a.period.localeCompare(b.period));
}