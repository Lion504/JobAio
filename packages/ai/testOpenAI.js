// packages/ai/src/testOpenAI.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey:
    "Your-OpenAI-API-Key", // Replace with your actual OpenAI API key
});

async function testOpenAI() {
  try {
    const prompt = "Translate 'Hello world' from English to Spanish";
    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      max_output_tokens: 100,
    });

    // Either output_text or parse from array
    let translation = res.output_text;
    if (!translation && Array.isArray(res.output)) {
      translation = res.output.map((o) => o.text).join("\n");
    }

    console.log("OpenAI Translation:", translation);
  } catch (err) {
    console.error("OpenAI request failed:", err);
  }
}

testOpenAI();
