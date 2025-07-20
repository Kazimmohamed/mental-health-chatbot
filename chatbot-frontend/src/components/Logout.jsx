import { getAuth, signOut } from "firebase/auth";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutButton() {
  const navigate = useNavigate();

  useEffect(() => {
    const auth = getAuth();
    signOut(auth)
      .then(() => {
        localStorage.removeItem("user");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Logout failed:", error);
        alert("❌ Logout failed. Try again.");
      });
  }, [navigate]);

  return (
    <div className="h-screen flex items-center justify-center bg-gray-100">
      <p className="text-gray-700 text-lg">Logging you out...</p>
    </div>
  );
}
