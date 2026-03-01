import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import SessionCard from "../components/SessionCard";

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

        if (!data.sessions || data.sessions.length === 0) {
          setSessions([]);
          return;
        }

        setSessions(data.sessions);
      } catch (err) {
        if (!isMounted) return;
        setSessions([]);
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
      .sort((a, b) => {
        const dateA = new Date(a[sortBy] || 0);
        const dateB = new Date(b[sortBy] || 0);
        return dateB - dateA;
      });
  }, [sessions, search, sortBy]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      {/* Navbar — uses our Navbar component */}
      <Navbar user={user} onSignOut={logout} />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">
        {/* ── Header ─────────────────────────────────────── */}
        <div className="flex justify-between items-start mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">My Sessions</h2>
            <p className="text-gray-500 text-sm mt-1">
              {loading ? (
                "Loading…"
              ) : (
                <>
                  <span className="text-green-400 font-medium">
                    {filtered.length}
                  </span>{" "}
                  session{filtered.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
          </div>

          <button
            onClick={createSession}
            disabled={creating}
            className="
              flex items-center gap-2 bg-green-500 hover:bg-green-400
              disabled:opacity-60 disabled:cursor-not-allowed
              text-black font-bold text-sm px-5 py-2.5 rounded-xl
              transition-all duration-200
              hover:shadow-[0_0_20px_rgba(74,222,128,0.4)]
              hover:scale-105 active:scale-95
            "
          >
            {creating ? (
              <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <span className="text-base leading-none">+</span>
            )}
            New Session
          </button>
        </div>

        {/* ── Search + Sort ──────────────────────────────── */}
        <div className="flex gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500 delay-100">
          {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search sessions…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full bg-gray-900 border border-gray-800 text-white text-sm
                pl-9 pr-4 py-2.5 rounded-xl outline-none
                focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
                placeholder-gray-600 transition-all duration-200
              "
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white text-xs transition-colors"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="
              bg-gray-900 border border-gray-800 text-gray-300 text-sm
              px-4 py-2.5 rounded-xl outline-none
              focus:ring-2 focus:ring-green-500/50 focus:border-green-500/50
              transition-all duration-200 cursor-pointer
            "
          >
            <option value="updatedAt">Last Updated</option>
            <option value="createdAt">Date Created</option>
          </select>
        </div>

        {/* ── Grid ───────────────────────────────────────── */}
        {loading ? (
          <LoadingSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState hasSearch={!!search} onCreate={createSession} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((session, i) => (
              <div
                key={session._id}
                className="animate-in fade-in slide-in-from-bottom-4 duration-300"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                {/* Uses our SessionCard component */}
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
  );
}

// Sub Components

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <div className="h-3 w-16 bg-gray-800 rounded-full mb-4" />
          <div className="h-4 w-3/4 bg-gray-800 rounded-full mb-2" />
          <div className="h-3 w-1/2 bg-gray-800 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ hasSearch, onCreate }) {
  return (
    <div className="flex flex-col items-center justify-center py-28 animate-in fade-in duration-500">
      <div className="text-5xl mb-4 opacity-30">{hasSearch ? "🔍" : "⚡"}</div>
      <p className="text-gray-500 text-lg font-medium">
        {hasSearch ? "No sessions match your search" : "No sessions yet"}
      </p>
      <p className="text-gray-600 text-sm mt-2 mb-6">
        {hasSearch
          ? "Try a different keyword"
          : "Create your first session to get started"}
      </p>
      {!hasSearch && (
        <button
          onClick={onCreate}
          className="
            text-sm text-green-400 border border-green-500/40 px-4 py-2 rounded-xl
            hover:bg-green-500/10 transition-all duration-200
          "
        >
          + New Session
        </button>
      )}
    </div>
  );
}
