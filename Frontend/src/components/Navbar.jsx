import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/settings", label: "Settings" },
  { to: "/sharing", label: "Shared View" },
];

export default function Navbar({ user, onSignOut }) {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSignout = async () => {
    try {
      await onSignOut();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="h-14 bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/60 flex items-center justify-between px-6 z-20">
      {/* Brand */}
      <Link
        to="/dashboard"
        className="flex items-center gap-2 text-green-400 font-bold text-lg hover:text-green-300 transition-colors"
      >
        <span className="drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]">⚡</span>
        <span className="text-white text-sm font-semibold tracking-tight">
          CodeFlash
        </span>
      </Link>

      {/* Links */}
      <div className="hidden md:flex items-center gap-1">
        {LINKS.map((link) => {
          const active = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`
                text-sm px-3 py-1.5 rounded-lg transition-all duration-150
                ${
                  active
                    ? "bg-green-500/10 text-green-400 font-medium"
                    : "text-gray-500 hover:text-white hover:bg-gray-800"
                }
              `}
            >
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* User */}
      <div className="flex items-center gap-3">
        {user && (
          <span className="sm:block text-xs text-gray-500 truncate max-w-35">
            {user.email}
          </span>
        )}
        <button
          onClick={handleSignout}
          className="text-xs text-gray-500 hover:text-red-400 px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition-all duration-150"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}
