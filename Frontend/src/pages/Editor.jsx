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
  javascript: `// JavaScript Template
function main() {
  console.log("Hello, World!");
}
main();
`,

  typescript: `// TypeScript Template
function main(): void {
  console.log("Hello, World!");
}
main();
`,

  python: `# Python Template
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}
`,

  c: `#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,

  java: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,

  go: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,

  ruby: `# Ruby Template
def main
  puts "Hello, World!"
end

main
`,

  php: `<?php
// PHP Template
function main() {
    echo "Hello, World!\\n";
}
main();
?>`,

  csharp: `using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}
`,

  swift: `// Swift Template
import Foundation

func main() {
    print("Hello, World!")
}
main()
`,

  kotlin: `// Kotlin Template
fun main() {
    println("Hello, World!")
}
`,

  rust: `// Rust Template
fn main() {
    println!("Hello, World!");
}
`,

  scala: `// Scala Template
@main def main(): Unit =
  println("Hello, World!")
`,

  r: `# R Template
cat("Hello, World!\\n")
`,

  dart: `// Dart Template
void main() {
  print("Hello, World!");
}
`,

  haskell: `-- Haskell Template
main :: IO ()
main = putStrLn "Hello, World!"
`,

  lua: `-- Lua Template
print("Hello, World!")
`,

  groovy: `// Groovy Template
println "Hello, World!"
`,

  sql: `-- SQL Template
SELECT 'Hello, World!';
`,

  bash: `#!/bin/bash
echo "Hello, World!"
`,
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
      // Store in cache
      lastAnalyzedRef.current = { code, language, result: data };
    } catch (e) {
      console.error("Complexity analysis error:", e);
      setComplexity({ time: "?", space: "?", reason: "Analysis failed." });
    }
    setIsAnalyzing(false);
  }, [code, language]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
      }
    };
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
      .get(`/session/${roomId}`, {
        signal: controller.signal,
      })
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
        if (err.name === "CanceledError" || err.name === "AbortError") {
          return;
        }

        toast.error("Session not found");
        navigate("/dashboard");
      });

    return () => controller.abort(); // cleanup
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

    // 🔥 Create unique cache key including input
    const cacheKey = `${language}__${btoa(code)}__${btoa(userInput || "")}`;

    // 🔥 Load cache from localStorage
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

      // 🔥 Save into cache
      storedCache[cacheKey] = finalOutput;

      // Optional: Limit cache size (avoid huge storage)
      const keys = Object.keys(storedCache);
      if (keys.length > 50) {
        delete storedCache[keys[0]]; // remove oldest
      }

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
        if (output) setOutput(null);
        else {
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
      if (isCtrl && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setOutput((prev) => (prev ? null : { status: "success", text: "" }));
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
    <div className="flex flex-col h-screen bg-linear-to-br from-gray-950 via-gray-900 to-black text-gray-200">
      {/* Topbar */}
      <div className="flex items-center justify-between px-8 py-4 bg-gray-900/90 backdrop-blur-xl border-b border-gray-800 shadow-xl rounded-b-2xl">
        {" "}
        {/* Left */}
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              await saveSession();
              toast.success("Saved! ✅");
              navigate("/dashboard");
            }}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 transition-all text-sm px-5 py-2 rounded-2xl font-medium"
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
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-green-500"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-sm text-gray-300 cursor-pointer hover:text-white"
              title="Click to rename"
            >
              {title} ✏️
            </span>
          )}
        </div>
        {/* Center */}
        <div className="flex items-center gap-2">
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
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none"
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
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </div>
        {/* Right */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-sm px-5 py-2 rounded-2xl font-medium transition-all"
          >
            📋 Copy
          </button>
          <button
            onClick={handleDownload}
            className="bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:border-green-500 text-sm px-5 py-2 rounded-2xl font-medium transition-all"
          >
            ⬇️ Download
          </button>
          <button
            onClick={analyzeComplexity}
            disabled={isAnalyzing}
            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-sm px-5 py-2 rounded-2xl font-medium shadow-md transition"
          >
            {isAnalyzing ? "🔍 Analyzing..." : "📊 Complexity"}
          </button>
          <button
            onClick={async () => {
              await saveSession();
              toast.success("Saved! ✅");
            }}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-sm px-5 py-2 rounded-2xl font-medium shadow-md transition"
          >
            {isSaving ? "Saving..." : "💾 Save"}
          </button>
          <button
            onClick={handleRun}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-sm px-5 py-2 rounded-2xl font-medium shadow-md transition"
          >
            {isRunning ? "⏳ Running..." : "▶ Run"}
          </button>
        </div>
      </div>

      {/* Complexity Bar */}
      {complexity && (
        <div className="flex items-center gap-8 px-10 py-5 bg-gray-900/95 border-b border-purple-700 shadow-lg rounded-b-2xl text-base">
          {" "}
          <span className="text-gray-400 font-semibold text-base">⏱ Time:</span>
          <span
            className={`font-mono font-extrabold text-lg ${
              COMPLEXITY_COLOR[complexity.time] ?? "text-white"
            }`}
          >
            {complexity.time}
          </span>
          <span className="text-gray-600 text-lg">|</span>
          <span className="text-gray-400 font-semibold text-base">
            🧠 Space:
          </span>
          <span
            className={`font-mono font-extrabold text-lg ${
              COMPLEXITY_COLOR[complexity.space] ?? "text-white"
            }`}
          >
            {complexity.space}
          </span>
          <span className="text-gray-600 text-lg">|</span>
          <span className="text-gray-400 italic text-sm md:text-base">
            {complexity.reason}
          </span>
          <button
            onClick={() => setComplexity(null)}
            className="ml-auto text-gray-500 hover:text-white text-lg transition"
          >
            ✕
          </button>
        </div>
      )}

      {/* Editor + Output */}
      <div className="flex flex-1 overflow-hidden bg-black min-w-0">
        {/* Editor */}
        <div
          className={`transition-all duration-300 min-w-0 ${
            output ? "flex-3 m-2.5" : "flex-1"
          }`}
        >
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

        {/* Custom Input */}
        {output && (
          <div className="flex-2 min-w-0 border-l border-gray-800 bg-gray-950 flex flex-col shadow-xl">
            <div className="px-5 py-3 bg-gray-900 border-b border-gray-800 text-sm font-medium text-gray-300">
              📥 Custom Input
            </div>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter input here..."
              className="flex-1 bg-gray-950 text-gray-200 p-5 text-sm font-mono outline-none resize-none"
            />
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="flex-2 min-w-0 border-l border-gray-800 bg-gray-950 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center px-5 py-3 bg-gray-900 border-b border-gray-800 text-sm font-medium">
              <span
                className={`${
                  output.status === "error"
                    ? "text-red-400"
                    : output.status === "running"
                      ? "text-yellow-400"
                      : "text-green-400"
                }`}
              >
                {output.status === "error"
                  ? "❌ Error"
                  : output.status === "running"
                    ? "⏳ Running..."
                    : "✅ Output"}
              </span>

              <button
                onClick={() => setOutput(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <pre className="flex-1 overflow-auto p-5 text-sm text-gray-200 font-mono leading-relaxed">
              {output.text}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
