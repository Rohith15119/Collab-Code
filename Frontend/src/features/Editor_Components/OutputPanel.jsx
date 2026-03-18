export default function OutputPanel({ output, setOutput }) {
  const isError = output.status === "error";
  const isRunning = output.status === "running";

  const statusLabel = isError
    ? "❌ Error"
    : isRunning
      ? "⏳ Running…"
      : "✅ Output";

  const statusClass = isError
    ? "text-red-400"
    : isRunning
      ? "text-yellow-400"
      : "text-green-400";

  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-3 sm:px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span
          className={`text-xs font-semibold tracking-wide uppercase ${statusClass}`}
        >
          {statusLabel}
        </span>

        <div className="flex items-center gap-2">
          {output.time != null && (
            <span className="hidden sm:inline text-xs text-gray-500 font-mono">
              {output.time}ms
            </span>
          )}
          <button
            onClick={() => setOutput(null)}
            aria-label="Clear output"
            className="w-6 h-6 flex items-center justify-center rounded text-gray-400 hover:text-white hover:bg-gray-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Output content */}
      <pre
        className="
          flex-1 overflow-auto
          p-3 sm:p-4
          text-xs sm:text-sm
          text-gray-200 font-mono
          leading-relaxed whitespace-pre-wrap break-words
        "
      >
        {output.text || (
          <span className="text-gray-600 italic">No output produced.</span>
        )}
      </pre>
    </div>
  );
}
