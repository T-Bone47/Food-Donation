# FoodShare AI Chatbot — API Reference Manual

## 1. Overview & Conventions

The **FoodShare Chatbot API** is exposed as an HTTP service running on port `5002` (configurable via `CHATBOT_PORT`). It interfaces with the Next.js frontend, Node.js/Express backend, and Google Gemini AI services.

* **Base URL**: `http://localhost:5002`
* **Content-Type**: `application/json; charset=utf-8`
* **Transport**: HTTP/1.1 with TLS supported via reverse proxy (Nginx / Express proxy).
* **Cross-Origin Resource Sharing (CORS)**: Configured to accept requests from authorized origins:
  - `http://localhost:3000` (Next.js development frontend)
  - `http://127.0.0.1:3000`
  - Explicit origins defined in `FRONTEND_ORIGINS`.

---

## 2. Authentication & Authorization

All stateful or authenticated queries accept user credentials via standard HTTP headers:

```http
Authorization: Bearer <session-token>
```

* **Token Verification**: The microservice decodes and verifies the signature using HMAC-SHA256 against `SESSION_SECRET`.
* **Zero-Trust Roles**: Even if a client sends `"role": "admin"`, the server inspects the bearer token payload. If the token indicates `"role": "donor"`, the authenticated role (`donor`) is strictly enforced.
* **Unauthenticated Access**: Guests may query general platform guidelines and FAQs without providing an `Authorization` header. In this case, `role` defaults to `"guest"`.

---

## 3. Standard Response Envelopes

### 3.1 Success Envelope
All successful requests return HTTP `200 OK` with the following structure:
```json
{
  "success": true,
  "data": {
    "reply": "string (markdown formatted)",
    "conversation_id": "uuid",
    "role": "donor | volunteer | ngo | admin | guest",
    "intent": "string",
    "suggestions": ["string", "string"],
    "sources": [
      {
        "id": "kb_donor_guide",
        "title": "Donor Guide & Best Practices",
        "category": "donor",
        "score": 1.45
      }
    ],
    "latency_ms": 12.4
  },
  "error": null,
  "meta": {
    "timestamp": "2026-11-02T14:00:00.000Z",
    "version": "2.0.0"
  }
}
```

### 3.2 Error Envelope
When an operation fails, the service returns an appropriate 4xx or 5xx code with a structured error envelope:
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR | AUTHENTICATION_ERROR | RATE_LIMIT_EXCEEDED | INTERNAL_ERROR",
    "message": "Human-readable explanation of error.",
    "details": {}
  },
  "meta": {
    "timestamp": "2026-11-02T14:00:00.000Z"
  }
}
```

---

## 4. Endpoints

### 4.1 Process Chat Turn
Processes a user's conversational message, executes intent classification, retrieves grounded knowledge or platform tools, and returns the assistant's reply.

* **Route**: `POST /api/chat`
* **Alias**: `POST /chat` (backward compatibility)
* **Headers**:
  - `Content-Type: application/json`
  - `Authorization: Bearer <session-token>` *(optional for guests)*

#### Request Body
```json
{
  "message": "How do I list surplus cooked meals for donation?",
  "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
  "role": "donor"
}
```

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `message` | `string` | **Yes** | The user's prompt (1–2000 characters). |
| `conversation_id`| `string` | No | UUID of existing session. If omitted or invalid, a new session is initialized. |
| `role` | `string` | No | Client hint (`donor`, `volunteer`, `ngo`, `admin`, `guest`). Overridden by bearer token if present. |

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "reply": "To list surplus cooked meals:\n\n1. Navigate to **Donations** > **Create Donation**.\n2. Specify food type, quantity, and packaging details.\n3. Set an accurate **Expiry Time** and pickup window.\n4. Ensure food has been maintained under safe temperature standards.\n\nOnce posted, nearby volunteers and registered NGOs are notified immediately.",
    "conversation_id": "550e8400-e29b-41d4-a716-446655440000",
    "role": "donor",
    "intent": "platform_knowledge",
    "suggestions": [
      "Check my active donations",
      "What are the food packaging rules?",
      "How to cancel a listing"
    ],
    "sources": [
      {
        "id": "kb_donor_guide",
        "title": "Donor Guide & Best Practices",
        "category": "donor",
        "score": 1.62
      }
    ],
    "latency_ms": 14.8
  },
  "error": null,
  "meta": {
    "timestamp": "2026-11-02T14:05:00.000Z",
    "version": "2.0.0"
  }
}
```

