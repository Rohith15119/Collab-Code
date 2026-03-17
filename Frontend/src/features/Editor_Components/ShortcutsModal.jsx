function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  const shortcuts = [
    { keys: ["Ctrl", "S"], action: "Save session" },
    { keys: ["Ctrl", "Enter"], action: "Run code" },
    { keys: ["Ctrl", "D"], action: "Download file" },
    { keys: ["Ctrl", "C"], action: "Copy code" },
    { keys: ["Ctrl", "="], action: "Increase font size" },
    { keys: ["Ctrl", "-"], action: "Decrease font size" },
    { keys: ["Ctrl", "F"], action: "Find in editor" },
    { keys: ["Ctrl", "H"], action: "Find & Replace" },
    { keys: ["Ctrl", "Z"], action: "Undo" },
    { keys: ["Ctrl", "⇧", "Z"], action: "Redo" },
    { keys: ["Ctrl", "/"], action: "Toggle comment" },
    { keys: ["Esc"], action: "Close output / Go back" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-700">
          <span className="font-semibold text-gray-200 text-sm">
            ⌨️ Keyboard Shortcuts
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>
        <div className="px-5 py-3 space-y-1 max-h-96 overflow-y-auto">
          {shortcuts.map(({ keys, action }) => (
            <div
              key={action}
              className="flex items-center justify-between py-1.5 border-b border-gray-800 last:border-0"
            >
              <span className="text-sm text-gray-300">{action}</span>
              <div className="flex items-center gap-1">
                {keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-1.5 py-0.5 bg-gray-800 border border-gray-600 rounded text-xs text-gray-200 font-mono"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShortcutsModal;
