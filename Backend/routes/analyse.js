const express = require("express");
const Groq = require("groq-sdk");
const rateLimit = require("express-rate-limit");

const router = express.Router();
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: "Too many requests. Please try again in 1 minute.",
});

router.post("/analyze-complexity", limiter, async (req, res) => {
  const { code, language } = req.body;

  if (!code || !language) {
    return res.status(400).json({ error: "Code and language are required" });
  }

  try {
    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: `
                You are a strict algorithm analyzer.

                Analyze the following ${language} code.
                Respond ONLY with valid JSON in this format:
                {"time":"O(...)","space":"O(...)","reason":"one sentence"}

                Do not add markdown.
                Do not add extra text.

                Code:
                ${code}
                `,
        },
      ],
    });
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
    res.status(500).json({ error: "Analysis failed" });
  }
});

module.exports = router;
