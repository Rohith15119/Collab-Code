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
      setMenuOpen(false);
      await onSignOut();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800/60 z-20">
      {/* ── Main row ── */}
      <div className="h-14 flex items-center justify-between px-6">
        {/* Brand */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-green-400 font-bold text-lg hover:text-green-300 transition-colors shrink-0"
        >
          <span className="drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]">⚡</span>
          <span className="text-white text-sm font-semibold tracking-tight">
            CodeFlash
          </span>
        </Link>

        {/* Desktop nav links */}
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

        {/* Desktop: user + sign out */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {user && (
            <span className="text-xs text-gray-500 truncate max-w-[160px]">
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

        {/* Mobile: hamburger */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 shrink-0"
          aria-label="Toggle menu"
        >
          <span
            className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-all duration-200 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block w-5 h-0.5 bg-white transition-all duration-200 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
          />
        </button>
      </div>

      {/* ── Mobile dropdown ── */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-800/60 bg-gray-900 px-4 py-3 flex flex-col gap-1">
          {LINKS.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`
                  text-sm px-3 py-2.5 rounded-lg transition-all duration-150
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

          <div className="my-1 border-t border-gray-800/60" />

          {user && (
            <span className="text-xs text-gray-500 px-3 py-1 truncate">
              {user.email}
            </span>
          )}
          <button
            onClick={handleSignout}
            className="text-sm text-gray-500 hover:text-red-400 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all duration-150 text-left"
          >
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
