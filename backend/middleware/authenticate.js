import { verifySessionToken, safeTokenUser } from "../lib/token.js";
import { supabase } from "../supabase.js";

/**
 * Resolve the current account from the database rather than trusting the role
 * and status embedded at login time. This makes suspensions and role changes
 * effective immediately instead of after the 24h token lifetime.
 */
async function loadCurrentUser(tokenUser) {
  if (!tokenUser?.userId) return { user: null, inactive: false };

  const { data, error } = await supabase
    .from("users")
    .select("id, email, role, account_status")
    .eq("id", tokenUser.userId)
    .maybeSingle();

  if (error || !data) return { user: null, inactive: false };
  if (data.account_status !== "active") return { user: null, inactive: true };

  return {
    user: {
      userId: data.id,
      email: data.email,
      role: data.role,
    },
    inactive: false,
  };
}

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: "Authentication required.",
      },
    });
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Session expired, revoked, or invalid.",
      },
    });
  }

  const tokenUser = safeTokenUser(payload);
  if (!tokenUser) {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Session payload is malformed.",
      },
    });
  }

  const { user, inactive } = await loadCurrentUser(tokenUser);
  if (inactive) {
    return res.status(403).json({
      error: {
        code: "ACCOUNT_INACTIVE",
        message: "This account is not active. Contact an administrator.",
      },
    });
  }
  if (!user) {
    return res.status(401).json({
      error: {
        code: "INVALID_SESSION",
        message: "Session user no longer exists.",
      },
    });
  }

  req.auth = user;
  req.sessionPayload = payload;
  next();
}

export async function optionalAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : null;

  if (!token) {
    req.auth = null;
    req.sessionPayload = null;
    return next();
  }

  const payload = verifySessionToken(token);
  if (!payload) {
    req.auth = null;
    req.sessionPayload = null;
    return next();
  }

  const tokenUser = safeTokenUser(payload);
  if (!tokenUser) {
    req.auth = null;
    req.sessionPayload = null;
    return next();
  }

  const { user } = await loadCurrentUser(tokenUser);
  req.auth = user;
  req.sessionPayload = user ? payload : null;
  next();
}