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

  // Legacy route compatibility (mount without /api/v1 prefix for existing frontend)
  app.use("/api/auth", authRoutes);
  app.use("/api/donations", donationRoutes);
  app.use("/api/volunteer", volunteerRoutes);
  app.use("/api/ngos", ngoRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/impact", impactRoutes);

  // Root endpoint
  app.get("/", (req, res) => {
    res.json({
      name: "Food Donation Platform API",
      version: "1.0.0",
      environment: config.env,
      documentation: "/api/v1/health",
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