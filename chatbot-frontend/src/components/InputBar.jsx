import React, { 
  useState, 
  useRef, 
  useEffect, 
  memo, 
  useCallback 
} from 'react';
import { HiPaperAirplane, HiMicrophone, HiOutlineEmojiHappy } from 'react-icons/hi';
import Button from "../ui/button";
import EmojiPicker from 'emoji-picker-react';
import { FaMagic } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io'; // For tooltip close button

const InputBar = memo(({
  onSendMessage,
  disabled,
  placeholder = "Type your message...",
  autoSendOnVoice = true
}) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeechSupported, setIsSpeechSupported] = useState(true);
  const [permissionError, setPermissionError] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isToneAnalysisEnabled, setIsToneAnalysisEnabled] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [showToneTooltip, setShowToneTooltip] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const messageRef = useRef('');
  const tooltipShownRef = useRef(false); // Track tooltip display status

  // Update ref on message change
  useEffect(() => {
    messageRef.current = message;
  }, [message]);

  // Check if tone tooltip should be shown
  useEffect(() => {
    const shown = sessionStorage.getItem('toneTooltipShown');
    if (shown) {
      tooltipShownRef.current = true;
    }
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      if (isAudioRecording) {
        stopAudioRecording();
      } else {
        onSendMessage({ text: message.trim() });
        setMessage('');
        setShowEmojiPicker(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      }
    }
  }, [message, disabled, onSendMessage, isAudioRecording]);

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
        const form = textareaRef.current.closest('form');
        if (form) {
          form.requestSubmit();
        }
      }
    };

    const stopRecording = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsRecording(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
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
  }, [autoSendOnVoice, handleSubmit]);

  // Cleanup media recorder
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && isAudioRecording) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isAudioRecording]);

  const startAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        onSendMessage({
          text: messageRef.current.trim(),
          audioBlob: isToneAnalysisEnabled ? audioBlob : null
        });
        setMessage('');
        setShowEmojiPicker(false);
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
        
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setIsAudioRecording(true);
    } catch (err) {
      console.error('Error starting audio recording:', err);
      setPermissionError(true);
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isAudioRecording) {
      mediaRecorderRef.current.stop();
      setIsAudioRecording(false);
    }
  };

  const startRecording = () => {
    if (!isSpeechSupported) return;
    
    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setPermissionError(false);
      
      if (isToneAnalysisEnabled) {
        startAudioRecording();
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      setPermissionError(true);
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    if (isAudioRecording) {
      stopAudioRecording();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
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
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  // Modified emoji handler - doesn't close picker
  const onEmojiClick = (emojiObject) => {
    setMessage(prevMessage => prevMessage + emojiObject.emoji);
    textareaRef.current.focus();
  };

  // Tone analysis toggle with tooltip logic
  const handleToneToggle = () => {
    setIsToneAnalysisEnabled(prev => !prev);
    
    // Show tooltip only once per session
    if (!tooltipShownRef.current) {
      setShowToneTooltip(true);
      tooltipShownRef.current = true;
      sessionStorage.setItem('toneTooltipShown', 'true');
      
      // Auto-dismiss after 4 seconds
      setTimeout(() => setShowToneTooltip(false), 4000);
    }
  };

  return (
    <div className="w-full relative">
      {showEmojiPicker && (
        <div className="absolute bottom-full mb-2 right-0 z-10">
          <EmojiPicker
            onEmojiClick={onEmojiClick}
            previewConfig={{ showPreview: false }}
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
            className="w-full px-4 py-3 pr-40 border border-gray-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-transparent resize-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors scrollbar-soft"
            style={{
              minHeight: '48px',
              maxHeight: '120px',
              overflowY: 'auto'
            }}
          />
        
          <div className="absolute right-3 bottom-3 flex space-x-1">
            <Button
                type="button"
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                disabled={disabled}
                variant="ghost"
                className={`p-2.5 rounded-full ${
                  showEmojiPicker 
                    ? 'text-indigo-600 bg-indigo-50' 
                    : 'text-gray-500 hover:text-indigo-600'
                }`}
                aria-label="Add emoji"
                title="Add emoji"
            >
                <HiOutlineEmojiHappy className="h-5 w-5" />
            </Button>

            {/* Tone Analysis Toggle with Tooltip */}
            <div className="relative flex items-center">
              <input
                id="tone-analysis-toggle"
                type="checkbox"
                className="hidden"
                checked={isToneAnalysisEnabled}
                onChange={handleToneToggle}
              />
              <label
                htmlFor="tone-analysis-toggle"
                onMouseEnter={() => {
                  if (!tooltipShownRef.current) {
                    setShowToneTooltip(true);
                    setTimeout(() => setShowToneTooltip(false), 4000);
                  }
                }}
                className={`relative flex items-center cursor-pointer rounded-full p-1.5 transition-all ${
                  isToneAnalysisEnabled
                    ? 'text-indigo-600 bg-indigo-100'
                    : 'text-gray-400 hover:bg-gray-100'
                }`}
                title={isToneAnalysisEnabled ? "Tone analysis enabled" : "Enable tone analysis"}
              >
                <FaMagic className="h-4 w-4" />
              </label>

              {/* Tone Analysis Tooltip */}
              {showToneTooltip && (
                <div className="absolute -top-14 right-0 z-20 w-56 p-2 bg-white border border-gray-200 shadow-xl rounded-xl text-sm text-gray-800 animate-fadeIn">
                  <div className="flex justify-between items-start">
                    <span>🎙️ Analyze voice tone to enhance responses</span>
                    <button 
                      onClick={() => setShowToneTooltip(false)}
                      className="text-gray-400 hover:text-gray-700 transition-colors"
                    >
                      <IoMdClose className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 right-3 w-4 h-4 bg-white transform rotate-45 translate-y-1/2 border-r border-b border-gray-200"></div>
                </div>
              )}
            </div>

            {isSpeechSupported && (
              <Button
                type="button"
                onClick={toggleRecording}
                disabled={disabled}
                variant="ghost"
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  isRecording
                    ? 'animate-gentlePulse bg-red-50 text-red-500 hover:bg-red-100'
                    : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-50'
                }`}
                aria-label={isRecording ? "Stop recording" : "Start voice input"}
                title={isRecording ? "Stop recording" : "Speak"}
              >
                <HiMicrophone className={`h-5 w-5 ${isRecording ? 'scale-110' : ''}`} />
              </Button>
            )}
            
            <Button
              type="submit"
              disabled={(!message.trim() && !isAudioRecording) || disabled}
              variant="primary"
              className="p-2.5 rounded-full"
              aria-label="Send message"
              title="Send"
            >
              <HiPaperAirplane className="h-5 w-5 transform -rotate-45" />
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
            <span className="text-red-500 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full"></span>
              Microphone access denied
            </span>
          )}
          {!isSpeechSupported && (
            <span className="text-yellow-600 flex items-center gap-1">
              <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
              Voice input not supported
            </span>
          )}
          {isSpeechSupported && !permissionError && (
            <span className="flex items-center gap-2">
              {isToneAnalysisEnabled && (
                <span className="text-indigo-600 flex items-center gap-1">
                  <FaMagic className="h-3 w-3" />
                  Tone analysis
                </span>
              )}
              <span className="text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Voice input ready
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

InputBar.displayName = 'InputBar';

export default InputBar;