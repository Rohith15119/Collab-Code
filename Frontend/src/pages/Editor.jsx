import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import toast from "react-hot-toast";
import api from "../api/index";
import { getSocket } from "../socket/index";

const LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "cpp",
  "c",
  "java",
  "go",
  "ruby",
  "php",
  "csharp",
  "swift",
  "kotlin",
  "rust",
  "scala",
  "r",
  "dart",
  "haskell",
  "lua",
  "groovy",
  "sql",
  "bash",
];

const LANGUAGE_TEMPLATES = {
  javascript: `// JavaScript Template\nfunction main() {\n  console.log("Hello, World!");\n}\nmain();\n`,
  typescript: `// TypeScript Template\nfunction main(): void {\n  console.log("Hello, World!");\n}\nmain();\n`,
  python: `# Python Template\ndef main():\n    print("Hello, World!")\n\nif __name__ == "__main__":\n    main()\n`,
  cpp: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n`,
  ruby: `# Ruby Template\ndef main\n  puts "Hello, World!"\nend\n\nmain\n`,
  php: `<?php\nfunction main() {\n    echo "Hello, World!\\n";\n}\nmain();\n?>`,
  csharp: `using System;\n\nclass Program {\n    static void Main(string[] args) {\n        Console.WriteLine("Hello, World!");\n    }\n}\n`,
  swift: `// Swift Template\nimport Foundation\n\nfunc main() {\n    print("Hello, World!")\n}\nmain()\n`,
  kotlin: `// Kotlin Template\nfun main() {\n    println("Hello, World!")\n}\n`,
  rust: `// Rust Template\nfn main() {\n    println!("Hello, World!");\n}\n`,
  scala: `// Scala Template\n@main def main(): Unit =\n  println("Hello, World!")\n`,
  r: `# R Template\ncat("Hello, World!\\n")\n`,
  dart: `// Dart Template\nvoid main() {\n  print("Hello, World!");\n}\n`,
  haskell: `-- Haskell Template\nmain :: IO ()\nmain = putStrLn "Hello, World!"\n`,
  lua: `-- Lua Template\nprint("Hello, World!")\n`,
  groovy: `// Groovy Template\nprintln "Hello, World!"\n`,
  sql: `-- SQL Template\nSELECT 'Hello, World!';\n`,
  bash: `#!/bin/bash\necho "Hello, World!"\n`,
};

const FONT_SIZES = [12, 14, 16, 18, 20, 22, 24];

const FONT_FAMILIES = [
  "Fira Code",
  "JetBrains Mono",
  "Cascadia Code",
  "Source Code Pro",
  "Inconsolata",
  "monospace",
];

export const THEME_FILE_MAP = {
  Active4D: "Active4D",
  Amy: "Amy",
  Blackboard: "Blackboard",
  Clouds: "Clouds",
  Cobalt: "Cobalt",
  Dawn: "Dawn",
  Dracula: "Dracula",
  Dreamweaver: "Dreamweaver",
  Eiffel: "Eiffel",
  GitHub: "GitHub",
  IDLE: "IDLE",
  iPlastic: "iPlastic",
  Katzenmilch: "Katzenmilch",
  LAZY: "LAZY",
  Merbivore: "Merbivore",
  Monokai: "Monokai",
  Nord: "Nord",
  SpaceCadet: "SpaceCadet",
  Sunburst: "Sunburst",
  Textmate: "Textmate (Mac Classic)",
  Tomorrow: "Tomorrow",
  Twilight: "Twilight",
  idleFingers: "idleFingers",
  krTheme: "krTheme",
  monoindustrial: "monoindustrial",
};

const themeCache = {};

