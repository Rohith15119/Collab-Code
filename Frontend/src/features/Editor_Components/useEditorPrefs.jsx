import { useEffect } from "react";

export default function EditorPref({
  setFontSize,
  setTabSize,
  setWordWrap,
  setMinimap,
  setLigatures,
  setTheme,
  setFontFamily,
  setPrefsLoaded,
}) {
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
}
