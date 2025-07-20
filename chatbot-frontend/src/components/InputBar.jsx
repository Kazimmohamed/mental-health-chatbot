import React, { useState, useRef, useEffect } from 'react';
import { HiPaperAirplane, HiMicrophone, HiOutlineEmojiHappy } from 'react-icons/hi'; // Import the emoji icon
import Button from "../ui/button";
import EmojiPicker from 'emoji-picker-react'; // Import the emoji picker

const InputBar = ({ 
  onSendMessage, 
  disabled, 
  placeholder = "Type your message...",
  autoSendOnVoice = true 
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // ✅ State for emoji picker visibility
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  // Check for speech recognition support
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSpeechSupported(false);
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = false;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setMessage(prev => prev + transcript);
      
      if (autoSendOnVoice) {
        setTimeout(() => {
          handleSubmit(new Event('submit'));
        }, 500);
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        setPermissionError(true);
      }
      stopRecording();
    };

    recognitionRef.current.onend = () => {
      stopRecording();
    };

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [autoSendOnVoice]);

  const startRecording = () => {
    if (!isSpeechSupported) return;
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setPermissionError(false);
    } catch (error) {
      console.error('Failed to start recording:', error);
      setPermissionError(true);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage('');
      setShowEmojiPicker(false); // Hide picker on send
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setMessage(e.target.value);
    
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
  };

  // ✅ Function to add emoji to the message
  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    setShowEmojiPicker(false); // Hide picker after selection
    textareaRef.current.focus();
  };

  return (
    <div className="w-full relative"> {/* ✅ Added relative positioning for the picker */}
      
      {/* ✅ Emoji Picker Component */}
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0">
            <EmojiPicker 
                onEmojiClick={onEmojiClick}
                pickerStyle={{ width: '100%', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}
            />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows="1"
            className="w-full px-4 py-3 pr-32 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors scrollbar-soft"
            style={{ 
              minHeight: '48px',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          />
          
          <div className="absolute right-3 bottom-3 flex space-x-1">
             {/* ✅ Emoji Button */}
            <Button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                variant="ghost"
                className="p-2.5 rounded-full text-gray-500 hover:text-indigo-600"
                aria-label="Add emoji"
                title="Add emoji"
            >
                <HiOutlineEmojiHappy className="h-5 w-5" />
            </Button>

            {/* Microphone Button */}
            {isSpeechSupported && (
              <Button
                type="button"
                onClick={toggleRecording}
                disabled={disabled}
                variant="ghost"
                className={`p-2.5 rounded-full ${isRecording ? 'animate-gentlePulse text-red-500' : 'text-gray-500 hover:text-indigo-600'}`}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                title={isRecording ? "Stop recording" : "Speak"}
              >
                <HiMicrophone className="h-5 w-5" />
              </Button>
            )}
            
            {/* Send Button */}
            <Button
              type="submit"
              disabled={!message.trim() || disabled}
              variant="primary"
              className="p-2.5 rounded-full"
              aria-label="Send message"
              title="Send"
            >
              <HiPaperAirplane className="h-5 w-5" />
            </Button>
          </div>
          
          {message.length > 500 && (
            <div className="absolute -bottom-6 right-0 text-xs text-gray-500">
              {message.length}/1000
            </div>
          )}
        </div>
      </form>
      
      <div className="mt-2 flex justify-between items-center">
        <div className="text-xs text-gray-500">
          Press Enter to send • Shift + Enter for new line
        </div>
        
        <div className="text-xs">
          {permissionError && (
            <span className="text-red-500">Microphone access denied</span>
          )}
          {!isSpeechSupported && (
            <span className="text-yellow-600">Voice input not supported</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default InputBar;