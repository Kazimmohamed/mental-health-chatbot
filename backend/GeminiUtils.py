import os
from dotenv import load_dotenv
import google.generativeai as genai
import json

# Load environment variables
load_dotenv()

# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        print("✅ [Gemini] API key configured successfully.")
    except Exception as e:
        print(f"🔥 [Gemini Error] Failed to configure Gemini: {e}")
else:
    print("🔥 [Gemini Error] GEMINI_API_KEY not found in environment variables.")
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

# Instantiate Gemini model (flash version)
model = genai.GenerativeModel("gemini-1.5-flash")
print("✅ [Gemini] Model 'gemini-1.5-flash' loaded.")

def gemini_generate_response(prompt: str, history: list = None) -> str:
    """
    Generate a conversational response using Gemini.
    """
    try:
        print(f"🔹 [Gemini Chat] Sending prompt: '{prompt[:80]}...'")
        chat = model.start_chat(history=history if history else [])
        response = chat.send_message(prompt)
        result = response.text.strip()
        print(f"🌟 [Gemini Chat Output]: {result}")
        return result
    except Exception as e:
        error_msg = f"🔥 [Gemini Chat Error] {str(e)}"
        print(error_msg)
        return error_msg

def gemini_quick_task(prompt: str) -> str:
    """
    Use Gemini to do a lightweight task like title generation.
    """
    try:
        print(f"🔹 [Gemini Task] Sending prompt for quick task: '{prompt[:80]}...'")
        response = model.generate_content(prompt)
        result = response.text.strip()
        # ✅ FIX: Added a check for empty or error-like responses
        if not result or "error" in result.lower():
            print(f"⚠️ [Gemini Task Warning] Received an empty or error-like response: '{result}'")
            return "Mindful Moment" # Fallback title
        print(f"🌟 [Gemini Task Output]: {result}")
        return result
    except Exception as e:
        error_msg = f"🔥 [Gemini Task Error] {str(e)}"
        print(error_msg)
        return "Mindful Moment" # Fallback title on exception

def gemini_classify_emotion_and_tone(text: str) -> dict:
    """
    Classify user's tone and emotion using Gemini.
    """
    prompt = (
        "You are an expert emotional analyst AI."
        " Analyze the user's emotional tone and psychological state from the given input."
        " Classify the emotion (like happy, sad, anxious, frustrated, etc.) and tone (supportive, angry, confused, etc.)."
        f"\n\nText: {text}\n\n"
        "Respond ONLY in this JSON format: {\"emotion\": <emotion>, \"tone\": <tone>}"
    )
    try:
        print(f"🔹 [Gemini Emotion] Sending text for analysis: '{text[:80]}...'")
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        print(f"🧠 [Gemini Emotion Output]: {text_response}")

        # Try parsing the JSON from Gemini's reply
        json_str = text_response[text_response.find('{'):text_response.rfind('}')+1]
        if json_str:
            return json.loads(json_str)
        else:
            print("⚠️ [Gemini Emotion Warning] No JSON object found in the response.")
            return {"emotion": "neutral", "tone": "neutral"}
    except Exception as e:
        print(f"🔥 [Gemini Emotion Error] {str(e)}")
        return {"emotion": "neutral", "tone": "neutral"}