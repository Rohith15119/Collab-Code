const analyzeService = require("../services/ComplexityService");
const { redisClient } = require("../services/Limiter");
const crypto = require("crypto");

async function AnalyzeComplexity(req, res) {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {
    const hash = crypto
      .createHash("sha256")
      .update(code + language)
      .digest("hex");

    const cacheKey = `complexity:${hash}`;

    let cached;

    try {
      cached = await redisClient.get(cacheKey);
    } catch (err) {
      console.error("Redis read error:", err);
    }

    if (cached) {
      return res.status(200).json(JSON.parse(cached));
    }

    const response = await analyzeService.ResponseRetrival(code, language);
    const text = response.choices[0].message.content.trim();

    let parsed;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      parsed = JSON.parse(clean);

      if (!parsed.time || !parsed.space || !parsed.reason) {
        throw new Error("AI returned incomplete data");
      }
    } catch (err) {
      console.error("Invalid JSON from AI:", text);
      return res.status(500).json({ error: "Invalid AI response format" });
    }

    try {
      await redisClient.setEx(cacheKey, 86400, JSON.stringify(parsed));
    } catch (err) {
      console.error("Redis write error:", err);
    }

    return res.status(200).json(parsed);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Analysis failed" });
  }
}

module.exports = { AnalyzeComplexity };
