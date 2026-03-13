# ============================================
# GeminiUtils.py — Unified Gemini Integration Layer
# Version: Finalized (Pipeline 3)
# ============================================
import os
import json
from dotenv import load_dotenv
import google.generativeai as genai

# ============================================
# 1️⃣ Environment Setup
# ============================================

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ [Gemini] API key configured successfully.")
    except Exception as e:
        print(f"🔥 [Gemini Error] Failed to configure Gemini: {e}")
else:
    print("🔥 [Gemini Error] GEMINI_API_KEY not found in environment variables.")
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

# Use the latest Gemini model
MODEL_NAME = "gemini-2.5-flash"
model = genai.GenerativeModel(MODEL_NAME)
print(f"✅ [Gemini] Model '{MODEL_NAME}' loaded successfully.")


# ============================================
# 2️⃣ Gemini General Chat Interface
# ============================================

def gemini_generate_response(prompt: str, history: list = None) -> str:
    """
    Conversational mode — maintains context if history is given.
    Used for reflective reasoning or follow-up dialogue.
    """
    try:
        print(f"🔹 [Gemini Chat] Sending prompt: {prompt[:80]}...")
        chat = model.start_chat(history=history if history else [])
        response = chat.send_message(prompt)
        result = response.text.strip()
        print(f"🌟 [Gemini Chat Output]: {result[:200]}")
        return result
    except Exception as e:
        error_msg = f"🔥 [Gemini Chat Error] {str(e)}"
        print(error_msg)
        return "I'm sorry, I couldn't process that right now."


# ============================================
# 3️⃣ Gemini Quick Task Utility
# ============================================

def gemini_quick_task(prompt: str, fallback_text: str = "Mindful Moment") -> str:
    """
    Lightweight one-shot generation — used for titles, naming, or short tasks.
    """
    try:
        print(f"🔹 [Gemini Task] Sending quick prompt: {prompt[:80]}...")
        response = model.generate_content(prompt)
        result = response.text.strip()

        if not result or "error" in result.lower():
            print(f"⚠️ [Gemini Task Warning] Invalid or empty response: {result}")
            return fallback_text

        print(f"🌟 [Gemini Task Output]: {result}")
        return result

    except Exception as e:
        print(f"🔥 [Gemini Task Error] {e}")
        return fallback_text


# ============================================
# 4️⃣ Emotion & Tone Classification (Text Only)
# ============================================

def gemini_classify_emotion_and_tone(text: str) -> dict:
    """
    Uses Gemini's language understanding to semantically classify emotion and tone.
    This is *semantic emotion detection*, not waveform-based.
    """
    prompt = f"""
You are an expert emotional intelligence and linguistic tone analysis AI.
Analyze the *emotional undertone and psychological state* of the user from the given text.

Your job:
1. Determine the user's primary emotion. Example: happy, sad, anxious, frustrated, calm, reflective, hopeful.
2. Determine the conversation tone. Example: supportive, angry, confused, motivated, empathetic.
3. Be context-sensitive — consider word choice, phrasing, and implicit emotion.

Respond ONLY in this JSON format:
{{
  "emotion": "<primary emotion>",
  "tone": "<dominant tone>",
  "confidence": <float between 0 and 1>
}}

User text:
{text}
"""

    try:
        print(f"🔹 [Gemini Emotion] Analyzing text: '{text[:80]}...'")
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        print(f"🧠 [Gemini Emotion Output]: {text_response}")

        json_str = text_response[text_response.find('{'):text_response.rfind('}') + 1]
        if json_str:
            data = json.loads(json_str)
            return {
                "emotion": data.get("emotion", "neutral"),
                "tone": data.get("tone", "neutral"),
                "confidence": data.get("confidence", 0.5)
            }
        else:
            print("⚠️ [Gemini Emotion Warning] No valid JSON found.")
            return {"emotion": "neutral", "tone": "neutral", "confidence": 0.0}

    except Exception as e:
        print(f"🔥 [Gemini Emotion Error] {str(e)}")
        return {"emotion": "neutral", "tone": "neutral", "confidence": 0.0}


# ============================================
# 5️⃣ Session Summarization (For Memory Pipeline)
# ============================================

def gemini_summarize_session(conversation_history: list) -> dict:
    """
    Summarizes a complete chat session for long-term memory storage.
    This is called when the session ends or is inactive.
    """
    prompt = f"""
You are a professional session summarization AI for a mental health and wellbeing assistant.
Your role is to create a structured, concise, emotionally aware summary of the conversation.

Conversation History (JSON list of user and assistant messages):
{json.dumps(conversation_history, ensure_ascii=False)}

Generate a JSON summary capturing:
1. "summary": A short paragraph (2-3 sentences) describing what the session was about and the user's mental/emotional focus.
2. "emotional_trend": One word describing the change in mood (improving / declining / stable / unclear).
3. "topics": A short list (max 4) of major topics discussed.
4. "confidence": A float (0.0–1.0) estimating how confident you are about your interpretation.

Output ONLY JSON in this exact structure:
{{
  "summary": "<text>",
  "emotional_trend": "<trend>",
  "topics": ["topic1", "topic2"],
  "confidence": <float>
}}
"""

    try:
        print("🔹 [Gemini Summary] Generating session summary...")
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        print(f"🧩 [Gemini Summary Output]: {text_response}")

        json_str = text_response[text_response.find('{'):text_response.rfind('}') + 1]
        if json_str:
            summary = json.loads(json_str)
            summary.setdefault("confidence", 0.8)
            summary.setdefault("topics", [])
            summary.setdefault("emotional_trend", "unclear")
            return summary
        else:
            print("⚠️ [Gemini Summary Warning] No JSON found in output.")
            return {
                "summary": "No summary available.",
                "emotional_trend": "unclear",
                "topics": [],
                "confidence": 0.0
            }

    except Exception as e:
        print(f"🔥 [Gemini Summary Error] {str(e)}")
        return {
            "summary": "Session summary could not be generated.",
            "emotional_trend": "unknown",
            "topics": [],
            "confidence": 0.0
        }


# ============================================
# 6️⃣ Optional: Context Relevance (for future)
# ============================================

def gemini_assess_relevance(new_message: str, past_summary: str) -> float:
    """
    Determines how relevant a previous session summary is to the new message.
    Used to filter old context when building long-term memory prompts.
    """
    prompt = f"""
You are a relevance-assessment AI.
Compare the following past session summary and the user's new message.

Past Summary:
{past_summary}

New Message:
{new_message}

Output ONLY a float between 0.0 and 1.0 indicating how relevant the past summary is
(0.0 = completely unrelated, 1.0 = directly related).
"""
    try:
        response = model.generate_content(prompt)
        score_text = response.text.strip()
        print(f"🔹 [Gemini Relevance Output]: {score_text}")
        try:
            return float(score_text)
        except ValueError:
            return 0.5
    except Exception as e:
        print(f"🔥 [Gemini Relevance Error] {e}")
        return 0.5
