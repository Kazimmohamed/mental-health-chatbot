# backend/ai_core.py

import os
import re
import speech_recognition as sr
from openai import OpenAI
from transformers import pipeline
from dotenv import load_dotenv
from firebase_utils import get_session_interactions, update_session_title, get_session_details
from GeminiUtils import gemini_quick_task
import traceback  # Added for detailed error logging

load_dotenv()

# --- Initialization ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
print("🔊 Initializing tone classifier...")
tone_classifier = pipeline("audio-classification", model="ehcalabres/wav2vec2-lg-xlsr-en-speech-emotion-recognition")
print("📝 Initializing text emotion classifier...")
text_classifier = pipeline("text-classification", model="j-hartmann/emotion-english-distilroberta-base", top_k=None)
print("✅ AI models loaded")

# --- Helper Functions ---
def record_audio_from_file(filepath):
    print(f"🔊 Starting transcription for: {filepath}")
    recognizer = sr.Recognizer()
    try:
        with sr.AudioFile(filepath) as source:
            print("🔊 Reading audio file...")
            audio = recognizer.record(source)
            print("✅ Audio file loaded")
        try:
            print("🔊 Transcribing with Google Speech Recognition...")
            text = recognizer.recognize_google(audio)
            print(f"📝 Transcription: '{text}'")
            return audio, text
        except sr.UnknownValueError:
            print("❌ Google Speech Recognition could not understand audio")
            return audio, ""
        except sr.RequestError as e:
            print(f"❌ Google Speech Recognition service error: {e}")
            return audio, ""
        except Exception as e:
            print(f"❌ Transcription error: {traceback.format_exc()}")
            return audio, ""
    except Exception as e:
        print(f"❌ Audio file loading error: {traceback.format_exc()}")
        return None, ""

def _generate_title(conversation_history):
    print("🏷️ Generating session title...")
    try:
        # Get the last user and assistant messages
        user_messages = [msg['content'] for msg in conversation_history if msg['role'] == 'user']
        bot_messages = [msg['content'] for msg in conversation_history if msg['role'] == 'assistant']
        
        # Use the last exchange for title generation
        user_message = user_messages[-1] if user_messages else ""
        bot_message = bot_messages[-1] if bot_messages else ""
        
        print(f"🗣️ User message for title: '{user_message}'")
        print(f"🤖 Bot message for title: '{bot_message}'")

        prompt = (
            "Create a very short (2-4 words) title summarizing this conversation exchange:\n"
            f"User: {user_message}\n"
            f"Assistant: {bot_message}\n\n"
            "Title:"
        )
        print(f"📝 Title generation prompt:\n{prompt}")
        title = gemini_quick_task(prompt)
        clean_title = title.strip() or "Conversation"
        print(f"🏷️ Generated title: '{clean_title}'")
        return clean_title
    except Exception as e:
        print(f"🔥 Title generation failed: {traceback.format_exc()}")
        return "Conversation"

def format_gpt_reply(text):
    cleaned = re.sub(r'\n{3,}', '\n\n', text).strip()
    print(f"🧹 Cleaned GPT response: '{cleaned[:100]}...'")
    return cleaned

def adjust_temperature(emotion_score):
    if emotion_score >= 0.75: 
        temp = 0.9
    elif emotion_score >= 0.5: 
        temp = 0.75
    elif emotion_score >= 0.3: 
        temp = 0.6
    else: 
        temp = 0.45
    print(f"🌡️ Adjusted temperature to: {temp} based on emotion score: {emotion_score}")
    return temp

# --- Core Logic ---
def analyze_and_respond(user_id, session_id, user_input, audio_path=None):
    print(f"🤖 Starting analyze_and_respond - User: {user_id}, Session: {session_id}")
    print(f"🗣️ User input: '{user_input}'")
    print(f"🔊 Audio path: {audio_path}")
    
    # --- Emotion Analysis ---
    tone_emotion = {"label": "Unknown", "score": 0.0}
    if audio_path and os.path.exists(audio_path):
        try:
            print("🔊 Running tone emotion analysis...")
            tone_result = tone_classifier(audio_path)
            if tone_result:
                tone_emotion = tone_result[0]
                print(f"🎵 Detected tone emotion: {tone_emotion}")
            else:
                print("⚠️ Tone classifier returned empty result")
        except Exception as e:
            print(f"❌ Tone analysis error: {traceback.format_exc()}")
    else:
        print("🔇 Skipping tone analysis - no audio path")
    
    text_emotion = {"label": "neutral", "score": 0.0}
    try:
        print("📝 Running text emotion analysis...")
        text_emotions = text_classifier(user_input)[0]
        text_emotion = max(text_emotions, key=lambda x: x['score'])
        print(f"📝 Detected text emotion: {text_emotion}")
    except Exception as e:
        print(f"❌ Text analysis error: {traceback.format_exc()}")

    temperature = adjust_temperature(text_emotion['score'])

    # --- Build System Prompt ---
    system_prompt = (
        "You are a warm, emotionally intelligent assistant. "
        "Your personality is friendly, calm, and adaptive. "
        "Respond naturally like a trusted friend.\n\n"
        "Rules:\n"
        "- Be empathetic but not clinical\n"
        "- Keep responses concise and human\n"
        "- Never repeat the user's exact words\n"
        f"- Current emotional tone: {text_emotion['label']}"
    )
    print(f"🤖 System prompt: '{system_prompt[:100]}...'")
    
    # --- Retrieve Conversation History ---
    print("📚 Retrieving conversation history...")
    interactions = get_session_interactions(user_id, session_id)
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add previous interactions to context
    for interaction in interactions:
        messages.append({"role": "user", "content": interaction['user_input']})
        messages.append({"role": "assistant", "content": interaction['gpt_response']})
    print(f"📚 Loaded {len(interactions)} previous interactions")
    
    # Add current user input
    messages.append({"role": "user", "content": user_input})

    # --- Generate Response ---
    gpt_response = "Error: Processing failed"
    try:
        print("🤖 Generating GPT response...")
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            temperature=temperature
        )
        gpt_response = format_gpt_reply(response.choices[0].message.content)
        print(f"🤖 GPT response generated: '{gpt_response[:100]}...'")
    except Exception as e:
        print(f"🔥 GPT error: {traceback.format_exc()}")

    # --- Update Session Title If Needed ---
    try:
        print("📝 Checking session title...")
        session_data = get_session_details(user_id, session_id)
        if session_data and session_data.get('title') == 'Untitled Session':
            print("🏷️ Generating new title for session...")
            new_title = _generate_title(messages + [{"role": "assistant", "content": gpt_response}])
            if new_title and new_title != "Mindful Moment":
                print(f"🏷️ Updating title to: {new_title}")
                update_session_title(user_id, session_id, new_title)
    except Exception as e:
        print(f"🔥 Title update error: {traceback.format_exc()}")

    print("✅ analyze_and_respond completed")
    return {
        "gpt_response": gpt_response,
        "text_emotion": text_emotion,
        "tone_emotion": tone_emotion
    }