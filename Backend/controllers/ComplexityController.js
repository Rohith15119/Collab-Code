const analyzeService = require("../services/ComplexityService");

async function AnalyzeComplexity(req, res) {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {
    const response = await analyzeService.ResponseRetrival(code, language);
    const text = response.choices[0].message.content.trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (err) {
      console.error("Invalid JSON from AI:", text);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Analysis failed" });
  }
}

module.exports = { AnalyzeComplexity };
