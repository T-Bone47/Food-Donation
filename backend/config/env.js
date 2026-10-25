/**
 * Environment configuration validation and defaults.
 * Call validateConfig() at application startup.
 */
import dotenv from "dotenv";

// Load .env before any module reads process.env. Several modules import this
// file before the rest of the application, so this is the single load point.
dotenv.config({ quiet: true });

const requiredEnvVars = {
  development: ["SUPABASE_URL", "SUPABASE_KEY", "SESSION_SECRET"],
  production: ["SUPABASE_URL", "SUPABASE_KEY", "SESSION_SECRET"],
};

const DEFAULTS = {
  NODE_ENV: "development",
  PORT: "5000",
  CORS_ORIGIN: "http://localhost:3000",
  EXPIRY_SWEEP_INTERVAL_MS: String(5 * 60 * 1000),
};

function validateConfig() {
  const env = process.env.NODE_ENV || "development";
  const required = requiredEnvVars[env] || requiredEnvVars.development;
  const missing = [];

  for (const varName of required) {
    if (!process.env[varName] || process.env[varName].includes("your-") || process.env[varName].includes("replace-") || process.env[varName] === "dev-only-session-secret-change-me") {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const msg = `Missing or placeholder environment variables: ${missing.join(", ")}. Check your .env file.`;
    if (env === "production") {
      throw new Error(msg);
    }
    console.warn(`[CONFIG WARNING] ${msg}`);
  }

  // Validate SESSION_SECRET strength
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length < 32) {
    if (env === "production") {
      throw new Error("SESSION_SECRET must be at least 32 characters in production.");
    }
    console.warn("[CONFIG WARNING] SESSION_SECRET is weak; use a long random string in production.");
  }

  const sweepInterval = parseInt(
    process.env.EXPIRY_SWEEP_INTERVAL_MS || DEFAULTS.EXPIRY_SWEEP_INTERVAL_MS,
    10
  );

  return {
    env,
    port: parseInt(process.env.PORT, 10) || parseInt(DEFAULTS.PORT, 10),
    corsOrigin: process.env.CORS_ORIGIN || DEFAULTS.CORS_ORIGIN,
    expirySweepIntervalMs:
      Number.isFinite(sweepInterval) && sweepInterval >= 60_000
        ? sweepInterval
        : parseInt(DEFAULTS.EXPIRY_SWEEP_INTERVAL_MS, 10),
    supabase: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_KEY,
    },
    sessionSecret: process.env.SESSION_SECRET,
  };
}

let cachedConfig = null;

export function getConfig() {
  if (!cachedConfig) {
    cachedConfig = validateConfig();
  }
  return cachedConfig;
}

export function resetConfig() {
  cachedConfig = null;
}