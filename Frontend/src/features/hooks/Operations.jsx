import { useCallback } from "react";
import toast from "react-hot-toast";

export default function Operations({
  roomId,
  setIsSaving,
  codeRef,
  languageRef,
  title,
  setCode,
  suppressEmitRef,
  api,
  getSocket,
}) {
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
    if (suppressEmitRef.current) {
      suppressEmitRef.current = false;
      setCode(value);
      codeRef.current = value;
      return;
    }

    setCode(value);
    codeRef.current = value;

    if (!languageRef.current) return;

    getSocket().emit("code:change", {
      roomId,
      code: value,
      language: languageRef.current,
    });
  };

  const handleCopy = useCallback(() => {
    if (!codeRef.current) return;
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

    if (!codeRef.current) return;

    const blob = new Blob([codeRef.current], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `${title}.${ext[languageRef.current] || "txt"}`;
    a.click();
    toast.success("Downloaded! 💾");
  }, [title]);

  return { saveSession, handleCodeChange, handleCopy, handleDownload };
}
