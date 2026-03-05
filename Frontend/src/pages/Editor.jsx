import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import toast from "react-hot-toast";
import api from "../api/index";

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
    const d = themeCache[themeName];
    monacoInstance.editor.defineTheme(themeName, {
      base: d.base || "vs-dark",
      inherit: true,
      rules: d.rules || [],
      colors: d.colors || {},
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

// Returns "mobile" | "tablet" | "desktop" based on window width
function useBreakpoint() {
  const get = () => {
    const w = window.innerWidth;
    if (w < 768) return "mobile";
    if (w < 1200) return "tablet";
    return "desktop";
  };
  const [bp, setBp] = useState(get);
  useEffect(() => {
    const h = () => setBp(get());
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, []);
  return bp;
}

// A compact, consistent action button
function Btn({ onClick, disabled, title, color, children }) {
  const colors = {
    gray: "bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-gray-500",
    purple: "bg-purple-900 border border-purple-700 hover:bg-purple-800",
    blue: "bg-blue-900 border border-blue-700 hover:bg-blue-800",
    green: "bg-green-800 border border-green-700 hover:bg-green-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-1 text-xs h-8 px-2.5 rounded-lg font-medium transition-all shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${colors[color] || colors.gray}`}
    >
      {children}
    </button>
  );
}

export default function Editor() {
  const monaco = useMonaco();
  const { roomId } = useParams();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const isMobile = bp === "mobile";
  const isTablet = bp === "tablet";
  const isDesktop = bp === "desktop";

  const [code, setCode] = useState(LANGUAGE_TEMPLATES["javascript"]);
  const [language, setLanguage] = useState("javascript");
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
  // Resizable side panel width (%) — desktop only
  const [sideWidth, setSideWidth] = useState(38);

  const lastAnalyzedRef = useRef({ code: null, language: null, result: null });
  const isPrefsLoaded = useRef(false);
  const autoSaveTimer = useRef(null);
  const themeRef = useRef(theme);
  const containerRef = useRef(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartSide = useRef(0);

  const analyzeComplexity = useCallback(async () => {
    const cached = lastAnalyzedRef.current;
    if (cached.code === code && cached.language === language && cached.result) {
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
        code,
        language,
      });
      setComplexity(data);
      lastAnalyzedRef.current = { code, language, result: data };
    } catch {
      setComplexity({ time: "?", space: "?", reason: "Analysis failed." });
    }
    setIsAnalyzing(false);
  }, [code, language]);

  useEffect(
    () => () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    },
    [],
  );

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
    setTimeout(() => {
      isPrefsLoaded.current = true;
    }, 0);
  }, []);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);
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
      });
    return () => controller.abort();
  }, [roomId]);

  useEffect(() => {
    if (!isPrefsLoaded.current) return;
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
  }, [fontSize, tabSize, wordWrap, minimap, ligatures, theme, fontFamily]);

  const saveSession = useCallback(
    async (currentCode = code) => {
      setIsSaving(true);
      try {
        await api.put(`/session/${roomId}`, {
          code: currentCode,
          language,
          title,
        });
      } catch {
        toast.error("Save failed");
      } finally {
        setIsSaving(false);
      }
    },
    [code, language, title, roomId],
  );

  const handleCodeChange = (val) => {
    setCode(val);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveSession(val), 2000);
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    toast.success("Copied! 📋");
  }, [code]);

  const handleDownload = useCallback(() => {
    const ext = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      cpp: "cpp",
      java: "java",
      go: "go",
      c: "c",
    };
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title}.${ext[language] || "txt"}`;
    a.click();
    toast.success("Downloaded! 💾");
  }, [code, title, language]);

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
    const langId = langMap[language];
    if (!langId) {
      setOutput({ status: "error", text: `${language} not supported yet` });
      setIsRunning(false);
      return;
    }
    const cacheKey = `${language}__${btoa(code)}__${btoa(userInput || "")}`;
    const storedCache = JSON.parse(localStorage.getItem("runCache") || "{}");
    if (storedCache[cacheKey]) {
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
            source_code: btoa(unescape(encodeURIComponent(code))),
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
      storedCache[cacheKey] = finalOutput;
      const keys = Object.keys(storedCache);
      if (keys.length > 50) delete storedCache[keys[0]];
      localStorage.setItem("runCache", JSON.stringify(storedCache));
    } catch {
      setOutput({ status: "error", text: "Failed to run code." });
    }
    setIsRunning(false);
  }, [code, language, userInput]);

  useEffect(() => {
    const h = (e) => {
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
        if (output) {
          setOutput(null);
          setMobilePanel("editor");
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
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [saveSession, handleRun, handleCopy, handleDownload, output, navigate]);

  // ── Drag-to-resize divider ──
  const startDrag = useCallback(
    (e) => {
      e.preventDefault();
      isDragging.current = true;
      dragStartX.current = e.clientX;
      dragStartSide.current = sideWidth;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    },
    [sideWidth],
  );

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current || !containerRef.current) return;
      const total = containerRef.current.offsetWidth;
      const delta = e.clientX - dragStartX.current;
      const deltaPct = (delta / total) * 100;
      setSideWidth(
        Math.max(20, Math.min(65, dragStartSide.current - deltaPct)),
      );
    };
    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // Monaco options tuned per device
  const monacoOptions = {
    fontSize: isDesktop ? fontSize : Math.max(12, fontSize - 1),
    tabSize,
    minimap: { enabled: isDesktop && minimap },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    wordWrap: wordWrap ? "on" : "off",
    fontFamily,
    fontLigatures: ligatures,
    lineNumbers: "on",
    renderLineHighlight: isDesktop ? "all" : "line",
    smoothScrolling: true,
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    padding: { top: isDesktop ? 14 : 8, bottom: isDesktop ? 14 : 8 },
    folding: isDesktop,
    lineDecorationsWidth: isDesktop ? 10 : 4,
    lineNumbersMinChars: isDesktop ? 4 : 3,
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-gray-950 text-gray-200"
      style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}
    >
      {/* ══════════════════════════════ TOP BAR ══════════════════════════════ */}
      <div
        className="shrink-0 flex items-center gap-2 px-3 bg-gray-900 border-b border-gray-800"
        style={{ height: isMobile ? 46 : 50 }}
      >
        {/* ── Back button ── */}
        <button
          onClick={async () => {
            await saveSession();
            toast.success("Saved! ✅");
            navigate("/dashboard");
          }}
          className="shrink-0 w-8 h-8 flex items-center justify-center bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 rounded-lg transition-all"
          title="Dashboard"
        >
          ⚡
        </button>

        {/* ── Title ── */}
        <div
          className="shrink-0 overflow-hidden"
          style={{ maxWidth: isMobile ? 88 : isTablet ? 150 : 200 }}
        >
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
              className="bg-gray-700 text-white px-2 py-1 rounded text-xs outline-none focus:ring-2 focus:ring-green-500 w-full"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-xs text-gray-400 cursor-pointer hover:text-white truncate block"
              title={title}
            >
              {title} ✏️
            </span>
          )}
        </div>

        <div className="shrink-0 h-4 w-px bg-gray-700" />

        {/* ── Language ── */}
        <select
          value={language}
          onChange={(e) => {
            const newLang = e.target.value;
            const savedCode =
              codeByLanguage[newLang] || LANGUAGE_TEMPLATES[newLang];
            setCodeByLanguage((prev) => ({ ...prev, [language]: code }));
            setCode(savedCode);
            setLanguage(newLang);
          }}
          className="shrink-0 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-700 hover:border-gray-500 transition-colors"
          style={{ maxWidth: isMobile ? 86 : 114 }}
        >
          {LANGUAGES.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        {/* ── Font size (tablet+) ── */}
        {!isMobile && (
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="shrink-0 bg-gray-800 text-white text-xs px-2 py-1.5 rounded-lg outline-none border border-gray-700 hover:border-gray-500 transition-colors w-16"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        )}

        {/* ── Spacer ── */}
        <div className="flex-1 min-w-0" />

        {/* ── Action buttons ── */}
        <div className="flex items-center gap-1.5 shrink-0">
          <Btn onClick={handleCopy} title="Copy  Ctrl+Shift+C" color="gray">
            📋{isDesktop && <span>Copy</span>}
          </Btn>
          <Btn onClick={handleDownload} title="Download  Ctrl+D" color="gray">
            ⬇️{isDesktop && <span>Download</span>}
          </Btn>
          <Btn
            onClick={analyzeComplexity}
            disabled={isAnalyzing}
            title="Complexity analysis"
            color="purple"
          >
            📊{!isMobile && <span>{isAnalyzing ? "…" : "Complexity"}</span>}
          </Btn>
          <Btn
            onClick={async () => {
              await saveSession();
              toast.success("Saved! ✅");
            }}
            disabled={isSaving}
            title="Save  Ctrl+S"
            color="blue"
          >
            💾
            <span className={isMobile ? "sr-only" : ""}>
              {isSaving ? "Saving…" : "Save"}
            </span>
          </Btn>
          <Btn
            onClick={handleRun}
            disabled={isRunning}
            title="Run  Ctrl+Enter"
            color="green"
          >
            {isRunning ? "⏳" : "▶"}
            <span className={isMobile ? "sr-only" : ""}>
              {isRunning ? "Running…" : "Run"}
            </span>
          </Btn>
        </div>
      </div>

      {/* ══════════════════════════════ COMPLEXITY BAR ══════════════════════════════ */}
      {complexity && (
        <div className="shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 bg-gray-900 border-b border-purple-900/60 text-xs">
          <span className="text-gray-500 font-semibold">⏱ Time:</span>
          <span
            className={`font-mono font-bold ${COMPLEXITY_COLOR[complexity.time] ?? "text-white"}`}
          >
            {complexity.time}
          </span>
          <span className="text-gray-700">│</span>
          <span className="text-gray-500 font-semibold">🧠 Space:</span>
          <span
            className={`font-mono font-bold ${COMPLEXITY_COLOR[complexity.space] ?? "text-white"}`}
          >
            {complexity.space}
          </span>
          {!isMobile && <span className="text-gray-700">│</span>}
          <span className="text-gray-400 italic flex-1 min-w-0 wrap-break-word">
            {complexity.reason}
          </span>
          <button
            onClick={() => setComplexity(null)}
            className="shrink-0 ml-auto text-gray-600 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ══════════════════════════════ MOBILE PANEL TABS ══════════════════════════════ */}
      {output && isMobile && (
        <div className="shrink-0 flex bg-gray-900 border-b border-gray-800">
          {[
            { id: "editor", label: "📝 Code" },
            { id: "input", label: "📥 Input" },
            { id: "output", label: "📤 Output" },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setMobilePanel(id)}
              className={`flex-1 py-2 text-xs font-medium transition-all border-b-2 ${
                mobilePanel === id
                  ? "border-green-500 text-green-400 bg-gray-800/40"
                  : "border-transparent text-gray-500 hover:text-gray-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ══════════════════════════════ MAIN CONTENT AREA ══════════════════════════════ */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* ── EDITOR ── */}
        <div
          className="min-h-0 min-w-0 overflow-hidden"
          style={
            isMobile
              ? // Mobile: full width, hidden when showing other panel
                {
                  display: output && mobilePanel !== "editor" ? "none" : "flex",
                  flex: 1,
                  flexDirection: "column",
                }
              : // Tablet / Desktop with output: fixed % width
                output
                ? {
                    width: `${100 - sideWidth}%`,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                  }
                : // Desktop no output: fill all
                  { flex: 1, display: "flex", flexDirection: "column" }
          }
        >
          <MonacoEditor
            height="100%"
            language={language}
            value={code}
            onChange={handleCodeChange}
            onMount={(_ed, m) => loadTheme(m, themeRef.current)}
            options={monacoOptions}
          />
        </div>

        {/* ── DRAG HANDLE (desktop + tablet, only when output open) ── */}
        {!isMobile && output && (
          <div
            onMouseDown={startDrag}
            className="shrink-0 w-1.5 bg-gray-800 hover:bg-green-600 active:bg-green-500 cursor-col-resize transition-colors z-20 select-none"
            title="Drag to resize panels"
          />
        )}

        {/* ── SIDE PANELS: Input + Output ── */}
        {output && (
          <div
            className="min-h-0 overflow-hidden"
            style={
              isMobile
                ? { flex: 1, display: "flex", flexDirection: "column" }
                : isTablet
                  ? // Tablet: stacked vertically
                    {
                      width: `${sideWidth}%`,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "column",
                    }
                  : // Desktop: side by side
                    {
                      width: `${sideWidth}%`,
                      flexShrink: 0,
                      display: "flex",
                      flexDirection: "row",
                    }
            }
          >
            {/* Input panel */}
            <div
              className="bg-gray-950 flex flex-col border-gray-800"
              style={
                isMobile
                  ? {
                      display: mobilePanel === "input" ? "flex" : "none",
                      flex: 1,
                    }
                  : isTablet
                    ? {
                        height: "35%",
                        flexShrink: 0,
                        borderTop: "1px solid #1f2937",
                        display: "flex",
                      }
                    : {
                        width: "40%",
                        flexShrink: 0,
                        borderLeft: "1px solid #1f2937",
                        display: "flex",
                      }
              }
            >
              <div className="shrink-0 px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                📥 Stdin / Input
              </div>
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter program input here…"
                className="flex-1 bg-gray-950 text-gray-200 p-3 text-xs font-mono outline-none resize-none min-h-0 placeholder-gray-700"
              />
            </div>

            {/* Divider between input/output on tablet (stacked) */}
            {isTablet && <div className="shrink-0 h-px bg-gray-800" />}

            {/* Output panel */}
            <div
              className="bg-gray-950 flex flex-col border-gray-800"
              style={
                isMobile
                  ? {
                      display: mobilePanel === "output" ? "flex" : "none",
                      flex: 1,
                    }
                  : isTablet
                    ? {
                        flex: 1,
                        borderTop: "1px solid #1f2937",
                        display: "flex",
                      }
                    : {
                        flex: 1,
                        borderLeft: "1px solid #1f2937",
                        display: "flex",
                      }
              }
            >
              <div className="shrink-0 flex justify-between items-center px-3 py-2 bg-gray-900 border-b border-gray-800 text-xs font-semibold">
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
                      ? "⏳ Running…"
                      : "✅ Output"}
                </span>
                <button
                  onClick={() => {
                    setOutput(null);
                    setMobilePanel("editor");
                  }}
                  className="text-gray-600 hover:text-white px-1 text-sm leading-none"
                  title="Close"
                >
                  ✕
                </button>
              </div>
              <pre className="flex-1 overflow-auto p-3 text-xs text-gray-200 font-mono leading-relaxed whitespace-pre-wrap wrap-break-word">
                {output.text}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
