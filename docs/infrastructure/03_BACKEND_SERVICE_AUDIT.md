# FoodShare Infrastructure — 03. Backend Service Audit

## 1. Express API Microservice Audit

### Architecture & Modularity
- **Entrypoint**: `backend/index.js` boots server on port 5000, attaches error and process signal handlers (`SIGTERM`, `SIGINT`).
- **Application Factory**: `backend/app.js` registers middleware in strict order:
  1. `cors`: Restricts cross-origin requests to configured origins (`http://localhost:3000`).
  2. `express.json({ limit: "1mb" })`: Safeguards against oversized payloads.
  3. `assignRequestId`: Propagates correlation IDs across the request lifecycle.
  4. Security headers: Adds `X-Content-Type-Options: nosniff` and `X-Frame-Options: DENY`.
  5. Route mounting: Supports both `/api/v1/*` canonical paths and legacy `/api/*` fallbacks.
  6. Centralized Error Handler: Unifies error envelope `{ error: { code, message, details? }, meta: { requestId } }`.

### Authentication & Token Subsystem
- **Implementation**: Cryptographic HMAC-SHA256 session token issuing and verification in `backend/lib/token.js`.
- **Validation**:
  - Validates signature timing-safely (`crypto.timingSafeEqual`).
  - Checks in-memory revocation blocklist (`tokenBlocklist`).
  - Extracts claims into normalized `req.auth` and `req.sessionPayload`.
  - Integrates transparent fallback to cryptographic token claims when database connection is momentarily degraded.

### Concurrency & Lifecycle Protection
- **Atomic Operations**:
  - `claimDonation`: Enforces atomic transaction check on donation status. If donation is not `AVAILABLE`, immediately throws HTTP 409 Conflict.
  - `confirmReceipt`: Idempotently writes delivery confirmation record; rejects duplicate confirmations.

---

## 2. Flask Chatbot Microservice Audit

### Architecture & Service Design
- **Entrypoint**: `chatbot_api/app.py` boots Flask service on port 5002.
- **Microservice Endpoints**:
  - `GET /`: HTML service dashboard for browser visitors; JSON health payload for API callers.
  - `GET /health` & `GET /api/health`: Automated health probes for orchestrators.
  - `POST /chat` & `POST /api/chat`: Primary conversational interface with structured JSON validation.
  - `GET /api/suggestions`: Role-aware contextual prompt suggestions.
  - `GET /api/metrics`: Internal request counters and latency diagnostics.
  - `GET /api/conversations/<id>`: Message history persistence per session.

### AI Engine & Provider Resilience
- **Google Gemini Client**: Integrates `google.generativeai` when `GEMINI_API_KEY` is present.
- **Deterministic Grounded Fallback**:
  - When Gemini API key is unset or external API is unreachable, the engine activates local grounded retrieval over `knowledge_base.py`.
  - Answers domain-specific queries on food donation regulations, temperature controls, and Good Samaritan Act protections with 0ms external API dependency.
- **Security Safeguards**:
  - Rate limiting via `flask-limiter` (e.g. 30 requests/minute per client).
  - Maximum input message length capped at 1,000 characters (`MAX_MESSAGE_LENGTH`).
  - Strict input sanitization in `security.py` preventing prompt injection attacks.

