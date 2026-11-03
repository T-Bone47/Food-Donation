"""
Platform Tools module for FoodShare AI Chatbot.
Executes authorized read queries against the Express backend API using caller session tokens.
Enforces strict parameter validation, timeout boundaries, and error encapsulation.
"""
import logging
from typing import Dict, Any, Optional, List
import requests

from config import BACKEND_URL

logger = logging.getLogger(__name__)
TOOL_TIMEOUT = 10

def _get_headers(token: Optional[str]) -> Dict[str, str]:
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers

def get_my_donations(token: str, limit: int = 5) -> Dict[str, Any]:
    """Retrieve the authenticated donor's recent donation listings."""
    if not token:
        return {"error": "Authentication required to view your donations."}
    try:
        url = f"{BACKEND_URL}/donations/mine?limit={limit}"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            payload = resp.json().get("data", {})
            donations = payload.get("donations", [])
            summary = []
            for d in donations:
                summary.append({
                    "id": d.get("id"),
                    "title": d.get("title"),
                    "category": d.get("food_category"),
                    "quantity": f"{d.get('quantity')} {d.get('unit')}",
                    "status": d.get("status"),
                    "pickup_deadline": d.get("pickup_deadline"),
                    "expires_at": d.get("expires_at"),
                    "address": d.get("pickup_address"),
                })
            return {"donations": summary, "count": len(summary)}
        return {"error": f"Failed to retrieve donations (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_my_donations failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_donation_by_id(token: str, donation_id: str) -> Dict[str, Any]:
    """Retrieve details of a specific donation by UUID."""
    if not token:
        return {"error": "Authentication required."}
    if not donation_id:
        return {"error": "Donation ID required."}
    try:
        url = f"{BACKEND_URL}/donations/{donation_id}"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            d = resp.json().get("data", {}).get("donation", {})
            return {
                "id": d.get("id"),
                "title": d.get("title"),
                "status": d.get("status"),
                "category": d.get("food_category"),
                "quantity": f"{d.get('quantity')} {d.get('unit')}",
                "pickup_address": d.get("pickup_address"),
                "pickup_deadline": d.get("pickup_deadline"),
                "expires_at": d.get("expires_at"),
            }
        elif resp.status_code in (403, 404):
            return {"error": "Donation not found or access unauthorized."}
        return {"error": f"Failed to retrieve donation (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_donation_by_id failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_available_donations(token: str, limit: int = 5) -> Dict[str, Any]:
    """Retrieve food donations currently AVAILABLE for volunteers to claim."""
    if not token:
        return {"error": "Authentication required."}
    try:
        url = f"{BACKEND_URL}/donations/available"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            donations = resp.json().get("data", {}).get("donations", [])[:limit]
            summary = []
            for d in donations:
                summary.append({
                    "id": d.get("id"),
                    "title": d.get("title"),
                    "category": d.get("food_category"),
                    "quantity": f"{d.get('quantity')} {d.get('unit')}",
                    "area": d.get("area"),
                    "pickup_deadline": d.get("pickup_deadline"),
                })
            return {"available_donations": summary, "count": len(summary)}
        return {"error": f"Failed to retrieve available donations (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_available_donations failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_volunteer_tasks(token: str) -> Dict[str, Any]:
    """Retrieve active tasks assigned to the authenticated volunteer."""
    if not token:
        return {"error": "Authentication required."}
    try:
        url = f"{BACKEND_URL}/volunteer/tasks"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            tasks = resp.json().get("data", {}).get("tasks", [])
            summary = []
            for t in tasks:
                d = t.get("donations", {})
                summary.append({
                    "assignment_id": t.get("id"),
                    "assignment_status": t.get("assignment_status"),
                    "donation_id": t.get("donation_id"),
                    "title": d.get("title"),
                    "status": d.get("status"),
                    "pickup_address": d.get("pickup_address"),
                    "pickup_deadline": d.get("pickup_deadline"),
                })
            return {"active_tasks": summary, "count": len(summary)}
        return {"error": f"Failed to retrieve volunteer tasks (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_volunteer_tasks failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_incoming_deliveries(token: str) -> Dict[str, Any]:
    """Retrieve incoming DELIVERED food shipments for the authenticated NGO."""
    if not token:
        return {"error": "Authentication required."}
    try:
        url = f"{BACKEND_URL}/ngos/incoming"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            deliveries = resp.json().get("data", {}).get("deliveries", [])
            summary = []
            for item in deliveries:
                summary.append({
                    "donation_id": item.get("id"),
                    "title": item.get("title"),
                    "quantity": f"{item.get('quantity')} {item.get('unit')}",
                    "category": item.get("food_category"),
                    "status": item.get("status"),
                    "delivered_at": item.get("delivered_at"),
                })
            return {"incoming_deliveries": summary, "count": len(summary)}
        return {"error": f"Failed to retrieve incoming deliveries (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_incoming_deliveries failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_ngo_verification_status(token: str) -> Dict[str, Any]:
    """Retrieve NGO verification status and approval notes."""
    if not token:
        return {"error": "Authentication required."}
    try:
        url = f"{BACKEND_URL}/ngos/verification"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            profile = resp.json().get("data", {}).get("profile")
            if not profile:
                return {"status": "unregistered", "message": "No NGO profile submitted yet."}
            return {
                "organization_name": profile.get("organization_name"),
                "verification_status": profile.get("verification_status"),
                "verification_notes": profile.get("verification_notes"),
            }
        return {"error": f"Failed to check NGO status (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_ngo_verification_status failed: %s", exc)
        return {"error": "Backend service unreachable."}

def get_user_notifications(token: str, limit: int = 5) -> Dict[str, Any]:
    """Retrieve unread/recent in-app notifications for the caller."""
    if not token:
        return {"error": "Authentication required."}
    try:
        url = f"{BACKEND_URL}/notifications?limit={limit}"
        resp = requests.get(url, headers=_get_headers(token), timeout=TOOL_TIMEOUT)
        if resp.status_code == 200:
            notifications = resp.json().get("data", {}).get("notifications", [])
            summary = []
            for n in notifications:
                summary.append({
                    "title": n.get("title"),
                    "message": n.get("message"),
                    "read": bool(n.get("read_at")),
                    "created_at": n.get("created_at"),
                })
            return {"notifications": summary, "count": len(summary)}
        return {"error": f"Failed to retrieve notifications (HTTP {resp.status_code})"}
    except requests.exceptions.RequestException as exc:
        logger.warning("Tool get_user_notifications failed: %s", exc)
        return {"error": "Backend service unreachable."}

