"""
FoodShare AI Chatbot Microservice — Flask Application Entrypoint.
Provides production-ready REST endpoints for conversational assistance,
RAG retrieval, platform tool integration, and session memory.
"""
import logging
import time
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

from config import (
    CHATBOT_PORT,
    FLASK_DEBUG,
    CORS_ORIGINS,
    RATE_LIMIT_DEFAULT,
    MAX_MESSAGE_LENGTH,
    is_gemini_configured,
)
from auth import extract_user_from_request
from conversation import conversation_manager
from engine import process_chat_message, get_role_followups

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(name)s: %(message)s",
)
logger = logging.getLogger("chatbot_api")

app = Flask(__name__)

# Rate Limiter
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=[RATE_LIMIT_DEFAULT],
    storage_uri="memory://",
)

# CORS configuration
CORS(
    app,
    resources={
        r"/*": {
            "origins": CORS_ORIGINS,
            "methods": ["GET", "POST", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Request-ID"],
        }
    },
)

# Metrics store
METRICS = {
    "total_requests": 0,
    "successful_responses": 0,
    "failed_requests": 0,
    "total_latency_ms": 0.0,
}

@app.before_request
def assign_request_id():
    request.request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))

@app.after_request
def add_security_headers(response):
    response.headers["X-Request-ID"] = getattr(request, "request_id", "")
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    return response

@app.route("/chat", methods=["POST"])
@app.route("/api/chat", methods=["POST"])
@limiter.limit(RATE_LIMIT_DEFAULT)
def chat_endpoint():
    """Main conversational endpoint."""
    start_time = time.time()
    METRICS["total_requests"] += 1

    if not request.is_json:
        METRICS["failed_requests"] += 1
        return jsonify({"error": "Content-Type must be application/json"}), 400

    payload = request.get_json(silent=True) or {}
    user_message = payload.get("message")
    conversation_id = payload.get("conversation_id")

    if user_message is None:
        METRICS["failed_requests"] += 1
        return jsonify({"error": "No message provided"}), 400

    if not isinstance(user_message, str):
        METRICS["failed_requests"] += 1
        return jsonify({"error": "Message must be a string"}), 400

    if not user_message.strip():
        METRICS["failed_requests"] += 1
        return jsonify({"error": "Message cannot be empty"}), 400

    if len(user_message) > MAX_MESSAGE_LENGTH:
        METRICS["failed_requests"] += 1
        return (
            jsonify({
                "error": f"Message too long. Maximum {MAX_MESSAGE_LENGTH} characters allowed."
            }),
            400,
        )

    # Extract authenticated caller context
    user_context = extract_user_from_request(request.headers)
    raw_token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        raw_token = auth_header[7:].strip()

    try:
        result = process_chat_message(
            user_message=user_message,
            conversation_id=conversation_id,
            user_context=user_context,
            raw_token=raw_token,
        )

        latency = (time.time() - start_time) * 1000.0
        METRICS["successful_responses"] += 1
        METRICS["total_latency_ms"] += latency

        return jsonify(result), 200

    except Exception as exc:
        METRICS["failed_requests"] += 1
        logger.error("Chatbot internal error: %s", exc, exc_info=True)
        return (
            jsonify({
                "error": "The assistant encountered an unexpected error. Please try again.",
                "code": "CHATBOT_ERROR",
            }),
            500,
        )

@app.route("/api/conversations/<conversation_id>", methods=["GET"])
def get_conversation_history(conversation_id):
    """Retrieve message history for an active conversation."""
    session = conversation_manager.get_or_create(conversation_id)
    return jsonify({
        "conversation_id": conversation_id,
        "title": session.get("title", "Conversation"),
        "messages": session.get("messages", []),
    }), 200

