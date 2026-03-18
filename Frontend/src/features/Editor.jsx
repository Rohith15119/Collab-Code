import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MonacoEditor, { useMonaco } from "@monaco-editor/react";
import toast from "react-hot-toast";
import api from "../api/index";
import { getSocket } from "../socket/index";
import SettingsDrawer from "../features/Editor_Components/SettingsDrawer";
import ShortcutsModal from "../features/Editor_Components/ShortcutsModal";
import { useRunCode } from "../features/hooks/useRunCode";
import Complexity from "../features/hooks/useComplexity";
import { loadTheme } from "../features/utils/themes";
import EditorPref from "./Editor_Components/useEditorPrefs";
import EditorSocket from "./Editor_Components/useEditorSocket";
import Sessions from "./hooks/Sessions";
import Operations from "./hooks/Operations";
import InputPanel from "./Editor_Components/InputPanel";
import OutputPanel from "./Editor_Components/OutputPanel";
import ResizablePanels from "./Editor_Components/ResizablePanels";

import {
  LANGUAGES,
  LANGUAGE_TEMPLATES,
  FONT_SIZES,
  FONT_FAMILIES,
  THEME_FILE_MAP,
  COMPLEXITY_COLOR,
} from "../features/utils/constants";
import ActionButton from "./hooks/ActionButton";

export const themeCache = {};

