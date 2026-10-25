import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import * as donationService from "../services/donation.service.js";
import * as impactService from "../services/impact.service.js";
import { ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * GET /api/v1/volunteer/tasks
 * Get volunteer's assigned tasks
 */
router.get(
  "/tasks",
  authMiddleware,
  requireRole("Volunteer"),
  async (req, res, next) => {
    try {
      const tasks = await donationService.getVolunteerTasks(req.auth.userId);
      res.json({
        data: { tasks },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/volunteer/dashboard
 * Get volunteer dashboard stats
 */
router.get(
  "/dashboard",
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

/**
 * GET /api/v1/volunteer/impact
 * Get volunteer impact metrics
 */
router.get(
  "/impact",
  authMiddleware,
  requireRole("Volunteer"),
  async (req, res, next) => {
    try {
      const impact = await impactService.getPersonalImpact(req.auth.userId, "Volunteer");
      res.json({
        data: { impact },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;