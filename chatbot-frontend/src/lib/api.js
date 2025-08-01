import { auth } from './firebase';

/**
 * Fetches the session history for the given user from the backend.
 * @param {object} user - The user object from the App's state.
 * @returns {Promise<Array>} A promise that resolves to an array of session objects.
 */
export async function getSessionHistory(user) {
    if (!user || !user.uid) {
        console.error('getSessionHistory: Invalid user object:', user);
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

        const url = `http://localhost:5000/history/${user.uid}`;
        const response = await fetch(url, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error(`getSessionHistory: Backend responded with error`, {
                url,
                userId: user.uid,
                status: response.status,
                message: errorData.error,
            });
            throw new Error(errorData.error || 'Failed to fetch session history');
        }

        const data = await response.json();
        return data.sessions || [];
    } catch (error) {
        console.error('getSessionHistory: Failed to fetch session history for UID:', user.uid, 'Error:', error);
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
        console.error('sendMessageToBackend: Invalid user object:', user);
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        let headers = { 'Content-Type': 'application/json' };
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const payload = {
            session_id: sessionId,
            input_text: inputText
        };

        const response = await fetch('http://localhost:5000/text', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        if (!response.ok) {
            console.error(`sendMessageToBackend: API error`, {
                sessionId,
                inputText,
                status: response.status,
                errorMessage: data.error
            });
            throw new Error(data.error || 'Failed to get AI response');
        }
        return data;
    } catch (error) {
        console.error('sendMessageToBackend: Failed to send message', {
            sessionId,
            inputText,
            error
        });
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
        console.error('generateTTS: Invalid user object:', user);
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        let headers = { 'Content-Type': 'application/json' };
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const payload = { text };

        const response = await fetch('http://localhost:5000/tts', {
            method: 'POST',
            headers,
            body: JSON.stringify(payload)
        });

        const data = await response.json();
        if (!response.ok) {
            console.error('generateTTS: Backend error during TTS', {
                text,
                status: response.status,
                errorMessage: data.error
            });
            throw new Error(data.error || 'Failed to generate audio');
        }
        return data;
    } catch (error) {
        console.error('generateTTS: TTS generation failed', { text, error });
        throw error;
    }
}

/**
 * Sends a voice message to the backend for tone analysis
 * @param {object} user - The user object
 * @param {string} sessionId - The current session ID
 * @param {Blob} audioBlob - The recorded audio blob
 * @returns {Promise<Object>} The AI response
 */
export async function sendVoiceMessageToBackend(user, sessionId, audioBlob) {
    if (!user || !user.uid) {
        console.error('sendVoiceMessageToBackend: Invalid user object:', user);
        throw new Error("Authentication error: User object is invalid.");
    }

    try {
        const formData = new FormData();
        formData.append('session_id', sessionId);
        formData.append('audio', audioBlob, 'recording.wav');

        let headers = {};
        if (user.isManualUser) {
            headers['X-User-ID'] = user.uid;
        } else {
            const token = await auth.currentUser.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:5000/voice', {
            method: 'POST',
            headers,
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('sendVoiceMessageToBackend: Voice upload failed', {
                sessionId,
                userId: user.uid,
                status: response.status,
                message: errorData.error
            });
            throw new Error(errorData.error || 'Voice upload failed');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('sendVoiceMessageToBackend: Voice processing failed', {
            sessionId,
            userId: user.uid,
            error
        });
        throw error;
    }
}
