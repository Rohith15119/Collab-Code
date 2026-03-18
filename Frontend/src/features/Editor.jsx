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

  //UseState hooks
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

  //Ref's
  const codeRef = useRef(null);
  const languageRef = useRef(null);
  const themeRef = useRef(theme);
  const suppressEmitRef = useRef(false);
  const lastAnalyzedRef = useRef({ code: null, language: null, result: null });
  const editorRef = useRef(null);

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
        handleRun({
          codeRef,
          languageRef,
          userInput,
          setMobilePanel,
        });
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
              codeRef.current = savedCode;
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
          <ActionButton onClick={handleCopy} icon="📋" label="Copy" />
          <ActionButton onClick={handleDownload} icon="⬇️" label="Download" />
          <ActionButton
            onClick={() => analyzeComplexity(lastAnalyzedRef, api)}
            icon="📊"
            label={isAnalyzing ? "Analyzing…" : "Complexity"}
            disabled={isAnalyzing}
            color="purple"
          />
          <ActionButton
            onClick={() => setShowShortcuts(true)}
            label="Keyboard shortcuts"
            icon="⌨️"
          />

          <ActionButton
            onClick={() => setShowSettings(true)}
            icon="⚙️"
            label="Settings"
          />

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

      {/* ── MAIN CONTENT ── */}
      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* 📱 MOBILE VIEW */}
        <div className="md:hidden h-full">
          {mobilePanel === "editor" && (
            <MonacoEditor
              height="100%"
              language={language}
              value={code}
              onChange={handleCodeChange}
              onMount={(editor, monacoInstance) => {
                loadTheme(monacoInstance, themeRef.current, themeCache);
                editorRef.current = editor;
              }}
              options={{
                fontSize,
                tabSize,
                minimap: { enabled: minimap },
                wordWrap: wordWrap ? "on" : "off",
                fontFamily,
                fontLigatures: ligatures,
              }}
            />
          )}

          {mobilePanel === "input" && (
            <InputPanel userInput={userInput} setUserInput={setUserInput} />
          )}

          {mobilePanel === "output" &&
            (output ? (
              <OutputPanel output={output} setOutput={setOutput} />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Run code to see output 🚀
              </div>
            ))}
        </div>

        {/* 💻 DESKTOP VIEW */}
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
                options={{
                  fontSize,
                  tabSize,
                  minimap: { enabled: minimap },
                  wordWrap: wordWrap ? "on" : "off",
                  fontFamily,
                  fontLigatures: ligatures,
                }}
              />
            }
            middle={
              <InputPanel userInput={userInput} setUserInput={setUserInput} />
            }
            right={
              output ? (
                <OutputPanel output={output} setOutput={setOutput} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Run code to see output 🚀
                </div>
              )
            }
          />
        </div>
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
