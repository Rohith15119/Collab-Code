import { useCallback } from "react";
import api from "../api/index";

export default function Complexity() {
  const [complexity, setComplexity] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeComplexity = useCallback(async (lastAnalyzedRef) => {
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

  return { analyzeComplexity, complexity, isAnalyzing, setComplexity };
}
