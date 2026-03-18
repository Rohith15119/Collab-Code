export default function InputPanel({ userInput, setUserInput }) {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-900 border-b border-gray-800">
        <span className="text-xs font-semibold text-gray-300 tracking-wide uppercase">
          📥 Input
        </span>
        {userInput.length > 0 && (
          <span className="ml-auto text-xs text-gray-500">
            {userInput.length} chars
          </span>
        )}
      </div>

      {/* Textarea */}
      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter stdin / custom input here…"
        spellCheck={false}
        className="
          flex-1 w-full
          bg-gray-950 text-gray-200
          p-3 sm:p-4
          text-xs sm:text-sm
          font-mono leading-relaxed
          outline-none resize-none
          placeholder:text-gray-600
          transition-colors
        "
      />
    </div>
  );
}
