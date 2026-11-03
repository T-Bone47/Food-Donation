/**
 * Pure helpers for the /api/v1 response contract (no imports, so they can be tested without a bundler).
 *
 * Success bodies are `{ data, meta }`; health endpoints are not enveloped.
 * Error bodies are `{ error: { code, message, details? }, meta? }` where details is `[{ field, message }]`.
 */

export function unwrapEnvelope<T = unknown>(body: unknown): T {
  if (body !== null && typeof body === "object" && !Array.isArray(body) && "data" in body && "meta" in body) {
    return (body as { data: T }).data;
  }
  return body as T;
}

export interface ApiFieldError {
  field: string | null;
  message: string;
}

export interface ApiError {
  /** HTTP status, or null when the request never got a response. */
  status: number | null;
  /** Server `error.code` (e.g. CONFLICT), or NETWORK_ERROR / TIMEOUT / UNKNOWN. */
  code: string;
  /** Safe to show to the person using the app. */
  message: string;
  details: ApiFieldError[];
  /** First message per field, for inline validation. */
  fieldErrors: Record<string, string>;
  requestId: string | null;
  isNetwork: boolean;
  /** 401: the session is missing, expired or revoked. */
  isAuth: boolean;
}

const FALLBACK_BY_STATUS: Record<number, string> = {
  401: "Your session has expired. Sign in again.",
  403: "You don't have permission to do that.",
  404: "We couldn't find that.",
  409: "That conflicts with the current state. Refresh and try again.",
  413: "That request is too large.",
  429: "Too many requests. Wait a moment and try again.",
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

function sanitizeTechnicalError(msg: string): string {
  if (
    msg.includes("fetch failed") ||
    msg.includes("TypeError:") ||
    msg.includes("ENOTFOUND") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("Cannot read propert") ||
    msg.includes("Failed to fetch")
  ) {
    return "Unable to connect to the food rescue service. Please check your connection and retry.";
  }
  return msg;
}

function parseDetails(raw: unknown): ApiFieldError[] {
  if (!Array.isArray(raw)) return [];
  const out: ApiFieldError[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({ field: null, message: sanitizeTechnicalError(item) });
      continue;
    }
    const rec = asRecord(item);
    if (rec && typeof rec.message === "string" && rec.message.trim()) {
      out.push({ field: typeof rec.field === "string" ? rec.field : null, message: sanitizeTechnicalError(rec.message) });
    }
  }
  return out;
}

/** Normalise anything thrown by an API call. The original error is never mutated. */
export function getApiError(err: unknown): ApiError {
  const e = asRecord(err);
  const response = asRecord(e?.response);
  const status = typeof response?.status === "number" ? response.status : null;
  const body = asRecord(response?.data);
  const serverError = asRecord(body?.error);
  const requestId = typeof asRecord(body?.meta)?.requestId === "string" ? (asRecord(body?.meta)!.requestId as string) : null;

  if (status === null) {
    const timedOut = e?.code === "ECONNABORTED" || e?.code === "ETIMEDOUT";
    const hasResponseShape = response !== null;
    if (!hasResponseShape && (timedOut || e?.code === "ERR_NETWORK" || typeof e?.request !== "undefined")) {
      return {
        status: null,
        code: timedOut ? "TIMEOUT" : "NETWORK_ERROR",
        message: timedOut
          ? "The server took too long to respond. Try again."
          : "Can't reach the server. Check your connection and try again.",
        details: [],
        fieldErrors: {},
        requestId: null,
        isNetwork: true,
        isAuth: false,
      };
    }
    return {
      status: null,
      code: "UNKNOWN",
      message: "Something went wrong. Try again.",
      details: [],
      fieldErrors: {},
      requestId: null,
      isNetwork: false,
      isAuth: false,
    };
  }

  const details = parseDetails(serverError?.details);
  const fieldErrors: Record<string, string> = {};
  for (const d of details) if (d.field && !(d.field in fieldErrors)) fieldErrors[d.field] = d.message;

  let serverMessage = typeof serverError?.message === "string" && serverError.message.trim() ? serverError.message : null;
  if (serverMessage && (serverMessage.includes("fetch failed") || serverMessage.includes("TypeError:") || serverMessage.includes("ENOTFOUND") || serverMessage.includes("ECONNREFUSED"))) {
    serverMessage = "Unable to sync with food rescue network. Please retry in a moment.";
  }
  const message = serverMessage ?? FALLBACK_BY_STATUS[status] ?? (status >= 500 ? "Something went wrong on our side. Try again in a moment." : "Something went wrong. Try again.");

  return {
    status,
    code: typeof serverError?.code === "string" ? serverError.code : "UNKNOWN",
    message,
    details,
    fieldErrors,
    requestId,
    isNetwork: false,
    isAuth: status === 401,
  };
}

/** Messages to render: validation details when present, otherwise the summary message. */
export function errorMessages(error: ApiError): string[] {
  const msgs = error.details.length > 0 ? error.details.map((d) => d.message) : [error.message];
  return msgs.map((m) => sanitizeTechnicalError(m));
}
