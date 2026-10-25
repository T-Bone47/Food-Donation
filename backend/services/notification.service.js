import { supabase } from "../supabase.js";
import { ValidationError, NotFoundError } from "../middleware/errorHandler.js";

/**
 * Notification event types.
 */
export const NOTIFICATION_EVENTS = {
  DONATION_CREATED: "donation.created",
  DONATION_CLAIMED: "donation.claimed",
  DONATION_PICKUP_RECORDED: "donation.pickup_recorded",
  DONATION_DELIVERED: "donation.delivered",
  DONATION_COMPLETED: "donation.completed",
  DONATION_CANCELLED: "donation.cancelled",
  DONATION_EXPIRED: "donation.expired",
  NGO_VERIFICATION_SUBMITTED: "ngo.verification_submitted",
  NGO_VERIFICATION_DECIDED: "ngo.verification_decided",
};

export const NOTIFICATION_CHANNELS = ["in_app", "push", "email", "sms", "whatsapp"];

export function isValidEventType(eventType) {
  return (
    typeof eventType === "string" &&
    (Object.values(NOTIFICATION_EVENTS).includes(eventType) ||
      eventType.startsWith("custom."))
  );
}

/**
 * Create a notification record and optionally dispatch via providers.
 * Returns the created notification record.
 *
 * Notification failures must not roll back an already-committed donation
 * transition. Callers that are not testing notification persistence should
 * use notifySafely() instead.
 */
export async function createNotification({
  recipientId,
  eventType,
  title,
  message,
  data = {},
  channels = ["in_app"],
}) {
  if (!recipientId) {
    throw new ValidationError("recipientId is required");
  }

  // NOTIFICATION_EVENTS maps constant names to wire values, so validating
  // with NOTIFICATION_EVENTS[eventType] rejected every real event value.
  if (!isValidEventType(eventType)) {
    throw new ValidationError(`Invalid eventType: ${eventType}`);
  }

  const { data: notification, error } = await supabase
    .from("notifications")
    .insert([
      {
        recipient_id: recipientId,
        event_type: eventType,
        title,
        message,
        data,
        channels,
        delivery_status: "pending",
        attempts: 0,
      },
    ])
    .select()
    .single();

  if (error) {
    throw new ValidationError(error.message);
  }

  // Dispatch asynchronously (fire and forget for in-app; real providers would be async)
  dispatchNotification(notification).catch((err) => {
    console.error("Notification dispatch failed:", err);
  });

  return notification;
}

/**
 * Best-effort notification used from business routes. Core state changes have
 * already been committed at this point, so a notification failure is logged
 * and never converted into a failed donation operation.
 */
export async function notifySafely(payload) {
  try {
    return await createNotification(payload);
  } catch (err) {
    console.error("Notification could not be persisted:", {
      eventType: payload?.eventType,
      recipientId: payload?.recipientId,
      message: err.message,
    });
    return null;
  }
}

/**
 * Dispatch notification to configured channels.
 * This is a stub - real implementation would use Firebase, email, SMS providers.
 */
async function dispatchNotification(notification) {
  try {
    // in_app is delivered by being persisted. External channels have no
    // configured provider in this repository and must not be reported as sent.
    const externalChannels = (notification.channels || []).filter(
      (channel) => channel !== "in_app"
    );

    if (externalChannels.length > 0) {
      await supabase
        .from("notifications")
        .update({
          delivery_status: "failed",
          last_error: `No provider configured for channels: ${externalChannels.join(", ")}`,
        })
        .eq("id", notification.id);
      return;
    }

    await supabase
      .from("notifications")
      .update({ delivery_status: "sent", sent_at: new Date().toISOString() })
      .eq("id", notification.id);

    console.log(
      `[NOTIFICATION] Stored in-app notification ${notification.event_type} for user ${notification.recipient_id}`
    );
  } catch (err) {
    // Increment attempts and mark for retry
    await supabase
      .from("notifications")
      .update({
        attempts: notification.attempts + 1,
        delivery_status: "failed",
        last_error: err.message,
      })
      .eq("id", notification.id);
  }
}

/**
 * Get notifications for a user.
 */
export async function getUserNotifications(userId, options = {}) {
  const { unreadOnly = false, limit = 50, offset = 0 } = options;

  let query = supabase
    .from("notifications")
    .select("*")
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}

/**
 * Mark notification as read.
 */
export async function markNotificationRead(notificationId, userId) {
  const { data, error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .eq("recipient_id", userId)
    .select()
    .single();

  if (error || !data) {
    throw new NotFoundError("Notification not found");
  }

  return data;
}

/**
 * Mark all notifications as read for a user.
 */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ read: true, read_at: new Date().toISOString() })
    .eq("recipient_id", userId)
    .eq("read", false);

  if (error) {
    throw new ValidationError(error.message);
  }

  return { success: true };
}

/**
 * Create audit log entry.
 */
export async function createAuditLog({
  actorId,
  action,
  resourceType,
  resourceId,
  reason = null,
  metadata = {},
}) {
  const { error } = await supabase.from("audit_logs").insert([
    {
      actor_id: actorId,
      action,
      resource_type: resourceType,
      resource_id: resourceId,
      reason,
      metadata,
      created_at: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.error("Audit log creation failed:", error);
    // Don't throw - audit logging should not break the main flow
  }
}

/**
 * Get audit logs (admin only).
 */
export async function getAuditLogs(options = {}) {
  const { actorId, action, resourceType, limit = 100, offset = 0 } = options;

  let query = supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (actorId) query = query.eq("actor_id", actorId);
  if (action) query = query.eq("action", action);
  if (resourceType) query = query.eq("resource_type", resourceType);

  const { data, error } = await query;

  if (error) {
    throw new ValidationError(error.message);
  }

  return data || [];
}