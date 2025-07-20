// src/components/ChatPage.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { HiOutlineSparkles, HiMenu } from "react-icons/hi";

export default function ChatPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 to-purple-50 overflow-hidden">
      {/* Sidebar - conditionally rendered */}
      {isSidebarOpen && (
        <div className="hidden md:block">
          <Sidebar />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Mobile Header */}
        <div className="md:hidden bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <HiOutlineSparkles className="text-white" />
            </div>
            <h1 className="font-bold text-xl">MindMate</h1>
          </div>
          <button 
            onClick={toggleSidebar}
            className="p-2 rounded-full hover:bg-white/10 transition"
          >
            <HiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Desktop Toggle Button */}
        <div className="hidden md:block absolute top-4 left-4 z-10">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-full bg-white text-indigo-600 shadow-md hover:bg-indigo-50 transition"
          >
            <HiMenu className="h-6 w-6" />
          </button>
        </div>

        {/* Chat Content */}
        <div className="flex-1 flex items-center justify-center p-4">
          <div className={`w-full max-w-4xl h-full flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${
            isSidebarOpen ? 'md:ml-0' : 'md:ml-0'
          }`}>
            <ChatWindow />
          </div>
        </div>
      </div>
    </div>
  );
}