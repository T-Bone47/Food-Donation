import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { getConfig } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import donationRoutes from "./routes/donations.routes.js";
import volunteerRoutes from "./routes/volunteer.routes.js";
import ngoRoutes from "./routes/ngos.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import notificationRoutes from "./routes/notifications.routes.js";
import impactRoutes from "./routes/impact.routes.js";
import healthRoutes from "./routes/health.routes.js";
import demoRoutes from "./routes/demo.routes.js";
import realtimeRoutes from "./routes/realtime.routes.js";

export function createApp() {
  const config = getConfig();

  const app = express();

  // Trust proxy for rate limiting and IP detection behind load balancers
  app.set("trust proxy", 1);

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Configure appropriately for your frontend
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS configuration
  const allowedOrigins = config.corsOrigin
    .split(",")
    .map((origin) => origin.trim().replace(/\/$/, ""))
    .filter(Boolean);

  const corsOptions = {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  app.use(cors(corsOptions));

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Request ID middleware
  app.use((req, res, next) => {
    req.requestId = req.headers["x-request-id"] || crypto.randomUUID();
    res.setHeader("X-Request-ID", req.requestId);
    next();
  });

  // Request logging
  app.use((req, res, next) => {
    const start = Date.now();
    res.on("finish", () => {
      const duration = Date.now() - start;
      console.log(
        `[${req.requestId}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`
      );
    });
    next();
  });

  // API routes
  app.use("/api/v1/auth", authRoutes);
  app.use("/api/v1/donations", donationRoutes);
  app.use("/api/v1/volunteer", volunteerRoutes);
  app.use("/api/v1/ngos", ngoRoutes);
  app.use("/api/v1/admin", adminRoutes);
  app.use("/api/v1/notifications", notificationRoutes);
  app.use("/api/v1/impact", impactRoutes);
  app.use("/api/v1/health", healthRoutes);
  app.use("/api/v1/demo", demoRoutes);
  app.use("/api/v1/realtime", realtimeRoutes);

  // Legacy route compatibility (mount without /api/v1 prefix for existing frontend)
  app.use("/api/auth", authRoutes);
  app.use("/api/donations", donationRoutes);
  app.use("/api/volunteer", volunteerRoutes);
  app.use("/api/ngos", ngoRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/impact", impactRoutes);
  app.use("/api/demo", demoRoutes);
  app.use("/api/realtime", realtimeRoutes);

  // Root endpoint
  app.get("/", (req, res) => {
    if (req.headers.accept && req.headers.accept.includes("text/html")) {
      return res.type("html").send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FoodShare Backend API</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 580px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(56, 189, 248, 0.15); border: 1px solid #0284c7; color: #38bdf8; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
    .dot { width: 8px; height: 8px; background: #38bdf8; border-radius: 50%; display: inline-block; }
    h1 { margin: 0 0 12px; font-size: 26px; font-weight: 700; color: #ffffff; }
    p { margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; background: #16a34a; color: #ffffff; font-weight: 600; font-size: 16px; padding: 12px 28px; border-radius: 8px; text-decoration: none; transition: background 0.2s; margin-bottom: 24px; }
    .btn:hover { background: #15803d; }
    .routes { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: left; font-size: 13px; font-family: ui-monospace, monospace; color: #cbd5e1; }
    .route-item { margin: 6px 0; }
    .method { color: #4ade80; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> REST API Online · Port 5000</div>
    <h1>FoodShare Backend API Microservice</h1>
    <p>This is the core REST API microservice handling authentication, donation state machines, volunteer dispatch, NGO intake, and admin audit ledgers.</p>
    <a href="http://localhost:3000" class="btn">Open FoodShare Web App (Port 3000) &rarr;</a>
    <div class="routes">
      <div style="font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Active API Endpoints:</div>
      <div class="route-item"><span class="method">GET</span>  /api/v1/health — Service and database health</div>
      <div class="route-item"><span class="method">POST</span> /api/v1/auth/login — User authentication</div>
      <div class="route-item"><span class="method">POST</span> /api/v1/demo/session — Instant demo authentication</div>
      <div class="route-item"><span class="method">GET</span>  /api/v1/donations — Donation dispatch feed</div>
      <div class="route-item"><span class="method">GET</span>  /api/v1/impact/summary — Community impact metrics</div>
    </div>
  </div>
</body>
</html>`);
    }

    res.json({
      name: "Food Donation Platform API",
      version: "1.0.0",
      environment: config.env,
      documentation: "/api/v1/health",
      web_app: "http://localhost:3000",
    });
  });

  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: `Route ${req.method} ${req.path} not found`,
      },
      meta: { requestId: req.requestId },
    });
  });

  // Error handler (must be last)
  app.use(errorHandler);

  return app;
}