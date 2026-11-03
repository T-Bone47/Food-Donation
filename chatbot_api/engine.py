"""
Conversational Engine for FoodShare AI Chatbot.
Orchestrates intent classification, RAG retrieval, tool execution, LLM synthesis, and grounded fallback.
"""
import logging
import re
from typing import Dict, Any, Optional, List, Tuple

from config import is_gemini_configured
from retriever import retriever
from tools import (
    get_my_donations,
    get_available_donations,
    get_volunteer_tasks,
    get_incoming_deliveries,
    get_ngo_verification_status,
    get_user_notifications,
)
from conversation import conversation_manager
from gemini_client import (
    call_gemini,
    generate_grounded_fallback,
    ChatbotConfigError,
    ChatbotProviderError,
    ChatbotRateLimitError,
)
from security import check_prompt_injection, redact_sensitive_data, sanitize_user_input

logger = logging.getLogger(__name__)

INTENT_GREETING = "greeting"
INTENT_MY_DATA = "my_data"
INTENT_PLATFORM = "platform_knowledge"
INTENT_AMBIGUOUS = "ambiguous"
INTENT_UNSUPPORTED = "unsupported"

GREETING_WORDS = {"hi", "hello", "hey", "greetings", "good morning", "good afternoon", "good evening"}

def classify_intent(message: str) -> str:
    """Classify the user message into a high-level intent."""
    text = message.lower().strip()
    words = set(re.findall(r"\b\w+\b", text))

    if text in GREETING_WORDS or words.intersection(GREETING_WORDS) and len(words) <= 3:
        return INTENT_GREETING

    # Live user data queries
    my_data_patterns = [
        r"\b(my\s+donations?|my\s+listings?|what\s+did\s+i\s+donate)\b",
        r"\b(my\s+tasks?|my\s+pickups?|my\s+assignments?)\b",
        r"\b(my\s+deliveries|incoming\s+deliveries|incoming\s+food)\b",
        r"\b(my\s+verification|ngo\s+status|am\s+i\s+verified)\b",
        r"\b(my\s+notifications|recent\s+alerts)\b",
        r"\b(available\s+donations?|donations?\s+to\s+claim|what\s+can\s+i\s+pick\s*up)\b",
    ]
    for pattern in my_data_patterns:
        if re.search(pattern, text):
            return INTENT_MY_DATA

    # Check for off-topic / unsupported questions
    off_topic_patterns = [
        r"\b(python|javascript|react|code|programming|algorithm)\b",
        r"\b(weather|stock|crypto|bitcoin|recipe\s+for|cook\s+pasta)\b",
        r"\b(tell\s+a\s+joke|poem|story|movie|song)\b",
    ]
    for pattern in off_topic_patterns:
        if re.search(pattern, text):
            return INTENT_UNSUPPORTED

    # Ambiguous short single words
    if len(words) == 1 and text in {"status", "help", "cancel", "pickup", "delivery", "donate"}:
        return INTENT_AMBIGUOUS

    return INTENT_PLATFORM

def execute_live_tool(intent: str, user_message: str, user_role: Optional[str], token: Optional[str]) -> Tuple[Optional[str], Optional[Dict[str, Any]]]:
    """Execute authorized backend tool matching the query and role."""
    if not token:
        return None, None

    text = user_message.lower()

    if "available" in text or "to claim" in text:
        return "get_available_donations", get_available_donations(token)

    if user_role == "Donor" or "donation" in text or "listing" in text:
        if "my" in text or "i donate" in text:
            return "get_my_donations", get_my_donations(token)

    if user_role == "Volunteer" or "task" in text or "pickup" in text:
        if "my" in text or "assigned" in text:
            return "get_volunteer_tasks", get_volunteer_tasks(token)

    if user_role == "NGO" or "delivery" in text or "verification" in text:
        if "verification" in text or "verified" in text:
            return "get_ngo_verification_status", get_ngo_verification_status(token)
        if "incoming" in text or "deliver" in text:
            return "get_incoming_deliveries", get_incoming_deliveries(token)

    if "notification" in text or "alert" in text:
        return "get_user_notifications", get_user_notifications(token)

    return None, None

def get_role_followups(role: Optional[str]) -> List[str]:
    """Provide intelligent role-tailored prompt suggestions."""
    if role == "Donor":
        return [
            "How do I list surplus food?",
            "What is the pickup deadline rule?",
            "Can I cancel a donation after pickup?",
        ]
    elif role == "Volunteer":
        return [
            "How do I claim a donation?",
            "What happens after I pick up food?",
            "How many active tasks can I claim?",
        ]
    elif role == "NGO":
        return [
            "How do I confirm receipt of food?",
            "What is required for NGO verification?",
            "Who can confirm incoming deliveries?",
        ]
    elif role == "Admin":
        return [
            "How do I review NGO verifications?",
            "What are the administrator safety rules?",
            "Where can I view platform audit logs?",
        ]
    return [
        "How does the donation lifecycle work?",
        "How do I register as a donor or volunteer?",
        "What are the food safety requirements?",
    ]

