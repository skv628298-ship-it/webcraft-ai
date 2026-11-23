
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({
        error: "Please enter a website description."
      });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `
        You are WebCraft AI, an expert website developer.

        Create a complete, professional, responsive website
        based on this description:

        ${prompt}

        Return complete HTML, CSS and JavaScript.
        Return HTML code only.
        Do not use Markdown code fences.
      `,
    });

    if (!response.text) {
      throw new Error("Empty AI response");
    }

    return res.status(200).json({
      html: response.text
    });

  } catch (error) {
    console.error("Gemini API Error:", error);

    return res.status(500).json({
      error: "Website generation failed."
    });
  }
}
