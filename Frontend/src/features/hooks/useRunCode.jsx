import { useState, useCallback } from "react";

export function useRunCode() {
  const [output, setOutput] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  const handleRun = useCallback(
    async ({ setMobilePanel, codeRef, languageRef, userInput }) => {
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
        setOutput({
          status: "error",
          text: `${currentLang} not supported yet`,
        });
        setIsRunning(false);
        return;
      }

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
    },
    [userInput],
  );

  return { handleRun, output, isRunning, setOutput };
}
