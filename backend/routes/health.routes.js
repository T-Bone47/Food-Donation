import express from "express";
import { supabase } from "../supabase.js";
import { getConfig } from "../config/env.js";

const router = express.Router();

/**
 * GET /api/v1/health
 * Health check endpoint
 */
router.get("/", async (req, res) => {
  const config = getConfig();
  const checks = {
    config: "ok",
    database: "unknown",
    timestamp: new Date().toISOString(),
    environment: config.env,
    version: "1.0.0",
  };

  // Check database connectivity
  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) {
      console.error("[HEALTH] Database check failed:", error.message);
      checks.database = "error";
    } else {
      checks.database = "ok";
    }
  } catch (err) {
    console.error("[HEALTH] Database check failed:", err.message);
    checks.database = "error";
  }

  const isHealthy = checks.database === "ok";
  const statusCode = isHealthy || config.env === "development" ? 200 : 503;

  res.status(statusCode).json({
    status: isHealthy ? "healthy" : "degraded",
    database: checks.database,
    checks,
    meta: { requestId: req.requestId },
  });
});

/**
 * GET /api/v1/health/ready
 * Readiness check (for Kubernetes/load balancers)
 */
router.get("/ready", async (req, res) => {
  const checks = {
    database: "unknown",
  };

  try {
    const { error } = await supabase.from("users").select("id").limit(1);
    if (error) console.error("[HEALTH] Readiness check failed:", error.message);
    checks.database = error ? "error" : "ok";
  } catch (err) {
    console.error("[HEALTH] Readiness check failed:", err.message);
    checks.database = "error";
  }

  const isReady = checks.database === "ok";

  res.status(isReady ? 200 : 503).json({
    ready: isReady,
    checks,
  });
});

export default router;