export default function OutputPanel({ output, setOutput }) {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="flex justify-between items-center px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold">
        <span
          className={
            output.status === "error"
              ? "text-red-400"
              : output.status === "running"
                ? "text-yellow-400"
                : "text-green-400"
          }
        >
          {output.status === "error"
            ? "❌ Error"
            : output.status === "running"
              ? "⏳ Running..."
              : "✅ Output"}
        </span>

        <button
          onClick={() => setOutput(null)}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      <pre className="flex-1 overflow-auto p-4 text-sm text-gray-200 font-mono whitespace-pre-wrap">
        {output.text}
      </pre>
    </div>
  );
}
