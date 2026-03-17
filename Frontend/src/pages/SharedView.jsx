import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/index";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import { useSocket } from "../socket/useSocket";
import { LANG_COLORS } from "../components/SessionCard";

const langColor = (lang) =>
  LANG_COLORS[lang?.toLowerCase()] ?? LANG_COLORS.default;

export default function SharedView() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [tab, setTab] = useState("received"); // "received" | "sent"
  const [received, setReceived] = useState([]);
  const [sent, setSent] = useState([]);
  const [loading, setLoading] = useState(true);
  // Share modal state
  const [shareModal, setShareModal] = useState(null); // session object | null

  // Someone shared a session WITH the current user
  const onShareReceived = useCallback(({ roomId, ownerEmail, sessionName }) => {
    toast.success(`${ownerEmail} shared "${sessionName}" with you`);
    // Re-fetch received list to get the full session object
    api.get("/sharing/shared/received").then((res) => {
      setReceived(res.data.sessions ?? []);
    });
  }, []);

  // Owner revoked current user's access
  const onShareRevoked = useCallback(({ roomId, ownerEmail, sessionName }) => {
    toast.error(`Your access to "${sessionName}" was revoked`);
    setReceived((prev) => prev.filter((s) => s.roomId !== roomId));
  }, []);

  const onCollaboratorAdded = useCallback(({ id, email, name }) => {}, []);

  const onCollaboratorRemoved = useCallback(({ userId, email }) => {
    setSent((prev) =>
      prev
        .map((s) => ({
          ...s,
          sharedWith: s.sharedWith?.filter((e) => e !== email) ?? [],
        }))
        .filter((s) => s.sharedWith?.length > 0),
    );
  }, []);

  useSocket({
    "share:received": onShareReceived,
    "share:revoked": onShareRevoked,
    "collaborator:added": onCollaboratorAdded,
    "collaborator:removed": onCollaboratorRemoved,
  });

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      try {
        const [recRes, sentRes] = await Promise.all([
          api.get("/sharing/shared/received"),
          api.get("/sharing/shared/sent"),
        ]);
        if (!mounted) return;
        setReceived(recRes.data.sessions ?? []);
        setSent(sentRes.data.sessions ?? []);
      } catch {
        if (!mounted) return;
        toast.error("Failed to load shared sessions");
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleRevoke = async (roomId, email) => {
    try {
      await api.delete(`/sharing/${roomId}/share`, { data: { email } });
      setSent((prev) =>
        prev
          .map((s) =>
            s.roomId === roomId
              ? { ...s, sharedWith: s.sharedWith.filter((e) => e !== email) }
              : s,
          )
          .filter((s) => s.sharedWith?.length > 0),
      );
      toast.success("Access revoked");
    } catch {
      toast.error("Failed to revoke access");
    }
  };

  const currentList = tab === "received" ? received : sent;

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">
      <Navbar user={user} onSignOut={logout} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Shared Sessions</h2>
          <p className="text-gray-500 text-sm mt-1">
            Collaborate in real-time with other CodeFlash users
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1 w-fit mb-6">
          {[
            { id: "received", label: "Shared with me", count: received.length },
            { id: "sent", label: "Shared by me", count: sent.length },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150
                ${
                  tab === t.id
                    ? "bg-green-500/10 text-green-400 border border-green-500/20"
                    : "text-gray-500 hover:text-white"
                }`}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-bold
                  ${tab === t.id ? "bg-green-500/20 text-green-400" : "bg-gray-800 text-gray-400"}`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <LoadingSkeleton />
        ) : currentList.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentList.map((session) => (
              <SessionCard
                key={session._id}
                session={session}
                tab={tab}
                currentUserEmail={user?.email}
                onOpen={() => navigate(`/editor/${session.roomId}`)}
                onShare={() => setShareModal(session)}
                onRevoke={handleRevoke}
              />
            ))}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {shareModal && (
        <ShareModal
          session={shareModal}
          onClose={() => setShareModal(null)}
          onShared={(roomId, email) => {
            setSent((prev) => {
              const existing = prev.find((s) => s.roomId === roomId);
              if (existing) {
                return prev.map((s) =>
                  s.roomId === roomId
                    ? { ...s, sharedWith: [...(s.sharedWith ?? []), email] }
                    : s,
                );
              }
              return [...prev, { ...shareModal, sharedWith: [email] }];
            });
          }}
        />
      )}
    </div>
  );
}

