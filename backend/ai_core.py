# ===========================================================
# backend/ai_core.py  — Finalized (Pipeline 3)
# ===========================================================

import os
import re
import speech_recognition as sr
from openai import OpenAI
from transformers import pipeline
from dotenv import load_dotenv
import traceback
from datetime import datetime, timezone

# Firebase helpers
from firebase_utils import (
    get_session_interactions,
    update_session_title,
    get_session_details,
    get_user_recent_summaries,
    save_session_summary,
    get_last_message_time,
)

# Gemini utilities
from GeminiUtils import (
    gemini_quick_task,
    gemini_summarize_session,
)

# ===========================================================
# Initialization
# ===========================================================

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

print("🔊 Initializing tone classifier...")
tone_classifier = pipeline(
    "audio-classification",
    model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
)
print("📝 Initializing text emotion classifier...")
text_classifier = pipeline(
    "text-classification",
    model="j-hartmann/emotion-english-distilroberta-base",
    top_k=None
)
print("✅ AI models loaded successfully.")


# ===========================================================
# Helper Functions
# ===========================================================

def record_audio_from_file(filepath):
    """Convert audio file to text using Google Speech Recognition."""
    print(f"🔊 Starting transcription for: {filepath}")
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(filepath) as source:
            audio = recognizer.record(source)
        print("✅ Audio file loaded")
        try:
            text = recognizer.recognize_google(audio)
            print(f"📝 Transcription: '{text}'")
            return audio, text
        except sr.UnknownValueError:
            print("❌ Google Speech Recognition could not understand audio")
            return audio, ""
        except sr.RequestError as e:
            print(f"❌ Google Speech Recognition service error: {e}")
            return audio, ""
    except Exception:
        print(f"❌ Audio file loading error: {traceback.format_exc()}")
        return None, ""


def _generate_title(conversation_history):
    """Generate a short title for the session using Gemini."""
    print("🏷️ Generating session title...")
    try:
        user_messages = [msg["content"] for msg in conversation_history if msg["role"] == "user"]
        bot_messages = [msg["content"] for msg in conversation_history if msg["role"] == "assistant"]

        user_message = user_messages[-1] if user_messages else ""
        bot_message = bot_messages[-1] if bot_messages else ""

        prompt = (
            "Create a very short (2–4 words) emotionally aware title for this conversation.\n"
            f"User: {user_message}\nAssistant: {bot_message}\n\nTitle:"
        )
        title = gemini_quick_task(prompt, fallback_text="Mindful Moment")
        clean_title = title.strip() or "Conversation"
        print(f"🏷️ Generated title: '{clean_title}'")
        return clean_title
    except Exception:
        print(f"🔥 Title generation failed: {traceback.format_exc()}")
        return "Conversation"


def format_gpt_reply(text):
    """Clean GPT text formatting."""
    cleaned = re.sub(r"\n{3,}", "\n\n", text).strip()
    print(f"🧹 Cleaned GPT response: '{cleaned[:120]}...'")
    return cleaned


def adjust_temperature(emotion_score):
    """Scale GPT creativity according to emotion confidence."""
    if emotion_score >= 0.75:
        temp = 0.9
    elif emotion_score >= 0.5:
        temp = 0.75
    elif emotion_score >= 0.3:
        temp = 0.6
    else:
        temp = 0.45
    print(f"🌡️ Adjusted temperature to {temp} (emotion score {emotion_score})")
    return temp


def should_summarize_session(last_message_time, timeout_minutes=10):
    """Check if session should be summarized due to inactivity."""
    if not last_message_time:
        return False
    now = datetime.now(timezone.utc)
    diff = (now - last_message_time).total_seconds() / 60
    return diff >= timeout_minutes


# ===========================================================
# Core Logic
# ===========================================================

