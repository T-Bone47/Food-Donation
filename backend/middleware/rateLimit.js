/**
 * Simple in-memory rate limiter.
 * For production, replace with Redis-backed rate limiting.
 */

const stores = new Map();

function getStore(key) {
  let store = stores.get(key);
  if (!store) {
    store = new Map();
    stores.set(key, store);
  }
  return store;
}

function cleanupStore(store, windowMs) {
  const now = Date.now();
  for (const [key, { timestamp }] of store.entries()) {
    if (now - timestamp > windowMs) {
      store.delete(key);
    }
  }
}

/**
 * @param {Object} options
 * @param {number} options.windowMs - Time window in milliseconds
 * @param {number} options.max - Maximum requests per window
 * @param {string} options.keyPrefix - Prefix for the rate limit key
 * @param {(req: Request) => string} options.keyGenerator - Custom key generator
 * @param {string} options.message - Error message
 */
export function rateLimit(options = {}) {
  // Integration tests and local load tooling may disable limits explicitly.
  // Never set this in production.
  if (process.env.RATE_LIMIT_DISABLED === "true") {
    return (req, res, next) => next();
  }

  const {
    windowMs = 60 * 1000, // 1 minute
    max = 60,
    keyPrefix = "rl",
    keyGenerator = (req) => req.ip || req.headers["x-forwarded-for"] || "unknown",
    message = "Too many requests, please try again later.",
  } = options;

  const store = getStore(keyPrefix);

  // Periodic cleanup
  const cleanupTimer = setInterval(
    () => cleanupStore(store, windowMs),
    windowMs
  );
  cleanupTimer.unref?.();

  return (req, res, next) => {
    const key = `${keyPrefix}:${keyGenerator(req)}`;
    const now = Date.now();

    const record = store.get(key);
    if (!record) {
      store.set(key, { count: 1, timestamp: now });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", new Date(now + windowMs).toISOString());
      return next();
    }

    if (now - record.timestamp > windowMs) {
      // Window expired, reset
      store.set(key, { count: 1, timestamp: now });
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", max - 1);
      res.setHeader("X-RateLimit-Reset", new Date(now + windowMs).toISOString());
      return next();
    }

    if (record.count >= max) {
      const retryAfter = Math.ceil((record.timestamp + windowMs - now) / 1000);
      res.setHeader("Retry-After", retryAfter);
      res.setHeader("X-RateLimit-Limit", max);
      res.setHeader("X-RateLimit-Remaining", 0);
      res.setHeader("X-RateLimit-Reset", new Date(record.timestamp + windowMs).toISOString());

      const error = new Error(message);
      error.name = "RateLimitError";
      return next(error);
    }

    record.count += 1;
    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", max - record.count);
    res.setHeader("X-RateLimit-Reset", new Date(record.timestamp + windowMs).toISOString());

    next();
  };
}