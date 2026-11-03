"""
Conversation and session memory management module for FoodShare AI Chatbot.
Handles session isolation, sliding context windows, message pruning, and privacy boundaries.
"""
import time
import uuid
from typing import Dict, List, Optional, Any

from config import MAX_CONVERSATION_TURNS, CONVERSATION_TTL_SECONDS

class ConversationManager:
    """In-memory conversation store with sliding window memory and TTL cleanup."""

    def __init__(self, max_turns: int = MAX_CONVERSATION_TURNS, ttl_seconds: int = CONVERSATION_TTL_SECONDS):
        self.max_turns = max_turns
        self.ttl_seconds = ttl_seconds
        self.sessions: Dict[str, Dict[str, Any]] = {}

    def _cleanup_expired(self):
        now = time.time()
        expired_ids = [
            cid for cid, s in self.sessions.items()
            if now - s.get("updated_at", 0) > self.ttl_seconds
        ]
        for cid in expired_ids:
            del self.sessions[cid]

    def get_or_create(self, conversation_id: Optional[str] = None, user_id: Optional[str] = None) -> Dict[str, Any]:
        """Get existing conversation session or initialize a new isolated session."""
        self._cleanup_expired()
        cid = conversation_id.strip() if conversation_id and isinstance(conversation_id, str) else ""

        if cid and cid in self.sessions:
            session = self.sessions[cid]
            # Ensure session privacy: if session has a bound user_id, caller must match
            if session.get("user_id") and user_id and session["user_id"] != user_id:
                # Security boundary: do not allow cross-user conversation hijacking
                cid = str(uuid.uuid4())
            else:
                session["updated_at"] = time.time()
                return session

        new_id = cid if cid else str(uuid.uuid4())
        session = {
            "id": new_id,
            "user_id": user_id,
            "title": "New Conversation",
            "messages": [],
            "summary": None,
            "created_at": time.time(),
            "updated_at": time.time(),
        }
        self.sessions[new_id] = session
        return session

    def add_message(self, conversation_id: str, role: str, content: str):
        """Append a message to the conversation and generate a title if new."""
        session = self.get_or_create(conversation_id)
        now = time.time()
        session["updated_at"] = now

        # Auto-generate title from first user message
        if role == "user" and session["title"] == "New Conversation":
            first_line = content.strip().split("\n")[0]
            session["title"] = first_line[:36] + ("..." if len(first_line) > 36 else "")

        session["messages"].append({
            "role": role,
            "content": content,
            "timestamp": now,
        })

        # Sliding window pruning and compact summarization
        # When turns exceed twice the limit, summarize older turns
        if len(session["messages"]) > self.max_turns * 2:
            older_messages = session["messages"][:-self.max_turns]
            session["messages"] = session["messages"][-self.max_turns:]
            # Build compact summary note
            topics = set()
            for m in older_messages:
                words = m["content"].lower().split()
                for keyword in ["donation", "volunteer", "pickup", "delivery", "ngo", "status", "cancel"]:
                    if any(keyword in w for w in words):
                        topics.add(keyword)
            if topics:
                session["summary"] = f"Earlier conversation discussed: {', '.join(sorted(topics))}."

    def get_messages(self, conversation_id: str) -> List[Dict[str, Any]]:
        """Retrieve full message history for a conversation."""
        if conversation_id in self.sessions:
            return list(self.sessions[conversation_id]["messages"])
        return []

    def get_context_window(self, conversation_id: str) -> List[Dict[str, str]]:
        """Retrieve formatted message history for LLM prompt context."""
        if conversation_id not in self.sessions:
            return []
        session = self.sessions[conversation_id]
        window = []
        if session.get("summary"):
            window.append({"role": "system", "content": f"[Context Summary: {session['summary']}]"})
        for m in session["messages"][-self.max_turns:]:
            window.append({"role": m["role"], "content": m["content"]})
        return window

    def delete_conversation(self, conversation_id: str, user_id: Optional[str] = None) -> bool:
        """Delete conversation if caller owns it."""
        if conversation_id in self.sessions:
            session = self.sessions[conversation_id]
            if session.get("user_id") and user_id and session["user_id"] != user_id:
                return False
            del self.sessions[conversation_id]
            return True
        return False

    def clear_messages(self, conversation_id: str) -> bool:
        """Clear message history while retaining conversation ID."""
        if conversation_id in self.sessions:
            self.sessions[conversation_id]["messages"] = []
            self.sessions[conversation_id]["summary"] = None
            self.sessions[conversation_id]["title"] = "New Conversation"
            self.sessions[conversation_id]["updated_at"] = time.time()
            return True
        return False

conversation_manager = ConversationManager()

