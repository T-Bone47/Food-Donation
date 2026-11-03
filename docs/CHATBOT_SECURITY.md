# FoodShare AI Chatbot — Security Architecture & Threat Model

## 1. Security Architecture Overview

The **FoodShare Chatbot** is designed with a defense-in-depth posture adhering to the **Principle of Least Privilege**, **Zero-Trust Input Validation**, and **Strict Isolation between AI Reasoning and Data Mutation**.

```
                           +-------------------------------------+
                           |            Incoming Request         |
                           +------------------+------------------+
                                              |
                     1. Rate Limiting Check   | 60 req/min/IP (Sliding Window)
                                              v
                           +-------------------------------------+
                           |          Rate Limiter Check         |
                           +------------------+------------------+
                                              |
                   2. Token & Role Validation | HMAC-SHA256 Session Signature
                                              v
                           +-------------------------------------+
                           |       Authentication Gatekeeper     |
                           |   (Overrides spoofed client roles)  |
                           +------------------+------------------+
                                              |
              3. Prompt Injection & XSS Guard | Regex Signature & Pattern Scanner
                                              v
                           +-------------------------------------+
                           |        Input Security Filter        |
                           +------------------+------------------+
                                              |
                    4. Sensitive Data Masking | JWT, Password, PII Redaction
                                              v
                           +-------------------------------------+
                           |        Redaction Sanitizer          |
                           +------------------+------------------+
                                              |
                      5. Read-Only Operations | Strictly HTTP GET / User Bearer
                                              v
                           +-------------------------------------+
                           |       Platform Tool Boundary        |
                           |      (ZERO Raw SQL / Mutations)     |
                           +-------------------------------------+
```

---

## 2. Threat Modeling (STRIDE Analysis)

| Threat Category | Potential Attack Vector | Applied Mitigation |
| :--- | :--- | :--- |
| **Spoofing** | Client sends `"role": "admin"` to access administrator data without credentials. | **Cryptographic Verification**: Incoming bearer tokens are signed with HMAC-SHA256. Roles are resolved from verified token claims. Untrusted client headers are discarded. |
| **Tampering** | User submits adversarial jailbreak or prompt injection to override system instructions. | **Multi-Layered Injection Filter**: Regex signature scanning blocks command overrides, roleplays, and delimiter escapes before reaching the LLM. |
| **Repudiation** | User executes state-changing actions through the chatbot without audit logging. | **Read-Only Enclosure**: Chatbot has zero write or state-mutation tools. State-changing actions (claiming, pickup, confirmation) must be performed directly in UI with user confirmation. |
| **Information Disclosure** | LLM outputs another donor's private contact info or internal secrets. | **Bearer Passthrough & Isolation**: Backend tools query Express endpoints passing the caller's specific token. Backend row-level security and filters enforce data isolation. Sensitive patterns (JWTs, cards, passwords) are automatically redacted. |
| **Denial of Service** | Malicious actor spams chatbot with heavy nested prompts or high-frequency loops. | **Rate Limiting & Size Caps**: In-memory rate limiting (60 req/min per IP) and strict input truncation (max 2,000 characters). |
| **Elevation of Privilege** | Attacker uses LLM tool-calling to execute arbitrary SQL or administrative APIs. | **Strictly Typed Tool Stubs**: Zero SQL generation or arbitrary command execution. Only predefined, read-only Python functions with typed parameters are supported. |

---

## 3. Cryptographic Session & Role Verification

Implemented in [`chatbot_api/auth.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/auth.py):

* **Compatibility with Express Backend**: Express issues sessions using the format `base64url(payload).signature`.
* **HMAC Verification**:
  ```python
  expected_sig = hmac.new(
      SESSION_SECRET.encode("utf-8"),
      payload_b64.encode("utf-8"),
      hashlib.sha256
  ).digest()
  ```
* **Tampering Prevention**: Constant-time comparison (`hmac.compare_digest`) prevents timing side-channel attacks.
* **Role Invariance**: If an attacker intercepts a legitimate donor token and modifies the request payload to `"role": "admin"`, `auth.py` overrides the field back to `"donor"`, preventing horizontal and vertical privilege escalation.

---

## 4. Prompt Injection & Adversarial Defense

Implemented in [`chatbot_api/security.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/security.py):

### 4.1 Signature & Pattern Detection
The security module intercepts prompts matching known injection heuristics:
1. **Instruction Overrides**: `ignore (all )?(previous|prior) instructions`, `disregard (all )?(system|developer) prompts`.
2. **Jailbreak Modes**: `DAN mode`, `developer mode enabled`, `jailbreak active`.
3. **Delimiter Escapes**: `---begin system---`, `</system>`, `### Human: ### Assistant:`.
4. **Code Injection**: `<script>`, `javascript:`, raw shell interpolations.

### 4.2 Guard Action
When a prompt injection pattern is detected:
* Execution is aborted before reaching the Gemini API or the local fallback generator.
* A structured refusal is returned:
  > *"I am programmed to assist strictly with food donations and platform procedures. I cannot execute instruction overrides, reveal system prompts, or perform unauthorized operations."*
* An audit warning is logged with the client IP and timestamp.

---

## 5. Tool Boundaries & Least Privilege

The chatbot operates under a strict **Zero-Mutation Mandate**:

1. **No Direct Database Access**: The chatbot service does not hold PostgreSQL or Supabase service-role credentials.
2. **Read-Only API Endpoints**: All platform tools in [`chatbot_api/tools.py`](file:///C:/Users/dream/Downloads/Food-Donation-main%20(1)/Food-Donation-main/chatbot_api/tools.py) only perform HTTP `GET` requests.
3. **User Token Passthrough**: Every tool call sends `Authorization: Bearer <user_token>`. The Express backend validates that:
   - A donor can only fetch their own donations.
   - A volunteer can only view available donations or tasks assigned to them.
   - An NGO can only view deliveries routed to their organization.
4. **Confirmation for State Actions**: If a user asks "Claim this donation for me", the assistant instructs the user to click the **Claim Task** button in the verified UI.

---

## 6. Sensitive Data Redaction

All incoming prompts, outgoing responses, and diagnostic log entries are passed through `redact_sensitive_data()`:

| Data Type | Detection Pattern | Redaction Mask |
| :--- | :--- | :--- |
| **Bearer Tokens** | `Bearer\s+[A-Za-z0-9\-_=.]+` | `Bearer [REDACTED_TOKEN]` |
| **JWT Strings** | `ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}` | `[REDACTED_JWT]` |
| **Passwords** | `password\s*[:=]\s*[^\s]+` | `password: [REDACTED]` |
| **Payment Cards** | `\b(?:\d{4}[-\s]?){3}\d{4}\b` | `[REDACTED_CARD]` |

---

## 7. Rate Limiting & Denial of Service

* **Sliding Window Token Bucket**: In-memory rate limiting tracks requests per client IP.
* **Default Threshold**: 60 requests per minute per IP.
* **Behavior on Breach**: Returns HTTP `429 Too Many Requests` with a standard error envelope and `Retry-After: 60` header.

