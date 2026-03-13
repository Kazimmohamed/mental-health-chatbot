// chatbot-frontend/src/components/PortfolioPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Share2, 
  Cpu, 
  Code, 
  Zap, 
  Heart, 
  Mic, 
  Volume2, 
  ChevronLeft, 
  ChevronRight,
  MessageSquare,
  Atom,           // For React
  FileCode,       // For Python
  Search,         // For Google
  Bot,            // For Robot/AI
  Database,       // For Firebase
  Wind,           // For Tailwind
  Brain,          // For OpenAI
  FlaskConical    // For Flask
} from 'lucide-react';

// --- UI Components ---

// 1. Chip Component: Displays tech stack items with icons
const TechChip = ({ icon: Icon, label, colorClass = "bg-indigo-100 text-indigo-700" }) => (
  <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-transform hover:scale-105 cursor-default ${colorClass}`}>
    {Icon && <Icon className="w-4 h-4 mr-2" />}
    {label}
  </div>
);

// 2. Snackbar Component: Notification toast
const Snackbar = ({ message, isOpen, onClose }) => (
  <div 
    className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white px-6 py-3 rounded-lg shadow-2xl flex items-center space-x-3 transition-all duration-300 z-50 ${
      isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'
    }`}
  >
    <Check className="w-5 h-5 text-green-400" />
    <span>{message}</span>
  </div>
);

