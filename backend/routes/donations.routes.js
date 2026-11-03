import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import { requireRole, requireDonationOwnership, requireAssignmentOwnership, requireApprovedNGO } from "../middleware/authorize.js";
import { supabase } from "../supabase.js";
import * as donationService from "../services/donation.service.js";
import * as demoService from "../services/demo.service.js";
import { broadcastRealtimeEvent } from "../services/realtime.service.js";
import {
  notifySafely,
  NOTIFICATION_EVENTS,
} from "../services/notification.service.js";
import { ValidationError, NotFoundError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * POST /api/v1/donations
 * Create a new donation listing (Donor only)
 */
router.post(
  "/",
  authMiddleware,
  requireRole("Donor"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donation = demoService.createDemoDonation(req.auth.userId, req.body);
        broadcastRealtimeEvent("donation.created", donation, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.status(201).json({
          data: { donation },
          meta: { requestId: req.requestId },
        });
      }

      const donation = await donationService.createDonation(
        req.auth.userId,
        req.body
      );

      // Best-effort broadcast to active volunteers in the pickup pincode.
      await donationService.notifyVolunteersAboutDonation(donation);

      broadcastRealtimeEvent("donation.created", donation, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.status(201).json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/donations/mine
 * Get current donor's donations
 */
router.get("/mine", authMiddleware, requireRole("Donor"), async (req, res, next) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    if (req.auth?.isDemo) {
      const donations = demoService.getDemoDonations({
        donorId: req.auth.userId,
        status: status ? String(status).toUpperCase() : undefined,
      });
      return res.json({
        data: { donations },
        meta: { requestId: req.requestId },
      });
    }

    try {
      const donations = await donationService.getDonationsByDonor(req.auth.userId, {
        status,
        limit: parseInt(limit, 10),
        offset: parseInt(offset, 10),
      });
      res.json({
        data: { donations },
        meta: { requestId: req.requestId },
      });
    } catch (dbErr) {
      return res.json({
        data: { donations: [] },
        meta: { requestId: req.requestId, degraded: true },
      });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/donations/available
 * Get available donations for volunteers
 */
router.get(
  "/available",
  authMiddleware,
  requireRole("Volunteer"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donations = demoService.getDemoDonations({ status: "AVAILABLE" });
        return res.json({
          data: { donations },
          meta: { requestId: req.requestId },
        });
      }

      // Get user's location for filtering
      const { data: user } = await supabase
        .from("users")
        .select("area, pincode, state")
        .eq("id", req.auth.userId)
        .single();

      const donations = await donationService.getAvailableDonations(req.auth.userId, user || {});
      res.json({
        data: { donations },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/v1/donations/:id
 * Get donation details (authorized roles)
 */
router.get("/:id", authMiddleware, async (req, res, next) => {
  try {
    if (req.auth?.isDemo) {
      const donation = demoService.getDemoDonationById(req.params.id);
      if (!donation) throw new NotFoundError("Donation not found");
      return res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    }

    const donation = await donationService.getDonationById(req.params.id, req.auth.userId, req.auth.role);
    res.json({
      data: { donation },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/v1/donations/:id
 * Update donation (owner only, only when AVAILABLE)
 */
router.patch(
  "/:id",
  authMiddleware,
  requireDonationOwnership(supabase),
  async (req, res, next) => {
    try {
      const donation = await donationService.updateDonation(req.params.id, req.auth.userId, req.body);
      res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/cancel
 * Cancel donation (owner or admin)
 */
router.post(
  "/:id/cancel",
  authMiddleware,
  requireDonationOwnership(supabase),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donation = demoService.cancelDemoDonation(
          req.params.id,
          req.auth.userId,
          req.auth.role
        );
        broadcastRealtimeEvent("donation.cancelled", donation, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.json({
          data: { donation },
          meta: { requestId: req.requestId },
        });
      }

      const donation = await donationService.cancelDonation(
        req.params.id,
        req.auth.userId,
        req.auth.role
      );

      broadcastRealtimeEvent("donation.cancelled", donation, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/claim
 * Atomically claim a donation (Volunteer only)
 */
router.post(
  "/:id/claim",
  authMiddleware,
  requireRole("Volunteer"),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const { donation, assignment } = demoService.claimDemoDonation(
          req.params.id,
          req.auth.userId
        );
        broadcastRealtimeEvent("donation.assigned", { donation, assignment }, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.status(201).json({
          data: { donation, assignment },
          meta: { requestId: req.requestId },
        });
      }

      const { donation, assignment } = await donationService.claimDonation(
        req.params.id,
        req.auth.userId
      );

      await notifySafely({
        recipientId: donation.donor_id,
        eventType: NOTIFICATION_EVENTS.DONATION_CLAIMED,
        title: "Donation Claimed",
        message: `Your donation "${donation.title}" has been claimed by a volunteer.`,
        data: { donationId: donation.id, assignmentId: assignment.id },
        channels: ["in_app"],
      });

      broadcastRealtimeEvent("donation.assigned", { donation, assignment }, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.status(201).json({
        data: { donation, assignment },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/pickup
 * Record pickup (assigned volunteer only)
 */
router.post(
  "/:id/pickup",
  authMiddleware,
  requireRole("Volunteer"),
  requireAssignmentOwnership(supabase),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donation = demoService.pickupDemoDonation(
          req.params.id,
          req.auth.userId
        );
        broadcastRealtimeEvent("donation.pickup_confirmed", donation, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.json({
          data: { donation },
          meta: { requestId: req.requestId },
        });
      }

      const donation = await donationService.recordPickup(
        req.params.id,
        req.auth.userId
      );

      await notifySafely({
        recipientId: donation.donor_id,
        eventType: NOTIFICATION_EVENTS.DONATION_PICKUP_RECORDED,
        title: "Donation Picked Up",
        message: `Your donation "${donation.title}" has been picked up by the volunteer.`,
        data: { donationId: donation.id },
        channels: ["in_app"],
      });

      broadcastRealtimeEvent("donation.pickup_confirmed", donation, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/deliver
 * Record delivery (assigned volunteer only)
 */
router.post(
  "/:id/deliver",
  authMiddleware,
  requireRole("Volunteer"),
  requireAssignmentOwnership(supabase),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donation = demoService.deliverDemoDonation(
          req.params.id,
          req.auth.userId,
          req.body?.ngo_id
        );
        broadcastRealtimeEvent("donation.delivery_confirmed", donation, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.json({
          data: { donation },
          meta: { requestId: req.requestId },
        });
      }

      const donation = await donationService.recordDelivery(
        req.params.id,
        req.auth.userId,
        req.body?.ngo_id
      );

      await Promise.all([
        notifySafely({
          recipientId: donation.donor_id,
          eventType: NOTIFICATION_EVENTS.DONATION_DELIVERED,
          title: "Donation Delivered",
          message: `Your donation "${donation.title}" has been delivered to the receiving NGO.`,
          data: { donationId: donation.id },
          channels: ["in_app"],
        }),
        notifySafely({
          recipientId: donation.recipient_ngo_id,
          eventType: NOTIFICATION_EVENTS.DONATION_DELIVERED,
          title: "Incoming Food Delivery",
          message: `"${donation.title}" has been delivered and is awaiting your receipt confirmation.`,
          data: { donationId: donation.id },
          channels: ["in_app"],
        }),
      ]);

      broadcastRealtimeEvent("donation.delivery_confirmed", donation, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/v1/donations/:id/confirm-receipt
 * Confirm receipt by authorized NGO
 */
router.post(
  "/:id/confirm-receipt",
  authMiddleware,
  requireRole("NGO"),
  requireApprovedNGO(supabase),
  async (req, res, next) => {
    try {
      if (req.auth?.isDemo) {
        const donation = demoService.confirmDemoReceipt(
          req.params.id,
          req.auth.userId
        );
        broadcastRealtimeEvent("donation.receipt_confirmed", donation, {
          isDemo: true,
          actorId: req.auth.userId,
          entityId: donation.id,
        });
        return res.json({
          data: { donation },
          meta: { requestId: req.requestId },
        });
      }

      const donation = await donationService.confirmReceipt(
        req.params.id,
        req.auth.userId
      );

      const { data: assignment } = await supabase
        .from("assignments")
        .select("volunteer_id")
        .eq("donation_id", donation.id)
        .eq("assignment_status", "completed")
        .maybeSingle();

      await Promise.all([
        notifySafely({
          recipientId: donation.donor_id,
          eventType: NOTIFICATION_EVENTS.DONATION_COMPLETED,
          title: "Donation Completed",
          message: `Your donation "${donation.title}" has been confirmed received by the NGO.`,
          data: { donationId: donation.id },
          channels: ["in_app"],
        }),
        assignment?.volunteer_id
          ? notifySafely({
              recipientId: assignment.volunteer_id,
              eventType: NOTIFICATION_EVENTS.DONATION_COMPLETED,
              title: "Delivery Confirmed",
              message: `Your delivery of "${donation.title}" has been confirmed by the NGO.`,
              data: { donationId: donation.id },
              channels: ["in_app"],
            })
          : Promise.resolve(null),
      ]);

      broadcastRealtimeEvent("donation.receipt_confirmed", donation, {
        isDemo: false,
        actorId: req.auth.userId,
        entityId: donation.id,
      });

      res.json({
        data: { donation },
        meta: { requestId: req.requestId },
      });
    } catch (err) {
      next(err);
    }
  }
);

export default router;