export const loadTheme = async (monacoInstance, themeName) => {
  if (["vs-dark", "light", "hc-black"].includes(themeName)) {
    monacoInstance.editor.setTheme(themeName);
    return;
  }
  const filename = THEME_FILE_MAP[themeName];
  if (!filename) {
    monacoInstance.editor.setTheme("vs-dark");
    return;
  }
  try {
    if (!themeCache[themeName]) {
      const res = await fetch(
        `https://cdn.jsdelivr.net/npm/monaco-themes@0.4.4/themes/${encodeURIComponent(filename)}.json`,
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      themeCache[themeName] = await res.json();
    }
    const themeData = themeCache[themeName];
    monacoInstance.editor.defineTheme(themeName, {
      base: themeData.base || "vs-dark",
      inherit: true,
      rules: themeData.rules || [],
      colors: themeData.colors || {},
    });
    monacoInstance.editor.setTheme(themeName);
  } catch {
    monacoInstance.editor.setTheme("vs-dark");
  }
};

const COMPLEXITY_COLOR = {
  "O(1)": "text-green-400",
  "O(log n)": "text-green-300",
  "O(n)": "text-yellow-300",
  "O(n log n)": "text-orange-300",
  "O(n²)": "text-red-400",
  "O(2ⁿ)": "text-red-600",
  "O(n!)": "text-pink-600",
};

// ── Concurrent sync strategy ──────────────────────────────────────────────────
//
// LAYER 1 — Character-diff guard (fires on every incoming code:change event)
//   Computes |incoming.length - local.length|. If > CHAR_DIFF_THRESHOLD,
//   a meaningful concurrent edit is present that isn't reflected locally.
//   The incoming code is force-applied immediately and a brief toast shown.
//   Small diffs (≤ threshold) are applied normally via suppressEmitRef.
//
// LAYER 2 — Periodic reconciliation ping (safety net, every 5 s)
//   Emits "session:reconcile" with the local char count as a lightweight
//   checksum. The server compares against the stored canonical code and,
//   if they differ by more than the threshold, replies with
//   "session:reconcile:response" containing the full canonical code.
//   The client applies it only when the user is not actively typing,
//   avoiding cursor-jump interruptions.
//
//   ⚠️  Requires a small server-side addition — see the comment block at
//   the very bottom of this file for the exact Socket.IO handler to add.
//
// ─────────────────────────────────────────────────────────────────────────────

// Minimum character-count difference to treat an incoming peer edit as a
// meaningful concurrent modification and force-apply it.
const CHAR_DIFF_THRESHOLD = 10;

// ── Settings Drawer ───────────────────────────────────────────────────────────
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

// ── Shortcuts Modal ───────────────────────────────────────────────────────────
function ShortcutsModal({ open, onClose }) {
  if (!open) return null;

  const shortcuts = [
    { keys: ["Ctrl", "S"], action: "Save session" },
    { keys: ["Ctrl", "Enter"], action: "Run code" },
    { keys: ["Ctrl", "D"], action: "Download file" },
    { keys: ["Ctrl", "⇧", "C"], action: "Copy code" },
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

// ── Main Editor ───────────────────────────────────────────────────────────────
export default function Editor() {
  const monaco = useMonaco();
  const { roomId } = useParams();
  const navigate = useNavigate();

  // Safe JWT decode — crash-proof, redirects on bad token
  let myUserId = null;
  try {
    const token = localStorage.getItem("token");
    if (token) {
      myUserId = JSON.parse(atob(token.split(".")[1])).id;
    } else {
      navigate("/login");
    }
  } catch {
    navigate("/login");
  }

  const [code, setCode] = useState(null);
  const [language, setLanguage] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [title, setTitle] = useState("Untitled Session");
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [ligatures, setLigatures] = useState(true);
  const [fontFamily, setFontFamily] = useState("Fira Code");
  const [complexity, setComplexity] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mobilePanel, setMobilePanel] = useState("editor");
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Always-current refs — prevent stale closure bugs
  const codeRef = useRef(null);
  const languageRef = useRef(null);
  const themeRef = useRef(theme);
  const suppressEmitRef = useRef(false);
  const socketEmitTimer = useRef(null);
  const lastAnalyzedRef = useRef({ code: null, language: null, result: null });

  useEffect(() => {
    codeRef.current = code;
  }, [code]);
  useEffect(() => {
    languageRef.current = language;
  }, [language]);
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // ── NEW: local-typing tracker ─────────────────────────────────────────────
  // Prevents the reconcile response from overwriting the editor while the
  // user is actively typing (which would jump their cursor).
  const isLocallyTypingRef = useRef(false);
  const localTypingTimer = useRef(null);

  const markLocalTyping = useCallback(() => {
    isLocallyTypingRef.current = true;
    clearTimeout(localTypingTimer.current);
    // Treat the user as "idle" after 1.5 s without a keystroke
    localTypingTimer.current = setTimeout(() => {
      isLocallyTypingRef.current = false;
    }, 1500);
  }, []);

  // ── Socket setup with Layer 1 + Layer 2 sync ──────────────────────────────
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) socket.connect();
    socket.emit("join:session", roomId);

    // ── LAYER 1: Character-diff guard ────────────────────────────────────────
    // Every incoming peer event computes |incomingLen - localLen|.
    // If > CHAR_DIFF_THRESHOLD → meaningful concurrent edit → force-apply.
    // If ≤ threshold → small routine edit → apply via suppressEmitRef.
    const onCodeChange = ({
      code: incomingCode,
      language: incomingLang,
      sender,
    }) => {
      if (sender === myUserId) return;

      const localLen = (codeRef.current ?? "").length;
      const incomingLen = (incomingCode ?? "").length;
      const charDiff = Math.abs(incomingLen - localLen);
      const isMeaningfulDiff = charDiff > CHAR_DIFF_THRESHOLD;

      if (isMeaningfulDiff) {
        // Force-apply — peer has substantially different content
        setCode(incomingCode);
        setLanguage(incomingLang);
        toast("↕ Synced with peer edits", {
          icon: "🔄",
          duration: 1800,
          style: { fontSize: "12px" },
        });
      } else {
        // Normal small peer update
        suppressEmitRef.current = true;
        setCode(incomingCode);
        setLanguage(incomingLang);
      }
    };

    // ── LAYER 2: Periodic reconciliation ping ─────────────────────────────
    // Every 5 s, send our local char count to the server as a checksum.
    // The server replies (to this socket only) if canonical code differs
    // by more than CHAR_DIFF_THRESHOLD — catching any dropped events.
    const reconcileInterval = setInterval(() => {
      if (!languageRef.current) return; // session not loaded yet
      socket.emit("session:reconcile", {
        roomId,
        localCharCount: (codeRef.current ?? "").length,
      });
    }, 5000);

    const onReconcileResponse = ({
      code: canonicalCode,
      language: canonicalLang,
    }) => {
      // Skip if user is mid-keystroke — avoids cursor-jump interruptions
      if (isLocallyTypingRef.current) return;

      const localLen = (codeRef.current ?? "").length;
      const canonicalLen = (canonicalCode ?? "").length;
      const charDiff = Math.abs(canonicalLen - localLen);

      // Re-check diff (state may have updated since we sent the ping)
      if (charDiff > CHAR_DIFF_THRESHOLD) {
        suppressEmitRef.current = true;
        setCode(canonicalCode);
        setLanguage(canonicalLang);
        toast("↕ Auto-synced missed changes", {
          icon: "🔄",
          duration: 1800,
          style: { fontSize: "12px" },
        });
      }
    };

    socket.on("code:change", onCodeChange);
    socket.on("session:reconcile:response", onReconcileResponse);

    return () => {
      socket.emit("leave:session", roomId);
      socket.off("code:change", onCodeChange);
      socket.off("session:reconcile:response", onReconcileResponse);
      clearInterval(reconcileInterval);
    };
  }, [roomId]);

  const analyzeComplexity = useCallback(async () => {
    const cached = lastAnalyzedRef.current;
    if (
      cached.code === codeRef.current &&
      cached.language === languageRef.current &&
      cached.result
    ) {
      setIsAnalyzing(true);
      await new Promise((r) => setTimeout(r, 600));
      setComplexity(cached.result);
      setIsAnalyzing(false);
      return;
    }
    setIsAnalyzing(true);
    setComplexity(null);
    try {
      const { data } = await api.post("/analyze-complexity", {
        code: codeRef.current,
        language: languageRef.current,
      });
      setComplexity(data);
      lastAnalyzedRef.current = {
        code: codeRef.current,
        language: languageRef.current,
        result: data,
      };
    } catch {
      setComplexity({ time: "?", space: "?", reason: "Analysis failed." });
    }
    setIsAnalyzing(false);
  }, []);

  useEffect(() => {
    const prefs = localStorage.getItem("editorPrefs");
    if (prefs) {
      const p = JSON.parse(prefs);
      setFontSize(p.fontSize ?? 14);
      setTabSize(p.tabSize ?? 2);
      setWordWrap(p.wordWrap ?? true);
      setMinimap(p.minimap ?? false);
      setLigatures(p.ligatures ?? true);
      setTheme(p.theme ?? "vs-dark");
      setFontFamily(p.font ?? "Fira Code");
    }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (monaco) loadTheme(monaco, theme);
  }, [theme, monaco]);

  useEffect(() => {
    const controller = new AbortController();
    api
      .get(`/session/${roomId}`, { signal: controller.signal })
      .then(({ data }) => {
        setCode(
          data.session.code ||
            LANGUAGE_TEMPLATES[data.session.language] ||
            "// Start coding...",
        );
        setLanguage(data.session.language || "javascript");
        setTitle(data.session.title || "Untitled Session");
      })
      .catch((err) => {
        if (err.name === "CanceledError" || err.name === "AbortError") return;
        toast.error("Session not found");
        navigate("/dashboard");
      })
      .finally(() => setIsLoadingSession(false));
    return () => controller.abort();
  }, [roomId]);

  useEffect(() => {
    if (!prefsLoaded) return;
    localStorage.setItem(
      "editorPrefs",
      JSON.stringify({
        fontSize,
        tabSize,
        wordWrap,
        minimap,
        ligatures,
        theme,
        font: fontFamily,
      }),
    );
  }, [
    fontSize,
    tabSize,
    wordWrap,
    minimap,
    ligatures,
    theme,
    fontFamily,
    prefsLoaded,
  ]);

  const saveSession = useCallback(
    async (overrideCode) => {
      setIsSaving(true);
      try {
        await api.put(`/session/${roomId}`, {
          code: overrideCode !== undefined ? overrideCode : codeRef.current,
          language: languageRef.current,
          title,
        });
      } catch {
        toast.error("Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [roomId, title],
  );

  const handleCodeChange = (value) => {
    // Track that the user is actively typing so Layer 2 doesn't interrupt
    markLocalTyping();

    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      setCode(value);
      return;
    }

    setCode(value);

    // Guard against emitting before session load (language === null)
    clearTimeout(socketEmitTimer.current);
    socketEmitTimer.current = setTimeout(() => {
      if (!languageRef.current) return;
      getSocket().emit("code:change", {
        roomId,
        code: value,
        language: languageRef.current,
      });
    }, 150);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(codeRef.current);
    toast.success("Copied! 📋");
  }, []);

  const handleDownload = useCallback(() => {
    const ext = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      cpp: "cpp",
      c: "c",
      java: "java",
      go: "go",
      ruby: "rb",
      php: "php",
      csharp: "cs",
      swift: "swift",
      kotlin: "kt",
      rust: "rs",
      scala: "scala",
      r: "r",
      dart: "dart",
      haskell: "hs",
      lua: "lua",
      groovy: "groovy",
      sql: "sql",
      bash: "sh",
    };
    const blob = new Blob([codeRef.current], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.${ext[languageRef.current] || "txt"}`;
    a.click();
    toast.success("Downloaded! 💾");
  }, [title]);

  const handleRun = useCallback(async () => {
    setIsRunning(true);
    setOutput({ status: "running", text: "Running..." });
    setMobilePanel("output");

    const langMap = {
      javascript: 102,
      typescript: 101,
      python: 109,
      cpp: 105,
      c: 103,
      java: 91,
      go: 107,
      ruby: 72,
      php: 98,
      csharp: 51,
      kotlin: 111,
      swift: 83,
      rust: 108,
      scala: 112,
      r: 99,
      dart: 90,
      haskell: 61,
      lua: 64,
      groovy: 88,
      sql: 82,
      bash: 46,
    };
    const currentCode = codeRef.current;
    const currentLang = languageRef.current;
    const langId = langMap[currentLang];

    if (!langId) {
      setOutput({ status: "error", text: `${currentLang} not supported yet` });
      setIsRunning(false);
      return;
    }

    // encodeURIComponent-safe btoa — handles non-Latin characters
    let cacheKey;
    try {
      cacheKey = `${currentLang}__${btoa(unescape(encodeURIComponent(currentCode)))}__${btoa(unescape(encodeURIComponent(userInput || "")))}`;
    } catch {
      cacheKey = null;
    }

    const storedCache = JSON.parse(localStorage.getItem("runCache") || "{}");
    if (cacheKey && storedCache[cacheKey]) {
      await new Promise((r) => setTimeout(r, 400));
      setOutput(storedCache[cacheKey]);
      setIsRunning(false);
      return;
    }

    try {
      const res = await fetch(
        "https://ce.judge0.com/submissions?base64_encoded=true&wait=true",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            source_code: btoa(unescape(encodeURIComponent(currentCode))),
            language_id: langId,
            stdin: btoa(unescape(encodeURIComponent(userInput || ""))),
          }),
        },
      );
      const result = await res.json();
      const decode = (str) => {
        try {
          return str ? decodeURIComponent(escape(atob(str))) : "";
        } catch {
          return str;
        }
      };
      const outputText = decode(
        result.compile_output ||
          result.stderr ||
          result.stdout ||
          result.message ||
          "",
      );
      const finalOutput = {
        status: result.status?.id === 3 ? "success" : "error",
        text: `${result.status?.description}\n\n${outputText}`,
      };
      setOutput(finalOutput);
      if (cacheKey) {
        storedCache[cacheKey] = finalOutput;
        const keys = Object.keys(storedCache);
        if (keys.length > 50) delete storedCache[keys[0]];
        localStorage.setItem("runCache", JSON.stringify(storedCache));
      }
    } catch {
      setOutput({ status: "error", text: "Failed to run code." });
    }
    setIsRunning(false);
  }, [userInput]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.key.toLowerCase() === "s") {
        e.preventDefault();
        saveSession();
        toast.success("Saved! ✅");
      }
      if ((isCtrl && e.key === "Enter") || (isCtrl && e.key === "'")) {
        e.preventDefault();
        handleRun();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        if (showShortcuts) {
          setShowShortcuts(false);
          return;
        }
        if (showSettings) {
          setShowSettings(false);
          return;
        }
        if (output) {
          setOutput(null);
          setMobilePanel("output");
        } else {
          saveSession();
          toast.success("Saved! ✅");
          navigate("/dashboard");
        }
      }
      if (isCtrl && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleDownload();
      }
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === "c") {
        e.preventDefault();
        handleCopy();
      }
      if (isCtrl && e.key === "=") {
        e.preventDefault();
        setFontSize((p) => Math.min(p + 2, 24));
      }
      if (isCtrl && e.key === "-") {
        e.preventDefault();
        setFontSize((p) => Math.max(p - 2, 10));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    saveSession,
    handleRun,
    handleCopy,
    handleDownload,
    output,
    navigate,
    showShortcuts,
    showSettings,
  ]);

  return (
    <div
      className="flex flex-col bg-gray-950 text-gray-200"
      style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}
    >
      {/* ── TOP BAR ── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={async () => {
              await saveSession();
              toast.success("Saved! ✅");
              navigate("/dashboard");
            }}
            className="shrink-0 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 transition-all text-sm w-9 h-9 rounded-xl font-medium flex items-center justify-center"
            title="Back to dashboard"
          >
            ⚡
          </button>

          {isEditingTitle ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                saveSession();
              }}
              onKeyDown={(e) => e.key === "Enter" && setIsEditingTitle(false)}
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-green-500 max-w-35 sm:max-w-xs"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-sm text-gray-300 cursor-pointer hover:text-white truncate max-w-30 sm:max-w-xs"
              title="Click to rename"
            >
              {title} ✏️
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <select
            value={language ?? ""}
            onChange={(e) => {
              const newLang = e.target.value;
              const savedCode =
                codeByLanguage[newLang] || LANGUAGE_TEMPLATES[newLang];
              setCodeByLanguage((prev) => ({
                ...prev,
                [language]: codeRef.current,
              }));
              setCode(savedCode);
              setLanguage(newLang);
              getSocket().emit("code:change", {
                roomId,
                code: savedCode,
                language: newLang,
              });
            }}
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none max-w-27.5"
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none w-16"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            onClick={handleCopy}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hidden sm:flex items-center gap-1"
          >
            📋 <span className="hidden md:inline">Copy</span>
          </button>
          <button
            onClick={handleCopy}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
          >
            📋
          </button>

          <button
            onClick={handleDownload}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hidden sm:flex items-center gap-1"
          >
            ⬇️ <span className="hidden md:inline">Download</span>
          </button>
          <button
            onClick={handleDownload}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
          >
            ⬇️
          </button>

          <button
            onClick={analyzeComplexity}
            disabled={isAnalyzing}
            className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-xs px-3 py-1.5 rounded-xl font-medium transition hidden sm:flex items-center gap-1"
          >
            📊{" "}
            <span className="hidden lg:inline">
              {isAnalyzing ? "Analyzing…" : "Complexity"}
            </span>
          </button>
          <button
            onClick={analyzeComplexity}
            disabled={isAnalyzing}
            className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-sm w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
          >
            📊
          </button>

          <button
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts"
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hidden sm:flex items-center gap-1"
          >
            ⌨️ <span className="hidden lg:inline">Shortcuts</span>
          </button>
          <button
            onClick={() => setShowShortcuts(true)}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
          >
            ⌨️
          </button>

          <button
            onClick={() => setShowSettings(true)}
            title="Editor settings"
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-xs px-3 py-1.5 rounded-xl font-medium transition-all hidden sm:flex items-center gap-1"
          >
            ⚙️ <span className="hidden lg:inline">Settings</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm w-8 h-8 rounded-xl flex items-center justify-center sm:hidden"
          >
            ⚙️
          </button>

          <button
            onClick={async () => {
              await saveSession();
              toast.success("Saved! ✅");
            }}
            disabled={isSaving}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-50 text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1"
          >
            💾{" "}
            <span className="hidden sm:inline">
              {isSaving ? "Saving…" : "Save"}
            </span>
          </button>

          <button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-xs px-3 py-1.5 rounded-xl font-medium transition flex items-center gap-1"
          >
            {isRunning ? "⏳" : "▶"}{" "}
            <span className="hidden sm:inline">
              {isRunning ? "Running…" : "Run"}
            </span>
          </button>
        </div>
      </div>

      {/* ── COMPLEXITY BAR ── */}
      {complexity && (
        <div className="shrink-0 flex flex-wrap items-center gap-3 px-4 py-2.5 bg-gray-900 border-b border-purple-800 text-sm">
          <span className="text-gray-400 font-semibold">⏱ Time:</span>
          <span
            className={`font-mono font-bold ${COMPLEXITY_COLOR[complexity.time] ?? "text-white"}`}
          >
            {complexity.time}
          </span>
          <span className="text-gray-600">|</span>
          <span className="text-gray-400 font-semibold">🧠 Space:</span>
          <span
            className={`font-mono font-bold ${COMPLEXITY_COLOR[complexity.space] ?? "text-white"}`}
          >
            {complexity.space}
          </span>
          <span className="text-gray-600 hidden sm:inline">|</span>
          <span className="text-gray-400 italic text-xs sm:text-sm wrap-break-word flex-1 min-w-0">
            {complexity.reason}
          </span>
          <button
            onClick={() => setComplexity(null)}
            className="ml-auto shrink-0 text-gray-500 hover:text-white text-base"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MOBILE PANEL TABS ── */}
      {output && (
        <div className="shrink-0 flex border-b border-gray-800 bg-gray-900 md:hidden">
          {["editor", "input", "output"].map((panel) => (
            <button
              key={panel}
              onClick={() => setMobilePanel(panel)}
              className={`flex-1 py-2 text-xs font-medium capitalize transition-all border-b-2 ${
                mobilePanel === panel
                  ? "border-green-500 text-green-400"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {panel === "editor"
                ? "📝 Editor"
                : panel === "input"
                  ? "📥 Input"
                  : "📤 Output"}
            </button>
          ))}
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div
          className={`
            min-h-0 min-w-0 overflow-hidden
            ${output ? "hidden md:flex md:flex-1" : "flex flex-1"}
            ${output ? "md:w-1/2 lg:w-[55%]" : ""}
            ${output && mobilePanel === "editor" ? "flex! flex-1 md:flex" : ""}
          `}
        >
          <div className="w-full h-full">
            {isLoadingSession ? (
              <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                Loading session…
              </div>
            ) : (
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={(_editor, monacoInstance) =>
                  loadTheme(monacoInstance, themeRef.current)
                }
                options={{
                  fontSize,
                  tabSize,
                  minimap: { enabled: minimap },
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  wordWrap: wordWrap ? "on" : "off",
                  fontFamily,
                  fontLigatures: ligatures,
                }}
              />
            )}
          </div>
        </div>

        {output && (
          <>
            <div
              className={`
                border-gray-800 bg-gray-950 flex flex-col flex-1 min-h-0 min-w-0
                md:flex md:w-[22%] lg:w-[20%] md:flex-none md:border-l
                ${mobilePanel === "input" ? "flex" : "hidden md:flex"}
              `}
            >
              <div className="shrink-0 px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-300 tracking-wide">
                📥 Custom Input
              </div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter input here..."
                className="flex-1 bg-gray-950 text-gray-200 p-4 text-sm font-mono outline-none resize-none min-h-0"
              />
            </div>

            <div
              className={`
                border-gray-800 bg-gray-950 flex flex-col flex-1 min-h-0 min-w-0
                md:flex md:w-[28%] lg:w-[25%] md:flex-none md:border-l
                ${mobilePanel === "output" ? "flex" : "hidden md:flex"}
              `}
            >
              <div className="shrink-0 flex justify-between items-center px-4 py-2.5 bg-gray-900 border-b border-gray-800 text-xs font-semibold">
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
                  onClick={() => {
                    setOutput(null);
                    setMobilePanel("output");
                  }}
                  className="text-gray-400 hover:text-white text-base leading-none"
                >
                  ✕
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-4 text-xs sm:text-sm text-gray-200 font-mono leading-relaxed whitespace-pre-wrap wrap-break-word">
                {output.text}
              </pre>
            </div>
          </>
        )}
      </div>

      <SettingsDrawer
        open={showSettings}
        onClose={() => setShowSettings(false)}
        theme={theme}
        setTheme={setTheme}
        fontSize={fontSize}
        setFontSize={setFontSize}
        fontFamily={fontFamily}
        setFontFamily={setFontFamily}
        tabSize={tabSize}
        setTabSize={setTabSize}
        wordWrap={wordWrap}
        setWordWrap={setWordWrap}
        minimap={minimap}
        setMinimap={setMinimap}
        ligatures={ligatures}
        setLigatures={setLigatures}
      />

      <ShortcutsModal
        open={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
