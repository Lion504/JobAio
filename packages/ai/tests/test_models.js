/**
 * Test script to find working Gemini model
 */
require("dotenv").config({
  path: require("path").resolve(__dirname, "../.env"),
});

const { GoogleGenAI } = require("@google/genai");

const modelsToTest = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-pro-preview",
];

async function testModel(modelName) {
  try {
    const genAI = new GoogleGenAI(process.env.GEMINI_API_KEY);
    const model = genAI.models.generateContent({ model: modelName });

    const result = await model.generateContent("Say hello in one word", {
      generationConfig: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const response = await result.response;
    const text = response.text();

    console.log(`✅ ${modelName}: ${text.trim()}`);
    return { model: modelName, success: true, response: text.trim() };
  } catch (error) {
    console.log(`❌ ${modelName}: ${error.message.split("\n")[0]}`);
    return { model: modelName, success: false, error: error.message };
  }
}

async function main() {
  console.log("Testing Gemini models...\n");

  const results = [];
  for (const modelName of modelsToTest) {
    const result = await testModel(modelName);
    results.push(result);
  }

  console.log("\n" + "=".repeat(60));
  console.log("SUMMARY:");
  console.log("=".repeat(60));

  const working = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  console.log(`\n✅ Working models (${working.length}):`);
  working.forEach((r) => console.log(`   - ${r.model}`));

  console.log(`\n❌ Failed models (${failed.length}):`);
  failed.forEach((r) => console.log(`   - ${r.model}`));

  if (working.length > 0) {
    console.log(`\n🎯 Recommended model: ${working[0].model}`);
  }
}

main().catch(console.error);
