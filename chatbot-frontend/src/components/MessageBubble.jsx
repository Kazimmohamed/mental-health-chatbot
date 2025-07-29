// chatbot-frontend/src/components/MessageBubble.jsx
import React, { useState, memo } from 'react';
import { HiClipboardCopy, HiCheck, HiHeart, HiVolumeUp } from 'react-icons/hi';

const MessageBubble = memo(({ message, onPlayAudio }) => {
  const [copied, setCopied] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const isUser = message.sender === 'user';

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async () => {
    if (!message.text) return;
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handlePlayAudio = async () => {
    if (onPlayAudio && !isPlaying) {
      setIsPlaying(true);
      try {
        await onPlayAudio();
      } finally {
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className={`flex items-start gap-2 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {/* Bot Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex-shrink-0 flex items-center justify-center text-white font-bold mt-1">
          M
        </div>
      )}

      {/* Message Content and Actions Wrapper */}
      <div className={`flex flex-col max-w-[85%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div 
          className={`
            px-4 py-3 rounded-2xl shadow-sm
            ${isUser 
              ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-br-none' 
              : 'bg-gray-100 text-gray-800 rounded-bl-none'
            }
            ${message.isTyping ? 'animate-pulse' : ''}
            ${message.isError ? 'bg-red-100 border-red-200 text-red-800' : ''}
            transition-all duration-200
          `}
        >
          {message.isTyping ? (
            <div className="flex space-x-1 p-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
            </div>
          ) : (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.text}
            </div>
          )}
        </div>

        {/* Timestamp */}
        {!message.isTyping && (
          <div className={`text-xs mt-1 px-1 ${isUser ? 'text-indigo-400' : 'text-gray-500'}`}>
            {formatTimestamp(message.created_at)}
          </div>
        )}

        {/* ✅ UI CHANGE: Action Buttons moved below the message bubble */}
        {!isUser && !message.isTyping && (
          <div className="flex items-center gap-2 mt-2 pl-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button onClick={copyToClipboard} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200" title="Copy">
              {copied ? <HiCheck className="h-4 w-4 text-green-500" /> : <HiClipboardCopy className="h-4 w-4 text-gray-500" />}
            </button>
            {onPlayAudio && (
              <button onClick={handlePlayAudio} disabled={isPlaying} className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200" title="Play audio">
                <HiVolumeUp className={`h-4 w-4 ${isPlaying ? 'text-indigo-500 animate-pulse' : 'text-gray-500'}`} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export default MessageBubble;
