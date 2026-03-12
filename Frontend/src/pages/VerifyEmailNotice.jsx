import { Link } from "react-router-dom";

export default function VerifyEmailNotice() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700 text-center max-w-md w-full">
        <div className="text-5xl mb-4">📧</div>
        <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
        <p className="text-gray-400 text-sm">
          We sent a verification link to your email. Click it to activate your
          account.
        </p>
        <p className="text-gray-500 text-xs mt-3">
          Didn't get it? Check your spam folder.
        </p>
        <Link
          to="/login"
          className="inline-block mt-6 text-green-400 hover:underline text-sm"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
}