def analyze_and_respond(user_id, session_id, user_input, audio_path=None):
    print(f"\n🤖 [analyze_and_respond] user={user_id}, session={session_id}")
    print(f"🗣️ User input: '{user_input}'")
    print(f"🔊 Audio path: {audio_path}")

    # -------------------------------------------------------
    # Emotion Analysis (Text + Optional Tone)
    # -------------------------------------------------------
    tone_emotion = {"label": "Unknown", "score": 0.0}
    if audio_path and os.path.exists(audio_path):
        try:
            print("🔊 Running tone emotion analysis (toggle ON)...")
            tone_result = tone_classifier(audio_path)
            if tone_result:
                tone_emotion = tone_result[0]
                print(f"🎵 Detected tone emotion: {tone_emotion}")
        except Exception:
            print(f"❌ Tone analysis error: {traceback.format_exc()}")
    else:
        print("🔇 Tone analysis skipped (toggle OFF or no audio).")

    text_emotion = {"label": "neutral", "score": 0.0}
    try:
        print("📝 Running text emotion analysis...")
        text_emotions = text_classifier(user_input)[0]
        text_emotion = max(text_emotions, key=lambda x: x["score"])
        print(f"🧠 Detected text emotion: {text_emotion}")
    except Exception:
        print(f"❌ Text emotion analysis error: {traceback.format_exc()}")

    temperature = adjust_temperature(text_emotion["score"])

    # -------------------------------------------------------
    # Retrieve Conversation Context
    # -------------------------------------------------------
    print("📚 Loading session history...")
    interactions = get_session_interactions(user_id, session_id)
    print(f"📚 Retrieved {len(interactions)} past messages.")

    # Load summaries from previous sessions (cross-session memory)
    past_summaries = get_user_recent_summaries(user_id, limit=3) or []
    context_summary = "\n".join(
        [f"- {s['summary']}" for s in past_summaries if s and s.get("summary")]
    )

    # -------------------------------------------------------
    # System Prompt (Intelligent Behavioral Framing)
    # -------------------------------------------------------
    system_prompt = f"""
You are an emotionally intelligent AI companion specializing in mental health and wellbeing conversations.
You are *not* a medical professional. You never diagnose, prescribe, or make clinical claims.
Your role is to provide **empathetic understanding, gentle guidance, and positive coping support**.

Communication Guidelines:
- Respond with warmth, active listening, and encouragement.
- Use clear, natural, and emotionally safe language.
- Avoid judgment, over-assurance, or toxic positivity.
- Reflect understanding before offering suggestions.
- If user shows distress or crisis cues, gently encourage reaching out to a professional or trusted person.

Context Awareness:
Recent session summaries (for continuity):
{context_summary or '- None available'}

User's detected emotions this message:
- Text Emotion → {text_emotion['label']} (confidence: {text_emotion['score']:.2f})
- Voice Tone → {tone_emotion.get('label', 'N/A')} (confidence: {tone_emotion.get('score', 0):.2f})

Now craft your response with empathy, calm tone, and helpful insights.
Keep paragraphs short (2–4 lines) and conversational.
If the user seeks advice, frame it as perspective, not instruction.
    """.strip()

    # -------------------------------------------------------
    # Build Conversation Payload for GPT
    # -------------------------------------------------------
    messages = [{"role": "system", "content": system_prompt}]
    for interaction in interactions:
        messages.append({"role": "user", "content": interaction["user_input"]})
        messages.append({"role": "assistant", "content": interaction["gpt_response"]})
    messages.append({"role": "user", "content": user_input})

    # -------------------------------------------------------
    # Generate GPT Response
    # -------------------------------------------------------
    gpt_response = "Error: GPT processing failed"
    try:
        print("💬 Generating GPT-4o-mini response...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature,
        )
        gpt_response = format_gpt_reply(response.choices[0].message.content)
        print(f"🤖 GPT reply: {gpt_response[:100]}...")
    except Exception:
        print(f"🔥 GPT error: {traceback.format_exc()}")

    # -------------------------------------------------------
    # Update Session Title (if still Untitled)
    # -------------------------------------------------------
    try:
        print("📝 Checking if session title needs update...")
        session_data = get_session_details(user_id, session_id)
        if session_data and session_data.get("title") == "Untitled Session":
            new_title = _generate_title(messages + [{"role": "assistant", "content": gpt_response}])
            if new_title and new_title != "Mindful Moment":
                update_session_title(user_id, session_id, new_title)
                print(f"🏷️ Updated title → {new_title}")
    except Exception:
        print(f"🔥 Title update error: {traceback.format_exc()}")

    # -------------------------------------------------------
    # Trigger Summarization if Session Inactive / Ended
    # -------------------------------------------------------
    try:
        last_time = get_last_message_time(user_id, session_id)
        if should_summarize_session(last_time):
            print("🧩 Session inactive → running Gemini summarization...")
            conv = get_session_interactions(user_id, session_id)
            summary = gemini_summarize_session(conv)
            save_session_summary(user_id, session_id, summary)
            print(f"📄 Summary saved: {summary.get('summary', '')[:100]}...")
    except Exception:
        print(f"⚠️ Summary generation failed: {traceback.format_exc()}")

    print("✅ analyze_and_respond completed.\n")
    return {
        "gpt_response": gpt_response,
        "text_emotion": text_emotion,
        "tone_emotion": tone_emotion,
    }
