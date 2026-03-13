# ==============================================================
# backend/firebase_utils.py — Finalized Firebase Data Layer
# ==============================================================
# Purpose:
#   Unified Firestore interface for managing users, sessions,
#   interactions, summaries, and contextual metadata for the
#   Mental Health Chatbot project.
# ==============================================================

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timezone
import uuid
import traceback

# ==============================================================
# 1️⃣ Firebase Initialization
# ==============================================================

try:
    cred = credentials.Certificate(
        r"C:\Users\kazim\Downloads\mindmate-b420b-firebase-adminsdk-fbsvc-b3801a9502.json"
    )
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("✅ [Firebase] Connection established successfully.")
except Exception as e:
    print(f"🔥 [Firebase Init Error]: {traceback.format_exc()}")
    raise SystemExit("Failed to initialize Firebase connection.")

# ==============================================================
# 2️⃣ Helper: Timestamp Generator
# ==============================================================

def utc_now():
    """Return current UTC datetime with timezone."""
    return datetime.now(timezone.utc)

# ==============================================================
# 3️⃣ User Management
# ==============================================================

def ensure_user_exists(user_id: str):
    """Create user root document if not already present."""
    try:
        user_ref = db.collection("conversations").document(user_id)
        if not user_ref.get().exists:
            user_ref.set({
                "user_id": user_id,
                "created_at": firestore.SERVER_TIMESTAMP,
                "status": "active",
                "total_sessions": 0,
                "last_active": firestore.SERVER_TIMESTAMP,
            })
            print(f"👤 [User Created] {user_id}")
        else:
            user_ref.update({"last_active": firestore.SERVER_TIMESTAMP})
    except Exception:
        print(f"🔥 [User Error]: {traceback.format_exc()}")

# ==============================================================
# 4️⃣ Session Management
# ==============================================================

def create_new_session(user_id: str) -> str:
    """Create a new chat session document for a user."""
    try:
        ensure_user_exists(user_id)
        session_id = f"session-{uuid.uuid4().hex[:8]}"
        session_ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
        )
        session_ref.set({
            "session_id": session_id,
            "title": "Untitled Session",
            "created_at": firestore.SERVER_TIMESTAMP,
            "last_updated": firestore.SERVER_TIMESTAMP,
            "summary": None,
            "emotional_trend": None,
            "topics": [],
        })
        print(f"💬 [Session Created] {session_id}")
        return session_id
    except Exception:
        print(f"🔥 [Create Session Error]: {traceback.format_exc()}")
        return ""

def update_session_title(user_id: str, session_id: str, title: str) -> bool:
    """Update a session's title."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
        )
        ref.update({"title": title, "last_updated": firestore.SERVER_TIMESTAMP})
        print(f"🏷️ [Title Updated] {title}")
        return True
    except Exception:
        print(f"🔥 [Update Title Error]: {traceback.format_exc()}")
        return False

# ==============================================================
# 5️⃣ Interaction Management
# ==============================================================

def save_interaction_to_session(
    user_id: str,
    session_id: str,
    user_input: str,
    gpt_response: str,
    text_emotion: dict,
    tone_emotion: dict,
) -> bool:
    """Save a structured user–assistant exchange to Firestore."""
    try:
        session_ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
        )
        session_ref.update({"last_updated": firestore.SERVER_TIMESTAMP})

        interaction_ref = session_ref.collection("interactions").document()
        payload = {
            "interaction_id": interaction_ref.id,
            "timestamp": utc_now(),
            "user_input": user_input.strip(),
            "gpt_response": gpt_response.strip(),
            "emotions": {
                "text": {
                    "label": text_emotion.get("label", "neutral"),
                    "score": float(text_emotion.get("score", 0.0)),
                },
                "tone": {
                    "label": tone_emotion.get("label", "neutral"),
                    "score": float(tone_emotion.get("score", 0.0)),
                },
            },
        }
        interaction_ref.set(payload)
        print(f"💾 [Interaction Saved] {interaction_ref.id}")
        return True
    except Exception:
        print(f"🔥 [Save Interaction Error]: {traceback.format_exc()}")
        return False

def get_session_interactions(user_id: str, session_id: str) -> list:
    """Return all interactions for a given session."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
            .collection("interactions")
            .order_by("timestamp", direction=firestore.Query.ASCENDING)
        )
        return [doc.to_dict() for doc in ref.stream()]
    except Exception:
        print(f"🔥 [Get Interactions Error]: {traceback.format_exc()}")
        return []

