# backend/firebase_utils.py
# backend/firebase_utils.py

import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from datetime import datetime

# --- Firebase Initialization ---
cred = credentials.Certificate(r"C:\Users\kazim\Documents\VScodeprojects\new poject\firebase_key.json.json")

if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- User and Session Management Functions ---

def ensure_user_exists(user_id):
    user_ref = db.collection("conversations").document(user_id)
    if not user_ref.get().exists:
        user_ref.set({
            "created_at": firestore.SERVER_TIMESTAMP,
            "status": "active"
        })

def create_new_session(user_id):
    session_id = f"session-{str(uuid.uuid4())[:8]}"
    session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
    session_ref.set({
        "created_at": firestore.SERVER_TIMESTAMP,
        "last_updated": firestore.SERVER_TIMESTAMP,
        "title": "Untitled Session"
    })
    return session_id

def save_interaction_to_session(user_id, session_id, user_input, gpt_response, text_emotion, tone_emotion):
    """Saves a complete user-bot interaction as a single document"""
    try:
        session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
        session_ref.update({"last_updated": firestore.SERVER_TIMESTAMP})
        
        # Create interaction document with the exact structure
        interaction_ref = session_ref.collection("interactions").document()
        interaction_ref.set({
            "created_at": datetime.utcnow(),
            "user_input": user_input,
            "gpt_response": gpt_response,
            "text_emotion": {
                "label": text_emotion["label"],
                "score": float(text_emotion["score"])
            },
            "tone_emotion": {
                "label": tone_emotion["label"],
                "score": float(tone_emotion["score"])
            }
        })
        return True
    except Exception as e:
        print(f"🔥 ERROR saving interaction: {e}")
        return False

def get_all_sessions(user_id):
    try:
        sessions_ref = db.collection("conversations").document(user_id).collection("sessions") \
                         .order_by("last_updated", direction=firestore.Query.DESCENDING)
        return [{
            "session_id": doc.id,
            "title": doc.to_dict().get("title", "Untitled"),
            "created_at": doc.to_dict().get("created_at"),
            "last_updated": doc.to_dict().get("last_updated")
        } for doc in sessions_ref.stream()]
    except Exception as e:
        print(f"🔥 ERROR getting sessions: {e}")
        return []

def get_session_interactions(user_id, session_id):
    """Retrieves all interactions from a session in chronological order"""
    try:
        interactions_ref = db.collection("conversations").document(user_id).collection("sessions") \
                             .document(session_id).collection("interactions") \
                             .order_by("created_at", direction=firestore.Query.ASCENDING)
        return [doc.to_dict() for doc in interactions_ref.stream()]
    except Exception as e:
        print(f"🔥 ERROR getting interactions: {e}")
        return []

def get_session_details(user_id, session_id):
    try:
        session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
        doc = session_ref.get()
        return doc.to_dict() if doc.exists else None
    except Exception as e:
        print(f"🔥 ERROR getting session details: {e}")
        return None

def update_session_title(user_id, session_id, title):
    try:
        session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
        session_ref.update({"title": title})
        return True
    except Exception as e:
        print(f"🔥 ERROR updating title: {e}")
        return False

__all__ = [
    'ensure_user_exists',
    'create_new_session',
    'save_interaction_to_session',
    'get_all_sessions',
    'get_session_interactions',
    'get_session_details',
    'update_session_title',
    'db'
]