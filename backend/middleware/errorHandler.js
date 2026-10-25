export function errorHandler(err, req, res, next) {
  // Log the full error internally
  const requestId = req.requestId || "unknown";
  console.error(`[ERROR] [${requestId}]`, {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.auth?.userId,
  });

  // Body-parser failures should not surface as generic 500s.
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({
      error: {
        code: "INVALID_JSON",
        message: "Request body is not valid JSON.",
      },
      meta: { requestId },
    });
  }

  if (err.type === "entity.too.large") {
    return res.status(413).json({
      error: {
        code: "PAYLOAD_TOO_LARGE",
        message: "Request body is too large.",
      },
      meta: { requestId },
    });
  }

  // Known operational errors
  if (err.name === "ValidationError") {
    return res.status(400).json({
      error: {
        code: "VALIDATION_ERROR",
        message: err.message,
        details: err.details || [],
      },
      meta: { requestId },
    });
  }

  if (err.name === "UnauthorizedError") {
    return res.status(401).json({
      error: {
        code: "UNAUTHENTICATED",
        message: err.message || "Authentication required.",
      },
      meta: { requestId },
    });
  }

  if (err.name === "ForbiddenError") {
    return res.status(403).json({
      error: {
        code: "FORBIDDEN",
        message: err.message || "Access denied.",
      },
      meta: { requestId },
    });
  }

  if (err.name === "NotFoundError") {
    return res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: err.message || "Resource not found.",
      },
      meta: { requestId },
    });
  }

  if (err.name === "ConflictError") {
    return res.status(409).json({
      error: {
        code: "CONFLICT",
        message: err.message,
      },
      meta: { requestId },
    });
  }

  if (err.name === "RateLimitError") {
    return res.status(429).json({
      error: {
        code: "RATE_LIMITED",
        message: err.message || "Too many requests.",
      },
      meta: { requestId },
    });
  }

  // Supabase/PostgreSQL errors
  if (err.code) {
    // Unique constraint violation
    if (err.code === "23505") {
      return res.status(409).json({
        error: {
          code: "DUPLICATE_ENTRY",
          message: "A record with this value already exists.",
        },
        meta: { requestId },
      });
    }

    // Foreign key violation
    if (err.code === "23503") {
      return res.status(400).json({
        error: {
          code: "INVALID_REFERENCE",
          message: "Referenced record does not exist.",
        },
        meta: { requestId },
      });
    }

    // Check constraint violation
    if (err.code === "23514") {
      return res.status(400).json({
        error: {
          code: "CONSTRAINT_VIOLATION",
          message: "Data violates a database constraint.",
        },
        meta: { requestId },
      });
    }
  }

  // Default: internal server error
  return res.status(500).json({
    error: {
      code: "INTERNAL_ERROR",
      message: "An unexpected error occurred.",
    },
    meta: { requestId },
  });
}

export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Authentication required") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access denied") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.name = "ConflictError";
  }
}

export class RateLimitError extends Error {
  constructor(message = "Too many requests") {
    super(message);
    this.name = "RateLimitError";
  }
}