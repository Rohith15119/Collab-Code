export default function InputPanel({ userInput, setUserInput }) {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      <div className="px-4 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-300">
        📥 Custom Input
      </div>

      <textarea
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Enter input here..."
        className="flex-1 bg-gray-950 text-gray-200 p-4 text-sm font-mono outline-none resize-none"
      />
    </div>
  );
}
