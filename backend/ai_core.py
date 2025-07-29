import os
import re
import speech_recognition as sr
from openai import OpenAI
from transformers import pipeline
from dotenv import load_dotenv
from firebase_utils import (
    get_session_messages,
    update_session_title
)
from GeminiUtils import gemini_quick_task

# --- Load environment variables ---
load_dotenv()

# --- Initialization ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
tone_emotion = pipeline("audio-classification", model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")
text_emotion = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)

# --- Helper Functions ---

def record_audio_from_file(filepath):
    """Transcribes audio from a given file path."""
    recognizer = sr.Recognizer()
    with sr.AudioFile(filepath) as source:
        audio = recognizer.record(source)
    try:
        transcript = recognizer.recognize_google(audio)
    except Exception:
        transcript = ""
    return audio, transcript

def _generate_title_for_session(conversation_history):
    """Uses Gemini to generate a short, human-readable title for a conversation."""
    print("DEBUG: Generating session title using Gemini...")
    try:
        history_summary = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        prompt = f"""
        Create a short (max 4 words), concise, human-like title that summarizes the topic of the following conversation.
        Avoid quotes and extra formatting.

        Conversation:
        {history_summary}

        Title:
        """
        title = gemini_quick_task(prompt)
        return title.strip() if title else "Titled Conversation"
    except Exception as e:
        print(f"🔥 ERROR: Gemini title generation failed: {e}. Using fallback title.")
        return "Titled Conversation"

def format_gpt_reply(text):
    """Helper function to format the AI's response text."""
    return re.sub(r'\n{3,}', '\n\n', text).strip()

# --- Core Logic ---

def analyze_and_respond(user_id, session_id, transcript, audio_path=None):
    """
    Main entry point for analyzing user input and generating a response.
    Routes tasks like tone/emotion detection to HuggingFace models, title generation to Gemini,
    and response generation to OpenAI GPT-4o-mini.
    """

    # --- Emotion/Tone Analysis ---
    tone_result = {"label": "Unknown", "score": 0.0}
    if audio_path and os.path.exists(audio_path):
        try:
            tone_result = tone_emotion(audio_path)[0]
        except Exception as e:
            print(f"⚠ WARNING: Audio tone analysis failed: {e}")

    try:
        text_emotions = text_emotion(transcript)[0]
        top_emotion = max(text_emotions, key=lambda x: x['score'])
    except Exception as e:
        print(f"⚠ WARNING: Text emotion analysis failed: {e}")
        top_emotion = {"label": "Neutral", "score": 0.0}

    # --- Build System Prompt ---
    system_prompt = f"""
You are a warm, emotionally intelligent assistant designed to support users in their mental and emotional wellness.
Your personality is friendly, calm, and adaptive. Think like a trusted friend — not a therapist.

Rules:
- Respect context: Use the full chat history provided.
- Never echo user input back as your whole response.
- Do not assume sadness or distress unless clearly expressed.
- Validate emotions only when it's relevant.
- Keep your responses unique, human, and caring — no robotic replies.
- Never offer clinical advice. Recommend talking to a trusted person or counselor if needed.
- Don't use cliches like "I understand this is hard" unless contextually appropriate.
- Adjust tone: Be lighter with students, more composed with adults.
- Always reflect the current emotional tone: "{top_emotion['label']}"
"""

    # --- Retrieve Past Conversation ---
    past_docs = get_session_messages(user_id, session_id)
    past_msgs = []
    for data in past_docs:
        role = "assistant" if data.get("sender") == "bot" else "user"
        past_msgs.append({"role": role, "content": str(data.get("text", ""))})

    messages = [
        {"role": "system", "content": system_prompt},
        *past_msgs,
        {"role": "user", "content": transcript}
    ]

    # --- Generate AI Response ---
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7
        )
        gpt_reply = format_gpt_reply(response.choices[0].message.content)
    except Exception as e:
        gpt_reply = f"(ChatGPT Error: {e})"
        print(f"🔥 ERROR: GPT reply failed: {e}")

    # --- Generate Session Title If First Message ---
    new_title = None
    if not past_docs:
        print(f"DEBUG: First message in session {session_id}. Generating title...")
        title_context = [
            {"role": "user", "content": transcript},
            {"role": "assistant", "content": gpt_reply}
        ]
        new_title = _generate_title_for_session(title_context)

    # --- Final Output ---
    return {
        "reply": gpt_reply,
        "title": new_title,
        "emotion": {"label": top_emotion['label'], "score": top_emotion['score']},
        "tone": tone_result
    }
