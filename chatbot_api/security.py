"""
Security, safety, and input sanitization module for FoodShare AI Chatbot.
Provides prompt-injection defense, input validation, and sensitive data redaction.
"""
import re
from typing import Tuple

# Suspicious jailbreak / instruction override patterns
INJECTION_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior|above)\s+instructions",
    r"disregard\s+(all\s+)?(previous|prior|system)\s+(instructions|prompts)",
    r"override\s+system\s+(prompt|instructions|rules)",
    r"you\s+are\s+now\s+(an?\s+)?(unrestricted|dan|jailbroken|evil)",
    r"act\s+as\s+(dan|jailbreak|root|superuser)",
    r"reveal\s+(your\s+)?(system\s+prompt|secret\s+key|api\s+key)",
    r"show\s+me\s+your\s+initial\s+instructions",
    r"what\s+is\s+the\s+system\s+prompt",
]

COMPILED_INJECTIONS = [re.compile(p, re.IGNORECASE) for p in INJECTION_PATTERNS]

# Regex patterns for sensitive data masking
REDACT_PATTERNS = [
    # JWT tokens
    (re.compile(r"eyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}(\.[A-Za-z0-9_-]{15,})?"), "[REDACTED_TOKEN]"),
    # Credit cards
    (re.compile(r"\b(?:\d[ -]*?){13,16}\b"), "[REDACTED_CARD]"),
    # Password parameters
    (re.compile(r"(?i)(password|secret|key)\s*[:=]\s*['\"]?[^\s'\"]+"), r"\1=[REDACTED]"),
]

def check_prompt_injection(text: str) -> Tuple[bool, str]:
    """
    Check if the user input contains adversarial prompt injection patterns.
    Returns (is_injection, reason).
    """
    if not text or not isinstance(text, str):
        return False, ""

    normalized = re.sub(r"\s+", " ", text).strip()
    for pattern in COMPILED_INJECTIONS:
        if pattern.search(normalized):
            return True, "Potential instruction override or prompt injection detected."

    return False, ""

def redact_sensitive_data(text: str) -> str:
    """Mask sensitive tokens, credentials, and payment details from text."""
    if not text or not isinstance(text, str):
        return ""
    masked = text
    for pattern, replacement in REDACT_PATTERNS:
        masked = pattern.sub(replacement, masked)
    return masked

def sanitize_user_input(text: str, max_length: int = 500) -> str:
    """Trim, sanitize whitespace, and enforce length boundaries."""
    if not text or not isinstance(text, str):
        return ""
    # Strip null bytes and control characters except standard whitespace
    clean = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    clean = clean.strip()
    return clean[:max_length]