def process_chat_message(
    user_message: str,
    conversation_id: Optional[str] = None,
    user_context: Optional[Dict[str, Any]] = None,
    raw_token: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Main conversational pipeline.
    """
    # 1. Sanitization & Length Checks
    clean_message = sanitize_user_input(user_message)
    if not clean_message:
        return {
            "response": "Please enter a question or topic so I can help you.",
            "sources": [],
            "conversation_id": conversation_id or "",
        }

    # 2. Prompt Injection Defense
    is_injection, injection_reason = check_prompt_injection(clean_message)
    if is_injection:
        logger.warning("Prompt injection blocked: %s", injection_reason)
        return {
            "response": (
                "I am the FoodShare platform assistant. I can only assist with food donations, "
                "volunteer tasks, NGO deliveries, and platform policies. I cannot execute code, "
                "override system instructions, or alter security rules."
            ),
            "sources": [],
            "conversation_id": conversation_id or "",
        }

    # 3. Context & Session Resolution
    user_id = user_context.get("userId") if user_context else None
    user_role = user_context.get("role") if user_context else "Guest"
    user_email = user_context.get("email") if user_context else ""

    session = conversation_manager.get_or_create(conversation_id, user_id=user_id)
    cid = session["id"]

    # 4. Intent Classification
    intent = classify_intent(clean_message)

    if intent == INTENT_GREETING:
        greeting_text = (
            f"Hello! I'm the FoodShare Assistant. As a **{user_role}**, how can I help you today?"
            if user_role != "Guest"
            else "Hello! I'm the FoodShare Assistant. How can I help you with donating, volunteering, or receiving food today?"
        )
        conversation_manager.add_message(cid, "user", clean_message)
        conversation_manager.add_message(cid, "assistant", greeting_text)
        return {
            "conversation_id": cid,
            "response": greeting_text,
            "role": user_role,
            "sources": [],
            "suggested_followups": get_role_followups(user_role),
        }

    if intent == INTENT_AMBIGUOUS:
        clarification = (
            f"Could you specify what you'd like to know about '{clean_message}'? For example, are you asking "
            f"how to check status, create a listing, or complete a delivery?"
        )
        conversation_manager.add_message(cid, "user", clean_message)
        conversation_manager.add_message(cid, "assistant", clarification)
        return {
            "conversation_id": cid,
            "response": clarification,
            "role": user_role,
            "sources": [],
            "suggested_followups": get_role_followups(user_role),
        }

    if intent == INTENT_UNSUPPORTED:
        unsupported_reply = (
            "I specialize exclusively in the FoodShare Food Donation Platform (food listings, volunteer pickups, "
            "NGO deliveries, safety standards, and account help). I cannot assist with general programming, "
            "external topics, or unrelated tasks."
        )
        conversation_manager.add_message(cid, "user", clean_message)
        conversation_manager.add_message(cid, "assistant", unsupported_reply)
        return {
            "conversation_id": cid,
            "response": unsupported_reply,
            "role": user_role,
            "sources": [],
            "suggested_followups": get_role_followups(user_role),
        }

    # 5. Tool Execution (if live user data is needed)
    tool_name, tool_data = None, None
    if intent == INTENT_MY_DATA and raw_token:
        tool_name, tool_data = execute_live_tool(intent, clean_message, user_role, raw_token)

    # 6. RAG Retrieval
    knowledge_chunks = retriever.retrieve(clean_message, user_role=user_role)
    sources = [
        {"id": c["id"], "title": c["title"], "source": c["source"]}
        for c in knowledge_chunks
    ]

    # 7. Prompt Construction
    system_instruction = (
        "You are 'FoodBot', the official verified AI assistant for 'FoodShare' (Unified Food Donation Platform). "
        "Your role is to guide donors, volunteers, NGOs, and administrators with accurate, grounded information.\n\n"
        f"Authenticated User Profile: Role='{user_role}', UserID='{user_id or 'anonymous'}'.\n"
        "Core Directives:\n"
        "1. Base your response strictly on the provided Context and Live Tool Data.\n"
        "2. Never fabricate platform policies, expiry rules, contact details, or donation records.\n"
        "3. Emphasize that the pickup deadline must never exceed the expiry time.\n"
        "4. Clarify that donations can only be cancelled BEFORE physical pickup.\n"
        "5. Explain that impact metrics derive strictly from COMPLETED donations.\n"
        "6. Do not claim you executed a state-changing action. For actions like donating or confirming, direct users to the UI.\n"
        "7. Present lists with clean Markdown formatting."
    )

    context_text = "\n\n".join([f"[{c['title']}]\n{c['content']}" for c in knowledge_chunks])
    tool_text = f"Live Platform Tool Result ({tool_name}):\n{tool_data}" if tool_data else "None"

    prompt = (
        f"<context>\n{context_text}\n</context>\n\n"
        f"<live_tool_data>\n{tool_text}\n</live_tool_data>\n\n"
        f"<user_question>\n{clean_message}\n</user_question>\n\n"
        f"Answer:"
    )

    # Multi-turn history from conversation window
    history_window = conversation_manager.get_context_window(cid)

    # 8. LLM Invocation with Fallback
    try:
        response_text = call_gemini(system_instruction, prompt, history=history_window)
    except (ChatbotConfigError, ChatbotProviderError, ChatbotRateLimitError) as exc:
        logger.info("Using local grounded fallback synthesizer: %s", exc)
        response_text = generate_grounded_fallback(
            clean_message, knowledge_chunks, tool_data=tool_data, user_role=user_role
        )

    # Sanitize and redact sensitive info
    safe_response = redact_sensitive_data(response_text)

    # Update conversation history
    conversation_manager.add_message(cid, "user", clean_message)
    conversation_manager.add_message(cid, "assistant", safe_response)

    return {
        "conversation_id": cid,
        "response": safe_response,
        "role": user_role,
        "tools_used": [tool_name] if tool_name else [],
        "sources": sources,
        "suggested_followups": get_role_followups(user_role),
    }

