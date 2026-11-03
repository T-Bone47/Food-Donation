/**
 * Loaded with `node --import ./test/support/test-env.js` before any test file.
 * Uses an isolated local Supabase instance; never point this at production.
 */
process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "test-only-session-secret-at-least-32-characters-long";
process.env.SUPABASE_URL =
  process.env.SUPABASE_URL || "http://127.0.0.1:54321";
process.env.SUPABASE_KEY =
  process.env.SUPABASE_KEY ||
  process.env.TEST_SUPABASE_SERVICE_ROLE_KEY ||
  "test-service-role-key-for-offline-unit-tests";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";
process.env.RATE_LIMIT_DISABLED = "true";
process.env.EXPIRY_SWEEPER = "false";

