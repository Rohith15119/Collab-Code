import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import SessionCard from "../components/SessionCard";

/* ─────────────────────────────────────────────
   Injected global styles (fonts + keyframes)
───────────────────────────────────────────── */
const GlobalStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');

    *, *::before, *::after { box-sizing: border-box; }

    :root {
      --bg:        #080b0f;
      --surface:   #0d1117;
      --elevated:  #131920;
      --border:    rgba(255,255,255,0.07);
      --border-hi: rgba(74,222,128,0.35);
      --text:      #e8edf2;
      --muted:     #4a5568;
      --accent:    #4ade80;
      --accent-dim:#1a3d28;
      --danger:    #f87171;
      --glow:      rgba(74,222,128,0.18);
    }

    body { background: var(--bg); color: var(--text); margin: 0; overflow-x: hidden; }

    .dash-root {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      font-family: 'Syne', sans-serif;
      background:
        radial-gradient(ellipse 80% 40% at 50% -10%, rgba(74,222,128,0.08) 0%, transparent 70%),
        var(--bg);
      overflow-x: hidden;
    }

    /* ── Main content ── */
    .dash-main {
      flex: 1;
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: clamp(1.5rem, 5vw, 3rem) clamp(1rem, 4vw, 2rem);
    }

    /* ── Header row ── */
    .dash-header {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: clamp(1.5rem, 4vw, 2.5rem);
      animation: fadeSlideDown 0.55s cubic-bezier(.22,1,.36,1) both;
    }

    .dash-title {
      font-size: clamp(1.4rem, 4vw, 2rem);
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text);
      margin: 0;
      line-height: 1.15;
    }

    .dash-subtitle {
      font-family: 'DM Mono', monospace;
      font-size: 0.72rem;
      letter-spacing: 0.04em;
      color: var(--muted);
      margin-top: 0.35rem;
    }

    .dash-count { color: var(--accent); }

    /* ── New session button ── */
    .btn-new {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--accent);
      color: #050c08;
      font-family: 'Syne', sans-serif;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      border: none;
      border-radius: 10px;
      padding: 0.7rem 1.3rem;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
      transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
      box-shadow: 0 0 0 0 var(--glow);
    }
    .btn-new:hover:not(:disabled) {
      transform: translateY(-2px) scale(1.03);
      box-shadow: 0 0 28px 4px var(--glow), 0 4px 16px rgba(0,0,0,0.4);
    }
    .btn-new:active:not(:disabled) { transform: scale(0.97); }
    .btn-new:disabled { opacity: 0.55; cursor: not-allowed; }

    .btn-spin {
      width: 14px; height: 14px;
      border: 2px solid #050c08;
      border-top-color: transparent;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
    }

    /* ── Controls row ── */
    .dash-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 0.75rem;
      margin-bottom: clamp(1.25rem, 3vw, 2rem);
      animation: fadeSlideDown 0.55s 0.08s cubic-bezier(.22,1,.36,1) both;
    }

    .search-wrap {
      position: relative;
      flex: 1 1 200px;
      min-width: 0;
    }

    .search-icon {
      position: absolute;
      left: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--muted);
      font-size: 0.85rem;
      pointer-events: none;
      line-height: 1;
    }

    .search-input {
      width: 100%;
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      letter-spacing: 0.02em;
      padding: 0.7rem 2.4rem 0.7rem 2.4rem;
      border-radius: 10px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
    }
    .search-input::placeholder { color: var(--muted); }
    .search-input:focus {
      border-color: var(--border-hi);
      box-shadow: 0 0 0 3px rgba(74,222,128,0.08);
    }

    .search-clear {
      position: absolute;
      right: 0.9rem;
      top: 50%;
      transform: translateY(-50%);
      background: none;
      border: none;
      color: var(--muted);
      cursor: pointer;
      font-size: 0.7rem;
      padding: 0.2rem;
      line-height: 1;
      transition: color 0.15s;
    }
    .search-clear:hover { color: var(--text); }

    .sort-select {
      background: var(--surface);
      border: 1px solid var(--border);
      color: var(--text);
      font-family: 'DM Mono', monospace;
      font-size: 0.78rem;
      letter-spacing: 0.02em;
      padding: 0.7rem 1rem;
      border-radius: 10px;
      outline: none;
      cursor: pointer;
      flex-shrink: 0;
      transition: border-color 0.2s;
      max-width: 100%;
    }
    .sort-select:focus {
      border-color: var(--border-hi);
      box-shadow: 0 0 0 3px rgba(74,222,128,0.08);
    }

    /* ── Grid ── */
    .sessions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
      gap: clamp(0.75rem, 2vw, 1.25rem);
    }

    .card-wrapper {
      animation: fadeSlideUp 0.45s cubic-bezier(.22,1,.36,1) both;
    }

    /* ── Skeleton ── */
    .skeleton-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 1.25rem;
      animation: pulse 1.6s ease-in-out infinite;
    }
    .skel-line {
      background: var(--elevated);
      border-radius: 6px;
    }

    /* ── Empty State ── */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: clamp(3rem, 12vw, 7rem) 1rem;
      text-align: center;
      animation: fadeSlideDown 0.5s cubic-bezier(.22,1,.36,1) both;
    }

    .empty-icon {
      font-size: clamp(2.5rem, 8vw, 4rem);
      margin-bottom: 1.25rem;
      opacity: 0.25;
    }

    .empty-title {
      font-size: clamp(1rem, 3vw, 1.2rem);
      font-weight: 700;
      color: var(--text);
      margin: 0 0 0.5rem;
    }

    .empty-sub {
      font-family: 'DM Mono', monospace;
      font-size: 0.75rem;
      color: var(--muted);
      margin: 0 0 1.5rem;
      max-width: 28ch;
    }

    .btn-empty {
      font-family: 'Syne', sans-serif;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--accent);
      border: 1px solid var(--border-hi);
      background: rgba(74,222,128,0.04);
      padding: 0.6rem 1.2rem;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.18s, box-shadow 0.18s, transform 0.15s;
    }
    .btn-empty:hover {
      background: rgba(74,222,128,0.1);
      box-shadow: 0 0 20px rgba(74,222,128,0.12);
      transform: translateY(-1px);
    }

    /* ── Keyframes ── */
    @keyframes fadeSlideDown {
      from { opacity: 0; transform: translateY(-14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(18px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.45; }
    }

    /* ── Responsive tweaks ── */
    @media (max-width: 480px) {
      .dash-header { flex-direction: column; align-items: stretch; }
      .btn-new { justify-content: center; width: 100%; }
      .dash-controls { flex-direction: column; }
      .sort-select { width: 100%; }
    }
  `}</style>
);

/* ─────────────────────────────────────────────
   Main Dashboard
───────────────────────────────────────────── */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const { data } = await api.get("/session/my");
        if (!isMounted) return;
        setSessions(data.sessions ?? []);
      } catch {
        if (isMounted) setSessions([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const createSession = async () => {
    setCreating(true);
    try {
      const { data } = await api.post("/session/create-session", {
        title: "Untitled Session",
        language: "javascript",
      });
      navigate(`/editor/${data.session.roomId}`);
    } catch {
      toast.error("Failed to create session");
    } finally {
      setCreating(false);
    }
  };

  const deleteSession = async (roomId) => {
    try {
      await api.delete(`/session/${roomId}`);
      setSessions((prev) => prev.filter((s) => s.roomId !== roomId));
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const filtered = useMemo(() => {
    return sessions
      .filter((s) => s.title.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => new Date(b[sortBy] || 0) - new Date(a[sortBy] || 0));
  }, [sessions, search, sortBy]);

  return (
    <>
      <GlobalStyles />
      <div className="dash-root">
        <Navbar user={user} onSignOut={logout} />

        <main className="dash-main">
          {/* Header */}
          <div className="dash-header">
            <div>
              <h2 className="dash-title">My Sessions</h2>
              <p className="dash-subtitle">
                {loading ? (
                  "Loading…"
                ) : (
                  <>
                    <span className="dash-count">{filtered.length}</span>{" "}
                    session{filtered.length !== 1 ? "s" : ""}
                  </>
                )}
              </p>
            </div>

            <button
              onClick={createSession}
              disabled={creating}
              className="btn-new"
            >
              {creating ? (
                <span className="btn-spin" />
              ) : (
                <span style={{ fontSize: "1.1rem", lineHeight: 1 }}>+</span>
              )}
              New Session
            </button>
          </div>

          {/* Controls */}
          <div className="dash-controls">
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder="Search sessions…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button className="search-clear" onClick={() => setSearch("")}>
                  ✕
                </button>
              )}
            </div>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="updatedAt">Last Updated</option>
              <option value="createdAt">Date Created</option>
            </select>
          </div>

          {/* Content */}
          {loading ? (
            <LoadingSkeleton />
          ) : filtered.length === 0 ? (
            <EmptyState hasSearch={!!search} onCreate={createSession} />
          ) : (
            <div className="sessions-grid">
              {filtered.map((session, i) => (
                <div
                  key={session._id}
                  className="card-wrapper"
                  style={{ animationDelay: `${i * 55}ms` }}
                >
                  <SessionCard
                    id={session.roomId}
                    title={session.title}
                    language={session.language}
                    updatedAt={new Date(session.updatedAt).toLocaleDateString(
                      "en-IN",
                    )}
                    onClick={() => navigate(`/editor/${session.roomId}`)}
                    onDelete={deleteSession}
                  />
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

/* ── Sub-components ── */

function LoadingSkeleton() {
  return (
    <div className="sessions-grid">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-card"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div
            className="skel-line"
            style={{ height: 10, width: "40%", marginBottom: 16 }}
          />
          <div
            className="skel-line"
            style={{ height: 14, width: "75%", marginBottom: 10 }}
          />
          <div className="skel-line" style={{ height: 10, width: "55%" }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onCreate }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{hasSearch ? "🔍" : "⚡"}</div>
      <p className="empty-title">
        {hasSearch ? "No sessions match your search" : "No sessions yet"}
      </p>
      <p className="empty-sub">
        {hasSearch
          ? "Try a different keyword"
          : "Create your first session to get started"}
      </p>
      {!hasSearch && (
        <button className="btn-empty" onClick={onCreate}>
          + New Session
        </button>
      )}
    </div>
  );
}