# ==============================================================
# 6️⃣ Session Details Retrieval
# ==============================================================

def get_all_sessions(user_id: str) -> list:
    """Fetch metadata for all sessions belonging to a user."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .order_by("last_updated", direction=firestore.Query.DESCENDING)
        )
        sessions = []
        for doc in ref.stream():
            d = doc.to_dict()
            sessions.append({
                "session_id": d.get("session_id", doc.id),
                "title": d.get("title", "Untitled Session"),
                "created_at": d.get("created_at"),
                "last_updated": d.get("last_updated"),
                "summary": d.get("summary"),
                "emotional_trend": d.get("emotional_trend"),
                "topics": d.get("topics", []),
            })
        return sessions
    except Exception:
        print(f"🔥 [Get Sessions Error]: {traceback.format_exc()}")
        return []

def get_session_details(user_id: str, session_id: str) -> dict:
    """Get metadata + summary of a session."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
        )
        doc = ref.get()
        return doc.to_dict() if doc.exists else None
    except Exception:
        print(f"🔥 [Get Session Details Error]: {traceback.format_exc()}")
        return None

# ==============================================================
# 7️⃣ Summarization Utilities (for Pipeline 3)
# ==============================================================

def save_session_summary(user_id: str, session_id: str, summary: dict) -> bool:
    """
    Attach a Gemini summary to the session document.
    Expected summary structure:
      {
        "summary": str,
        "emotional_trend": str,
        "topics": list[str],
        "confidence": float
      }
    """
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
        )
        data = {
            "summary": summary.get("summary", ""),
            "emotional_trend": summary.get("emotional_trend", "unclear"),
            "topics": summary.get("topics", []),
            "summary_confidence": float(summary.get("confidence", 0.8)),
            "summary_generated_at": firestore.SERVER_TIMESTAMP,
            "last_updated": firestore.SERVER_TIMESTAMP,
        }
        ref.update(data)
        print(f"🧩 [Summary Stored] Session {session_id}")
        return True
    except Exception:
        print(f"🔥 [Save Summary Error]: {traceback.format_exc()}")
        return False

def get_user_recent_summaries(user_id: str, limit: int = 3) -> list:
    """Fetch the latest session summaries for contextual memory."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .order_by("summary_generated_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        summaries = []
        for doc in ref.stream():
            data = doc.to_dict()
            if data.get("summary"):
                summaries.append({
                    "summary": data.get("summary"),
                    "emotional_trend": data.get("emotional_trend", "unknown"),
                    "topics": data.get("topics", []),
                    "confidence": float(data.get("summary_confidence", 0.8)),
                })
        return summaries
    except Exception:
        print(f"🔥 [Get Recent Summaries Error]: {traceback.format_exc()}")
        return []

def get_last_message_time(user_id: str, session_id: str):
    """Return timestamp of the most recent message in session."""
    try:
        ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("sessions")
            .document(session_id)
            .collection("interactions")
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
            .limit(1)
        )
        for doc in ref.stream():
            return doc.to_dict().get("timestamp")
        return None
    except Exception:
        print(f"🔥 [Get Last Message Time Error]: {traceback.format_exc()}")
        return None

# ==============================================================
# 8️⃣ Module Exports
# ==============================================================

__all__ = [
    "ensure_user_exists",
    "create_new_session",
    "update_session_title",
    "save_interaction_to_session",
    "get_session_interactions",
    "get_all_sessions",
    "get_session_details",
    "save_session_summary",
    "get_user_recent_summaries",
    "get_last_message_time",
    "db",
]
