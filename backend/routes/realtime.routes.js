import express from "express";
import { verifySessionToken } from "../lib/token.js";
import { registerClient, getRealtimeDiagnostics, broadcastRealtimeEvent } from "../services/realtime.service.js";
import { getDemoUserById } from "../services/demo.service.js";
import { supabase } from "../supabase.js";

const router = express.Router();

/**
 * GET /api/v1/realtime/stream
 * Server-Sent Events (SSE) streaming endpoint.
 * Accepts authentication token via query parameter (?token=...) or Authorization header.
 */
router.get("/stream", async (req, res) => {
  let token = null;

  const authHeader = req.headers.authorization || "";
  if (authHeader.startsWith("Bearer ")) {
    token = authHeader.slice(7).trim();
  } else if (req.query?.token) {
    token = String(req.query.token).trim();
  }

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication token required for real-time streaming subscription.",
      },
    });
  }

  const tokenUser = verifySessionToken(token);
  if (!tokenUser) {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Invalid or expired session token.",
      },
    });
  }

  let userId = tokenUser.userId;
  let role = tokenUser.role;
  let isDemo = Boolean(tokenUser.isDemo);

  if (isDemo) {
    const demoUser = getDemoUserById(userId);
    if (demoUser) {
      role = demoUser.role;
    }
  } else {
    try {
      const { data: userRecord } = await supabase
        .from("users")
        .select("id, role, account_status")
        .eq("id", userId)
        .maybeSingle();

      if (userRecord && userRecord.account_status === "active") {
        role = userRecord.role;
      }
    } catch {
      // Degraded fallback uses token claims
    }
  }

  registerClient(userId, role, isDemo, res);
});

/**
 * GET /api/v1/realtime/diagnostics
 * Telemetry endpoint reporting active listeners and broadcast metrics.
 */
router.get("/diagnostics", (req, res) => {
  const diag = getRealtimeDiagnostics();
  res.json({
    data: diag,
    meta: { requestId: req.requestId },
  });
});

export default router;

