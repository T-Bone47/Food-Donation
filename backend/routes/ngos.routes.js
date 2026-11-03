import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole } from "../middleware/authorize.js";
import * as ngoService from "../services/ngo.service.js";
import * as impactService from "../services/impact.service.js";
import * as demoService from "../services/demo.service.js";
import { ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * POST /api/v1/ngos/verification
 * Submit NGO verification request (NGO role only)
 */
router.post(
  "/verification",
  authMiddleware,
  requireRole("NGO"),
  async (req, res, next) => {
    try {
      const profile = await ngoService.submitNGOVerification(req.auth.userId, req.body);
      res.status(201).json({
        data: { profile },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ngos/verification
 * Get own NGO verification status
 */
router.get(
  "/verification",
  authMiddleware,
  requireRole("NGO"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const profile = demoService.getDemoNGOVerificationStatus(req.auth.userId);
        return res.json({
          data: { profile },
          meta: { requestId: req.requestId },
        });
      }

      const profile = await ngoService.getNGOVerificationStatus(req.auth.userId);
      res.json({
        data: { profile },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ngos/incoming
 * Get incoming deliveries for approved NGO
 */
router.get(
  "/incoming",
  authMiddleware,
  requireRole("NGO"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const deliveries = demoService.getDemoIncomingDeliveries(req.auth.userId);
        return res.json({
          data: { deliveries },
          meta: { requestId: req.requestId },
        });
      }

      const deliveries = await ngoService.getIncomingDeliveries(req.auth.userId);
      res.json({
        data: { deliveries },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ngos/history
 * Completed delivery history for the approved NGO
 */
router.get(
  "/history",
  authMiddleware,
  requireRole("NGO"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const history = demoService.getDemoDonations({ status: "COMPLETED" }).map((d) => ({
          ...d,
          delivery_confirmations: [{ id: "mock-dc", donation_id: d.id, confirmed_at: d.updated_at }],
        }));
        return res.json({
          data: { history },
          meta: { requestId: req.requestId },
        });
      }

      const history = await ngoService.getNGOHistory(req.auth.userId);
      res.json({
        data: { history },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ngos/impact
 * Get NGO impact metrics
 */
router.get(
  "/impact",
  authMiddleware,
  requireRole("NGO"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const impact = {
          totalCompletedDonations: 4,
          totalQuantity: 120,
          byUnit: { meals: 80, kg: 40 },
          byCategory: { "Cooked Meals": 80, "Raw Produce": 40 },
        };
        return res.json({
          data: { impact },
          meta: { requestId: req.requestId },
        });
      }

      const impact = await impactService.getPersonalImpact(req.auth.userId, "NGO");
      res.json({
        data: { impact },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/ngos/approved
 * Get list of approved NGOs (public for volunteer/donor reference)
 */
router.get(
  "/approved",
  authMiddleware,
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const ngos = [
          {
            id: demoService.DEMO_USERS.ngo.id,
            name: demoService.DEMO_USERS.ngo.organization,
            area: "Indiranagar",
            state: "Karnataka",
          },
        ];
        return res.json({
          data: { ngos },
          meta: { requestId: req.requestId },
        });
      }

      const ngos = await ngoService.getApprovedNGOs();
      res.json({
        data: { ngos },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;