
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CHECK API KEY
if (!process.env.GEMINI_API_KEY) {
  console.error("Gemini API key missing. Check your .env file.");
  process.exit(1);
}

// INITIALIZE GEMINI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// CORS CONFIGURATION
const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin || "");

      if (!origin || isLocalhost || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

app.use(express.json({ limit: "5mb" }));

// CLEAN HTML RESPONSE
const cleanHtml = (html) => {
  return html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
};

// FRIENDLY ERROR MESSAGES
const getFriendlyError = (error) => {
  const message = error?.message || "";
  const status = error?.status;

  if (status === 503 || message.includes("503")) {
    return "Gemini is currently busy. Please wait a minute and try again.";
  }

  if (status === 429 || message.includes("429")) {
    return "Gemini API request limit reached. Please try again later.";
  }

  if (status === 400 || message.includes("400")) {
    return "Invalid request. Please check your input.";
  }

  console.error("Gemini error details:", error);

  return "Something went wrong. Please try again.";
};

// RETRY TEMPORARY GEMINI ERRORS
const generateWithRetry = async (request) => {
  const maxAttempts = 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await ai.models.generateContent(request);
    } catch (error) {
      const status = error?.status;

      const isTemporary =
        status === 503 ||
        status === 500 ||
        status === 429 ||
        status === 504;

      if (!isTemporary || attempt === maxAttempts) {
        throw error;
      }

      const delay = attempt * 3000;

      console.log(
        `Gemini temporarily unavailable. Retry ${attempt + 1}/${maxAttempts} in ${delay / 1000}s...`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// BACKEND HEALTH CHECK
app.get("/", (req, res) => {
  res.send("WebCraft AI backend is running!");
});

// GENERATE WEBSITE
app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 5000
    ) {
      return res.status(400).json({
        error: "Enter a valid description (maximum 5000 characters).",
      });
    }

    console.log("Generating website...");

    const response = await generateWithRetry({
      model: "gemini-3.5-flash-lite",
      contents: `
You are WebCraft AI, an expert website developer.

Create a complete, attractive website based on this description:

${prompt}

Requirements:
- Return a complete HTML document.
- Include all CSS inside a style tag.
- Include JavaScript inside script tags when needed.
- Make the website responsive on mobile, tablet and desktop.
- Use modern typography, attractive colors and spacing.
- Include working navigation and interactive elements.
- Do not use Markdown code fences.
- Return HTML only.
      `,
    });

    const html = cleanHtml(response.text || "");

    if (!html) {
      throw new Error("Gemini returned an empty response.");
    }

    console.log("Website generated successfully.");

    res.json({ html });

  } catch (error) {
    console.error("Website generation error:", error);

    const status =
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status <= 599
        ? error.status
        : 500;

    res.status(status).json({
      error: getFriendlyError(error),
    });
  }
});

// EDIT EXISTING WEBSITE
app.post("/api/edit", async (req, res) => {
  try {
    const { html, instruction } = req.body;

    if (
      typeof html !== "string" ||
      !html.trim() ||
      html.length > 500000
    ) {
      return res.status(400).json({
        error: "Please provide a valid website to edit.",
      });
    }

    if (
      typeof instruction !== "string" ||
      !instruction.trim() ||
      instruction.length > 3000
    ) {
      return res.status(400).json({
        error: "Enter a valid editing instruction (maximum 3000 characters).",
      });
    }

    console.log("Editing website...");

    const response = await generateWithRetry({
      model: "gemini-3.8-flash",
      contents: `
You are WebCraft AI, an expert website designer and developer.

The user has an existing website and wants to modify it.

EXISTING WEBSITE HTML:
${html}

USER'S REQUESTED CHANGES:
${instruction}

IMPORTANT REQUIREMENTS:
- Apply the requested changes to the existing website.
- Preserve existing sections and functionality unless the user asks to change them.
- Keep the website responsive on mobile, tablet and desktop.
- Preserve existing styling where possible.
- Return the complete updated HTML document.
- Include all CSS inside style tags.
- Include JavaScript inside script tags when needed.
- Do not return explanations or Markdown code fences.
- Return HTML only.
      `,
    });

    const updatedHtml = cleanHtml(response.text || "");

    if (!updatedHtml) {
      throw new Error("Gemini returned an empty edited website.");
    }

    console.log("Website edited successfully.");

    res.json({ html: updatedHtml });

  } catch (error) {
    console.error("Website editing error:", error);

    const status =
      Number.isInteger(error.status) &&
      error.status >= 400 &&
      error.status <= 599
        ? error.status
        : 500;

    res.status(status).json({
      error: getFriendlyError(error),
    });
  }
});

// START SERVER
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`WebCraft AI backend running on port ${PORT}`);
  console.log("Server listening:", server.listening);
});

server.on("close", () => {
  console.log("WARNING: Server has closed!");
});

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
});
