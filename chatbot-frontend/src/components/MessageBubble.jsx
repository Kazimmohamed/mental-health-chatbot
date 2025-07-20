// chatbot-frontend/src/components/MessageBubble.jsx
// src/components/MessageBubble.jsx
import React, { useState } from 'react';
import { HiClipboardCopy, HiCheck, HiHeart } from 'react-icons/hi';

const MessageBubble = ({ message }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.sender === 'user';

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <div className={`flex mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] flex ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Message Content */}
        <div className="group relative">
          <div 
            className={`
              px-4 py-3 rounded-2xl shadow-sm
              ${isUser 
                ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-tr-none' 
                : 'bg-indigo-50 text-gray-800 rounded-tl-none border border-indigo-100'
              }
              ${message.isTyping ? 'animate-pulse' : ''}
              ${message.isError ? 'bg-red-100 border-red-200 text-red-800' : ''}
              transition-all duration-200
            `}
          >
            {message.isTyping ? (
              <div className="flex items-center space-x-1 px-3 py-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {message.text}
              </div>
            )}
          </div>

          {/* Timestamp */}
          {!message.isTyping && (
            <div className={`text-xs mt-1 ${isUser ? 'text-indigo-400 text-right' : 'text-gray-500 text-left'}`}>
              {formatTimestamp(message.timestamp)}
            </div>
          )}

          {/* Copy Button - Only for bot messages */}
          {!isUser && !message.isTyping && (
            <button
              onClick={copyToClipboard}
              className={`absolute -top-2 ${
                isUser ? '-left-2' : '-right-2'
              } opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-indigo-50 rounded-full p-1.5 shadow-md border border-indigo-100`}
              title="Copy message"
            >
              {copied ? (
                <HiCheck className="h-3 w-3 text-green-500" />
              ) : (
                <HiClipboardCopy className="h-3 w-3 text-indigo-500" />
              )}
            </button>
          )}

          {/* Heart reaction for user messages */}
          {isUser && !message.isTyping && !message.isError && (
            <button className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white hover:bg-rose-50 rounded-full p-1 shadow-md border border-rose-100">
              <HiHeart className="h-3 w-3 text-rose-400" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;