@app.route("/api/conversations/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    """Delete a conversation session."""
    user_context = extract_user_from_request(request.headers)
    user_id = user_context.get("userId") if user_context else None
    deleted = conversation_manager.delete_conversation(conversation_id, user_id=user_id)
    if deleted:
        return jsonify({"status": "deleted", "conversation_id": conversation_id}), 200
    return jsonify({"error": "Conversation not found or access unauthorized"}), 404

@app.route("/api/conversations/<conversation_id>/clear", methods=["POST"])
def clear_conversation(conversation_id):
    """Clear messages in a conversation while retaining session ID."""
    cleared = conversation_manager.clear_messages(conversation_id)
    if cleared:
        return jsonify({"status": "cleared", "conversation_id": conversation_id}), 200
    return jsonify({"error": "Conversation not found"}), 404

@app.route("/api/suggestions", methods=["GET"])
@limiter.exempt
def get_suggestions():
    """Return role-aware suggested prompts."""
    user_context = extract_user_from_request(request.headers)
    role = user_context.get("role") if user_context else "Guest"
    return jsonify({
        "role": role,
        "suggestions": get_role_followups(role),
    }), 200

@app.route("/", methods=["GET"])
@limiter.exempt
def root_index():
    """Root entrypoint with HTML service portal and JSON fallback."""
    if "text/html" in request.headers.get("Accept", ""):
        html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>FoodShare AI Assistant Service</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 24px; box-sizing: border-box; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 40px; max-width: 560px; width: 100%; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5); text-align: center; }
    .badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; background: rgba(34, 197, 94, 0.15); border: 1px solid #22c55e; color: #4ade80; border-radius: 9999px; font-size: 13px; font-weight: 600; text-transform: uppercase; margin-bottom: 20px; }
    .dot { width: 8px; height: 8px; background: #22c55e; border-radius: 50%; display: inline-block; }
    h1 { margin: 0 0 12px; font-size: 26px; font-weight: 700; color: #ffffff; }
    p { margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6; }
    .btn { display: inline-block; background: #16a34a; hover: #15803d; color: #ffffff; font-weight: 600; font-size: 16px; padding: 12px 28px; border-radius: 8px; text-decoration: none; transition: background 0.2s; margin-bottom: 24px; }
    .btn:hover { background: #15803d; }
    .routes { background: #0f172a; border: 1px solid #334155; border-radius: 8px; padding: 16px; text-align: left; font-size: 13px; font-family: ui-monospace, monospace; color: #cbd5e1; }
    .route-item { margin: 6px 0; }
    .method { color: #38bdf8; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge"><span class="dot"></span> Service Online · Port 5002</div>
    <h1>FoodShare AI Chatbot Service</h1>
    <p>This is the backend AI microservice powering conversational assistance, regulatory food safety citations, and platform workflows.</p>
    <a href="http://localhost:3000" class="btn">Open FoodShare Web App (Port 3000) &rarr;</a>
    <div class="routes">
      <div style="font-weight: 600; color: #94a3b8; margin-bottom: 8px;">Active Microservice Endpoints:</div>
      <div class="route-item"><span class="method">POST</span> /chat — Conversational assistant</div>
      <div class="route-item"><span class="method">GET</span> /health — Service readiness check</div>
      <div class="route-item"><span class="method">GET</span> /api/suggestions — Role-aware quick prompts</div>
      <div class="route-item"><span class="method">GET</span> /api/metrics — Latency and throughput</div>
    </div>
  </div>
</body>
</html>"""
        return html, 200, {"Content-Type": "text/html; charset=utf-8"}

    return jsonify({
        "service": "FoodShare Chatbot",
        "status": "healthy",
        "version": "1.0.0",
        "provider_configured": is_gemini_configured(),
        "web_app": "http://localhost:3000",
    }), 200

@app.route("/health", methods=["GET"])
@app.route("/api/health", methods=["GET"])
@limiter.exempt
def health():
    """Service liveness and provider readiness check."""
    return jsonify({
        "status": "healthy",
        "service": "FoodShare Chatbot",
        "version": "1.0.0",
        "provider_configured": is_gemini_configured(),
    }), 200

@app.route("/api/metrics", methods=["GET"])
@limiter.exempt
def metrics():
    """Observability metrics for performance and error monitoring."""
    total = METRICS["total_requests"]
    avg_latency = (
        METRICS["total_latency_ms"] / METRICS["successful_responses"]
        if METRICS["successful_responses"] > 0
        else 0.0
    )
    return jsonify({
        "total_requests": total,
        "successful_responses": METRICS["successful_responses"],
        "failed_requests": METRICS["failed_requests"],
        "average_latency_ms": round(avg_latency, 2),
    }), 200

@app.errorhandler(404)
def not_found(error):
    """Handle 404 gracefully with HTML portal or JSON guide."""
    if "text/html" in request.headers.get("Accept", ""):
        return root_index()
    return jsonify({
        "error": "Not Found",
        "message": "Endpoint not found on FoodShare Chatbot service",
        "service": "FoodShare Chatbot Microservice",
        "health": "/health",
        "web_app": "http://localhost:3000",
    }), 404

if __name__ == "__main__":
    logger.info("Starting FoodShare Chatbot Microservice on port %d", CHATBOT_PORT)
    app.run(
        debug=FLASK_DEBUG,
        port=CHATBOT_PORT,
    )
