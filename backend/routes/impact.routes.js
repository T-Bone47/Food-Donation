import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import * as impactService from "../services/impact.service.js";
import { ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * GET /api/v1/impact/me
 * Get personal impact metrics
 */
router.get("/me", authMiddleware, async (req, res, next) => {
  try {
    if (!req.auth.role) {
      throw new ValidationError("User role not found");
    }
    const impact = await impactService.getPersonalImpact(req.auth.userId, req.auth.role);
    res.json({
      data: { impact },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/impact/donor
 * Get donor dashboard stats
 */
router.get(
  "/donor",
  authMiddleware,
  requireRole("Donor"),
  async (req, res, next) => {
    try {
      const stats = await impactService.getDonorDashboardStats(req.auth.userId);
      res.json({
        data: { stats },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/impact/volunteer
 * Get volunteer dashboard stats
 */
router.get(
  "/volunteer",
  authMiddleware,
  requireRole("Volunteer"),
  async (req, res, next) => {
    try {
      const stats = await impactService.getVolunteerDashboardStats(req.auth.userId);
      res.json({
        data: { stats },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;