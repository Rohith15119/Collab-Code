import { useState } from "react";
import api from "../api/index";
import toast from "react-hot-toast";

const LANG_COLORS = {
  javascript: "text-yellow-400 bg-yellow-400/10",
  typescript: "text-blue-400 bg-blue-400/10",
  python: "text-green-400 bg-green-400/10",
  rust: "text-orange-400 bg-orange-400/10",
  go: "text-cyan-400 bg-cyan-400/10",
  cpp: "text-blue-300 bg-blue-300/10",
  java: "text-red-400 bg-red-400/10",
  c: "text-emerald-300 bg-emerald-500/10",
  default: "text-gray-400 bg-gray-400/10",
};

export default function SessionCard({
  id,
  title,
  language,
  updatedAt,
  lineCount,
  onClick,
  onDelete,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const langClass = LANG_COLORS[language] ?? LANG_COLORS.default;

  return (
    <>
      <article
        onClick={onClick}
        className="
          group relative bg-gray-900/60 hover:bg-gray-900 border border-gray-800/60
          hover:border-gray-700 rounded-2xl p-4 cursor-pointer
          transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]
          hover:-translate-y-0.5
        "
      >
        {/* Language badge */}
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider ${langClass}`}
        >
          {language}
        </span>

        {/* Title */}
        <h3 className="text-sm font-medium text-white truncate mb-1">
          {title}
        </h3>

        {/* Meta */}
        <div className="flex items-center gap-3 text-[11px] text-gray-600">
          {lineCount != null && <span>{lineCount} lines</span>}
          {updatedAt && <span>· {updatedAt}</span>}
        </div>

        {/* Top-right action buttons */}
        <div className="absolute top-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-150">
          {/* Share button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowShare(true);
            }}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[11px] hover:bg-green-500/20 hover:text-green-400 text-gray-600 transition-all duration-150"
            title="Share session"
          >
            ↗
          </button>

          {/* Delete button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirmDelete) onDelete?.(id);
              else setConfirmDelete(true);
            }}
            onBlur={() => setConfirmDelete(false)}
            className="w-6 h-6 flex items-center justify-center rounded-lg text-[10px] hover:bg-red-500/20 hover:text-red-400 text-gray-600 transition-all duration-150"
            title={confirmDelete ? "Confirm delete" : "Delete session"}
          >
            {confirmDelete ? "✓" : "✕"}
          </button>
        </div>
      </article>

      {/* Share modal — rendered outside article so clicks don't bubble */}
      {showShare && (
        <ShareModal
          roomId={id}
          title={title}
          onClose={() => setShowShare(false)}
        />
      )}
    </>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
function ShareModal({ roomId, title, onClose }) {
  const [email, setEmail] = useState("");
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState([]); // emails invited this session

  const shareLink = `${window.location.origin}/editor/${roomId}`;

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error("Enter an email address");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast.error("Invalid email");
      return;
    }
    if (shared.includes(trimmed)) {
      toast.error("Already invited");
      return;
    }

    setSharing(true);
    try {
      await api.post(`/session/${roomId}/share`, { email: trimmed });
      setShared((prev) => [...prev, trimmed]);
      setEmail("");
      toast.success(`Invite sent to ${trimmed}`);
    } catch (err) {
      toast.error(err.response?.data?.message ?? "Failed to share session");
    } finally {
      setSharing(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-white">Share Session</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">
              {title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Invite by email */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            Invite by Email
          </label>
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              placeholder="collaborator@example.com"
              className="flex-1 bg-gray-800 border border-gray-700 text-white text-sm px-3.5 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500/50 placeholder-gray-600 transition-all"
            />
            <button
              onClick={handleInvite}
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
            They must have a CodeFlash account. Access is granted immediately.
          </p>
        </div>

        {/* Invited this session */}
        {shared.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
              Invited
            </p>
            {shared.map((e) => (
              <div
                key={e}
                className="flex items-center gap-2 bg-green-500/5 border border-green-500/20 rounded-xl px-3 py-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shrink-0" />
                <span className="text-xs text-green-300 truncate">{e}</span>
              </div>
            ))}
          </div>
        )}

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-gray-800" />
          <span className="text-xs text-gray-600">or copy link</span>
          <div className="flex-1 h-px bg-gray-800" />
        </div>

        {/* Copy link */}
        <div className="flex gap-2">
          <div className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3.5 py-2.5 text-xs text-gray-400 truncate font-mono">
            {shareLink}
          </div>
          <button
            onClick={handleCopy}
            className={`shrink-0 text-sm px-4 py-2.5 rounded-xl border font-medium transition-all active:scale-95 ${
              copied
                ? "bg-green-500/10 border-green-500/30 text-green-400"
                : "border-gray-700 text-gray-400 hover:text-white hover:border-gray-500"
            }`}
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>
    </div>
  );
}
