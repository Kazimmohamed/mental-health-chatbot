import { getAuth, signOut } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Logout() {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();

    const performLogout = async () => {
      try {
        // This will sign out Google users. It does nothing for manual users, which is fine.
        await signOut(auth);
      } catch (error) {
        console.error("Firebase sign-out failed:", error);
      } finally {
        // ✅ CRITICAL FIX: Clear all possible session-related local storage items.
        // This ensures that both Google users and manual users are fully logged out.
        localStorage.removeItem("user");
        localStorage.removeItem("customUserID");
        localStorage.removeItem("isManualUser");
        
        // Navigate to the login page immediately after cleanup.
        navigate("/login");
      }
    };

    performLogout();
  }, [navigate]);

  // Display a clean loading state while the logout process completes.
  return (
    <div className="h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
        <p className="text-indigo-600 font-medium">Logging you out...</p>
      </div>
    </div>
  );
}
