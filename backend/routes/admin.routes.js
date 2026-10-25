import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { supabase } from "../supabase.js";
import * as ngoService from "../services/ngo.service.js";
import * as donationService from "../services/donation.service.js";
import * as impactService from "../services/impact.service.js";
import * as notificationService from "../services/notification.service.js";
import { notifySafely, NOTIFICATION_EVENTS } from "../services/notification.service.js";
import { ValidationError, NotFoundError, ConflictError } from "../middleware/errorHandler.js";
import { canTransition, transitionErrorMessage } from "../lib/lifecycle.js";

function sanitizeSearch(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[,()%\\"]/g, " ").replace(/\s+/g, " ").trim();
}

const router = express.Router();

// All admin routes require Admin role
router.use(authMiddleware, requireRole("Admin"));

/**
 * GET /api/v1/admin/verifications
 * List all NGO verification requests
 */
router.get("/verifications", async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const verifications = await ngoService.listNGOVerifications({
      status,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json({
      data: { verifications },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/verifications/:id
 * Approve or reject NGO verification
 */
router.patch("/verifications/:id", async (req, res, next) => {
  try {
    const { decision, notes } = req.body;
    if (!["approved", "rejected"].includes(decision)) {
      throw new ValidationError("Decision must be 'approved' or 'rejected'");
    }
    const profile = await ngoService.reviewNGOVerification(req.params.id, req.auth.userId, decision, notes);

    await notifySafely({
      recipientId: profile.user_id,
      eventType: NOTIFICATION_EVENTS.NGO_VERIFICATION_DECIDED,
      title:
        decision === "approved"
          ? "NGO Verification Approved"
          : "NGO Verification Rejected",
      message:
        decision === "approved"
          ? "Your NGO has been approved. You can now receive and confirm deliveries."
          : `Your NGO verification was rejected.${notes ? ` Reason: ${notes}` : ""}`,
      data: { ngoProfileId: profile.id, decision },
      channels: ["in_app"],
    });

    res.json({
      data: { profile },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/users
 * List all users with pagination and filters
 */
router.get("/users", async (req, res, next) => {
  try {
    const { role, status, limit = 50, offset = 0, search } = req.query;

    let query = supabase
      .from("users")
      .select("id, name, email, role, organization, phonenumber, area, pincode, state, country, account_status, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

    if (role) query = query.eq("role", role);
    if (status) query = query.eq("account_status", status);
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) {
      query = query.or(
        `name.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%,organization.ilike.%${safeSearch}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new ValidationError(error.message);
    }

    res.json({
      data: { users: data || [] },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/admin/users/:id
 * Update user account status (suspend/activate)
 */
router.patch("/users/:id", async (req, res, next) => {
  try {
    const { account_status } = req.body;
    if (!["active", "suspended", "rejected"].includes(account_status)) {
      throw new ValidationError("Invalid account_status. Must be 'active', 'suspended', or 'rejected'");
    }

    const { data: user, error } = await supabase
      .from("users")
      .update({ account_status, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select("id, name, email, role, account_status")
      .single();

    if (error) {
      throw new ValidationError(error.message);
    }

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Audit log
    await notificationService.createAuditLog({
      actorId: req.auth.userId,
      action: "user.status_changed",
      resourceType: "user",
      resourceId: user.id,
      reason: `Account status changed to ${account_status}`,
    });

    res.json({
      data: { user },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/donations
 * List all donations with filters
 */
router.get("/donations", async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0, search } = req.query;

    let query = supabase
      .from("donations")
      .select(`
        *,
        users!donor_id (id, name, email)
      `)
      .order("created_at", { ascending: false })
      .range(parseInt(offset, 10), parseInt(offset, 10) + parseInt(limit, 10) - 1);

    if (status) query = query.eq("status", status.toUpperCase());
    const safeSearch = sanitizeSearch(search);
    if (safeSearch) {
      query = query.or(
        `title.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`
      );
    }

    const { data, error } = await query;

    if (error) {
      throw new ValidationError(error.message);
    }

    res.json({
      data: { donations: data || [] },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/donations/:id
 * Get donation details with assignment info
 */
router.get("/donations/:id", async (req, res, next) => {
  try {
    const { data: donation, error } = await supabase
      .from("donations")
      .select(`
        *,
        users!donor_id (id, name, email, phonenumber),
        assignments (
          id,
          volunteer_id,
          assigned_at,
          picked_up_at,
          delivered_at,
          assignment_status,
          users!volunteer_id (id, name, email, phonenumber)
        ),
        delivery_confirmations (
          id,
          confirmed_by,
          confirmed_at,
          users!confirmed_by (id, name, email)
        )
      `)
      .eq("id", req.params.id)
      .single();

    if (error || !donation) {
      throw new NotFoundError("Donation not found");
    }

    res.json({
      data: { donation },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/donations/:id/expire
 * Manually expire a donation (admin override)
 */
router.post("/donations/:id/expire", async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from("donations")
      .select("id, title, status, donor_id")
      .eq("id", req.params.id)
      .maybeSingle();

    if (fetchError) {
      throw new ValidationError(fetchError.message);
    }
    if (!existing) {
      throw new NotFoundError("Donation not found");
    }

    if (!canTransition(existing.status, "EXPIRED")) {
      throw new ConflictError(
        transitionErrorMessage(existing.status, "EXPIRED")
      );
    }

    const { data: donation, error } = await supabase
      .from("donations")
      .update({ status: "EXPIRED", updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .eq("status", existing.status)
      .select()
      .maybeSingle();

    if (error) {
      throw new ValidationError(error.message);
    }
    if (!donation) {
      throw new ConflictError(
        "Donation status changed while the expiry was being applied."
      );
    }

    // Cancel active assignment (normally none for AVAILABLE donations)
    await supabase
      .from("assignments")
      .update({ assignment_status: "cancelled" })
      .eq("donation_id", req.params.id)
      .eq("assignment_status", "active");

    await notificationService.createAuditLog({
      actorId: req.auth.userId,
      action: "donation.expired",
      resourceType: "donation",
      resourceId: req.params.id,
      reason: "Manually expired by admin",
    });

    await notifySafely({
      recipientId: existing.donor_id,
      eventType: NOTIFICATION_EVENTS.DONATION_EXPIRED,
      title: "Donation Expired",
      message: `Your donation "${existing.title}" was expired by an administrator.`,
      data: { donationId: existing.id },
      channels: ["in_app"],
    });

    res.json({
      data: { donation },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/impact
 * Get aggregate impact metrics
 */
router.get("/impact", async (req, res, next) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const impact = await impactService.getAggregateImpact({
      startDate,
      endDate,
      groupBy,
    });
    res.json({
      data: { impact },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/admin/audit-logs
 * Get audit logs
 */
router.get("/audit-logs", async (req, res, next) => {
  try {
    const { actorId, action, resourceType, limit = 100, offset = 0 } = req.query;
    const logs = await notificationService.getAuditLogs({
      actorId,
      action,
      resourceType,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json({
      data: { logs },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/admin/process-expired
 * Process expired donations (cron endpoint)
 */
router.post("/process-expired", async (req, res, next) => {
  try {
    const result = await donationService.processExpiredDonations();
    res.json({
      data: { result },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;