import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import * as impactService from "../services/impact.service.js";
import * as demoService from "../services/demo.service.js";
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
    if (req.auth?.isDemo) {
      const impact = demoService.getDemoPersonalImpact(req.auth.userId, req.auth.role);
      return res.json({
        data: { impact },
        meta: { requestId: req.requestId },
      });
    }
    try {
      const impact = await impactService.getPersonalImpact(req.auth.userId, req.auth.role);
      res.json({
        data: { impact },
        meta: { requestId: req.requestId },
      });
    } catch (dbErr) {
      const fallbackImpact = {
        role: req.auth.role,
        totalDonations: 0,
        totalDeliveries: 0,
        totalKgRescued: 0,
        mealsProvided: 0,
        co2SavedKg: 0,
      };
      return res.json({
        data: { impact: fallbackImpact },
        meta: { requestId: req.requestId, degraded: true },
      });
    }
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
      if (req.auth?.isDemo) {
        const stats = demoService.getDemoDonorStats(req.auth.userId);
        return res.json({
          data: { stats },
          meta: { requestId: req.requestId },
        });
      }

      try {
        const stats = await impactService.getDonorDashboardStats(req.auth.userId);
        return res.json({
          data: { stats },
          meta: { requestId: req.requestId },
        });
      } catch (dbErr) {
        // Graceful degraded response if database connection fails
        const fallbackStats = {
          totalDonations: 0,
          byStatus: {},
          completedQuantity: 0,
          activeDonations: 0,
          completedDonations: 0,
        };
        return res.json({
          data: { stats: fallbackStats },
          meta: { requestId: req.requestId, degraded: true },
        });
      }
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
      if (req.auth?.isDemo) {
        const stats = demoService.getDemoVolunteerStats(req.auth.userId);
        return res.json({
          data: { stats },
          meta: { requestId: req.requestId },
        });
      }

      try {
        const stats = await impactService.getVolunteerDashboardStats(req.auth.userId);
        return res.json({
          data: { stats },
          meta: { requestId: req.requestId },
        });
      } catch (dbErr) {
        const fallbackStats = {
          totalDeliveries: 0,
          activeTasks: 0,
          totalKgRescued: 0,
          mealsProvided: 0,
        };
        return res.json({
          data: { stats: fallbackStats },
          meta: { requestId: req.requestId, degraded: true },
        });
      }
    } catch (err) {
      next(err);
    }
  }
);

export default router;