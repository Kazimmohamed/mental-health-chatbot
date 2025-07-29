import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot, query, orderBy, doc, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sendMessageToBackend, generateTTS } from '../lib/api';
import MessageBubble from './MessageBubble';
import InputBar from './InputBar';
import { Card, CardContent } from '../ui/card';
import { HiHeart, HiSparkles } from 'react-icons/hi';

async function createNewSession(user) {
    let headers = { 'Content-Type': 'application/json' };
    
    if (user.isManualUser) {
        headers['X-User-ID'] = user.uid;
    } else {
        const token = await user.getIdToken();
        headers['Authorization'] = `Bearer ${token}`;
    }

    const res = await fetch('http://localhost:5000/sessions/new', {
        method: 'POST',
        headers,
        body: JSON.stringify({})
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create session');
    }

    return res.json();
}

const ChatWindow = ({ user, sessionId, setSessionId }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sending]);

  useEffect(() => {
    if (!sessionId || !user) {
      setMessages([]);
      return;
    }
    
    setLoading(true);
    const userId = user.uid;

    const q = query(
      collection(db, 'conversations', userId, 'sessions', sessionId, 'messages'),
      orderBy('created_at', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching messages:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [sessionId, user]);

  const playAudio = useCallback(async (text) => {
    try {
      const { audio_base64 } = await generateTTS(user, text);
      const audio = new Audio("data:audio/mp3;base64," + audio_base64);
      await audio.play();
    } catch (error) {
      console.error('Failed to generate or play audio:', error);
    }
  }, [user]);

  const sendMessage = useCallback(async (text) => {
    const inputText = text.trim();
    if (!inputText || !user) return;

    setSending(true);

    let currentSessionId = sessionId;

    try {
      if (!currentSessionId) {
        const { session_id } = await createNewSession(user);
        currentSessionId = session_id;
        setSessionId(currentSessionId);
      }
      
      const userId = user.uid;
      const messagesCol = collection(db, 'conversations', userId, 'sessions', currentSessionId, 'messages');

      await addDoc(messagesCol, {
        text: inputText,
        sender: 'user',
        created_at: serverTimestamp(),
      });
      
      // ✅ FIX: No longer need to receive 'title' from the backend.
      const { reply } = await sendMessageToBackend(user, currentSessionId, inputText);

      await addDoc(messagesCol, {
        text: reply,
        sender: 'bot',
        created_at: serverTimestamp(),
      });

      // ✅ FIX: Removed the title update logic from the frontend.
      // We still update the timestamp to ensure the session appears at the top of the list.
      const sessionDocRef = doc(db, 'conversations', userId, 'sessions', currentSessionId);
      await updateDoc(sessionDocRef, { last_updated: serverTimestamp() });
      
    } catch (err) {
      console.error('Error sending message:', err);
      if (currentSessionId) {
        const userId = user.uid;
        await addDoc(collection(db, 'conversations', userId, 'sessions', currentSessionId, 'messages'), {
          text: "Sorry, I'm having trouble responding right now.",
          sender: 'bot',
          created_at: serverTimestamp(),
          isError: true
        });
      }
    } finally {
      setSending(false);
    }
  }, [sessionId, user, setSessionId]);
  
  const Welcome = useCallback(() => (
    <div className="flex flex-col items-center justify-center h-full py-10 px-4">
      <div className="max-w-md w-full">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <HiHeart className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">
          Hi! I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">MindMate</span>
        </h2>
        <p className="text-gray-600 text-center mb-8">
          I'm here to listen and support you on your mental wellness journey.
        </p>
        <Card className="border-0 shadow-sm bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-center mb-3">
              <HiSparkles className="h-5 w-5 text-yellow-500 mr-2" />
              <span className="font-medium text-gray-700">Quick prompts to get started</span>
            </div>
            <div className="space-y-3">
              {["I'm feeling anxious about something","I need someone to talk to","I'm having a tough day"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => sendMessage(preset)}
                  className="w-full text-left px-4 py-3 bg-white border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all duration-200"
                >
                  {preset}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  ), [sendMessage]);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading && (
          <div className="flex justify-center py-10">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        {!loading && messages.length === 0 && <Welcome />}
        <div className="space-y-1">
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              onPlayAudio={msg.sender === 'bot' ? () => playAudio(msg.text) : null}
            />
          ))}
        </div>
        {sending && (
          <MessageBubble message={{ sender: "bot", isTyping: true }} />
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-gray-200 bg-white px-4 py-3">
        <div className="max-w-4xl mx-auto">
          <InputBar
            onSendMessage={sendMessage}
            disabled={sending}
            placeholder="Share what's on your mind…"
            autoSendOnVoice={true}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;