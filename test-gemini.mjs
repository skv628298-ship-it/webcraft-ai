import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

async function testGemini() {
  try {
    const response = await ai.models.generateContent({
      model:"gemini-3.5-flash-lite",
      contents: [
        {
          role: "user",
          parts: [{ text: "Reply with only the word SUCCESS." }]
        }
      ]
    });

    console.log("GEMINI API WORKING!");
    console.log(response.text);

  } catch (error) {
    console.error("GEMINI TEST FAILED:");
    console.error(error.message);
    console.error(error.status);
  }
}

testGemini();