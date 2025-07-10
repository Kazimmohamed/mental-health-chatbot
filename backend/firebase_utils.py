import firebase_admin
from firebase_admin import credentials, firestore
import uuid
from datetime import datetime

# Path to your Firebase Admin SDK JSON key
cred = credentials.Certificate(r"C:\Users\kazim\Documents\VScodeprojects\new poject\firebase_key.json.json")

# Initialize the Firebase app
if not firebase_admin._apps:
    firebase_admin.initialize_app(cred)

db = firestore.client()

# === Create New User ===
def create_new_user():
    user_id = f"user-{str(uuid.uuid4())[:8]}"
    user_doc = {
        "created_at": firestore.SERVER_TIMESTAMP,
        "status": "active"
    }
    db.collection("conversations").document(user_id).set(user_doc)
    return user_id

# === Check if User Exists ===
def is_existing_user(user_id):
    doc = db.collection("conversations").document(user_id).get()
    return doc.exists

# === 🔥 NEW: Create New Session for User ===
def create_new_session(user_id):
    session_id = f"session-{str(uuid.uuid4())[:8]}"
    session_ref = db.collection("conversations").document(user_id).collection("sessions").document(session_id)
    session_ref.set({
        "created_at": firestore.SERVER_TIMESTAMP,
        "last_updated": firestore.SERVER_TIMESTAMP,
        "title": "Untitled Session"
    })
    return session_id

# === 🔥 NEW: Save Message to Specific Session ===
def save_message_to_session(user_id, session_id, input_text, gpt_response, text_emotion, tone_emotion):
    message_ref = db.collection("conversations").document(user_id).collection("sessions") \
                    .document(session_id).collection("messages")
    message_ref.add({
        "input_text": input_text,
        "gpt_response": gpt_response,
        "text_emotion": text_emotion,
        "tone_emotion": tone_emotion,
        "created_at": datetime.utcnow()
    })

    # Update session metadata
    db.collection("conversations").document(user_id).collection("sessions") \
      .document(session_id).update({"last_updated": firestore.SERVER_TIMESTAMP})

# === 🔥 NEW: Get All Sessions for a User ===
def get_all_sessions(user_id):
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
        print("❌ Firestore session fetch error:", e)
        return []

# === 🔥 NEW: Get Messages for a Specific Session ===
def get_session_messages(user_id, session_id):
    try:
        messages_ref = db.collection("conversations").document(user_id).collection("sessions") \
                         .document(session_id).collection("messages") \
                         .order_by("created_at", direction=firestore.Query.ASCENDING)
        docs = messages_ref.stream()
        messages = []
        for doc in docs:
            data = doc.to_dict()
            created_at = data.get("created_at")
            messages.append({
                "id": doc.id,
                "input_text": data.get("input_text", ""),
                "gpt_response": data.get("gpt_response", ""),
                "timestamp": created_at.isoformat() if isinstance(created_at, datetime) else None
            })
        return messages
    except Exception as e:
        print("❌ Firestore message fetch error:", e)
        return []

# === (Optional) Old history for compatibility (can remove later) ===
def get_user_conversations(user_id):
    try:
        messages_ref = (
            db.collection("conversations")
            .document(user_id)
            .collection("messages")
            .order_by("created_at", direction=firestore.Query.DESCENDING)
        )
        docs = messages_ref.stream()

        history = []
        for doc in docs:
            data = doc.to_dict()
            created_at = data.get("created_at")
            history.append({
                "id": doc.id,
                "input_text": data.get("input_text", ""),
                "gpt_response": data.get("gpt_response", ""),
                "timestamp": created_at.isoformat() if isinstance(created_at, datetime) else None
            })
        return history

    except Exception as e:
        print("❌ Firestore fetch error:", e)
        return []

# Re-export db and useful functions
__all__ = [
    'create_new_user',
    'is_existing_user',
    'create_new_session',
    'save_message_to_session',
    'get_all_sessions',
    'get_session_messages',
    'get_user_conversations',
    'db'
]
