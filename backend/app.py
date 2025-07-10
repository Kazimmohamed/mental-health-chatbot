from flask import Flask, request, jsonify
from flask_cors import CORS
import os

from ai_core import analyze_and_respond, record_audio_from_file
from firebase_utils import create_new_user, is_existing_user

from firebase_utils import (
    get_all_sessions,
    get_session_messages,
    create_new_session,
    get_user_conversations
)

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route('/user', methods=['POST'])
def handle_user():
    data = request.json
    if data.get("is_new", False):
        user_id = create_new_user()
        return jsonify({"user_id": user_id}) 
    else:
        user_id = data.get("user_id")
        if is_existing_user(user_id):
            return jsonify({"user_id": user_id})
        else:
            return jsonify({"error": "Invalid user ID"}), 400

@app.route('/new_session', methods=['POST'])
def new_session():
    data = request.json
    user_id = data.get("user_id")
    if not user_id or not is_existing_user(user_id):
        return jsonify({"error": "Invalid user ID"}), 400

    session_id = create_new_session(user_id)
    return jsonify({"session_id": session_id})

@app.route('/text', methods=['POST'])
def handle_text():
    try:
        data = request.json
        user_id = data['user_id']
        session_id = data['session_id']
        transcript = str(data['input_text'])
        print(f"Received: {user_id=}, {session_id=}, {transcript=}")
        result = analyze_and_respond(user_id, session_id, transcript, audio_path=None)
        return jsonify(result)
    except Exception as e:
        print("❌ Error in /text:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/voice', methods=['POST'])
def handle_voice():
    user_id = request.form['user_id']
    session_id = request.form['session_id']
    file = request.files['audio']
    filepath = os.path.join(UPLOAD_FOLDER, "temp.wav")
    file.save(filepath)
    _, transcript = record_audio_from_file(filepath)
    result = analyze_and_respond(user_id, session_id, transcript, audio_path=filepath)
    return jsonify(result)

@app.route('/history/<user_id>', methods=['GET'])
def get_sessions(user_id):
    try:
        sessions = get_all_sessions(user_id)
        return jsonify({"sessions": sessions})
    except Exception as e:
        print("🔥 Error fetching session list:", e)
        return jsonify({"error": str(e)}), 500

@app.route('/history/<user_id>/<session_id>', methods=['GET'])
def get_session_chat(user_id, session_id):
    try:
        messages = get_session_messages(user_id, session_id)
        return jsonify({"messages": messages})
    except Exception as e:
        print("🔥 Error fetching session messages:", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)