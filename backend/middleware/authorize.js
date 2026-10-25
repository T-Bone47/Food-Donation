/**
 * Role-based authorization middleware.
 * Requires req.auth to be set by authenticate middleware.
 */

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const role = req.auth.role;
    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: `This action requires one of the following roles: ${allowedRoles.join(", ")}.`,
        },
      });
    }

    next();
  };
}

/**
 * Resource ownership authorization.
 * Checks that the authenticated user owns the resource being accessed.
 * The `resourceUserIdExtractor` is a function that receives req and returns the resource owner's user ID.
 */
export function requireOwnership(resourceUserIdExtractor) {
  return (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const resourceUserId = resourceUserIdExtractor(req);
    if (!resourceUserId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Could not determine resource ownership.",
        },
      });
    }

    if (req.auth.userId !== resourceUserId && req.auth.role !== "Admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this resource.",
        },
      });
    }

    next();
  };
}

/**
 * Donation ownership check - extracts donor_id from donation record.
 * Use with req.params.id for donation ID.
 */
export function requireDonationOwnership(supabase) {
  return async (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const donationId = req.params.id;
    if (!donationId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Donation ID required.",
        },
      });
    }

    const { data: donation, error } = await supabase
      .from("donations")
      .select("donor_id")
      .eq("id", donationId)
      .single();

    if (error || !donation) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Donation not found.",
        },
      });
    }

    if (req.auth.userId !== donation.donor_id && req.auth.role !== "Admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You do not have permission to access this donation.",
        },
      });
    }

    req.donation = donation;
    next();
  };
}

/**
 * Assignment ownership check - volunteer can only access their own assignments.
 */
export function requireAssignmentOwnership(supabase) {
  return async (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    const donationId = req.params.id;
    if (!donationId) {
      return res.status(400).json({
        error: {
          code: "BAD_REQUEST",
          message: "Donation ID required.",
        },
      });
    }

    const { data: assignment, error } = await supabase
      .from("assignments")
      .select("volunteer_id")
      .eq("donation_id", donationId)
      .eq("assignment_status", "active")
      .single();

    if (error || !assignment) {
      return res.status(404).json({
        error: {
          code: "NOT_FOUND",
          message: "Active assignment not found for this donation.",
        },
      });
    }

    if (req.auth.userId !== assignment.volunteer_id && req.auth.role !== "Admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "You are not assigned to this donation.",
        },
      });
    }

    req.assignment = assignment;
    next();
  };
}

/**
 * NGO authorization - only approved NGOs can confirm receipt.
 */
export function requireApprovedNGO(supabase) {
  return async (req, res, next) => {
    if (!req.auth) {
      return res.status(401).json({
        error: {
          code: "UNAUTHENTICATED",
          message: "Authentication required.",
        },
      });
    }

    if (req.auth.role !== "NGO" && req.auth.role !== "Admin") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Only NGOs can confirm receipt.",
        },
      });
    }

    const { data: profile, error } = await supabase
      .from("ngo_profiles")
      .select("verification_status")
      .eq("user_id", req.auth.userId)
      .single();

    if (error || !profile) {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "NGO profile not found.",
        },
      });
    }

    if (profile.verification_status !== "approved") {
      return res.status(403).json({
        error: {
          code: "FORBIDDEN",
          message: "Your NGO is not yet approved to confirm receipts.",
        },
      });
    }

    req.ngoProfile = profile;
    next();
  };
}