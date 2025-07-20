# FILE: firebaseutil.py (Corrected & Upgraded)
# This file now includes a new function to update a session's title.
# =================================================================================

import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from datetime import datetime

# --- Firebase Initialization ---
# Ensure the path to your service account key is correct.
cred = credentials.Certificate(r"C:\Users\kazim\Documents\VScodeprojects\new poject\firebase_key.json.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- User and Session Management Functions ---

def ensure_user_exists(user_id):
    """
    Checks if a user document exists for the given Firebase UID.
    If not, it creates a new one.
    """
    user_ref = db.collection("conversations").document(user_id)
    if not user_ref.get().exists:
        print(f"✅ DEBUG: New user detected. Creating document for UID: {user_id}")
        user_ref.set({
            "created_at": firestore.SERVER_TIMESTAMP,
            "status": "active"
        })

def create_new_session(user_id):
    """Creates a new chat session for a given user with a default title."""
    session_id = f"session-{str(uuid.uuid4())[:8]}"
    session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
    session_ref.set({
        "created_at": firestore.SERVER_TIMESTAMP,
        "last_updated": firestore.SERVER_TIMESTAMP,
        "title": "Untitled Session"
    })
    print(f"DEBUG: New session created: {session_id} for user {user_id}")
    return session_id

def save_message_to_session(user_id, session_id, input_text, gpt_response, text_emotion, tone_emotion):
    """Saves a message to a specific session in Firestore."""
    try:
        session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
        session_ref.update({"last_updated": firestore.SERVER_TIMESTAMP})
        
        message_ref = session_ref.collection("messages")
        message_ref.add({
            "input_text": input_text,
            "gpt_response": gpt_response,
            "text_emotion": text_emotion,
            "tone_emotion": tone_emotion,
            "created_at": datetime.utcnow()
        })
        print(f"DEBUG: Message saved for session {session_id}")
    except Exception as e:
        print(f"🔥 ERROR in save_message_to_session: {e}")

def get_all_sessions(user_id):
    """Retrieves all of a user's sessions, sorted by most recently updated."""
    try:
        sessions_ref = db.collection("conversations").document(user_id).collection("sessions") \
                         .order_by("last_updated", direction=firestore.Query.DESCENDING)
        docs = sessions_ref.stream()
        sessions = []
        for doc in docs:
            data = doc.to_dict()
            sessions.append({
                "session_id": doc.id,
                "title": data.get("title", "Untitled"),
                "created_at": data.get("created_at"),
                "last_updated": data.get("last_updated")
            })
        return sessions
    except Exception as e:
        print(f"🔥 ERROR in get_all_sessions: {e}")
        return []

def get_session_messages(user_id, session_id):
    """Retrieves all messages from a specific session, sorted by time."""
    try:
        messages_ref = db.collection("conversations").document(user_id).collection("sessions") \
                         .document(session_id).collection("messages") \
                         .order_by("created_at", direction=firestore.Query.ASCENDING)
        docs = messages_ref.stream()
        return [doc.to_dict() for doc in docs]
    except Exception as e:
        print(f"🔥 ERROR in get_session_messages: {e}")
        return []

def update_session_title(user_id, session_id, title):
    """
    Updates the 'title' field of a specific session document.
    This is necessary for the automatic session naming feature.
    """
    try:
        session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
        session_ref.update({"title": title})
        print(f"DEBUG: Session title updated for {session_id} to '{title}'")
    except Exception as e:
        print(f"🔥 ERROR in update_session_title: {e}")

# ✅ ADDED: __all__ list for clean imports
__all__ = [
    'ensure_user_exists',
    'create_new_session',
    'save_message_to_session',
    'get_all_sessions',
    'get_session_messages',
    'update_session_title',
    'db'
]