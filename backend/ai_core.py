import os
import datetime
import speech_recognition as sr
from transformers import pipeline
from firebase_utils import (
    db,
    save_message_to_session,
    get_session_messages
)
from openai import OpenAI
import re

# 🔐 Securely load API key from environment variable
client = OpenAI(api_key=os.getenv("OPENAI_API-KEY"))

# 🚨 Critical phrases to monitor
CRITICAL_PHRASES = [
    "i want to die", 
    "i hate myself", 
    "no reason to live", 
    "kill myself", 
    "i feel hopeless"
]

# 🔄 Load emotion models
tone_emotion = pipeline(
    "audio-classification", 
    model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition"
)
text_emotion = pipeline(
    "text-classification", 
    model="j-hartmann/emotion-english-distilroberta-base", 
    top_k=None
)

# 🎙️ Transcribe audio
def record_audio_from_file(filepath):
    recognizer = sr.Recognizer()
    with sr.AudioFile(filepath) as source:
        audio = recognizer.record(source)
    try:
        transcript = recognizer.recognize_google(audio)
    except Exception:
        transcript = ""
    return audio, transcript

# 🚨 Detect high-risk input
def is_critical_condition(transcript, emotion_label, emotion_score):
    transcript = transcript.lower()
    return (
        any(phrase in transcript for phrase in CRITICAL_PHRASES) or
        (emotion_label.lower() in ["sadness", "fear", "depression"] and emotion_score >= 0.6)
    )

# 💬 Core logic for session-based chat
def analyze_and_respond(user_id, session_id, transcript, audio_path=None):
    tone = {"label": "Unknown", "score": 0.0}

    if audio_path and os.path.exists(audio_path):
        try:
            tone = tone_emotion(audio_path)[0]
        except Exception as e:
            print(f"⚠ Tone analysis failed: {e}")

    text_emotions = text_emotion(transcript)[0]
    text = max(text_emotions, key=lambda x: x['score'])

    system_prompt = f"""
You are a kind, emotionally intelligent virtual assistant designed to support users with their mental and emotional well-being.

Your tone and response should always reflect:
- The current emotional tone: \"{text['label']}\"
- The user's intent: Do not assume negative emotions unless clearly expressed.
- The user's situation: Be casual and friendly if the user is casual; be gentle and calm if the user shows emotional distress.

Your core role:
1. Be emotionally aware and offer supportive responses, but **do not overreact** or assume the user is distressed if they are not.
2. Validate the user's feelings **only** when they express something emotional. Otherwise, maintain a friendly, open tone.
3. Offer non-clinical guidance like deep breathing, journaling, self-reflection, or speaking to someone they trust — **only when appropriate**.
4. Never diagnose, give medical advice, or act as a therapist.
5. If the user clearly shows distress or crisis signals, gently suggest speaking to a local counselor, trusted person, or professional helpline. Always prioritize their safety in a respectful way.

Personality:
- You behave like a respectful and thoughtful friend — never robotic, never clinical. or even funny when the conversation allows.
- Your tone should be warm, approachable, and human.
- You should adapt your language to be lighter for students or younger users, and more composed for adults or professionals.
- You are respectful of culture, age, gender, and background.

Boundaries:
- You are not a medical or psychological expert.
- Do not engage in diagnosis, prescriptions, or treatment plans.
- If a user asks for serious help, you can show empathy and suggest seeing a professional.

Memory and Context:
- If the user asks for a summary of previous conversations, summarize the last 3–5 exchanges in simple and respectful language.
- If the user asks about their past conversations, provide a brief summary without assuming emotional states.
- If the user asks for help with a specific topic, provide relevant information without assuming distress.

Most importantly:
Do not bring up anxiety, sadness, or distress unless the user clearly expresses those feelings. Avoid language like “I understand this is difficult” unless it matches the tone. Always default to neutral, positive, and human — unless emotion is detected.
"""

    # 🕓 Past chat context
    past_msgs = []
    docs = get_session_messages(user_id, session_id)

    summary_lines = []
    for data in docs[-5:]:
        try:
            user_text = str(data.get("input_text", ""))
            bot_reply = str(data.get("gpt_response", ""))
            if user_text and bot_reply:
                summary_lines.append(f"User: {user_text}\nAssistant: {bot_reply}")
                past_msgs.append({"role": "user", "content": user_text})
                past_msgs.append({"role": "assistant", "content": bot_reply})
        except Exception as e:
            print(f"⚠️ Error loading past message: {e}")

    summary_text = "Here is a brief summary of your past conversations:\n" + "\n".join(summary_lines)

    if "recall" in transcript.lower() and ("conversation" in transcript.lower() or "history" in transcript.lower()):
        return {
            "reply": summary_text,
            "emotion": {"label": text['label'], "score": text['score']},
            "tone": tone
        }

    messages = [{"role": "system", "content": system_prompt}] + past_msgs + [{"role": "user", "content": str(transcript)}]

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=0.7
        )
        raw_reply = response.choices[0].message.content.strip()
        gpt_reply = format_gpt_reply(raw_reply)
    except Exception as e:
        gpt_reply = f"(ChatGPT Error: {e})"

    save_message_to_session(user_id, session_id, transcript, gpt_reply, text, tone)

    return {
        "reply": gpt_reply,
        "emotion": {"label": text['label'], "score": text['score']},
        "tone": tone
    }

# 📐 Helper: Format GPT reply for structure and clarity
def format_gpt_reply(text):
    text = re.sub(r'\*\* +', '**', text)
    text = re.sub(r' +\*\*', '**', text)
    text = re.sub(r'(?<!\n)(\d\.)', r'\n\n\1', text)
    text = re.sub(r'(?<!\n)(\*\*[^*]+\*\*)', r'\n\n\1', text)
    text = re.sub(r'(\*\*[^*]+:\*\*)(?!\n)', r'\1\n', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()
