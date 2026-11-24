
import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Parse JSON requests from WebCraft AI
app.use(express.json({ limit: "1mb" }));

// ==========================================
// GROQ CONFIGURATION
// ==========================================

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const GROQ_MODEL =
  process.env.GROQ_MODEL || "openai/gpt-oss-120b";

if (!GROQ_API_KEY) {
  console.error("Groq API key missing. Check your environment variables.");
  process.exit(1);
}

// ==========================================

const allowedOrigins = (process.env.FRONTEND_URL || "")
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

const capacitorOrigins = [
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
];

app.use(
  cors({
    origin: (origin, callback) => {
      const isLocalhost =
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || "");

      if (
        !origin ||
        isLocalhost ||
        capacitorOrigins.includes(origin) ||
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      return callback(new Error("Origin not allowed by CORS"));
    },
  })
);

// ==========================================
// CLEAN HTML RESPONSE
// ==========================================

function cleanHtml(html) {
  return html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

// ==========================================
// GROQ API REQUEST WITH RETRIES
// ==========================================

async function generateWithGroq(messages) {
  let lastError;

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      console.log(
        `Groq request attempt ${attempt}/2 using ${GROQ_MODEL}...`
      );

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages,
            max_completion_tokens: 12000,
            temperature: 0.7,
          }),
          signal: AbortSignal.timeout(120000),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const error = new Error(
          data?.error?.message || `Groq API error: ${response.status}`
        );

        error.status = response.status;
        throw error;
      }

      const content = data?.choices?.[0]?.message?.content;

      if (!content || !content.trim()) {
        throw new Error("Groq returned an empty response.");
      }

      console.log("Groq response received successfully.");

      return content;

    } catch (error) {
      lastError = error;

      const status = Number(error.status || 0);

      const temporary =
        [408, 429, 500, 502, 503, 504].includes(status) ||
        error.name === "TimeoutError" ||
        error.name === "AbortError" ||
        error.name === "TypeError";

      console.error("Groq request failed:", error.message);

      if (!temporary || attempt === 2) {
        throw error;
      }

      console.log("Temporary Groq error. Retrying in 3 seconds...");

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw lastError || new Error("Groq request failed.");
}

// ==========================================
// FRIENDLY ERROR MESSAGES
// ==========================================

function getFriendlyError(error) {
  const status = Number(error.status || 0);
  const message = error.message || "";

  if (status === 401 || status === 403) {
    return "Groq authentication failed. Please check your API key.";
  }

  if (status === 429) {
    return "Groq API rate limit reached. Please wait and try again.";
  }

  if (status === 400) {
    return `Groq rejected the request: ${message}`;
  }

  if (status === 413) {
    return "The website is too large to edit. Try a smaller website.";
  }

  if ([500, 502, 503, 504].includes(status)) {
    return "Groq is temporarily unavailable. Please try again shortly.";
  }

  if (
    error.name === "TimeoutError" ||
    error.name === "AbortError"
  ) {
    return "The AI request took too long. Please try again.";
  }

  console.error("Unexpected error:", error);

  return "Something went wrong. Please try again.";
}

// ==========================================
// BACKEND HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.send("WebCraft AI backend is running with Groq!");
});

// ==========================================
// GENERATE WEBSITE
// ==========================================

app.post("/api/generate", async (req, res) => {
  try {
    const { prompt } = req.body || {};

    if (
      typeof prompt !== "string" ||
      !prompt.trim() ||
      prompt.length > 5000
    ) {
      return res.status(400).json({
        error: "Enter a valid description (maximum 5000 characters).",
      });
    }

    console.log("Generating website with Groq...");

    const html = await generateWithGroq([
      {
        role: "system",
        content: `
You are WebCraft AI, an expert website designer and developer.

Create beautiful, complete, professional websites from user descriptions.

Requirements:
- Return a complete HTML document.
- Include all CSS inside a style tag.
- Include JavaScript inside script tags when needed.
- Make the website responsive on mobile, tablet and desktop.
- Use modern typography, attractive colors and spacing.
- Include working navigation and interactive elements.
- Use suitable image URLs when images are requested.
- Do not use Markdown code fences.
- Return HTML only.
        `,
      },
      {
        role: "user",
        content: `Create a complete website based on this description:\n\n${prompt}`,
      },
    ]);

    const cleanedHtml = cleanHtml(html);

    if (!cleanedHtml) {
      throw new Error("Groq returned an empty website.");
    }

    console.log("Website generated successfully.");

    return res.json({ html: cleanedHtml });

  } catch (error) {
    console.error("Website generation error:", error);

    const status = Number(error.status);

    return res.status(
      status >= 400 && status <= 599 ? status : 500
    ).json({
      error: getFriendlyError(error),
    });
  }
});

// ==========================================
// EDIT EXISTING WEBSITE
// ==========================================

app.post("/api/edit", async (req, res) => {
  try {
    const { html, instruction } = req.body || {};

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

    console.log("Editing website with Groq...");

    const updatedHtml = await generateWithGroq([
      {
        role: "system",
        content: `
You are WebCraft AI, an expert website designer and developer.

Modify the supplied website according to the user's instructions.

Requirements:
- Preserve existing sections and functionality unless asked to change them.
- Keep the website responsive on mobile, tablet and desktop.
- Preserve existing styling where possible.
- Return the complete updated HTML document.
- Include CSS inside style tags.
- Include JavaScript inside script tags when needed.
- Do not return explanations or Markdown code fences.
- Return HTML only.
        `,
      },
      {
        role: "user",
        content: `
EXISTING WEBSITE HTML:
${html}

REQUESTED CHANGES:
${instruction}

Return the complete updated HTML document.
        `,
      },
    ]);

    const cleanedHtml = cleanHtml(updatedHtml);

    if (!cleanedHtml) {
      throw new Error("Groq returned an empty edited website.");
    }

    console.log("Website edited successfully.");

    return res.json({ html: cleanedHtml });

  } catch (error) {
    console.error("Website editing error:", error);

    const status = Number(error.status);

    return res.status(
      status >= 400 && status <= 599 ? status : 500
    ).json({
      error: getFriendlyError(error),
    });
  }
});

// ==========================================
// START SERVER
// ==========================================

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`WebCraft AI backend running on port ${PORT}`);
  console.log("AI provider: Groq");
  console.log(`AI model: ${GROQ_MODEL}`);
  console.log("Server listening:", server.listening);
});

server.on("error", (error) => {
  console.error("SERVER ERROR:", error);
});
