const express = require("express");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  return new OpenAI({ apiKey });
}

app.get("/", (req, res) => {
  res.json({
    name: "DEMON AI",
    status: "online",
    message: "DEMON AI backend is running."
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please provide a message."
      });
    }

    if (message.length > 12000) {
      return res.status(413).json({
        error: "Message is too long."
      });
    }

    if (!Array.isArray(history) || history.length > 20) {
      return res.status(400).json({
        error: "Invalid conversation history."
      });
    }

    const messages = [
      {
        role: "system",
        content:
          "You are DEMON, a helpful personal AI assistant. " +
          "Answer clearly and honestly. Help with learning, " +
          "programming, business, writing, and everyday questions."
      }
    ];

    for (const item of history) {
      if (
        !item ||
        !["user", "assistant"].includes(item.role) ||
        typeof item.content !== "string"
      ) {
        return res.status(400).json({
          error: "Invalid history item."
        });
      }

      messages.push({
        role: item.role,
        content: item.content.slice(0, 12000)
      });
    }

    messages.push({
      role: "user",
      content: message.trim()
    });

    const openai = getOpenAI();

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      max_tokens: 1000
    });

    res.json({
      reply:
        response.choices[0]?.message?.content ||
        "I couldn't generate a response. Please try again."
    });
  } catch (error) {
    console.error("DEMON chat error:", error.message);

    res.status(500).json({
      error: "DEMON couldn't answer right now. Please try again."
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`DEMON AI backend listening on port ${PORT}`);
});
