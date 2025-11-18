// packages/ai/src/testOpenAI.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey:
    "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",
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
