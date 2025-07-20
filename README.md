Mental Health AI Chatbot

An intelligent, voice-based chatbot system built using Python (backend) and Vite + Tailwind (frontend), powered by Google Speech Recognition, HuggingFace Transformers, OpenAI API, and Firebase Authentication. The chatbot is designed to understand user input via voice, analyze emotional tone, and respond with empathetic, AI-generated replies.

🧠 Features

🔊 Voice-to-text input using Google Speech Recognition

🤖 Text sentiment & tone analysis using HuggingFace Transformers

🗣️ AI-generated responses using OpenAI GPT API

🔐 User authentication via Google using Firebase Auth

🗂️ Firebase Firestore integration for chat history

🌐 Clean, modern frontend using Vite + React + Tailwind CSS

📜 Keeps last 10-message history per user

☁️ Fully connected backend to manage tone, sessions, and database

📦 Tech Stack

Layer

Tools & Libraries

Frontend

Vite, React, Tailwind CSS, shadcn/ui, lucide-react

Backend

Python, Flask (or FastAPI), Firebase Admin SDK

AI/ML

OpenAI API, HuggingFace Transformers

Voice

Google Speech Recognition, pyttsx3 (TTS)

Auth/DB

Firebase Authentication, Firebase Firestore

🚀 Setup Instructions

1. Clone the Repository

git clone https://github.com/Kazimmohamed/mental-health-chatbot.git
cd mental-health-chatbot

🧩 Backend Setup (Python)

📁 Navigate to Backend Directory

cd backend

📜 Install Python Dependencies

Install Python 3.10+ and then:

pip install -r requirements.txt

If requirements.txt is minimal, also manually install:

pip install openai
pip install firebase-admin
pip install transformers
pip install google-cloud-speech
pip install pyttsx3
pip install SpeechRecognition

🔑 Firebase Admin SDK Key

Place your Firebase Admin JSON key in the backend folder:

backend/firebase_key.json

If not present, generate it from [Firebase Console > Project Settings > Service Accounts > Generate New Private Key]

🔐 Add your OpenAI API Key

Create a .env file or set as environment variable:

OPENAI_API_KEY=your_key_here

🎨 Frontend Setup (Vite + React + Tailwind CSS)

📁 Navigate to Frontend Directory

cd frontend

📦 Install Node Modules

npm install

💡 Start Dev Server

npm run dev

🔥 Firebase Setup

Go to Firebase Console

Create a new project

Add a web app inside it

Copy the Firebase config and paste it in your frontend project under:

// inside frontend/firebaseConfig.js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};

Enable Google Authentication under Firebase > Authentication > Sign-in Method

Setup Cloud Firestore in test mode to store user messages

💬 Voice Input & Emotion Flow (Backend Logic)

User speaks → captured by microphone

Converted to text using speech_recognition

Sentiment analysis using transformers (e.g., BERT)

Emotion label extracted

Query and history sent to OpenAI ChatCompletion

Response returned + saved to Firestore

Optional: Voice output using pyttsx3

📁 Project Structure

mental-health-chatbot/
├── backend/
│   ├── main.py
│   ├── firebase_key.json
│   ├── speech_logic.py
│   ├── emotion_model.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── firebaseConfig.js
│   ├── index.html
│   └── tailwind.config.js
│
├── README.md
└── .gitignore

🛠️ Other Tools You May Need

Tool

Purpose

Firebase CLI

Managing Firebase from terminal

Node.js + npm

Required for frontend

Python 3.10+

Required for backend

GitHub

For pushing/pulling your code

🙋 FAQ

Q: What if SpeechRecognition doesn't work?Make sure pyaudio is installed. On Windows:

pip install pipwin
pipwin install pyaudio

Q: How to deploy it online?Use services like Vercel (for frontend), Render/Railway/Replit/Fly.io for backend hosting. Firebase handles the database and auth.

👨‍💻 Author

Kazim Mohamed — GitHub Profile

Feel free to fork, modify, and share. If you like the project, star the repo ⭐

📜 License

MIT License. Feel free to use and modify it.
