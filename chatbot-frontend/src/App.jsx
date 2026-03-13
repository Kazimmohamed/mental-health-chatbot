import React, { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, Link, useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "./lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

import Login from "./components/Login";
import Logout from "./components/Logout";
import ChatWindow from "./components/ChatWindow";
import Sidebar from "./components/Sidebar";
import PortfolioPage from "./components/PortfolioPage";

import { Menu, LogOut, Sparkles } from "lucide-react";
import Button from "./ui/button";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  const unsubscribeRef = useRef(null);
  const navigate = useNavigate();

  // ================= AUTH =================
  useEffect(() => {
    const manualUserId = localStorage.getItem("customUserID");
    const isManualUser = localStorage.getItem("isManualUser") === "true";

    if (manualUserId && isManualUser) {
      setUser({
        uid: manualUserId,
        displayName: `User ${manualUserId}`,
        isManualUser: true,
      });
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  // ================= SESSIONS =================
  useEffect(() => {
    if (!user) {
      setSessions([]);
      return;
    }

    const sessionsQuery = query(
      collection(db, "conversations", user.uid, "sessions"),
      orderBy("last_updated", "desc")
    );

    unsubscribeRef.current = onSnapshot(
      sessionsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          session_id: doc.id,
          ...doc.data(),
          created_at: doc.data().created_at?.toDate?.() || null,
          last_updated: doc.data().last_updated?.toDate?.() || null,
        }));
        setSessions(data);
        setLoading(false);
      },
      () => {
        setSessions([]);
        setLoading(false);
      }
    );

    return () => unsubscribeRef.current?.();
  }, [user]);

  // ================= SIDEBAR =================
  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);
  const startNewChat = () => {
    setCurrentSessionId(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };
  const selectChat = (id) => {
    setCurrentSessionId(id);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  };

  // ================= LOADING =================
  if (loading && !sessions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-indigo-500" />
      </div>
    );
  }

  // ================= ROUTES =================
  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-indigo-50 to-purple-50">
      <Routes>
        <Route path="/" element={<Navigate to={user ? "/chat" : "/login"} />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/chat" />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/portfolio" element={<PortfolioPage />} />

        <Route
          path="/chat"
          element={
            user ? (
              <div className="flex h-full w-full">
                <Sidebar
                  isOpen={sidebarOpen}
                  onClose={() => setSidebarOpen(false)}
                  onNewChat={startNewChat}
                  onSelectChat={selectChat}
                  sessions={sessions}
                  user={user}
                  currentSessionId={currentSessionId}
                />

                <main
                  className={`flex-1 flex flex-col transition-all duration-300 ${
                    sidebarOpen ? "lg:ml-80" : "lg:ml-0"
                  }`}
                >
                  {/* ================= HEADER (RESTORED) ================= */}
                  <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 px-4 sm:px-6 py-4 flex items-center justify-between shadow-sm">
                    {/* LEFT */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={toggleSidebar}
                        className="p-2 rounded-lg hover:bg-indigo-50"
                      >
                        <Menu className="h-6 w-6 text-indigo-600" />
                      </button>
                      <h1 className="text-xl font-bold text-indigo-600">MindMate</h1>
                    </div>

                    {/* RIGHT */}
                    <div className="flex items-center space-x-4">
                      <Link
                        to="/portfolio"
                        target="_blank"
                        className="hidden md:flex items-center text-sm text-gray-600 hover:text-indigo-600"
                      >
                        <Sparkles className="h-4 w-4 mr-1" />
                        About Project
                      </Link>

                      {/* USER PROFILE */}
                      <div className="flex items-center space-x-2">
                        <div className="bg-gradient-to-r from-indigo-400 to-purple-500 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold">
                          {user?.displayName?.charAt(0)?.toUpperCase() || "U"}
                        </div>
                        <div className="hidden md:block">
                          <p className="text-sm font-medium text-gray-700">
                            {user.displayName || `User ${user.uid}`}
                          </p>
                          <p className="text-xs text-gray-500">
                            {user.email || "Manual User"}
                          </p>
                        </div>
                      </div>

                      {/* LOGOUT */}
                      <Button
                        variant="ghost"
                        onClick={() => navigate("/logout")}
                        className="flex items-center text-sm text-gray-600 hover:text-indigo-600"
                      >
                        <LogOut className="h-5 w-5 mr-1" />
                        Logout
                      </Button>
                    </div>
                  </header>

                  {/* ================= CHAT ================= */}
                  <div className="flex-1 overflow-hidden">
                    <ChatWindow
                      user={user}
                      sessionId={currentSessionId}
                      setSessionId={setCurrentSessionId}
                    />
                  </div>
                </main>
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App;
