import { useEffect } from "react";
import toast from "react-hot-toast";
import {
  LANGUAGES,
  LANGUAGE_TEMPLATES,
  FONT_SIZES,
  FONT_FAMILIES,
  THEME_FILE_MAP,
  COMPLEXITY_COLOR,
} from "../utils/constants";

export default function Sessions({
  roomId,
  setLanguage,
  setTitle,
  setCode,
  navigate,
  api,
  setIsLoadingSession,
}) {
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
}
