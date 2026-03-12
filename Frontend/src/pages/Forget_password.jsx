import { useState } from "react";
import api from "../api/index";
import { useAuth } from "../context/AuthContext";

export default function ForgetPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { forgetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = forgetPassword(email?.trim().toLowerCase());

      setMessage(
        "If an account exists with this email, a reset link has been sent.",
      );
      setEmail("");
    } catch (err) {
      setError(err.response?.data?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="bg-gray-900/60 backdrop-blur-lg p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-800">
        <h2 className="text-3xl font-bold text-white text-center mb-2">
          Forgot Password
        </h2>

        <p className="text-gray-400 text-sm text-center mb-6">
          Enter your registered email to receive a reset link.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-lg bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-700 transition duration-300 text-white font-semibold disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {message && (
          <p className="text-emerald-400 text-sm mt-4 text-center">{message}</p>
        )}

        {error && (
          <p className="text-red-400 text-sm mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
