import React from 'react';
import { HiPlus, HiChat, HiSparkles } from 'react-icons/hi';
import Button from "../ui/button";
import SessionTitle from './SessionTitle';

const Sidebar = ({ isOpen, onClose, onNewChat, onSelectChat, sessions }) => {
    // The loading state is now managed by App.jsx, but we can check if sessions is null
    const loading = sessions === null;

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        // The timestamp from Firestore can be a string, so we ensure it's a Date object
        const date = new Date(timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) return 'Today';
        if (diffDays === 2) return 'Yesterday';
        if (diffDays <= 7) return `${diffDays - 1} days ago`;
        return date.toLocaleDateString();
    };

    return (
        <>
            {/* ✅ UI RESTORED: Backdrop for mobile view */}
            <div
                className={`fixed inset-0 bg-black bg-opacity-30 backdrop-blur-sm z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
            />

            {/* ✅ UI RESTORED: Sidebar container with animations */}
            <div className={`fixed inset-y-0 left-0 z-50 w-80 bg-gradient-to-b from-purple-50 to-indigo-50 border-r border-indigo-100 transform transition-transform duration-300 ease-in-out shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full">
                    {/* ✅ UI RESTORED: Header */}
                    <div className="p-6 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center">
                                <HiSparkles className="mr-2 text-yellow-300" />
                                MindMate
                            </h2>
                            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors lg:hidden">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                        <p className="text-indigo-100 text-sm mt-1">Your conversation history</p>
                    </div>

                    {/* ✅ UI RESTORED: New Chat Button */}
                    <div className="p-5 border-b border-indigo-100">
                        <Button onClick={onNewChat} variant="primary" className="w-full flex items-center justify-center space-x-2 rounded-xl py-3 shadow-md hover:shadow-lg transition-shadow">
                            <HiPlus className="h-5 w-5" />
                            <span className="font-medium">New Chat</span>
                        </Button>
                    </div>

                    {/* ✅ UI RESTORED: Chat List with correct data mapping */}
                    <div className="flex-1 overflow-y-auto p-4 scrollbar-soft">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-10">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
                                <p className="text-gray-500 text-sm mt-4">Loading your conversations...</p>
                            </div>
                        ) : sessions.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="bg-gradient-to-r from-indigo-400 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                                    <HiChat className="h-8 w-8 text-white" />
                                </div>
                                <p className="text-gray-700 font-medium">No conversations yet</p>
                                <p className="text-gray-500 text-sm mt-2">Start a new chat to begin your journey</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {sessions.map((session) => (
                                    <button
                                        key={session.session_id}
                                        onClick={() => onSelectChat(session.session_id)}
                                        className="w-full text-left p-4 bg-white rounded-xl hover:shadow-lg transition-all duration-200 border border-indigo-100 group"
                                    >
                                        <div className="flex items-start space-x-3">
                                            <div className="flex-shrink-0 w-3 h-3 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full mt-2"></div>
                                            <div className="flex-1 min-w-0">
                                                <SessionTitle title={session.title} className="text-sm font-medium text-gray-800 group-hover:text-indigo-600 transition-colors truncate" />
                                                <p className="text-xs text-indigo-500 mt-1">
                                                    {formatDate(session.last_updated)}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
