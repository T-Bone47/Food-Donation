import express from "express";
import { rateLimit } from "../middleware/rateLimit.js";
import { authMiddleware } from "../middleware/authenticate.js";
import * as demoService from "../services/demo.service.js";
import { broadcastRealtimeEvent } from "../services/realtime.service.js";
import { ValidationError, ForbiddenError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * POST /api/v1/demo/session
 * Establish an authenticated session for one of the 4 demo roles.
 */
router.post(
  "/session",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: "demo-session" }),
  async (req, res, next) => {
    try {
      const { role } = req.body || {};
      if (!role || typeof role !== "string") {
        throw new ValidationError("A demo role is required (donor, volunteer, ngo, admin).");
      }

      const result = demoService.authenticateDemoRole(role);
      res.json({
        data: result,
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/demo/identities
 * Retrieve descriptions and metadata for all 4 available demo roles.
 */
router.get("/identities", (req, res) => {
  const identities = [
    {
      role: "donor",
      title: "Donor Demo",
      displayName: "Demo Food Donor",
      roleEnum: "Donor",
      description: "Explore surplus food listings, create donations and track donation progress.",
      icon: "Soup",
      organization: "Community Kitchen Demo",
      startUrl: "/donordash",
    },
    {
      role: "volunteer",
      title: "Volunteer Demo",
      displayName: "Demo Volunteer",
      roleEnum: "Volunteer",
      description: "Explore available donations, claim pickup tasks and complete deliveries.",
      icon: "Truck",
      organization: "Youth Food Rescue Corps",
      startUrl: "/volunteerdash",
    },
    {
      role: "ngo",
      title: "NGO Demo",
      displayName: "Demo NGO",
      roleEnum: "NGO",
      description: "Explore incoming donations, delivery tracking and receipt confirmation.",
      icon: "Building",
      organization: "Hope Shelter Foundation",
      startUrl: "/ngodash",
    },
    {
      role: "admin",
      title: "Admin Demo",
      displayName: "Demo Administrator",
      roleEnum: "Admin",
      description: "Explore donation management, user management and platform activity.",
      icon: "ShieldCheck",
      organization: "FoodShare Platform Governance",
      startUrl: "/adminpage",
    },
  ];

  res.json({
    data: { identities },
    meta: { requestId: req.requestId },
  });
});

/**
 * POST /api/v1/demo/reset
 * Reverts the demo environment state back to the pristine initial seed scenario.
 * Strictly forbidden for non-demo tokens or unauthenticated requests.
 */
router.post("/reset", authMiddleware, (req, res, next) => {
  try {
    if (!req.auth || !req.auth.isDemo) {
      throw new ForbiddenError("Demo reset is only permitted within an active demo session.");
    }

    const summary = demoService.resetDemoState();
    broadcastRealtimeEvent("demo.reset", {
      message: "Demo environment successfully reset to pristine seed state.",
      seedSummary: summary,
    }, { isDemo: true });
    res.json({
      data: {
        message: "Demo environment successfully reset to pristine seed state.",
        seedSummary: summary,
      },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/demo/status
 * Get quick metrics of current demo scenario
 */
router.get("/status", authMiddleware, (req, res, next) => {
  try {
    if (!req.auth || !req.auth.isDemo) {
      throw new ForbiddenError("Demo status is only accessible within an active demo session.");
    }

    const stats = demoService.getDemoAdminStats();
    res.json({
      data: { stats },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;

