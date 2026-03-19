# Mental Health AI Chatbot - MindMate

[](https://opensource.org/licenses/MIT)
[](https://reactjs.org/)
[](https://vitejs.dev/)
[](https://tailwindcss.com/)
[](https://www.python.org/)
[](https://flask.palletsprojects.com/)
[](https://firebase.google.com/)
[](https://openai.com/)

**MindMate** is an intelligent, voice-enabled AI chatbot designed to provide a safe and supportive space for users to express their thoughts and feelings. It leverages a powerful combination of AI technologies to understand, analyze, and respond with empathy and care.

## 🌟 Features

  - **🗣️ Voice-to-Text Input**: Speak your mind with Google Speech Recognition.
  - **🧠 Advanced AI Conversations**: Powered by **OpenAI's GPT-4o-mini** and **Google's Gemini** for intelligent and empathetic responses.
  - **😊 Emotion & Tone Analysis**: Utilizes **HuggingFace Transformers** to analyze text and audio for emotional tone, allowing for more adaptive responses.
  - **🔐 Secure User Authentication**: Sign in with Google or as a guest, with user data securely managed by **Firebase Authentication**.
  - **📝 Persistent Chat History**: Conversations are saved to **Firebase Firestore**, allowing you to pick up where you left off.
  - **🔊 Text-to-Speech Output**: Listen to the AI's responses with **gTTS**.
  - **✨ Modern & Responsive UI**: A clean and calming user interface built with **Vite, React, and Tailwind CSS**.

## 🛠️ Tech Stack

### Frontend

  - **Framework**: React with Vite
  - **Styling**: Tailwind CSS
  - **UI Components**: shadcn/ui (as indicated by `components.json`)
  - **Authentication**: Firebase Authentication
  - **Routing**: React Router

### Backend

  - **Framework**: Flask
  - **Database**: Firebase Firestore
  - **Authentication**: Firebase Admin SDK
  - **API**: RESTful API for communication with the frontend

### AI & Machine Learning

  - **Core LLM**: OpenAI GPT-4o-mini
  - **Generative AI**: Google Gemini for session title generation and other tasks
  - **Emotion Analysis**: HuggingFace Transformers (for both text and audio)
  - **Speech-to-Text**: Google Speech Recognition
  - **Text-to-Speech**: gTTS

## 🚀 Getting Started

Follow these instructions to get a local copy up and running.

### Prerequisites

  - **Node.js and npm**: [Download Node.js](https://nodejs.org/)
  - **Python 3.10+**: [Download Python](https://www.python.org/)
  - **Firebase Project**: Create a new project on the [Firebase Console](https://console.firebase.google.com/)
  - **OpenAI API Key**: Get your API key from [OpenAI](https://platform.openai.com/account/api-keys)
  - **Google Gemini API Key**: Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

### Backend Setup

1.  **Navigate to the backend directory:**

    ```bash
    cd backend
    ```

2.  **Create a virtual environment and activate it:**

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `venv\Scripts\activate`
    ```

3.  **Install the required Python packages:**

    ```bash
    pip install -r requirements.txt
    ```

4.  **Set up Firebase Admin SDK:**

      - In your Firebase project, go to **Project settings \> Service accounts**.
      - Click **Generate new private key** and download the JSON file.
      - Place the downloaded file in the `backend` directory and rename it to `firebase_key.json.json` or update the path in `firebase_utils.py`.

5.  **Create a `.env` file in the `backend` directory and add your API keys:**

    ```env
    OPENAI_API_KEY=your_openai_api_key
    GEMINI_API_KEY=your_gemini_api_key
    ```

6.  **Run the Flask server:**

    ```bash
    flask run
    ```

    The backend will be running at `http://localhost:5000`.

### Frontend Setup

1.  **Navigate to the frontend directory:**

    ```bash
    cd chatbot-frontend
    ```

2.  **Install the required npm packages:**

    ```bash
    npm install
    ```

3.  **Set up Firebase for the client-side:**

      - In your Firebase project, go to **Project settings** and scroll down to **Your apps**.
      - Click on the **Web** icon (`</>`) to add a new web app.
      - Copy the `firebaseConfig` object and paste it into `src/lib/firebase.js`.

4.  **Enable Google Authentication in Firebase:**

      - In the Firebase console, go to **Authentication \> Sign-in method**.
      - Enable the **Google** provider.

5.  **Set up Firestore:**

      - In the Firebase console, go to **Firestore Database**.
      - Create a new database in **test mode** for development.

6.  **Run the Vite development server:**

    ```bash
    npm run dev
    ```

    The frontend will be running at `http://localhost:5173` (or another port if 5173 is in use).

## 📁 Project Structure

```
mental-health-chatbot/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── ai_core.py          # Core AI and emotion analysis logic
│   ├── GeminiUtils.py      # Utilities for Google Gemini
│   ├── firebase_utils.py   # Firebase Admin SDK utilities
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Example environment variables
│
├── chatbot-frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/            # Helper libraries (Firebase, API)
│   │   ├── ui/             # UI components
│   │   ├── App.jsx         # Main App component
│   │   └── main.jsx        # Entry point for the React app
│   ├── tailwind.config.js  # Tailwind CSS configuration
│   ├── vite.config.js      # Vite configuration
│   └── package.json        # Frontend dependencies
│
└── README.md
```

## 🤝 Contributing

Contributions are welcome\! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

1.  **Fork the repository**
2.  **Create your feature branch** (`git checkout -b feature/AmazingFeature`)
3.  **Commit your changes** (`git commit -m 'Add some AmazingFeature'`)
4.  **Push to the branch** (`git push origin feature/AmazingFeature`)
5.  **Open a pull request**

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](https://www.google.com/search?q=LICENSE) file for details.

## 👨‍💻 Author

  - **Kazim Mohamed** - [GitHub Profile](https://www.google.com/search?q=https://github.com/Kazimmohamed)

Feel free to fork, modify, and share. If you like the project, star the repo ⭐

📜 License

MIT License. Feel free to use and modify it.
