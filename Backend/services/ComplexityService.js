const Groq = require("groq-sdk");
const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const ResponseRetrival = async (code, language) => {
  return client.chat.completions.create({
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

                analyse the time complexity very depth and give very accurate and precise time complexity including space complexity too.

                Code:
                ${code}
                `,
      },
    ],
  });
};

module.exports = { ResponseRetrival };
