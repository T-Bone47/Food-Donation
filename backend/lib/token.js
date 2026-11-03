import crypto from "node:crypto";

const TOKEN_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Read the secret lazily. Previously this module captured process.env at
// import time, before dotenv had loaded, which made every signup/login fail
// on a clean start even though .env contained a valid secret.
function getSessionSecret() {
  return process.env.SESSION_SECRET;
}

// In-memory token blocklist (use Redis in production / multi-instance deploys)
const tokenBlocklist = new Map();

function base64UrlEncode(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function base64UrlDecode(value) {
  return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
}

function sign(encodedPayload) {
  const secret = getSessionSecret();
  if (typeof secret !== "string" || secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }
  return crypto.createHmac("sha256", secret).update(encodedPayload).digest("base64url");
}

export function issueSessionToken(payload) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    jti: crypto.randomUUID(),
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };
  const encodedPayload = base64UrlEncode(body);
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifySessionToken(token) {
  if (typeof token !== "string" || token.length === 0) return null;
  
  // Check blocklist first
  if (tokenBlocklist.has(token)) {
    const expiry = tokenBlocklist.get(token);
    if (expiry > Date.now()) {
      return null; // Token is revoked
    } else {
      tokenBlocklist.delete(token); // Clean up expired blocklist entries
    }
  }
  
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const encodedPayload = parts[0];
  const receivedSignature = parts[1];
  let expectedSignature;
  try {
    expectedSignature = sign(encodedPayload);
  } catch {
    return null;
  }
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (
    received.length !== expected.length ||
    !crypto.timingSafeEqual(received, expected)
  ) {
    return null;
  }
  let payload;
  try {
    payload = base64UrlDecode(encodedPayload);
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) {
    return null;
  }
  if (typeof payload.userId !== "string" || !payload.userId) {
    return null;
  }
  return payload;
}

export function revokeToken(token) {
  // Add token to blocklist with its expiry time
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const payload = base64UrlDecode(parts[0]);
      if (payload && typeof payload.exp === "number") {
        tokenBlocklist.set(token, payload.exp * 1000); // Convert to milliseconds
      }
    }
  } catch {
    // If we can't parse, add with default 24hr expiry
    tokenBlocklist.set(token, Date.now() + TOKEN_TTL_SECONDS * 1000);
  }
}

export function safeTokenUser(payload) {
  if (!payload) return null;
  return {
    userId: payload.userId,
    email: typeof payload.email === "string" ? payload.email : null,
    role: typeof payload.role === "string" ? payload.role : null,
    isDemo: Boolean(payload.isDemo),
  };
}

// Cleanup old blocklist entries periodically. unref() keeps this timer from
// holding test runners or short-lived scripts open.
const blocklistCleanup = setInterval(() => {
  const now = Date.now();
  for (const [token, expiry] of tokenBlocklist.entries()) {
    if (expiry < now) {
      tokenBlocklist.delete(token);
    }
  }
}, 60 * 60 * 1000); // Every hour
blocklistCleanup.unref?.();
