import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/index";

export default function VerifyAccount() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verify = async () => {
      try {
        await api.post(`/auth/verify-account/${token}`);
        navigate("/login?verified=true");
      } catch (err) {
        navigate("/login?error=invalid_token");
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center">
        <div className="text-5xl mb-4">⏳</div>
        <p className="text-white text-lg">Verifying your account...</p>
      </div>
    </div>
  );
}