// ── Session Card ──────────────────────────────────────────────────────────────
function SessionCard({
  session,
  tab,
  currentUserEmail,
  onOpen,
  onShare,
  onRevoke,
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-gray-900/60 border border-gray-800/60 rounded-2xl p-5 flex flex-col gap-3 hover:border-gray-700 transition-all duration-200">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <span
            className={`inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 ${langColor(session.language)}`}
          >
            {session.language}
          </span>
          <h3 className="text-sm font-semibold text-white truncate">
            {session.title}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {tab === "received"
              ? `Owner: ${session.ownerEmail ?? "Unknown"}`
              : `${session.sharedWith?.length ?? 0} collaborator${session.sharedWith?.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {/* Live indicator if session recently active */}
        {isRecentlyActive(session.updatedAt) && (
          <span className="flex items-center gap-1 text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </span>
        )}
      </div>

      {/* Code preview */}
      {session.code && (
        <pre className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-400 overflow-hidden max-h-16 font-mono leading-relaxed">
          {session.code.slice(0, 120)}
          {session.code.length > 120 ? "…" : ""}
        </pre>
      )}

      {/* Shared-with list (sent tab) */}
      {tab === "sent" && session.sharedWith?.length > 0 && (
        <div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs text-gray-500 hover:text-white transition-colors mb-2"
          >
            {expanded ? "▲ Hide" : "▼ Show"} collaborators (
            {session.sharedWith.length})
          </button>
          {expanded && (
            <ul className="flex flex-col gap-1.5">
              {session.sharedWith.map((email) => (
                <li
                  key={email}
                  className="flex items-center justify-between bg-gray-800/60 rounded-lg px-3 py-1.5"
                >
                  <span className="text-xs text-gray-300 truncate">
                    {email}
                  </span>
                  <button
                    onClick={() => onRevoke(session.roomId, email)}
                    className="text-[10px] text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2 py-0.5 rounded-lg transition-all shrink-0 ml-2"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 mt-1">
        <button
          onClick={onOpen}
          className="flex-1 text-sm bg-green-500 hover:bg-green-400 text-black font-bold py-2 rounded-xl transition-all duration-200 hover:shadow-[0_0_16px_rgba(74,222,128,0.3)] active:scale-95"
        >
          Open Editor
        </button>
        {tab === "sent" && (
          <button
            onClick={onShare}
            className="text-sm border border-gray-700 hover:border-gray-500 text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            Share
          </button>
        )}
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ session, onClose, onShared }) {
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareLink = `${window.location.origin}/editor/${session.roomId}`;

  const handleShare = async () => {
    if (!email.trim()) {
      toast.error("Enter an email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error("Invalid email");
      return;
    }
    setSharing(true);
    try {
      await api.post(`/sharing/${session.roomId}/share`, {
        email: email.trim(),
      });
      toast.success(`Session shared with ${email}`);
      onShared(session.roomId, email.trim());
      setEmail("");
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to share session");
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Share Session</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-65">
              {session.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Share by email */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleShare()}
              placeholder="collaborator@example.com"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 placeholder-gray-600 transition-all"
            />
            <button
              onClick={handleShare}
              disabled={sharing}
              className="shrink-0 flex items-center gap-1.5 bg-green-500 hover:bg-green-400 disabled:opacity-50 text-black text-sm font-bold px-4 py-2.5 rounded-xl transition-all active:scale-95"
            >
              {sharing ? (
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                "Invite"
              )}
            </button>
          </div>
          <p className="text-[11px] text-gray-600">
            The user must already have a CodeFlash account. They'll get access
            immediately.
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or share link</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Copy link */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 truncate font-mono">
            {shareLink}
          </div>
          <button
            onClick={copyLink}
            className={`shrink-0 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all active:scale-95 ${
              copied
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        {/* Concurrency note */}
        <div className="flex items-start gap-2.5 bg-blue-500/5 border border-blue-500/20 rounded-xl px-4 py-3">
          <span className="text-blue-400 text-sm mt-0.5 shrink-0">⚡</span>
          <p className="text-xs text-blue-300/80">
            Invited users join the same live room. All edits sync in real-time
            via WebSocket — last write wins with operational conflict
            resolution.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function isRecentlyActive(updatedAt) {
  if (!updatedAt) return false;
  return Date.now() - new Date(updatedAt).getTime() < 10 * 60 * 1000; // 10 min
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-5 animate-pulse"
        >
          <div className="h-3 w-16 bg-gray-800 rounded-full mb-3" />
          <div className="h-4 w-2/3 bg-gray-800 rounded-full mb-2" />
          <div className="h-3 w-1/3 bg-gray-800 rounded-full mb-4" />
          <div className="h-14 bg-gray-800 rounded-xl mb-4" />
          <div className="h-9 bg-gray-800 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ tab }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="text-5xl mb-4 opacity-30">
        {tab === "received" ? "📬" : "📤"}
      </div>
      <p className="text-gray-500 text-lg font-medium">
        {tab === "received"
          ? "No sessions shared with you"
          : "You haven't shared any sessions"}
      </p>
      <p className="text-gray-600 text-sm mt-2">
        {tab === "received"
          ? "Ask a collaborator to share their session with your email"
          : "Open a session from Dashboard and share it with a collaborator"}
      </p>
    </div>
  );
}
