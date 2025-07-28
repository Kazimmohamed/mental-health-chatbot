import React, { useState, useEffect, useRef } from 'react';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  serverTimestamp,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { HiHeart, HiSparkles } from 'react-icons/hi';
import InputBar from './InputBar';
import { Card, CardContent } from '../ui/Card';
import { sendMessageToBackend } from '../lib/api'; 

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] flex items-end ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex-shrink-0 mr-3 flex items-center justify-center text-white font-bold">
            M
          </div>
        )}

        <div
          className={`
            px-4 py-3 rounded-2xl
            ${isUser 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }
            shadow-sm
          `}
        >
          {message.isTyping ? (
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
          ) : (
            <p className={`whitespace-pre-wrap ${message.isError ? 'text-red-100' : ''}`}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

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

    const q = query(
      collection(db, 'conversations', user.uid, 'sessions', sessionId, 'messages'),
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

  const sendMessage = async (text) => {
    const inputText = text.trim();
    if (!inputText || !user) return;

    setSending(true);

    try {
      let currentSessionId = sessionId;

      if (!currentSessionId) {
        const token = await auth.currentUser.getIdToken();

        const res = await fetch('http://localhost:5000/sessions/new', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({})
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to create session');
        }

        const data = await res.json();
        currentSessionId = data.session_id;
        setSessionId(currentSessionId);
      }

      const userMessage = {
        input_text: inputText,
        gpt_response: '',
        sender: 'user',
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, 'conversations', user.uid, 'sessions', currentSessionId, 'messages'), userMessage);

      const { reply, title } = await sendMessageToBackend(currentSessionId, inputText);

      const botMessage = {
        input_text: '',
        gpt_response: reply,
        sender: 'bot',
        created_at: serverTimestamp()
      };
      await addDoc(collection(db, 'conversations', user.uid, 'sessions', currentSessionId, 'messages'), botMessage);

      if (title) {
        await updateDoc(doc(db, 'conversations', user.uid, 'sessions', currentSessionId), { title });
      }
      await updateDoc(doc(db, 'conversations', user.uid, 'sessions', currentSessionId), { last_updated: serverTimestamp() });

    } catch (err) {
      console.error('Error sending message:', err);
      if (sessionId) {
        await addDoc(collection(db, 'conversations', user.uid, 'sessions', sessionId, 'messages'), {
          input_text: '',
          gpt_response: "Sorry, I'm having trouble responding right now.",
          sender: 'bot',
          created_at: serverTimestamp(),
          isError: true
        });
      }
    } finally {
      setSending(false);
    }
  };

  const Welcome = () => (
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
  );

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="flex space-x-1">
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-3 h-3 bg-indigo-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <Welcome />
        ) : (
          <div className="space-y-1">
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={{
                  text: m.input_text || m.gpt_response,
                  sender: m.sender,
                  isError: m.isError
                }}
              />
            ))}
          </div>
        )}
        {sending && (
          <MessageBubble message={{ text: "", sender: "bot", isTyping: true }} />
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
