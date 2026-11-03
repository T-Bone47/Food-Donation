"""
Configuration module for FoodShare AI Chatbot Microservice.
Centralizes environment variables, model parameters, and operational limits.
"""
import os
from dotenv import load_dotenv

load_dotenv()

# Server Settings
CHATBOT_PORT = int(os.getenv("CHATBOT_PORT", "5001"))
FLASK_DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

# CORS Configuration
CORS_ORIGINS = [
    origin.strip().rstrip("/")
    for origin in os.getenv("CORS_ORIGIN", "http://localhost:3000").split(",")
    if origin.strip()
]

# Backend Express API Settings
BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:5000/api/v1").rstrip("/")
SESSION_SECRET = os.getenv("SESSION_SECRET", "dev-only-session-secret-change-me")

# Gemini LLM Settings
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_MODEL = "gemini-2.5-flash"
GEMINI_MODEL = os.getenv("GEMINI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL
GEMINI_TIMEOUT_SECONDS = int(os.getenv("GEMINI_TIMEOUT_SECONDS", "20"))
GEMINI_MAX_RETRIES = int(os.getenv("GEMINI_MAX_RETRIES", "3"))
GEMINI_TEMPERATURE = float(os.getenv("GEMINI_TEMPERATURE", "0.4"))
GEMINI_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "450"))

# Rate Limiting
RATE_LIMIT_DEFAULT = os.getenv("CHATBOT_RATE_LIMIT", "20 per minute")

# Conversational Limits
MAX_MESSAGE_LENGTH = int(os.getenv("MAX_MESSAGE_LENGTH", "500"))
MAX_CONVERSATION_TURNS = int(os.getenv("MAX_CONVERSATION_TURNS", "8"))
CONVERSATION_TTL_SECONDS = int(os.getenv("CONVERSATION_TTL_SECONDS", "7200"))  # 2 hours

# Knowledge Retrieval Settings
BM25_TOP_K = int(os.getenv("BM25_TOP_K", "3"))
BM25_RELEVANCE_THRESHOLD = float(os.getenv("BM25_RELEVANCE_THRESHOLD", "1.5"))

def is_gemini_configured() -> bool:
    """Check if a valid Gemini API key is configured."""
    return bool(
        GEMINI_API_KEY
        and GEMINI_API_KEY not in {"YOUR_GEMINI_API_KEY_HERE", "your-gemini-api-key", ""}
    )

