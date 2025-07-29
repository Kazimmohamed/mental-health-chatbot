import os
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

# Get Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    raise ValueError("GEMINI_API_KEY not found in environment variables.")

# Instantiate Gemini model (flash version)
model = genai.GenerativeModel("gemini-1.5-flash")

def gemini_generate_response(prompt: str, history: list = None) -> str:
    """
    Generate a conversational response using Gemini.

    Args:
        prompt (str): The user prompt.
        history (list): List of previous messages (optional).

    Returns:
        str: Gemini's generated response.
    """
    try:
        chat = model.start_chat(history=history if history else [])
        response = chat.send_message(prompt)
        result = response.text.strip()
        print(f"🌟 [Gemini Chat Output]: {result}")
        return result
    except Exception as e:
        return f"[Gemini Chat Error] {str(e)}"

def gemini_quick_task(prompt: str) -> str:
    """
    Use Gemini to do a lightweight task like tone/emotion classification or title generation.

    Args:
        prompt (str): The instruction + input text.

    Returns:
        str: Gemini's generated output.
    """
    try:
        response = model.generate_content(prompt)
        result = response.text.strip()
        print(f"🔹 [Gemini Task Output]: {result}")
        return result
    except Exception as e:
        error_msg = f"[Gemini Task Error] {str(e)}"
        print(error_msg)
        return error_msg

def gemini_classify_emotion_and_tone(text: str) -> dict:
    """
    Classify user's tone and emotion using Gemini.

    Args:
        text (str): User's input text.

    Returns:
        dict: Contains 'emotion' and 'tone'.
    """
    prompt = (
        "You are an expert emotional analyst AI."
        " Analyze the user's emotional tone and psychological state from the given input."
        " Classify the emotion (like happy, sad, anxious, frustrated, etc.) and tone (supportive, angry, confused, etc.)."
        f"\n\nText: {text}\n\n"
        "Respond ONLY in this JSON format: {\"emotion\": <emotion>, \"tone\": <tone>}"
    )
    try:
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        print(f"🧠 [Gemini Emotion Output]: {text_response}")

        # Try parsing the JSON from Gemini's reply
        import json
        json_str = text_response[text_response.find('{'):text_response.rfind('}')+1]  # Extract JSON part
        return json.loads(json_str)
    except Exception as e:
        print(f"[Gemini Emotion Error] {str(e)}")
        return {"emotion": "neutral", "tone": "neutral"}