// 3. Carousel Component: Auto-playing feature slider
const FeatureCarousel = () => {
  const slides = [
    {
      title: "Voice-First Interaction",
      desc: "Speak naturally to MindMate. Our advanced speech-to-text integration captures your nuances perfectly.",
      icon: Mic,
      color: "from-pink-500 to-rose-500"
    },
    {
      title: "Emotional Intelligence",
      desc: "Using HuggingFace transformers, we analyze your tone to provide empathetic and context-aware responses.",
      icon: Heart,
      color: "from-indigo-500 to-purple-600"
    },
    {
      title: "Auditory Support",
      desc: "Sometimes you just need to listen. MindMate speaks back with a calming voice using gTTS technology.",
      icon: Volume2,
      color: "from-cyan-500 to-blue-600"
    }
  ];

  const [current, setCurrent] = useState(0);

  const next = () => setCurrent((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prev = () => setCurrent((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  // Auto-play functionality
  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 h-64 sm:h-80 group">
      {slides.map((slide, index) => (
        <div 
          key={index}
          className={`absolute inset-0 transition-all duration-500 ease-in-out transform flex flex-col items-center justify-center p-8 text-center ${
            index === current ? 'opacity-100 translate-x-0' : index < current ? 'opacity-0 -translate-x-full' : 'opacity-0 translate-x-full'
          }`}
        >
          <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${slide.color} flex items-center justify-center mb-6 shadow-lg`}>
            <slide.icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">{slide.title}</h3>
          <p className="text-gray-600 max-w-md leading-relaxed">{slide.desc}</p>
        </div>
      ))}
      
      {/* Carousel Controls */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-all">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 hover:bg-white shadow-md text-gray-800 opacity-0 group-hover:opacity-100 transition-all">
        <ChevronRight className="w-6 h-6" />
      </button>
      
      {/* Carousel Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
        {slides.map((_, idx) => (
          <button 
            key={idx}
            onClick={() => setCurrent(idx)}
            className={`w-2 h-2 rounded-full transition-all ${idx === current ? 'bg-indigo-600 w-6' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    </div>
  );
};

// 4. Tabs Component: Switches between Tech, Capabilities, and Architecture
const InfoTabs = () => {
  const [activeTab, setActiveTab] = useState('tech');

  const tabs = [
    { id: 'tech', label: 'Tech Stack', icon: Code },
    { id: 'capabilities', label: 'Capabilities', icon: Zap },
    { id: 'architecture', label: 'Architecture', icon: Cpu },
  ];

  const content = {
    tech: (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
        <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
          <h4 className="font-semibold text-indigo-900 mb-4 flex items-center">
            <Atom className="mr-2 w-5 h-5" /> Frontend
          </h4>
          <div className="flex flex-wrap gap-2">
            <TechChip icon={Atom} label="React 19" colorClass="bg-blue-100 text-blue-700" />
            <TechChip icon={Wind} label="Tailwind CSS" colorClass="bg-cyan-100 text-cyan-700" />
            <TechChip icon={Zap} label="Vite" colorClass="bg-purple-100 text-purple-700" />
            <TechChip icon={Code} label="Framer Motion" colorClass="bg-pink-100 text-pink-700" />
          </div>
        </div>
        <div className="bg-orange-50/50 p-6 rounded-xl border border-orange-100">
          <h4 className="font-semibold text-orange-900 mb-4 flex items-center">
             <FileCode className="mr-2 w-5 h-5" /> Backend & AI
          </h4>
          <div className="flex flex-wrap gap-2">
            <TechChip icon={FlaskConical} label="Flask" colorClass="bg-gray-200 text-gray-800" />
            <TechChip icon={Brain} label="GPT-4o-mini" colorClass="bg-green-100 text-green-700" />
            <TechChip icon={Search} label="Gemini 1.5" colorClass="bg-blue-100 text-blue-600" />
            <TechChip icon={Database} label="Firestore" colorClass="bg-yellow-100 text-yellow-700" />
          </div>
        </div>
      </div>
    ),
    capabilities: (
      <div className="space-y-4 animate-fadeIn">
        {[
          "Real-time Voice Processing & Transcription",
          "Sentiment & Tone Analysis (HuggingFace)",
          "Secure Authentication via Google Firebase",
          "Persistent Conversation History",
          "Dynamic Session Title Generation",
          "Responsive Glassmorphism UI"
        ].map((item, i) => (
          <div key={i} className="flex items-start p-3 bg-white border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5 mr-3">
              <Check className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-gray-700">{item}</p>
          </div>
        ))}
      </div>
    ),
    architecture: (
      <div className="bg-gray-900 text-gray-300 p-6 rounded-xl font-mono text-sm overflow-x-auto animate-fadeIn shadow-inner">
        <p className="mb-2"><span className="text-purple-400">User</span> ➜ <span className="text-blue-400">React Frontend</span> (Voice/Text)</p>
        <p className="mb-2 pl-4">⬇ HTTP Request</p>
        <p className="mb-2"><span className="text-yellow-400">Flask Backend</span></p>
        <div className="pl-4 border-l-2 border-gray-700 ml-2 mb-2 space-y-1">
          <p>1. Speech Recognition (Google)</p>
          <p>2. Emotion Classifier (HuggingFace)</p>
          <p>3. LLM Processing (OpenAI/Gemini)</p>
          <p>4. TTS Generation (gTTS)</p>
        </div>
        <p className="mb-2 pl-4">⬇ Store/Fetch</p>
        <p><span className="text-orange-400">Firebase Firestore</span> (User Data & History)</p>
      </div>
    )
  };

  return (
    <div className="w-full">
      <div className="flex space-x-2 mb-6 bg-gray-100/50 p-1.5 rounded-xl w-fit mx-auto sm:mx-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id 
                ? 'bg-white text-indigo-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200/50'
            }`}
          >
            <tab.icon className="w-4 h-4 mr-2" />
            {tab.label}
          </button>
        ))}
      </div>
      <div className="min-h-[200px]">
        {content[activeTab]}
      </div>
    </div>
  );
};

// --- Main Portfolio Page Component ---

export default function PortfolioPage() {
  const [showSnackbar, setShowSnackbar] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowSnackbar(true);
    setTimeout(() => setShowSnackbar(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 font-sans text-gray-800 overflow-x-hidden">
      
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Area */}
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mr-2 shadow-md">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-gray-900">MindMate<span className="text-indigo-600">.ai</span></span>
            </div>

            {/* Nav Links - Bi-directional (Login & Chat) */}
            <div className="flex items-center space-x-4">
              <Link 
                to="/login"
                className="hidden sm:flex items-center text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors px-3 py-2 rounded-md hover:bg-indigo-50"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" />
                Login
              </Link>
              <Link 
                to="/chat"
                className="flex items-center px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>Launch App</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20">
        
        {/* Hero Section */}
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24">
          <div className="space-y-8">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-purple-500 mr-2 animate-pulse"></span>
              Live Demo Available
            </div>
            
            <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Your AI Companion for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                Mental Wellness
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 leading-relaxed max-w-lg">
              Experience a supportive, voice-enabled chatbot that understands not just what you say, but how you feel.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link 
                to="/chat"
                className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-1 transition-all duration-300 flex items-center"
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                Start Chatting
              </Link>
              <button 
                onClick={handleShare}
                className="px-8 py-3.5 rounded-xl bg-white text-gray-700 border border-gray-200 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all duration-300 flex items-center"
              >
                <Share2 className="w-5 h-5 mr-2 text-gray-500" />
                Share Project
              </button>
            </div>

            {/* Visual Stats / Stack Indicators */}
            <div className="pt-4 flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-bold">
                    {['AI','ML','UI'][i-1]}
                  </div>
                ))}
              </div>
              <span>Powered by modern AI stack</span>
            </div>
          </div>

          {/* Right Side: Feature Carousel */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-[2rem] transform rotate-2 opacity-70 blur-lg"></div>
            <FeatureCarousel />
          </div>
        </div>

        {/* Detailed Info Section with Interactive Tabs */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Under the Hood</h2>
            <p className="text-gray-600">Explore the technologies and features that make MindMate intelligent.</p>
          </div>
          
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/50 p-1 sm:p-8">
            <InfoTabs />
          </div>
        </div>

        {/* Footer / CTA */}
        <div className="mt-24 text-center border-t border-gray-200 pt-12">
          <p className="text-gray-600 mb-6">Ready to explore the project?</p>
          <div className="flex justify-center space-x-6">
            <Link to="/login" className="text-indigo-600 font-medium hover:underline hover:text-indigo-800">
              Log In as Admin
            </Link>
            <span className="text-gray-300">|</span>
            <a href="https://github.com/kazimmohamed" target="_blank" rel="noreferrer" className="text-gray-500 font-medium hover:text-black transition-colors">
              View on GitHub
            </a>
          </div>
          <p className="text-gray-400 text-sm mt-8">© 2024 MindMate Project. Built by Kazim Mohamed.</p>
        </div>

      </main>

      {/* Global Snackbar */}
      <Snackbar 
        isOpen={showSnackbar} 
        message="Project link copied to clipboard!" 
        onClose={() => setShowSnackbar(false)} 
      />
    </div>
  );
}