import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Editor from "./features/Editor";
import Profile from "./pages/Profile";
import SharedView from "./pages/SharedView";
import Settings from "./pages/Settings";
import ForgetPassword from "./pages/Forget_password";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmailNotice from "./pages/VerifyEmailNotice";
import VerifyAccount from "./pages/VerifyAccount";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center relative overflow-hidden">
        {/* background gradient glow */}
        <div className="absolute w-125 h-125 bg-green-500/20 blur-[120px] rounded-full"></div>

        {/* loading card */}
        <div className="relative z-10 bg-gray-900/70 backdrop-blur-xl border border-gray-800 rounded-3xl px-10 py-12 flex flex-col items-center shadow-2xl">
          {/* logo */}
          <h1 className="text-3xl font-bold text-green-400 mb-6 tracking-wide">
            ⚡ CollabCode
          </h1>

          {/* animated loader */}
          <div className="relative w-14 h-14 mb-5">
            <div className="absolute inset-0 rounded-full border-4 border-gray-700"></div>
            <div className="absolute inset-0 rounded-full border-4 border-green-400 border-t-transparent animate-spin"></div>
          </div>

          {/* text */}
          <p className="text-gray-400 text-sm tracking-wide">
            Preparing your workspace...
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/shared/:roomId" element={<SharedView />} />
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/verify-email-notice" element={<VerifyEmailNotice />} />
        <Route path="/verify-account/:token" element={<VerifyAccount />} />
        <Route
          path="/editor/:roomId"
          element={
            <ProtectedRoute>
              <Editor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* Default redirect */}
        <Route
          path="*"
          element={
            user ? <Navigate to="/dashboard" /> : <Navigate to="/login" />
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <Settings />
            </ProtectedRoute>
          }
        />{" "}
        <Route
          path="/sharing"
          element={
            <ProtectedRoute isAuthenticated={!!user}>
              <SharedView />
            </ProtectedRoute>
          }
        />{" "}
        <Route path="/forgot-password" element={<ForgetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
