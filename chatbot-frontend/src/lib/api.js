import { auth } from './firebase';

/**
 * Fetches the session history for the given user from the backend.
 * @param {object} user - The user object from the App's state.
 * @returns {Promise<Array>} A promise that resolves to an array of session objects.
 */
export async function getSessionHistory(user) {
    if (!user || !user.uid) {
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        let headers = {};
        
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:5000/history/${user.uid}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch session history');
        }

        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error('Error fetching session history:', error);
        throw error;
    }
}

/**
 * Sends a user's message to the backend for processing.
 * @param {object} user - The user object from the App's state.
 * @param {string} sessionId - The ID of the current session.
 * @param {string} inputText - The message from the user.
 * @returns {Promise<Object>} A promise that resolves to the AI's response.
 */
export async function sendMessageToBackend(user, sessionId, inputText) {
    if (!user || !user.uid) {
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        let headers = {
            'Content-Type': 'application/json'
        };
        
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:5000/text', {
            method: 'POST',
            headers,
            body: JSON.stringify({
                session_id: sessionId,
                input_text: inputText
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to get AI response');
        }
        return data;
    } catch (error) {
        console.error('Error sending message:', error);
        throw error;
    }
}

/**
 * Generates TTS audio for the given text.
 * @param {object} user - The user object from the App's state.
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<Object>} A promise that resolves to the audio data.
 */
export async function generateTTS(user, text) {
    if (!user || !user.uid) {
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        let headers = {
            'Content-Type': 'application/json'
        };
        
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch('http://localhost:5000/tts', {
            method: 'POST',
            headers,
            body: JSON.stringify({ text })
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Failed to generate audio');
        }
        return data;
    } catch (error) {
        console.error('Error generating TTS:', error);
        throw error;
    }
}