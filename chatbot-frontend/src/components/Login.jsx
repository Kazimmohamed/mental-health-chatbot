import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from '../lib/firebase';
import { FcGoogle } from "react-icons/fc";
import { HiOutlineSparkles, HiX } from "react-icons/hi";
import Button from '../ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/input';

const provider = new GoogleAuthProvider();

// ✅ NEW FEATURE: Modal component for Terms and Privacy
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100">
          <HiX className="h-5 w-5 text-gray-600" />
        </button>
      </div>
      <div className="p-6 overflow-y-auto scrollbar-soft">
        {children}
      </div>
    </div>
  </div>
);

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState(null);
  const [manualId, setManualId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // ✅ NEW FEATURE: State to manage the modal content
  const [modalContent, setModalContent] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      await signInWithPopup(auth, provider);
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
          // ✅ FIX: Use the full user ID for the displayName
          displayName: `User ${data.user_id}`,
          isAnonymous: false,
          isManualUser: true
        };
        
        window.dispatchEvent(new CustomEvent('manualUserLogin', { detail: manualUser }));
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
    <div className="w-full h-full flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-white animate-gradient-xy">
      <style>{`
        @keyframes gradient-xy {
            0%, 100% { background-size: 400% 400%; background-position: 15% 0%; }
            50% { background-size: 400% 400%; background-position: 85% 100%; }
        }
        .animate-gradient-xy { animation: gradient-xy 15s ease infinite; }
      `}</style>
      
      {/* ✅ NEW FEATURE: Render the modal when content is set */}
      {modalContent && (
        <Modal title={modalContent === 'terms' ? 'Terms of Service' : 'Privacy Policy'} onClose={() => setModalContent(null)}>
          {modalContent === 'terms' ? (
            <div className="prose prose-sm">
              <p>Welcome to MindMate. By using our app, you agree to these terms.</p>
              <p><strong>1. Service Description:</strong> MindMate is an AI-powered chatbot designed for supportive conversations. It is not a medical device and does not provide medical advice, diagnosis, or treatment.</p>
              <p><strong>2. Not a Replacement for Professional Help:</strong> This service is not a substitute for professional mental health care. If you are in crisis, please contact a local emergency service or mental health professional immediately.</p>
              <p><strong>3. User Conduct:</strong> You agree not to use the service for any unlawful purpose. All conversations are confidential but may be reviewed anonymously to improve our service.</p>
            </div>
          ) : (
            <div className="prose prose-sm">
              <p>Your privacy is important to us. This policy explains how we handle your data.</p>
              <p><strong>1. Data Collection:</strong> We collect your conversation history to provide a continuous experience. For Google users, we store your name and email as provided by Google for authentication purposes.</p>
              <p><strong>2. Data Usage:</strong> Your conversation data is used solely to power the chatbot's memory and to improve our AI models. All data used for training is anonymized.</p>
              <p><strong>3. Data Storage:</strong> Your data is securely stored using Firebase's Firestore database. We do not share your personal conversation data with third parties.</p>
            </div>
          )}
        </Modal>
      )}

      <Card className="w-full max-w-md border border-gray-200 shadow-2xl rounded-2xl overflow-hidden bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center py-6">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="text-white text-3xl font-bold">M</div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 flex items-center justify-center">
            Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 ml-2">MindMate</span>
            <HiOutlineSparkles className="w-6 h-6 text-purple-500 ml-1" />
          </CardTitle>
          <CardDescription className="text-sm text-gray-500 mt-2">
            Your personal AI mental health companion
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4 px-6 pb-6">
          {!step && (
            <div className="space-y-3">
              <Button variant="primary" onClick={() => setStep("new")} className="w-full py-3 rounded-xl">
                I'm a New User
              </Button>
              <Button variant="secondary" onClick={() => setStep("old")} className="w-full py-3 rounded-xl">
                I'm an Existing User
              </Button>
            </div>
          )}

          {step === "old" && (
            <div className="space-y-4">
              <Input value={manualId} onChange={(e) => setManualId(e.target.value)} placeholder="Enter your User ID" className="py-3 rounded-xl" />
              <Button variant="primary" onClick={handleManualLogin} disabled={isLoading} className="w-full py-3 rounded-xl">
                {isLoading ? 'Loading...' : 'Continue'}
              </Button>
              <Button variant="ghost" onClick={() => setStep(null)} className="w-full py-2">
                ← Back
              </Button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {step === "new" && (
            <div className="space-y-4">
              <Button variant="primary" onClick={handleManualLogin} disabled={isLoading} className="w-full py-3 rounded-xl">
                {isLoading ? 'Creating...' : 'Create and Continue'}
              </Button>
              <Button variant="ghost" onClick={() => setStep(null)} className="w-full py-2">
                ← Back
              </Button>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <Button variant="ghost" onClick={handleGoogleLogin} disabled={isLoading} className="w-full border border-gray-300 py-3 rounded-xl flex items-center justify-center">
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
            {/* ✅ NEW FEATURE: Added onClick handlers to open the modal */}
            <span onClick={() => setModalContent('terms')} className="underline cursor-pointer hover:text-indigo-600 transition-colors">Terms</span> and{" "}
            <span onClick={() => setModalContent('privacy')} className="underline cursor-pointer hover:text-indigo-600 transition-colors">Privacy Policy</span>.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
