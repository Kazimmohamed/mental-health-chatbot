# backend/app.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import uuid
from functools import wraps
import firebase_admin
from firebase_admin import auth
from gtts import gTTS
import base64
from io import BytesIO

# Assume ai_core.py exists and contains these functions
from ai_core import analyze_and_respond, record_audio_from_file

# Import the corrected and streamlined functions from your firebase utility file
from firebase_utils import (
    ensure_user_exists,
    get_all_sessions,
    get_session_messages,
    create_new_session,
    db
)

app = Flask(__name__)
# It's important to configure CORS to allow the Authorization header from your frontend
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}}, expose_headers=["Authorization"])

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# === ✅ REVISED: Authentication Decorator ===
def check_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token is missing or invalid"}), 401
        
        id_token = auth_header.split('Bearer ')[1]
        
        try:
            # Verify the token against the Firebase Auth API
            decoded_token = auth.verify_id_token(id_token)
            uid = decoded_token['uid']
            
            # **THE FIX IS HERE**
            # This crucial step ensures a user document exists in Firestore before proceeding.
            ensure_user_exists(uid)
            
            # Add the verified user ID to the request context for use in the endpoint
            request.user_id = uid
            
        except Exception as e:
            print(f"🔥 Token verification or user check failed: {e}")
            return jsonify({"error": "Invalid or expired token"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# === ✅ Manual User Authentication Decorator ===
def check_manual_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # For manual users, we'll use a custom header or query parameter
        user_id = request.headers.get('X-User-ID') or request.args.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID is missing"}), 401
        
        try:
            # Check if user exists in Firestore
            user_ref = db.collection("conversations").document(user_id)
            if not user_ref.get().exists:
                return jsonify({"error": "User not found"}), 404
            
            # Add the verified user ID to the request context
            request.user_id = user_id
            
        except Exception as e:
            print(f"🔥 Manual user verification failed: {e}")
            return jsonify({"error": "Invalid user"}), 401
            
        return f(*args, **kwargs)
    return decorated_function

# --- Public Routes (No token required) ---

@app.route("/user", methods=["POST"])
def handle_user():
    """Handles manual user creation and validation."""
    try:
        data = request.json
        is_new = data.get('is_new', False)
        
        if is_new:
            # Create a new user with a random ID
            user_id = f"user_{str(uuid.uuid4())[:8]}"
            ensure_user_exists(user_id)
            print(f"✅ Created new manual user: {user_id}")
            return jsonify({"user_id": user_id, "message": "New user created successfully"}), 201
        else:
            # Validate existing user ID
            user_id = data.get('user_id', '').strip()
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
            
            # Check if user exists in Firestore
            user_ref = db.collection("conversations").document(user_id)
            if user_ref.get().exists:
                print(f"✅ Validated existing manual user: {user_id}")
                return jsonify({"user_id": user_id, "message": "User validated successfully"}), 200
            else:
                return jsonify({"error": "User ID not found"}), 404
                
    except Exception as e:
        print(f"🔥 Error in /user endpoint: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

# --- Secure Routes (Token required) ---
# All routes below require a valid Firebase ID Token in the Authorization header.

@app.route("/sessions/new", methods=["POST"])
def new_session():
    """Creates a new, empty session for the authenticated user."""
    try:
        # Check if it's a manual user or Firebase user
        auth_header = request.headers.get('Authorization')
        manual_user_id = request.headers.get('X-User-ID')
        
        if auth_header and auth_header.startswith('Bearer '):
            # Firebase user
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            ensure_user_exists(user_id)
        elif manual_user_id:
            # Manual user
            user_id = manual_user_id
            ensure_user_exists(user_id)
        else:
            return jsonify({"error": "Authentication required"}), 401
        
        session_id = create_new_session(user_id)
        return jsonify({"session_id": session_id}), 201
    except Exception as e:
        print(f"🔥 Error creating new session: {e}")
        return jsonify({"error": "Could not create new session"}), 500

@app.route('/text', methods=['POST'])
def handle_text():
    """Handles a text-based message from the user."""
    try:
        data = request.json
        session_id = data['session_id']
        transcript = str(data['input_text'])
        
        # Check if it's a manual user or Firebase user
        auth_header = request.headers.get('Authorization')
        manual_user_id = request.headers.get('X-User-ID')
        
        if auth_header and auth_header.startswith('Bearer '):
            # Firebase user
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            ensure_user_exists(user_id)
        elif manual_user_id:
            # Manual user
            user_id = manual_user_id
            ensure_user_exists(user_id)
        else:
            return jsonify({"error": "Authentication required"}), 401
        
        # This function should call `save_message_to_session` internally
        result = analyze_and_respond(user_id, session_id, transcript, audio_path=None)
        
        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing key in request: {e}"}), 400
    except Exception as e:
        print(f"❌ Error in /text endpoint: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/voice', methods=['POST'])
@check_auth
def handle_voice():
    """Handles a voice-based message from the user."""
    try:
        user_id = request.user_id
        session_id = request.form['session_id']
        
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file in request"}), 400
            
        file = request.files['audio']
        import uuid
        unique_filename = f"audio_{uuid.uuid4().hex[:8]}.wav"
        filepath = os.path.join(UPLOAD_FOLDER, unique_filename)
        file.save(filepath)
        
        _, transcript = record_audio_from_file(filepath)
        result = analyze_and_respond(user_id, session_id, transcript, audio_path=filepath)

        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing form data: {e}"}), 400
    except Exception as e:
        print(f"❌ Error in /voice endpoint: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/history/<string:requested_user_id>', methods=['GET'])
@check_auth
def get_sessions(requested_user_id):
    """Gets the list of all sessions for a user."""
    token_user_id = request.user_id
    
    # Security check: Ensure the user is only requesting their own history.
    if token_user_id != requested_user_id:
        return jsonify({"error": "Forbidden: You can only access your own history."}), 403
    
    try:
        sessions = get_all_sessions(token_user_id)
        return jsonify({"sessions": sessions})
    except Exception as e:
        print(f"🔥 Error fetching session list: {e}")
        return jsonify({"error": "Could not retrieve session history"}), 500

@app.route('/tts', methods=['POST'])
def generate_tts():
    """Generates TTS audio for the given text."""
    try:
        data = request.json
        text = data.get('text', '')
        
        if not text:
            return jsonify({"error": "No text provided"}), 400
        
        # Check if it's a manual user or Firebase user
        auth_header = request.headers.get('Authorization')
        manual_user_id = request.headers.get('X-User-ID')
        
        if auth_header and auth_header.startswith('Bearer '):
            # Firebase user - verify token
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
        elif manual_user_id:
            # Manual user - just use the ID
            user_id = manual_user_id
        else:
            return jsonify({"error": "Authentication required"}), 401
        
        # Generate TTS audio
        tts = gTTS(text=text, lang='en')
        mp3_fp = BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
        
        return jsonify({"audio_base64": audio_base64})
    except Exception as e:
        print(f"❌ Error in /tts endpoint: {e}")
        return jsonify({"error": "Failed to generate audio"}), 500

@app.route('/history/<string:requested_user_id>/<string:session_id>', methods=['GET'])
@check_auth
def get_session_chat(requested_user_id, session_id):
    """Gets the message history for a specific session."""
    token_user_id = request.user_id
    
    # Security check: Ensure the user is only requesting their own history.
    if token_user_id != requested_user_id:
        return jsonify({"error": "Forbidden: You can only access your own history."}), 403

    try:
        messages = get_session_messages(token_user_id, session_id)
        return jsonify({"messages": messages})
    except Exception as e:
        print(f"🔥 Error fetching session messages: {e}")
        return jsonify({"error": "Could not retrieve messages for this session"}), 500

if __name__ == '__main__':
    app.run(debug=True)