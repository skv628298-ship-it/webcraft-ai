
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

if (!process.env.GEMINI_API_KEY) {
  console.error("Gemini API key missing. Check your .env file.");
  process.exit(1);
}

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Add your deployed frontend URL to FRONTEND_URL later.
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    const isLocalhost =
      /^http:\/\/localhost:\d+$/.test(origin || "") ||
      /^http:\/\/127\.0\.0\.1:\d+$/.test(origin || "");

    if (
      !origin ||
      isLocalhost ||
      allowedOrigins.includes(origin)
    ) {
      return callback(null, true);
    }

    callback(new Error("Origin not allowed by CORS"));
  }
}));

app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => {
  res.send("WebCraft AI backend is running!");
});

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 5000
    ) {
      return res.status(400).json({
        error: "Please enter a valid website description (maximum 5000 characters)."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `
        You are WebCraft AI, an expert website developer.

        Create a complete, professional website based on this user description:

        ${prompt}

        Requirements:
        - Modern and attractive UI design.
        - Fully responsive on mobile, tablet and desktop.
        - Professional typography and colors.
        - Smooth hover effects and animations.
        - Working navigation and buttons.
        - Include complete HTML and CSS.
        - Use JavaScript for interactive features.
        - Return complete HTML code only.
        - Do not include Markdown code fences.
      `,
    });

    if (!response.text) {
      throw new Error("AI returned an empty response.");
    }

    res.json({ html: response.text });

  } catch (error) {
    console.error("Gemini API Error:", error);

    res.status(500).json({
      error: "Website generation failed. Please try again."
    });
  }
});

app.listen(PORT, () => {
  console.log(`WebCraft AI backend running on port ${PORT}`);
});
