import { useState } from "react";

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

/**
 * SessionCard — shown on dashboard.
 * @param {{ id, title, language, updatedAt, lineCount, onClick, onDelete }} props
 */
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
  const langClass = LANG_COLORS[language] ?? LANG_COLORS.default;

  return (
    <article
      onClick={onClick}
      className="
        group relative bg-gray-900/60 hover:bg-gray-900 border border-gray-800/60
        hover:border-gray-700 rounded-2xl p-4 cursor-pointer
        transition-all duration-200 hover:shadow-[0_0_20px_rgba(0,0,0,0.5)]
        hover:-translate-y-0.5 animate-in fade-in slide-in-from-bottom-2
      "
    >
      {/* Language badge */}
      <span
        className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-3 uppercase tracking-wider ${langClass}`}
      >
        {language}
      </span>

      {/* Title */}
      <h3 className="text-sm font-medium text-white truncate mb-1">{title}</h3>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-gray-600">
        {lineCount != null && <span>{lineCount} lines</span>}
        {updatedAt && <span>· {updatedAt}</span>}
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (confirmDelete) {
            onDelete?.(id);
          } else setConfirmDelete(true);
        }}
        onBlur={() => setConfirmDelete(false)}
        className="
          absolute top-3 right-3 opacity-0 group-hover:opacity-100
          w-6 h-6 flex items-center justify-center rounded-lg
          text-[10px] transition-all duration-150
          hover:bg-red-500/20 hover:text-red-400 text-gray-600
        "
        title={confirmDelete ? "Confirm delete" : "Delete session"}
      >
        {confirmDelete ? "✓" : "✕"}
      </button>
    </article>
  );
}
