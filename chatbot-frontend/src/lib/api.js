import { auth } from './firebase';

/**
 * Fetches the session history for the currently logged-in user from the backend.
 * @param {string} userId - The UID of the user.
 * @returns {Promise<Array>} A promise that resolves to an array of session objects.
 */
export async function getSessionHistory(userId) {
    const user = auth.currentUser;
    const isManualUser = localStorage.getItem("isManualUser") === "true";
    
    if (!user && !isManualUser) {
        throw new Error("Authentication error: No user is signed in.");
    }

    try {
        let headers = {};
        
        if (isManualUser) {
            // For manual users, use custom header
            const manualUserId = localStorage.getItem("customUserID");
            headers['X-User-ID'] = manualUserId;
        } else {
            // For Firebase users, use token
            const token = await user.getIdToken();
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:5000/history/${userId}`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch session history');
        }

        const data = await response.json();
        return data.sessions || []; // Ensure it returns an array
    } catch (error) {
        console.error('Error fetching session history:', error);
        throw error;
    }
}

/**
 * Sends a user's message to the backend for processing.
 * @param {string} sessionId - The ID of the current session.
 * @param {string} inputText - The message from the user.
 * @returns {Promise<Object>} A promise that resolves to the AI's response.
 */
export async function sendMessageToBackend(sessionId, inputText) {
    const user = auth.currentUser;
    const isManualUser = localStorage.getItem("isManualUser") === "true";
    
    if (!user && !isManualUser) {
        throw new Error("Authentication error: No user is signed in.");
    }

    try {
        let headers = {
            'Content-Type': 'application/json'
        };
        
        if (isManualUser) {
            // For manual users, use custom header
            const manualUserId = localStorage.getItem("customUserID");
            headers['X-User-ID'] = manualUserId;
        } else {
            // For Firebase users, use token
            const token = await user.getIdToken();
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
 * @param {string} text - The text to convert to speech.
 * @returns {Promise<Object>} A promise that resolves to the audio data.
 */
export async function generateTTS(text) {
    const user = auth.currentUser;
    const isManualUser = localStorage.getItem("isManualUser") === "true";
    
    if (!user && !isManualUser) {
        throw new Error("Authentication error: No user is signed in.");
    }

    try {
        let headers = {
            'Content-Type': 'application/json'
        };
        
        if (isManualUser) {
            // For manual users, use custom header
            const manualUserId = localStorage.getItem("customUserID");
            headers['X-User-ID'] = manualUserId;
        } else {
            // For Firebase users, use token
            const token = await user.getIdToken();
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

