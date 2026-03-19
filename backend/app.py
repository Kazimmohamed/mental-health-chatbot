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
import traceback

load_dotenv()

from ai_core import analyze_and_respond, record_audio_from_file
from firebase_utils import (
    ensure_user_exists,
    get_all_sessions,
    get_session_interactions,
    create_new_session,
    save_interaction_to_session,
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
    print(f"🔑 Auth Header: {auth_header}, Manual ID: {manual_user_id}")

    if auth_header and auth_header.startswith('Bearer '):
        try:
            id_token = auth_header.split('Bearer ')[1]
            decoded_token = auth.verify_id_token(id_token)
            user_id = decoded_token['uid']
            print(f"✅ Firebase authenticated user: {user_id}")
            ensure_user_exists(user_id)
            return user_id
        except Exception as e:
            print(f"🔥 Firebase token error: {traceback.format_exc()}")
            return None
    elif manual_user_id:
        try:
            user_ref = db.collection("conversations").document(manual_user_id)
            if user_ref.get().exists:
                print(f"✅ Manual auth user: {manual_user_id}")
                ensure_user_exists(manual_user_id)
                return manual_user_id
            return None
        except Exception as e:
            print(f"🔥 Manual auth error: {traceback.format_exc()}")
            return None
    return None

def require_auth(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        user_id = get_authenticated_user_id()
        if not user_id:
            print("⛔ No authenticated user")
            return jsonify({"error": "Authentication required"}), 401
        request.user_id = user_id
        return f(*args, **kwargs)
    return decorated_function

# --- Routes ---
@app.route("/user", methods=["POST"])
def handle_user():
    try:
        data = request.json
        is_new = data.get('is_new', False)
        if is_new:
            user_id = f"user_{str(uuid.uuid4())[:8]}"
            print(f"👤 Creating new user: {user_id}")
            ensure_user_exists(user_id)
            return jsonify({"user_id": user_id, "message": "New user created"}), 201
        else:
            user_id = data.get('user_id', '').strip()
            if not user_id:
                return jsonify({"error": "User ID required"}), 400
            user_ref = db.collection("conversations").document(user_id)
            if user_ref.get().exists:
                print(f"👤 Existing user validated: {user_id}")
                return jsonify({"user_id": user_id, "message": "User validated"}), 200
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        print(f"🔥 /user error: {traceback.format_exc()}")
        return jsonify({"error": "Internal error"}), 500

@app.route("/sessions/new", methods=["POST"])
@require_auth
def new_session():
    try:
        user_id = request.user_id
        print(f"🆕 Creating new session for user: {user_id}")
        session_id = create_new_session(user_id)
        return jsonify({"session_id": session_id}), 201
    except Exception as e:
        print(f"🔥 New session error: {traceback.format_exc()}")
        return jsonify({"error": "Session creation failed"}), 500

@app.route('/text', methods=['POST'])
@require_auth
def handle_text():
    try:
        data = request.json
        user_id = request.user_id
        session_id = data['session_id']
        user_input = str(data['input_text'])
        print(f"📝 Text input received - User: {user_id}, Session: {session_id}, Text: '{user_input[:50]}...'")
        
        # Get bot response
        result = analyze_and_respond(user_id, session_id, user_input, audio_path=None)
        print(f"🤖 AI response generated - Emotion: {result['text_emotion']}, Tone: {result['tone_emotion']}")
        
        # Save complete interaction
        save_interaction_to_session(
            user_id=user_id,
            session_id=session_id,
            user_input=user_input,
            gpt_response=result['gpt_response'],
            text_emotion=result['text_emotion'],
            tone_emotion=result['tone_emotion']
        )
        
        return jsonify({
            "reply": result['gpt_response'],
            "emotion": result['text_emotion'],
            "tone": result['tone_emotion'],
            "title": result.get('title', '')
        })
    except KeyError as e:
        print(f"🔑 Missing key: {e} - Request data: {request.json}")
        return jsonify({"error": f"Missing data: {e}"}), 400
    except Exception as e:
        print(f"❌ /text error: {traceback.format_exc()}")
        return jsonify({"error": "Processing failed"}), 500

@app.route('/voice', methods=['POST'])
@require_auth
def handle_voice():
    try:
        user_id = request.user_id
        print(f"🎤 Voice endpoint called - User: {user_id}")
        
        # Validate session ID
        session_id = request.form.get('session_id')
        if not session_id:
            print("❌ Missing session_id in form data")
            return jsonify({"error": "Missing session_id"}), 400
        
        # Validate audio file
        if 'audio' not in request.files:
            print("❌ No audio file in request")
            return jsonify({"error": "No audio file"}), 400
            
        file = request.files['audio']
        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({"error": "Empty filename"}), 400
            
        # Save audio file
        filename = f"audio_{uuid.uuid4().hex[:8]}.wav"
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        print(f"💾 Saving audio to: {filepath}")
        file.save(filepath)
        print("✅ Audio saved successfully")
        
        # Transcribe audio
        print("🔊 Starting audio transcription...")
        _, user_input = record_audio_from_file(filepath)
        print(f"📝 Transcription: '{user_input}'")
        
        # Get bot response
        print("🤖 Processing AI response...")
        result = analyze_and_respond(user_id, session_id, user_input, audio_path=filepath)
        print(f"✅ AI response generated - Emotion: {result['text_emotion']}, Tone: {result['tone_emotion']}")
        
        # Save interaction
        print("💾 Saving interaction to session...")
        save_interaction_to_session(
            user_id=user_id,
            session_id=session_id,
            user_input=user_input,
            gpt_response=result['gpt_response'],
            text_emotion=result['text_emotion'],
            tone_emotion=result['tone_emotion']
        )
        print("✅ Interaction saved")
        
        return jsonify({
            "reply": result['gpt_response'],
            "emotion": result['text_emotion'],
            "tone": result['tone_emotion'],
            "title": result.get('title', '')
        })
    except KeyError as e:
        print(f"🔑 Missing key: {e} - Form data: {request.form}")
        return jsonify({"error": f"Missing data: {e}"}), 400
    except Exception as e:
        print(f"❌ /voice error: {traceback.format_exc()}")
        return jsonify({"error": "Processing failed"}), 500

@app.route('/tts', methods=['POST'])
@require_auth
def generate_tts_route():
    try:
        data = request.json
        text = data.get('text', '')
        print(f"🔊 TTS request received - Text length: {len(text)} characters")
        
        if not text:
            print("❌ Empty text in TTS request")
            return jsonify({"error": "No text provided"}), 400
            
        tts = gTTS(text=text, lang='en')
        mp3_fp = BytesIO()
        tts.write_to_fp(mp3_fp)
        mp3_fp.seek(0)
        audio_base64 = base64.b64encode(mp3_fp.read()).decode('utf-8')
        print("✅ TTS audio generated successfully")
        return jsonify({"audio_base64": audio_base64})
    except Exception as e:
        print(f"❌ /tts error: {traceback.format_exc()}")
        return jsonify({"error": "Failed to generate audio"}), 500

@app.route('/history/<string:requested_user_id>', methods=['GET'])
@require_auth
def get_sessions(requested_user_id):
    if request.user_id != requested_user_id:
        print(f"⛔ Unauthorized history access attempt: {request.user_id} != {requested_user_id}")
        return jsonify({"error": "Unauthorized access to user history"}), 403
    
    try:
        print(f"📚 Fetching sessions for user: {requested_user_id}")
        sessions = get_all_sessions(requested_user_id)
        print(f"✅ Found {len(sessions)} sessions")
        return jsonify({"sessions": sessions})
    except Exception as e:
        print(f"🔥 Session fetch error: {traceback.format_exc()}")
        return jsonify({"error": "Failed to fetch sessions"}), 500

@app.route('/history/<string:requested_user_id>/<string:session_id>', methods=['GET'])
@require_auth
def get_session_chat(requested_user_id, session_id):
    if request.user_id != requested_user_id:
        print(f"⛔ Unauthorized session access: {request.user_id} != {requested_user_id}")
        return jsonify({"error": "Unauthorized access to session history"}), 403
    
    try:
        print(f"💬 Fetching interactions for session: {session_id}")
        interactions = get_session_interactions(requested_user_id, session_id)
        print(f"✅ Found {len(interactions)} interactions")
        return jsonify({"interactions": interactions})
    except Exception as e:
        print(f"🔥 Interaction fetch error: {traceback.format_exc()}")
        return jsonify({"error": "Failed to fetch session messages"}), 500

if __name__ == '__main__':
    print("🚀 Starting Flask server...")
    app.run(debug=True, host='0.0.0.0', port=5000)