import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import { getSessionHistory } from './lib/api'; // Corrected import

import Login from './components/Login';
import Logout from './components/Logout';
import ChatWindow from './components/ChatWindow';
import Sidebar from './components/Sidebar';
import { HiMenu, HiLogout } from 'react-icons/hi';
import Button from './ui/Button';

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState([]); // State for session history
    const [currentSessionId, setCurrentSessionId] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        // This effect handles user authentication state changes
        const unsub = onAuthStateChanged(auth, async (u) => {
            if (u) {
                setUser(u);
                // ✅ FIX: When user logs in, fetch their session history
                try {
                    const userSessions = await getSessionHistory(u.uid);
                    setSessions(userSessions);
                } catch (error) {
                    console.error("Failed to load sessions on auth change:", error);
                    setSessions([]); // Reset on error
                }
            } else {
                setUser(null);
                setSessions([]); // Clear sessions on logout
            }
            setLoading(false);
        });

        // Handle manual user login
        const handleManualLogin = (event) => {
            const manualUser = event.detail;
            setUser(manualUser);
            setLoading(false);
        };

        window.addEventListener('manualUserLogin', handleManualLogin);

        // This effect handles responsive sidebar visibility
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setSidebarOpen(false);
            } else {
                setSidebarOpen(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        return () => {
            unsub();
            window.removeEventListener('manualUserLogin', handleManualLogin);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

    const startNewChat = () => {
        setCurrentSessionId(null);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    const selectChat = (id) => {
        setCurrentSessionId(id);
        if (window.innerWidth < 1024) {
            setSidebarOpen(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-8 w-8 bg-gradient-to-r from-indigo-400 to-purple-500 rounded-full animate-gentlePulse"></div>
                        </div>
                    </div>
                    <p className="text-indigo-600 font-medium text-lg">Preparing your MindMate...</p>
                </div>
            </div>
        );
    }

    return (
        <Router>
            <div className="flex h-screen overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
                <Routes>
                    <Route path="/" element={user ? <Navigate to="/chat" /> : <Navigate to="/login" />} />
                    <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route
                        path="/chat"
                        element={
                            user ? (
                                <div className="flex w-full h-full">
                                    <Sidebar
                                        isOpen={sidebarOpen}
                                        onClose={() => setSidebarOpen(false)}
                                        onNewChat={startNewChat}
                                        onSelectChat={selectChat}
                                        sessions={sessions} // Pass fetched sessions
                                        user={user} // Pass user for display if needed
                                    />
                                    <div className={`flex-1 flex flex-col min-h-0 transition-all duration-300 ease-in-out ${sidebarOpen ? 'lg:ml-80' : 'lg:ml-0'}`}>
                                        {/* ✅ UI RESTORED: Top Navigation Bar */}
                                        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm flex-shrink-0">
                                            <div className="flex items-center space-x-4">
                                                <button onClick={toggleSidebar} className="p-2 rounded-lg hover:bg-indigo-50 transition-colors">
                                                    <HiMenu className="h-6 w-6 text-indigo-600" />
                                                </button>
                                                <h1 className="text-xl font-bold text-indigo-600">MindMate</h1>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <div className="hidden md:block">
                                                    <Button variant="ghost" onClick={() => window.location = '/logout'} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 transition-colors">
                                                        <HiLogout className="h-5 w-5 mr-1" />
                                                        Logout
                                                    </Button>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="bg-gradient-to-r from-indigo-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                                                        {user.displayName ? user.displayName.charAt(0) : 'U'}
                                                    </div>
                                                    <div className="hidden md:block">
                                                        <p className="text-sm font-medium text-gray-700">{user.displayName || 'User'}</p>
                                                        <p className="text-xs text-gray-500 truncate max-w-[120px]">{user.email}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-hidden">
                                            <ChatWindow
                                                user={user}
                                                sessionId={currentSessionId}
                                                setSessionId={setCurrentSessionId}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ) : <Navigate to="/login" />
                        }
                    />
                </Routes>
            </div>
        </Router>
    );
}

export default App;
