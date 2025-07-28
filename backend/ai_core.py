import os
from openai import OpenAI
import re
import base64
from io import BytesIO
from gtts import gTTS
from firebase_utils import (
    save_message_to_session,
    get_session_messages,
    update_session_title # Import the new function
)
from transformers import pipeline
import speech_recognition as sr


# --- Initialization ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
# Models for emotion analysis
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
    """
    Asks the AI to create a short, human-friendly title for the conversation.
    Includes error handling.
    """
    print("DEBUG: Attempting to generate session title...")
    try:
        # Create a concise summary of the conversation for the prompt
        history_summary = "\n".join([f"{msg['role']}: {msg['content']}" for msg in conversation_history])
        
        prompt = f"""
        Based on the following conversation, create a very short, concise title (4 words maximum).
        The title should capture the main topic. Do not use quotes or any extra formatting.

        Conversation:
        {history_summary}

        Title:
        """
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=15
        )
        # Clean the title of any quotes or extra whitespace
        title = response.choices[0].message.content.strip().replace('"', '')
        print(f"DEBUG: AI generated title: '{title}'")
        return title if title else "Titled Conversation" # Ensure it's not empty
    except Exception as e:
        print(f"🔥 ERROR: Title generation failed: {e}. Using fallback title.")
        # Fallback in case the API call fails
        return "Titled Conversation"

def format_gpt_reply(text):
    """Helper function to format the AI's response text."""
    # Your regex formatting logic remains the same
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# --- Core Logic ---

def analyze_and_respond(user_id, session_id, transcript, audio_path=None):
    """
    Main function to process user input, get an AI response, and handle session titling.
    """
    # 1. Analyze Emotions (Your existing logic is fine)
    tone = {"label": "Unknown", "score": 0.0}
    if audio_path and os.path.exists(audio_path):
        try:
            tone = tone_emotion(audio_path)[0]
        except Exception as e:
            print(f"⚠ WARNING: Tone analysis failed: {e}")
    text_emotions = text_emotion(transcript)[0]
    text = max(text_emotions, key=lambda x: x['score'])
    
    # 2. Prepare System Prompt and History
    system_prompt = """
You are a kind, emotionally intelligent virtual assistant designed to support users with their mental and emotional well-being.

**Core Instruction on Memory:**
You will be provided with the recent conversation history. You MUST use this history to understand the context of the user's current message and provide a relevant, continuous response. Do not ask questions that have already been answered in the provided history. Maintain the flow of the conversation.

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

Most importantly:
Do not bring up anxiety, sadness, or distress unless the user clearly expresses those feelings. Avoid language like “I understand this is difficult” unless it matches the tone. Always default to neutral, positive, and human — unless emotion is detected.

**NEW BEHAVIORAL RULE:**
Never simply repeat or echo the user's message back to them. Always provide a unique, thoughtful, or engaging response, even for simple greetings like "hi" or an emoji. For example, if the user says "hi", respond with something like "Hello! How are you feeling today?" instead of just "hi".
"""
    past_docs = get_session_messages(user_id, session_id)
    past_msgs = []
    for data in past_docs:
        past_msgs.append({"role": "user", "content": str(data.get("input_text", ""))})
        past_msgs.append({"role": "assistant", "content": str(data.get("gpt_response", ""))})

    # 3. Get AI Response
    messages = [{"role": "system", "content": system_prompt}] + past_msgs + [{"role": "user", "content": str(transcript)}]
    gpt_reply = ""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini", messages=messages, temperature=0.7
        )
        raw_reply = response.choices[0].message.content.strip()
        gpt_reply = format_gpt_reply(raw_reply)
    except Exception as e:
        gpt_reply = f"(ChatGPT Error: {e})"
        print(f"🔥 ERROR: OpenAI API call failed: {e}")

    # 4. Save the new message to the database
    save_message_to_session(user_id, session_id, transcript, gpt_reply, text, tone)

    # 5. ✅ Generate and Save Session Title (only for the first message)
    if not past_docs: # This is True only if the message history was empty before this turn
        print(f"DEBUG: First message in session {session_id}. Triggering title generation.")
        # Create a small history of the first exchange for the title generator
        title_history = [
            {"role": "user", "content": transcript},
            {"role": "assistant", "content": gpt_reply}
        ]
        new_title = _generate_title_for_session(title_history)
        update_session_title(user_id, session_id, new_title)

    # 6. Return the response to the frontend
    # ❗ECHO BUG NOTE: This function ONLY returns the AI's reply under the key "reply".
    # It does NOT return the user's 'transcript'. The echoing you see is a bug
    # in your frontend code (likely ChatWindow.jsx) where you are displaying
    # the user's input a second time as if it were the AI's response.
    return {
        "reply": gpt_reply,
        "emotion": {"label": text['label'], "score": text['score']},
        "tone": tone
    }
# FILE: ai_core.py 