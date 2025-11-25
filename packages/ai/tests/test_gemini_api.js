import { GoogleGenAI } from "@google/genai";

// Load environment variables
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Pass the API key explicitly
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function main() {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: "Explain how AI works in a few words",
    });
    console.log(response.text);
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main();