export default function Editor() {
  const monaco = useMonaco();
  const { roomId } = useParams();
  const navigate = useNavigate();

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

  // ── State ──────────────────────────────────────────────────────────────────
  const [code, setCode] = useState(null);
  const [language, setLanguage] = useState(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [title, setTitle] = useState("Untitled Session");
  const [userInput, setUserInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [codeByLanguage, setCodeByLanguage] = useState({});
  const [tabSize, setTabSize] = useState(2);
  const [wordWrap, setWordWrap] = useState(true);
  const [minimap, setMinimap] = useState(false);
  const [ligatures, setLigatures] = useState(true);
  const [fontFamily, setFontFamily] = useState("Fira Code");
  const [mobilePanel, setMobilePanel] = useState("editor");
  const [showSettings, setShowSettings] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [prefsLoaded, setPrefsLoaded] = useState(false);
  // Controls whether the mobile bottom panel is expanded (for small phones)
  const [bottomExpanded, setBottomExpanded] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────────────
  const codeRef = useRef(null);
  const languageRef = useRef(null);
  const themeRef = useRef(theme);
  const suppressEmitRef = useRef(false);
  const lastAnalyzedRef = useRef({ code: null, language: null, result: null });
  const editorRef = useRef(null);

  // ── Hooks ──────────────────────────────────────────────────────────────────
  const { handleRun, output, isRunning, setOutput } = useRunCode();
  const { analyzeComplexity, isAnalyzing, complexity, setComplexity } =
    Complexity({ codeRef, languageRef });

  const { saveSession, handleCodeChange, handleCopy, handleDownload } =
    Operations({
      roomId,
      setIsSaving,
      codeRef,
      languageRef,
      title,
      setCode,
      suppressEmitRef,
      api,
      getSocket,
      myUserId,
    });

  // ── Sync refs ──────────────────────────────────────────────────────────────
  useEffect(() => {
    codeRef.current = code;
    languageRef.current = language;
    themeRef.current = theme;
  }, [code, language, theme]);

  useEffect(() => {
    if (monaco) loadTheme(monaco, theme, themeCache);
  }, [theme, monaco]);

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

  EditorPref({
    setFontSize,
    setTabSize,
    setWordWrap,
    setMinimap,
    setLigatures,
    setTheme,
    setFontFamily,
    setPrefsLoaded,
  });
  EditorSocket({
    editorRef,
    suppressEmitRef,
    roomId,
    myUserId,
    getSocket,
    setCode,
    setLanguage,
    codeRef,
    languageRef,
  });
  Sessions({
    roomId,
    setLanguage,
    setTitle,
    setCode,
    navigate,
    api,
    setIsLoadingSession,
  });

  // ── Keyboard shortcuts ─────────────────────────────────────────────────────
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
        handleRun({ codeRef, languageRef, userInput, setMobilePanel });
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
    userInput,
  ]);

  // ── Language switch ────────────────────────────────────────────────────────
  const handleLanguageChange = useCallback(
    (e) => {
      const newLang = e.target.value;
      const savedCode = codeByLanguage[newLang] || LANGUAGE_TEMPLATES[newLang];
      setCodeByLanguage((prev) => ({ ...prev, [language]: codeRef.current }));
      setCode(savedCode);
      codeRef.current = savedCode;
      setLanguage(newLang);
      getSocket().emit("code:change", {
        roomId,
        code: savedCode,
        language: newLang,
      });
    },
    [codeByLanguage, language, roomId],
  );

  // ── Shared Monaco options ──────────────────────────────────────────────────
  const mobileMonacoOptions = {
    fontSize: 12,
    minimap: { enabled: false },
    wordWrap: "on",
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  const desktopMonacoOptions = {
    fontSize,
    tabSize,
    minimap: { enabled: minimap },
    wordWrap: wordWrap ? "on" : "off",
    fontFamily,
    fontLigatures: ligatures,
    scrollBeyondLastLine: false,
    automaticLayout: true,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="flex flex-col bg-gray-950 text-gray-200"
      style={{ height: "100dvh", width: "100vw", overflow: "hidden" }}
    >
      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div className="shrink-0 flex flex-wrap items-center gap-2 px-2 sm:px-3 py-2 bg-gray-900 border-b border-gray-800">
        {/* Left: back + title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <button
            onClick={() => {
              saveSession();
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
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm outline-none focus:ring-2 focus:ring-green-500 w-full max-w-[8rem] sm:max-w-xs"
            />
          ) : (
            <span
              onClick={() => setIsEditingTitle(true)}
              className="text-sm text-gray-300 cursor-pointer hover:text-white truncate max-w-[6rem] xs:max-w-[8rem] sm:max-w-xs"
              title="Click to rename"
            >
              {title} ✏️
            </span>
          )}
        </div>

        {/* Center: language + font size selects */}
        <div className="flex items-center gap-1.5 shrink-0">
          <select
            value={language ?? ""}
            onChange={handleLanguageChange}
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none max-w-[7rem] sm:max-w-[10rem]"
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
            className="bg-gray-700 text-white text-xs px-2 py-1.5 rounded-lg outline-none w-16 hidden sm:block"
          >
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}px
              </option>
            ))}
          </select>
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-1 flex-wrap justify-end">
          {/* Always-visible: Save + Run */}
          <ActionButton
            onClick={() => {
              saveSession();
              toast.success("Saved! ✅");
            }}
            icon="💾"
            label={isSaving ? "Saving…" : "Save"}
            disabled={isSaving}
            color="blue"
          />
          <ActionButton
            onClick={() =>
              handleRun({ codeRef, languageRef, userInput, setMobilePanel })
            }
            icon={isRunning ? "⏳" : "▶"}
            label={isRunning ? "Running…" : "Run"}
            disabled={isRunning}
            color="green"
          />

          {/* Secondary: hidden on very small screens, visible from sm */}
          <span className="hidden sm:contents">
            <ActionButton onClick={handleCopy} icon="📋" label="Copy" />
            <ActionButton onClick={handleDownload} icon="⬇️" label="Download" />
            <ActionButton
              onClick={() => analyzeComplexity(lastAnalyzedRef, api)}
              icon="📊"
              label={isAnalyzing ? "Analyzing…" : "Complexity"}
              disabled={isAnalyzing}
              color="purple"
            />
          </span>

          {/* Settings + shortcuts always visible */}
          <ActionButton
            onClick={() => setShowShortcuts(true)}
            label="Shortcuts"
            icon="⌨️"
          />
          <ActionButton
            onClick={() => setShowSettings(true)}
            icon="⚙️"
            label="Settings"
          />
        </div>
      </div>

      {/* ── COMPLEXITY BAR ───────────────────────────────────────────────── */}
      {complexity && (
        <div className="shrink-0 flex flex-wrap items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 bg-gray-900 border-b border-purple-800 text-xs sm:text-sm">
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
          <span className="text-gray-400 italic text-xs flex-1 min-w-0 break-words">
            {complexity.reason}
          </span>
          <button
            onClick={() => setComplexity(null)}
            className="ml-auto shrink-0 text-gray-500 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* ── 📱 MOBILE (< md) ── */}
        <div className="md:hidden flex flex-col h-full">
          {/* Editor fills remaining space */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              onMount={(editor, monacoInstance) => {
                loadTheme(monacoInstance, themeRef.current, themeCache);
                editorRef.current = editor;
              }}
              options={mobileMonacoOptions}
            />
          </div>

          {/* Bottom panel — toggleable height */}
          <div
            className="shrink-0 bg-gray-900 border-t border-gray-800 flex flex-col transition-all duration-200"
            style={{ height: bottomExpanded ? "55%" : "38%" }}
          >
            {/* Tab bar */}
            <div className="flex shrink-0 border-b border-gray-800">
              {["input", "output"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobilePanel(tab)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    mobilePanel === tab
                      ? "text-green-400 border-b-2 border-green-500"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  {tab === "input" ? "📥 Input" : "📤 Output"}
                </button>
              ))}
              {/* Expand toggle */}
              <button
                onClick={() => setBottomExpanded((v) => !v)}
                className="px-3 text-gray-500 hover:text-gray-300 text-xs"
                title="Toggle panel height"
              >
                {bottomExpanded ? "▼" : "▲"}
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {mobilePanel === "input" && (
                <InputPanel userInput={userInput} setUserInput={setUserInput} />
              )}
              {mobilePanel === "output" &&
                (output ? (
                  <OutputPanel output={output} setOutput={setOutput} />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                    <span className="text-2xl">🚀</span>
                    <span className="text-xs">Run code to see output</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* ── 💻 DESKTOP (≥ md) ── */}
        <div className="hidden md:flex h-full">
          <ResizablePanels
            left={
              <MonacoEditor
                height="100%"
                language={language}
                value={code}
                onChange={handleCodeChange}
                onMount={(editor, monacoInstance) => {
                  loadTheme(monacoInstance, themeRef.current, themeCache);
                  editorRef.current = editor;
                }}
                options={desktopMonacoOptions}
              />
            }
            middle={
              <InputPanel userInput={userInput} setUserInput={setUserInput} />
            }
            right={
              output ? (
                <OutputPanel output={output} setOutput={setOutput} />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                  <span className="text-3xl">🚀</span>
                  <span className="text-sm">Run code to see output</span>
                </div>
              )
            }
          />
        </div>
      </div>

      {/* ── DRAWERS / MODALS ──────────────────────────────────────────────── */}
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
