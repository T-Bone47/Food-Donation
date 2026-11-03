import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import { rateLimit } from "../middleware/rateLimit.js";
import * as authService from "../services/auth.service.js";
import * as validators from "../lib/validators.js";
import { ValidationError } from "../middleware/errorHandler.js";
import { revokeToken } from "../lib/token.js";

const router = express.Router();

/**
 * POST /api/v1/auth/signup
 * Register a new user (Donor, Volunteer, or NGO)
 */
router.post(
  "/signup",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, keyPrefix: "signup" }),
  async (req, res, next) => {
    try {
      const { user, token } = await authService.registerUser(req.body);
      res.status(201).json({
        data: { user, token },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/login
 * Authenticate and issue session token
 */
router.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "login" }),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      if (!validators.isValidEmail(email)) {
        throw new ValidationError("Invalid email format");
      }
      if (typeof password !== "string" || !password) {
        throw new ValidationError("Password is required");
      }

      const { user, token } = await authService.loginUser(email, password);
      res.json({
        data: { user, token },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/auth/logout
 * Logout - revokes the current session token
 */
router.post("/logout", authMiddleware, (req, res) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : null;
  
  if (token) {
    revokeToken(token);
  }
  
  res.json({
    data: { message: "Logged out successfully" },
    meta: { requestId: req.requestId },
  });
});

/**
 * GET /api/v1/me
 * Get current authenticated user profile
 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.auth.userId);
    if (!user) {
      throw new ValidationError("User not found");
    }
    res.json({
      data: { user },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/me
 * Update current user profile (allowed fields only)
 */
router.patch("/me", authMiddleware, async (req, res, next) => {
  try {
    const allowedFields = ["name", "organization", "phonenumber", "area", "pincode", "state", "country"];
    
    // Explicitly reject prohibited security fields
    if (req.body.email !== undefined) {
      throw new ValidationError("Email address cannot be changed via profile update");
    }
    if (
      req.body.role !== undefined ||
      req.body.id !== undefined ||
      req.body.account_status !== undefined ||
      req.body.password !== undefined ||
      req.body.password_hash !== undefined
    ) {
      throw new ValidationError("System and authentication fields cannot be modified via profile update");
    }

    // Check for unexpected extra properties
    const extraKeys = Object.keys(req.body).filter((k) => !allowedFields.includes(k));
    if (extraKeys.length > 0) {
      throw new ValidationError(`Unexpected property: '${extraKeys[0]}'`);
    }

    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        const val = req.body[field];
        if (val !== null && typeof val !== "string") {
          throw new ValidationError(`Field '${field}' must be a string or null`);
        }
        updates[field] = val;
      }
    }

    if (Object.keys(updates).length === 0) {
      throw new ValidationError("No valid fields to update");
    }

    if (updates.name !== undefined && !validators.isNonEmptyText(updates.name, validators.LIMITS.name)) {
      throw new ValidationError(
        `Name is required and must be between 1 and ${validators.LIMITS.name} characters`
      );
    }

    if (updates.phonenumber && !validators.isValidPhone(updates.phonenumber)) {
      throw new ValidationError("Invalid phone number format");
    }

    if (updates.pincode && !validators.isValidPincode(updates.pincode)) {
      throw new ValidationError("Invalid pincode format");
    }

    for (const [field, max] of [
      ["organization", validators.LIMITS.organization],
      ["area", validators.LIMITS.area],
      ["state", validators.LIMITS.state],
      ["country", validators.LIMITS.country],
    ]) {
      if (updates[field] && !validators.isWithinLength(updates[field], max)) {
        throw new ValidationError(`${field} must be at most ${max} characters`);
      }
    }

    const user = await authService.updateUserProfile(req.auth.userId, updates);
    res.json({
      data: { user },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/auth/users/:email
 * Admin-only user lookup. This was previously unauthenticated and exposed
 * account existence and profile fields to anyone who knew an email address.
 */
router.get("/users/:email", authMiddleware, requireRole("Admin"), async (req, res, next) => {
  try {
    const { email } = req.params;
    if (!validators.isValidEmail(email)) {
      throw new ValidationError("Invalid email format");
    }

    const user = await authService.getUserByEmail(email);
    if (!user) {
      throw new ValidationError("User not found");
    }

    res.json({
      data: { user },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;