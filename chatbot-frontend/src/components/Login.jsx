import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../lib/firebase'; // ✅ IMPROVEMENT: Import auth instance directly
import { FcGoogle } from "react-icons/fc";
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/input';

const provider = new GoogleAuthProvider();

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(null);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener in App.jsx will handle navigation
    } catch (err) {
      console.error("Google Sign-In Error:", err);
      setError("🚫 Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualLogin = async () => {
    try {
      setIsLoading(true);
      setError("");
      const res = await fetch("http://localhost:5000/user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          step === "new"
            ? { is_new: true }
            : { is_new: false, user_id: manualId }
        ),
      });

      const data = await res.json();

      if (res.ok && data.user_id) {
        localStorage.setItem("customUserID", data.user_id);
        localStorage.setItem("isManualUser", "true");
        
        const manualUser = {
          uid: data.user_id,
          email: null,
          displayName: `User ${data.user_id.substring(0, 8)}...`,
          isAnonymous: false,
          isManualUser: true
        };
        
        window.dispatchEvent(new CustomEvent('manualUserLogin', { detail: manualUser }));
        // The App.jsx listener will handle navigation
      } else {
        throw new Error(data.error || "Invalid user ID or failed to create user.");
      }
    } catch (err) {
      console.error("Manual Login Error:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <Card className="w-full max-w-md border border-gray-200 shadow-2xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center py-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-white text-3xl font-bold">M</div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">MindMate</span> ✨
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-2">
            Your personal AI mental health companion
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          {!step && (
            <div className="space-y-3">
              <Button 
                variant="primary"
                onClick={() => setStep("new")}
                className="w-full py-3 rounded-xl"
              >
                I'm a New User
              </Button>
              <Button 
                variant="secondary"
                onClick={() => setStep("old")}
                className="w-full py-3 rounded-xl"
              >
                I'm an Existing User
              </Button>
            </div>
          )}

          {step === "old" && (
            <div className="space-y-4">
              <Input
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="Enter your User ID"
                className="py-3 rounded-xl"
              />
              <Button
                variant="primary"
                onClick={handleManualLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl"
              >
                {isLoading ? 'Loading...' : 'Continue'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(null)}
                className="w-full py-2"
              >
                ← Back
              </Button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {step === "new" && (
            <div className="space-y-4">
              <Button
                variant="primary"
                onClick={handleManualLogin}
                disabled={isLoading}
                className="w-full py-3 rounded-xl"
              >
                {isLoading ? 'Creating...' : 'Create and Continue'}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setStep(null)}
                className="w-full py-2"
              >
                ← Back
              </Button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <Button
              variant="ghost"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full border border-gray-300 py-3 rounded-xl flex items-center justify-center"
            >
              <div className="flex items-center space-x-2">
                <FcGoogle size={22} />
                <span>{isLoading ? 'Loading...' : 'Continue with Google'}</span>
              </div>
            </Button>
          </div>
        </CardContent>

        <CardFooter className="bg-gray-50 py-4">
          <p className="text-xs text-gray-500 text-center w-full">
            By continuing, you agree to our{" "}
            <span className="underline cursor-pointer hover:text-indigo-600 transition-colors">Terms</span> and{" "}
            <span className="underline cursor-pointer hover:text-indigo-600 transition-colors">Privacy Policy</span>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

