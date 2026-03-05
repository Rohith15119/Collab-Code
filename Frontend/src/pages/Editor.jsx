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

export default function Editor() {
  const monaco = useMonaco();
  const { roomId } = useParams();
  const navigate = useNavigate();

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
  // Mobile: which panel is active — "editor" | "input" | "output"
  const [mobilePanel, setMobilePanel] = useState("editor");

  const lastAnalyzedRef = useRef({ code: null, language: null, result: null });
  const isPrefsLoaded = useRef(false);
  const autoSaveTimer = useRef(null);
  const themeRef = useRef(theme);

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

  const handleCodeChange = (value) => {
    setCode(value);
    clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => saveSession(value), 2000);
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
    // Switch to output panel on mobile when run is triggered
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
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveSession, handleRun, handleCopy, handleDownload, output, navigate]);

  return (
    <div
      className="flex flex-col bg-gray-950 text-gray-200"
      style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}
    >
      {/* ── TOP BAR ── */}
      <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-gray-900 border-b border-gray-800">
        {/* Left: back + title */}
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

        {/* Center: language + font size */}
        <div className="flex items-center gap-1.5">
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

        {/* Right: action buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Copy — icon only on very small screens */}
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

      {/* ── MOBILE PANEL TABS (only when output exists) ── */}
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
        {/* ── DESKTOP: Editor ── */}
        <div
          className={`
            min-h-0 min-w-0 overflow-hidden
            ${output ? "hidden md:flex md:flex-1" : "flex flex-1"}
            ${output ? "md:w-1/2 lg:w-[55%]" : ""}
            ${output && mobilePanel === "editor" ? "flex! flex-1 md:flex" : ""}
          `}
          style={output ? {} : {}}
        >
          <div className="w-full h-full">
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
          </div>
        </div>

        {/* ── DESKTOP: Input + Output panels side by side | Mobile: separate tabs ── */}
        {output && (
          <>
            {/* Custom Input */}
            <div
              className={`
                border-gray-800 bg-gray-950 flex flex-col
                flex-1 min-h-0 min-w-0
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

            {/* Output */}
            <div
              className={`
                border-gray-800 bg-gray-950 flex flex-col
                flex-1 min-h-0 min-w-0
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
                    setMobilePanel("editor");
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
    </div>
  );
}