#### Example cURL
```bash
curl -X POST http://localhost:5002/api/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOi..." \
  -d '{
    "message": "Show my active donations",
    "conversation_id": "c1f7a22e-e47b-402a-9cb0-394c5d5a2d1e"
  }'
```

---

### 4.2 Retrieve Conversation History
Retrieves the recorded multi-turn message history for an active session.

* **Route**: `GET /api/conversations/<id>`
* **Parameters**: `id` (string, UUID format)

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "conversation_id": "c1f7a22e-e47b-402a-9cb0-394c5d5a2d1e",
    "turns": [
      {
        "turn": 1,
        "role": "user",
        "content": "Hello",
        "timestamp": "2026-11-02T14:01:00.000Z"
      },
      {
        "turn": 1,
        "role": "assistant",
        "content": "Hello! I am your FoodShare Assistant. How can I help you today?",
        "timestamp": "2026-11-02T14:01:01.000Z"
      }
    ],
    "created_at": "2026-11-02T14:01:00.000Z",
    "last_active": "2026-11-02T14:01:01.000Z"
  },
  "error": null
}
```

---

### 4.3 Clear Conversation History
Clears all recorded turns in a session while maintaining the session UUID.

* **Route**: `POST /api/conversations/<id>/clear`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "conversation_id": "c1f7a22e-e47b-402a-9cb0-394c5d5a2d1e",
    "message": "Conversation history cleared successfully."
  },
  "error": null
}
```

---

### 4.4 Delete Conversation Session
Destroys the session and releases associated memory resources.

* **Route**: `DELETE /api/conversations/<id>`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "conversation_id": "c1f7a22e-e47b-402a-9cb0-394c5d5a2d1e",
    "message": "Session deleted."
  },
  "error": null
}
```

---

### 4.5 Fetch Role Suggestions
Returns contextual quick-prompt suggestions tailored for a specific role.

* **Route**: `GET /api/suggestions?role=<role>`
* **Query Parameters**:
  - `role` (optional): `donor`, `volunteer`, `ngo`, `admin`, `guest`.

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "role": "volunteer",
    "suggestions": [
      "Show available donations near me",
      "How do I claim a pickup task?",
      "What if an NGO is closed during delivery?",
      "Show my assigned tasks"
    ]
  },
  "error": null
}
```

---

### 4.6 Health & Readiness Check
Returns the live operational status of the service, active AI provider, and knowledge base capacity.

* **Route**: `GET /health`
* **Response (200 OK)**:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "provider": "gemini",
  "model": "gemini-2.5-flash",
  "offline_resilience": true,
  "knowledge_base_chunks": 13,
  "uptime_seconds": 3840
}
```

---

### 4.7 Performance & Usage Metrics
Exposes real-time operational counters for system monitoring and observability.

* **Route**: `GET /api/metrics`
* **Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "total_requests": 1420,
    "gemini_calls": 1180,
    "fallback_calls": 240,
    "rate_limited_count": 0,
    "blocked_injections": 12,
    "average_latency_ms": 18.2,
    "active_conversations": 47
  },
  "error": null
}
```

---

## 5. HTTP Status Code Summary

| Status Code | Meaning | Cause |
| :--- | :--- | :--- |
| `200 OK` | Success | Request was processed normally. |
| `400 Bad Request` | Validation Error | Missing `message`, oversized payload ($>2,000$ chars), or empty string. |
| `401 Unauthorized` | Invalid Token | Expired or tampered Bearer token signature. |
| `403 Forbidden` | Policy Refusal | Request attempted unauthorized privilege escalation or dangerous action. |
| `404 Not Found` | Session Not Found | Provided `conversation_id` does not exist or has expired. |
| `429 Too Many Requests` | Rate Limited | IP exceeded rate threshold ($>60$ requests/minute). |
| `500 Internal Error` | Server Exception | Unhandled runtime error in conversational pipeline. |
| `503 Service Unavailable` | Gateway Error | Upstream Gemini API network timeout without local fallback. |

