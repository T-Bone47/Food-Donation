import express from "express";
import { authMiddleware } from "../middleware/authenticate.js";
import * as notificationService from "../services/notification.service.js";
import * as demoService from "../services/demo.service.js";
import { ValidationError } from "../middleware/errorHandler.js";

const router = express.Router();

/**
 * GET /api/v1/notifications
 * Get current user's notifications
 */
router.get("/", authMiddleware, async (req, res, next) => {
  try {
    if (req.auth?.isDemo) {
      const notifications = demoService.getDemoNotifications(req.auth.userId);
      return res.json({
        data: { notifications },
        meta: { requestId: req.requestId },
      });
    }

    const { unreadOnly = false, limit = 50, offset = 0 } = req.query;
    const notifications = await notificationService.getUserNotifications(req.auth.userId, {
      unreadOnly: unreadOnly === "true",
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
    });
    res.json({
      data: { notifications },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/:id/read
 * Mark notification as read
 */
router.post("/:id/read", authMiddleware, async (req, res, next) => {
  try {
    if (req.auth?.isDemo) {
      const notification = demoService.markDemoNotificationRead(req.params.id, req.auth.userId);
      return res.json({
        data: { notification },
        meta: { requestId: req.requestId },
      });
    }

    const notification = await notificationService.markNotificationRead(req.params.id, req.auth.userId);
    res.json({
      data: { notification },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/notifications/read-all
 * Mark all notifications as read
 */
router.post("/read-all", authMiddleware, async (req, res, next) => {
  try {
    await notificationService.markAllNotificationsRead(req.auth.userId);
    res.json({
      data: { success: true },
      meta: { requestId: req.requestId },
    });
  } catch (err) {
    next(err);
  }
});

export default router;