import { THEME_FILE_MAP, FONT_FAMILIES } from "../utils/constants";

function SettingsDrawer({
  open,
  onClose,
  theme,
  setTheme,
  fontSize,
  setFontSize,
  fontFamily,
  setFontFamily,
  tabSize,
  setTabSize,
  wordWrap,
  setWordWrap,
  minimap,
  setMinimap,
  ligatures,
  setLigatures,
}) {
  const ALL_THEMES = {
    "Built-in": ["vs-dark", "light", "hc-black"],
    Custom: Object.keys(THEME_FILE_MAP),
  };

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/40" onClick={onClose} />
      )}

      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 bg-gray-900 border-l border-gray-700 shadow-2xl flex flex-col transition-transform duration-200 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <span className="text-sm font-semibold text-gray-200">
            ⚙️ Editor Settings
          </span>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-lg leading-none"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
          {/* Theme */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
              Theme
            </label>
            {Object.entries(ALL_THEMES).map(([group, themes]) => (
              <div key={group} className="mb-3">
                <div className="text-xs text-gray-600 mb-1.5">{group}</div>
                <div className="flex flex-wrap gap-1.5">
                  {themes.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={`text-[10px] px-2 py-1 rounded-md transition-all border ${
                        theme === t
                          ? "bg-blue-600 border-blue-500 text-white"
                          : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
              Font Family
            </label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 rounded-lg outline-none focus:border-blue-500"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </div>

          {/* Font Size */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
              Font Size — <span className="text-blue-400">{fontSize}px</span>
            </label>
            <input
              type="range"
              min={10}
              max={24}
              step={2}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10px</span>
              <span>24px</span>
            </div>
          </div>

          {/* Tab Size */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-2 uppercase tracking-wider">
              Tab Size
            </label>
            <div className="flex gap-2">
              {[2, 4, 8].map((s) => (
                <button
                  key={s}
                  onClick={() => setTabSize(s)}
                  className={`flex-1 py-1.5 text-sm rounded-lg border transition-all ${
                    tabSize === s
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-500"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div>
            <label className="block text-xs text-gray-400 font-semibold mb-3 uppercase tracking-wider">
              Options
            </label>
            <div className="space-y-3">
              {[
                {
                  label: "Word Wrap",
                  value: wordWrap,
                  set: setWordWrap,
                  desc: "Wrap long lines",
                },
                {
                  label: "Minimap",
                  value: minimap,
                  set: setMinimap,
                  desc: "Show code minimap",
                },
                {
                  label: "Font Ligatures",
                  value: ligatures,
                  set: setLigatures,
                  desc: "Enable ligatures",
                },
              ].map(({ label, value, set, desc }) => (
                <div key={label} className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-300">{label}</div>
                    <div className="text-xs text-gray-600">{desc}</div>
                  </div>
                  <button
                    onClick={() => set(!value)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${value ? "bg-blue-600" : "bg-gray-700"}`}
                  >
                    <span
                      className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        value ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-4 py-3 border-t border-gray-700 text-xs text-gray-600">
          Settings are auto-saved to browser
        </div>
      </div>
    </>
  );
}

export default SettingsDrawer;
