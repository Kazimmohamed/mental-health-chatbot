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
from dotenv import load_dotenv
load_dotenv()

from ai_core import analyze_and_respond, record_audio_from_file
from firebase_utils import (
    ensure_user_exists,
    get_all_sessions,
    get_session_messages,
    create_new_session,
    db
)

app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "*"}}, expose_headers=["Authorization"])

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# === Authentication ===
def get_authenticated_user_id():
    auth_header = request.headers.get('Authorization')
    manual_user_id = request.headers.get('X-User-ID')

    if auth_header and auth_header.startswith('Bearer '):
        try:
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            ensure_user_exists(user_id)
            return user_id
        except Exception as e:
            print(f"🔥 Firebase token verification failed: {e}")
            return None
    elif manual_user_id:
        try:
            user_ref = db.collection("conversations").document(manual_user_id)
            if user_ref.get().exists:
                ensure_user_exists(manual_user_id)
                return manual_user_id
            else:
                return None
        except Exception as e:
            print(f"🔥 Manual user verification failed: {e}")
            return None
    else:
        return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_authenticated_user_id()
        if not user_id:
            return jsonify({"error": "Authentication required"}), 401
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function

# --- Public Route ---
@app.route("/user", methods=["POST"])
def handle_user():
    try:
        data = request.json
        is_new = data.get('is_new', False)
        if is_new:
            user_id = f"user_{str(uuid.uuid4())[:8]}"
            ensure_user_exists(user_id)
            return jsonify({"user_id": user_id, "message": "New user created successfully"}), 201
        else:
            user_id = data.get('user_id', '').strip()
            if not user_id:
                return jsonify({"error": "User ID is required"}), 400
            user_ref = db.collection("conversations").document(user_id)
            if user_ref.get().exists:
                return jsonify({"user_id": user_id, "message": "User validated successfully"}), 200
            else:
                return jsonify({"error": "User ID not found"}), 404
    except Exception as e:
        print(f"🔥 Error in /user endpoint: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

# --- Authenticated Routes ---
@app.route("/sessions/new", methods=["POST"])
@require_auth
def new_session():
    try:
        user_id = request.user_id
        session_id = create_new_session(user_id)
        return jsonify({"session_id": session_id}), 201
    except Exception as e:
        print(f"🔥 Error creating new session: {e}")
        return jsonify({"error": "Could not create new session"}), 500

@app.route('/text', methods=['POST'])
@require_auth
def handle_text():
    try:
        data = request.json
        user_id = request.user_id
        session_id = data['session_id']
        transcript = str(data['input_text'])
        result = analyze_and_respond(user_id, session_id, transcript, audio_path=None)
        return jsonify(result)
    except KeyError as e:
        return jsonify({"error": f"Missing key in request: {e}"}), 400
    except Exception as e:
        print(f"❌ Error in /text endpoint: {e}")
        return jsonify({"error": "An internal error occurred"}), 500

@app.route('/voice', methods=['POST'])
@require_auth
def handle_voice():
    try:
        user_id = request.user_id
        session_id = request.form['session_id']
        if 'audio' not in request.files:
            return jsonify({"error": "No audio file in request"}), 400
        file = request.files['audio']
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
@require_auth
def get_sessions(requested_user_id):
    if request.user_id != requested_user_id:
        return jsonify({"error": "Unauthorized access to user history"}), 403
    try:
        sessions = get_all_sessions(requested_user_id)
        return jsonify({"sessions": sessions})
    except Exception as e:
        print(f"🔥 Error fetching sessions: {e}")
        return jsonify({"error": "Failed to fetch sessions"}), 500

@app.route('/tts', methods=['POST'])
@require_auth
def generate_tts_route():
    try:
        data = request.json
        text = data.get('text', '')
        if not text:
            return jsonify({"error": "No text provided"}), 400
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
@require_auth
def get_session_chat(requested_user_id, session_id):
    if request.user_id != requested_user_id:
        return jsonify({"error": "Unauthorized access to session history"}), 403
    try:
        messages = get_session_messages(requested_user_id, session_id)
        return jsonify({"messages": messages})
    except Exception as e:
        print(f"🔥 Error fetching session messages: {e}")
        return jsonify({"error": "Failed to fetch session messages"}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
