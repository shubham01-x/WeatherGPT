import { Router } from "express";
import { chat } from "../services/ai.service.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "WeatherGPT AI",
    provider: (process.env.AI_PROVIDER || "groq").toLowerCase(),
    configured: Boolean(
      (process.env.AI_PROVIDER || "groq").toLowerCase() === "gemini"
        ? process.env.GEMINI_API_KEY
        : process.env.GROQ_API_KEY
    ),
  });
});

router.post("/chat", async (req, res, next) => {
  try {
    const { message, location, history = [] } = req.body || {};

    if (typeof message !== "string" || !message.trim()) {
      const error = new Error("Please enter a message before sending.");
      error.status = 400;
      throw error;
    }

    if (message.length > 3000) {
      const error = new Error("Message is too long (maximum 3000 characters).");
      error.status = 400;
      throw error;
    }

    const safeHistory = Array.isArray(history)
      ? history
          .filter((item) =>
            item &&
            ["user", "assistant"].includes(item.role) &&
            typeof item.content === "string"
          )
          .slice(-8)
          .map(({ role, content }) => ({ role, content: content.slice(0, 3000) }))
      : [];

    const answer = await chat({
      message: message.trim(),
      location: location || null,
      history: safeHistory,
    });

    res.json({
      answer,
      source: "WeatherGPT AI",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
