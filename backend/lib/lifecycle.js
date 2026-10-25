/**
 * Canonical donation lifecycle state machine.
 *
 * States:
 *   AVAILABLE -> ASSIGNED -> PICKED_UP -> DELIVERED -> COMPLETED
 *   AVAILABLE -> CANCELLED
 *   AVAILABLE -> EXPIRED
 *   ASSIGNED  -> CANCELLED   (authorized release/cancellation)
 *
 * COMPLETED, CANCELLED and EXPIRED are terminal states.
 */

export const DONATION_STATUSES = [
  "AVAILABLE",
  "ASSIGNED",
  "PICKED_UP",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "EXPIRED",
];

export const TERMINAL_STATUSES = ["COMPLETED", "CANCELLED", "EXPIRED"];

export const TRANSITIONS = {
  AVAILABLE: ["ASSIGNED", "CANCELLED", "EXPIRED"],
  ASSIGNED: ["PICKED_UP", "CANCELLED"],
  PICKED_UP: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
};

export function isValidDonationStatus(status) {
  return typeof status === "string" && DONATION_STATUSES.includes(status.toUpperCase());
}

export function normalizeDonationStatus(status) {
  if (typeof status !== "string") return null;
  const normalized = status.toUpperCase();
  return DONATION_STATUSES.includes(normalized) ? normalized : null;
}

/**
 * Returns true when the transition from `current` to `next` is allowed.
 */
export function canTransition(current, next) {
  const from = normalizeDonationStatus(current);
  const to = normalizeDonationStatus(next);
  if (!from || !to) return false;
  if (from === to) return false;
  if (TERMINAL_STATUSES.includes(from)) return false;
  return (TRANSITIONS[from] || []).includes(to);
}

/**
 * Human readable conflict message for an invalid transition.
 */
export function transitionErrorMessage(current, next) {
  const from = normalizeDonationStatus(current) || "UNKNOWN";
  const to = normalizeDonationStatus(next) || "UNKNOWN";
  if (TERMINAL_STATUSES.includes(from)) {
    return `Donation is already in terminal status '${from}' and cannot be transitioned.`;
  }
  if (from === to) {
    return `Donation is already in status '${from}'.`;
  }
  return `Invalid donation status transition from '${from}' to '${to}'.`;
}
