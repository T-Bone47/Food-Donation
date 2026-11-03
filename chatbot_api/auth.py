"""
Authentication and token verification module for FoodShare AI Chatbot.
Verifies backend HMAC-SHA256 session tokens and extracts authenticated user context.
"""
import base64
import hashlib
import hmac
import json
import logging
import time
from typing import Optional, Dict, Any

from config import SESSION_SECRET, BACKEND_URL

logger = logging.getLogger(__name__)

def base64url_decode(input_str: str) -> bytes:
    """Decode base64url without padding."""
    rem = len(input_str) % 4
    if rem > 0:
        input_str += "=" * (4 - rem)
    return base64.urlsafe_b64decode(input_str.encode("utf-8"))

def base64url_encode(input_bytes: bytes) -> str:
    """Encode bytes to base64url string without padding."""
    return base64.urlsafe_b64encode(input_bytes).decode("utf-8").rstrip("=")

def verify_session_token(token: str, secret: str = SESSION_SECRET) -> Optional[Dict[str, Any]]:
    """
    Verify an HMAC-SHA256 backend session token.
    Token format: `<encodedPayload>.<signature>`
    Returns user payload dictionary or None if invalid/expired.
    """
    if not token or not isinstance(token, str):
        return None

    parts = token.strip().split(".")
    if len(parts) != 2:
        return None

    encoded_payload, signature = parts

    try:
        expected_sig_bytes = hmac.new(
            secret.encode("utf-8"),
            encoded_payload.encode("utf-8"),
            hashlib.sha256
        ).digest()
        expected_sig = base64url_encode(expected_sig_bytes)

        if not hmac.compare_digest(signature, expected_sig):
            return None

        payload_bytes = base64url_decode(encoded_payload)
        payload = json.loads(payload_bytes.decode("utf-8"))

        # Verify required claims
        user_id = payload.get("userId")
        role = payload.get("role")
        exp = payload.get("exp")

        if not user_id or not role or not exp:
            return None

        # Verify expiry
        if exp <= int(time.time()):
            logger.info("Session token has expired: exp=%s, now=%s", exp, int(time.time()))
            return None

        return {
            "userId": user_id,
            "role": role,
            "email": payload.get("email", ""),
            "jti": payload.get("jti", ""),
        }
    except Exception as exc:
        logger.warning("Error verifying session token: %s", exc)
        return None

def extract_user_from_request(headers: Dict[str, str]) -> Optional[Dict[str, Any]]:
    """Extract and verify user context from HTTP Authorization header."""
    auth_header = headers.get("Authorization", "") or headers.get("authorization", "")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None

    token = auth_header[7:].strip()
    return verify_session_token(token)

