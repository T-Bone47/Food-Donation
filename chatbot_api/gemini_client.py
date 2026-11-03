"""
Google Gemini API Client for FoodShare AI Chatbot.
Handles model communication, exponential backoff retries, error classification, and grounded fallback.
"""
import logging
import time
from typing import Dict, Any, List, Optional
import requests

from config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    GEMINI_TIMEOUT_SECONDS,
    GEMINI_MAX_RETRIES,
    GEMINI_TEMPERATURE,
    GEMINI_MAX_OUTPUT_TOKENS,
    is_gemini_configured,
)

logger = logging.getLogger(__name__)

class ChatbotConfigError(Exception):
    """Raised when the AI provider is not configured."""

class ChatbotProviderError(Exception):
    """Raised when the AI provider returns an unrecoverable failure."""

class ChatbotRateLimitError(Exception):
    """Raised when the AI provider rate limit is exceeded."""

def generate_grounded_fallback(
    user_message: str,
    knowledge_chunks: List[Dict[str, Any]],
    tool_data: Optional[Dict[str, Any]] = None,
    user_role: Optional[str] = None,
) -> str:
    """
    Intelligent local synthesizer for offline mode or when Gemini is unconfigured.
    Directly answers from retrieved knowledge base chunks and live tool records.
    """
    lines = []

    # If live tool data was retrieved, present it clearly
    if tool_data:
        if "donations" in tool_data:
            donations = tool_data["donations"]
            if donations:
                lines.append("Here are your recent donation listings:")
                for d in donations[:3]:
                    lines.append(f"• **{d['title']}** ({d['quantity']}) — Status: `{d['status']}` (Deadline: {d.get('pickup_deadline', 'N/A')})")
            else:
                lines.append("You currently have no listed donations.")
        elif "active_tasks" in tool_data:
            tasks = tool_data["active_tasks"]
            if tasks:
                lines.append("Here are your active volunteer tasks:")
                for t in tasks[:3]:
                    lines.append(f"• **{t.get('title', 'Task')}** — Status: `{t.get('status')}` (Pickup: {t.get('pickup_address', 'N/A')})")
            else:
                lines.append("You have no active volunteer tasks at the moment.")
        elif "available_donations" in tool_data:
            avail = tool_data["available_donations"]
            if avail:
                lines.append("Here are donations available for collection:")
                for d in avail[:3]:
                    lines.append(f"• **{d['title']}** ({d['quantity']}) in {d.get('area', 'your area')} — Deadline: {d.get('pickup_deadline', 'N/A')}")
            else:
                lines.append("There are currently no unclaimed donations available in your area.")
        elif "incoming_deliveries" in tool_data:
            deliveries = tool_data["incoming_deliveries"]
            if deliveries:
                lines.append("Here are incoming deliveries addressed to your NGO:")
                for item in deliveries[:3]:
                    lines.append(f"• **{item['title']}** ({item['quantity']}) — Arrived for receipt confirmation.")
            else:
                lines.append("You have no pending incoming deliveries right now.")
        elif "verification_status" in tool_data:
            lines.append(f"Your NGO verification status is: **{tool_data['verification_status'].upper()}**.")
            if tool_data.get("verification_notes"):
                lines.append(f"Notes: {tool_data['verification_notes']}")

        if lines:
            return "\n".join(lines)

    # Answer from knowledge chunks
    if knowledge_chunks:
        primary = knowledge_chunks[0]
        summary = primary["content"].strip()
        lines.append(f"**{primary['title']}**\n\n{summary}")

        if len(knowledge_chunks) > 1:
            secondary = knowledge_chunks[1]
            lines.append(f"\n\n**Additional Details ({secondary['title']}):**\n{secondary['content'].strip()}")

        return "\n".join(lines)

    return (
        "I don't have enough specific information in the platform documentation to answer that. "
        "Please consult the platform User Guide (/docs/USER_GUIDE.md) or contact your administrator."
    )

def call_gemini(
    system_instruction: str,
    prompt: str,
    history: Optional[List[Dict[str, str]]] = None,
) -> str:
    """
    Invoke Gemini REST API with retry backoff and timeout handling.
    """
    if not is_gemini_configured():
        raise ChatbotConfigError("The chatbot AI provider is not configured.")

    api_url = (
        f"https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent?key={GEMINI_API_KEY}"
    )

    contents = []

    # Include multi-turn conversation history
    if history:
        for turn in history:
            role = "user" if turn["role"] == "user" else "model"
            contents.append({"role": role, "parts": [{"text": turn["content"]}]})

    # Add current turn
    contents.append({"role": "user", "parts": [{"text": prompt}]})

    payload = {
        "contents": contents,
        "systemInstruction": {"parts": [{"text": system_instruction}]},
        "generationConfig": {
            "temperature": GEMINI_TEMPERATURE,
            "maxOutputTokens": GEMINI_MAX_OUTPUT_TOKENS,
        },
    }

    last_error = None
    for attempt in range(GEMINI_MAX_RETRIES):
        try:
            resp = requests.post(
                api_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=GEMINI_TIMEOUT_SECONDS,
            )
        except requests.exceptions.RequestException as exc:
            last_error = exc
            logger.warning("Gemini attempt %d failed with network error: %s", attempt + 1, exc)
            if attempt < GEMINI_MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
                continue
            break

        if resp.status_code == 200:
            try:
                data = resp.json()
                candidate = data["candidates"][0]
                text = candidate["content"]["parts"][0]["text"]
                return text.strip()
            except (KeyError, IndexError, TypeError, ValueError) as exc:
                logger.error("Failed to parse Gemini response payload: %s", exc)
                raise ChatbotProviderError("The AI provider returned an unexpected response format.")

        if resp.status_code == 429:
            last_error = f"rate limit (status 429)"
            if attempt < GEMINI_MAX_RETRIES - 1:
                time.sleep(2 ** attempt)
                continue
            raise ChatbotRateLimitError("Gemini rate limit exceeded. Please try again shortly.")

        if resp.status_code in {500, 502, 503, 504} and attempt < GEMINI_MAX_RETRIES - 1:
            last_error = f"server error (status {resp.status_code})"
            time.sleep(2 ** attempt)
            continue

        raise ChatbotProviderError(f"The AI provider rejected the request (status {resp.status_code}).")

    raise ChatbotProviderError(f"The AI service is unavailable: {last_error or 'no response'}")

