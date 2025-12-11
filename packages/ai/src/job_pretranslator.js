import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Validate required environment variables
if (!process.env.GEMINI_API_KEY) {
  throw new Error(
    "Missing required environment variable: GEMINI_API_KEY. Please set it in your .env file.",
  );
}
if (!process.env.GEMINI_MODEL_NAME) {
  throw new Error(
    "Missing required environment variable: GEMINI_MODEL_NAME. Please set it in your .env file.",
  );
}

// Initialize Gemini API
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Export helper functions for testing
export { extractJsonFromResponse, safeJsonParse };

/**
 * Advanced JSON repair for AI-generated content
 * Handles unescaped quotes within string values and other common issues
 */
function repairJsonString(jsonString) {
  let result = jsonString;

  // Find all string values in the JSON (content between quotes after colons)
  const stringValueRegex = /":\s*"([^"]*(?:"[^"]*)*)"(?=[,\]\}])/g;
  let match;

  while ((match = stringValueRegex.exec(result)) !== null) {
    const fullMatch = match[0];
    const stringContent = match[1];

    // Check if this string contains unescaped quotes
    if (stringContent.includes('"')) {
      // Replace unescaped quotes with escaped ones
      const escapedContent = stringContent.replace(/"/g, '\\"');
      const newString = `": "${escapedContent}"`;

      // Replace in the result
      result = result.replace(fullMatch, newString);
    }
  }

  return result;
}

/**
 * Conservative JSON extraction from AI response
 * Only applies fixes when JSON is actually malformed
 */
function extractJsonFromResponse(responseText) {
  let cleanText = responseText.trim();

  // Remove markdown code blocks
  if (cleanText.startsWith("```json")) {
    cleanText = cleanText.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  cleanText = cleanText.trim();

  // Handle AI responses wrapped in quotes (common with some models)
  if (cleanText.startsWith('"') && cleanText.endsWith('"')) {
    try {
      // Try to parse as JSON with quotes removed
      const unquoted = cleanText.slice(1, -1);
      JSON.parse(unquoted); // Test if it's valid
      cleanText = unquoted;
    } catch (e) {
      // If unquoted version isn't valid JSON, keep the original
    }
  }

  // Try to find JSON array boundaries if there's extra text
  const jsonStart = cleanText.indexOf("[");
  const jsonEnd = cleanText.lastIndexOf("]");

  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanText = cleanText.substring(jsonStart, jsonEnd + 1);
  }

  // FIRST: Try to parse as-is. If it works, return unchanged.
  try {
    JSON.parse(cleanText);
    return cleanText; // Valid JSON, return as-is
  } catch (e) {
    // JSON is malformed, apply fixes
  }

  // Apply advanced JSON repair for unescaped quotes (only on malformed JSON)
  cleanText = repairJsonString(cleanText);

  // Remove any trailing commas before closing braces/brackets
  cleanText = cleanText.replace(/,(\s*[}\]])/g, "$1");

  // Fix common JSON issues (only on malformed JSON)
  cleanText = cleanText
    .replace(/,\s*}/g, "}") // Remove trailing commas
    .replace(/,\s*]/g, "]") // Remove trailing commas in arrays
    .replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":') // Quote unquoted keys
    .replace(/:\s*([a-zA-Z][^",\[\]{}\n]*)([,}])/g, ':"$1"$2'); // Only quote string values (not numbers)

  return cleanText;
}

/**
 * Safe JSON parsing with multiple fallback strategies
 */
function safeJsonParse(jsonText) {
  let parsed = null;

  // 1: Direct parse
  try {
    parsed = JSON.parse(jsonText);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}

  // 2: Extract and repair JSON
  try {
    const extracted = extractJsonFromResponse(jsonText);
    parsed = JSON.parse(extracted);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}

  // 3: Return empty array to prevent crashes
  console.warn("All JSON parsing strategies failed, returning empty array");
  return [];
}

/**
 * Batch translate a list of jobs in one API call
 * @param {Array} jobsBatch - max 20 currently
 * @returns {Promise<Array>} - List of jobs with translated fields
 */
async function translateBatch(jobsBatch) {
  if (!jobsBatch || jobsBatch.length === 0) return [];

  //console.log(`  Writing batch prompt for ${jobsBatch.length} jobs...`);

  // Prepare minimal input for translation (ID + text fields)
  const inputForAi = jobsBatch.map((job, index) => ({
    id: index,
    title: job.title,
    description: job.description,
  }));

  const prompt = `
  You are a professional translator specializing in job descriptions.
  Translate the "title" and "description" fields to English.

  CRITICAL REQUIREMENTS:
  - Return ONLY a valid JSON array
  - No explanations, no markdown, no extra text
  - Format: [{"id": 0, "title": "translated title", "description": "translated desc"}, ...]
  - Ensure all strings are properly escaped
  - No trailing commas

  Input:
  ${JSON.stringify(inputForAi)}
  `;

  try {
    const result = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.text;
    // console.log("=== RAW AI RESPONSE START ===");
    // console.log(responseText);
    // console.log("=== RAW AI RESPONSE END ===");
    const cleanJson = extractJsonFromResponse(responseText);

    const translatedData = safeJsonParse(cleanJson);

    if (!Array.isArray(translatedData)) {
      throw new Error("AI response could not be parsed as valid JSON array");
    }

    // Map results back to original job objects
    return jobsBatch.map((originalJob, index) => {
      const translatedItem = translatedData.find((t) => t.id === index);

      if (translatedItem) {
        return {
          ...originalJob,
          title: translatedItem.title || originalJob.title,
          description: translatedItem.description || originalJob.description,
          original_title: originalJob.title,
          original_description: originalJob.description,
          _metadata: {
            ...originalJob._metadata,
            pretranslation: {
              completed_at: new Date().toISOString(),
              method: "batch_v1",
              source_language: "auto",
              target_language: "en",
            },
          },
        };
      } else {
        // Fallback if item missing in response
        console.warn(
          `  ⚠️ Item ${index} missing in batch response, keeping original.`,
        );
        return {
          ...originalJob,
          _metadata: {
            ...originalJob._metadata,
            pretranslation: { error: "missing_in_batch" },
          },
        };
      }
    });
  } catch (err) {
    console.error(`  ❌ Batch translation failed: ${err.message}`);
    // Fallback: Return originals with error metadata
    return jobsBatch.map((job) => ({
      ...job,
      _metadata: {
        ...job._metadata,
        pretranslation: {
          error: err.message,
          failed_at: new Date().toISOString(),
        },
      },
    }));
  }
}

/**
 * Helper to process arrays in parallel with a concurrency limit
 */
async function processInParallel(items, concurrency, fn) {
  const results = [];
  const executing = [];

  for (const item of items) {
    const p = fn(item).then((res) => {
      executing.splice(executing.indexOf(p), 1);
      return res;
    });

    results.push(p);
    executing.push(p);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
    }
  }

  return Promise.all(results);
}

/**
 * Batch translate multiple jobs to English with concurrent processing
 */
export async function pretranslateJobsToEnglish(jobs) {
  // OPTIMIZATION: Reduced batch size to 3 to prevent token limit truncation
  // Increased concurrency to 5 to maintain throughput
  const BATCH_SIZE = 10;
  const CONCURRENCY = 5;

  console.log(
    `Processing ${jobs.length} jobs with Batch Size ${BATCH_SIZE} and Concurrency ${CONCURRENCY}...`,
  );

  // Create batches
  const batches = [];
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push({
      index: Math.floor(i / BATCH_SIZE) + 1,
      data: jobs.slice(i, i + BATCH_SIZE),
    });
  }

  const totalBatches = batches.length;
  console.log(
    `Created ${totalBatches} batches. Starting parallel execution...`,
  );

  const results = await processInParallel(
    batches,
    CONCURRENCY,
    async (batch) => {
      console.log(
        `▶️ [Batch ${batch.index}/${totalBatches}] Starting translation for ${batch.data.length} jobs...`,
      );
      const batchResult = await translateBatch(batch.data);
      console.log(`✅ [Batch ${batch.index}/${totalBatches}] Completed.`);
      return batchResult;
    },
  );

  // Flatten results
  const translatedJobs = results.flat();

  //console.log(`\n✨ All ${translatedJobs.length} jobs processed successfully.`);
  return translatedJobs;
}

// CLI interface for when script is run directly
if (process.argv[1]?.endsWith("job_pretranslator.js")) {
  const inputFile = process.argv[2];
  const outputFile = process.argv[3];

  if (!inputFile || !outputFile) {
    console.error(
      "Usage: node job_pretranslator.js <input.json> <output.json>",
    );
    process.exit(1);
  }

  try {
    // Read input file
    const inputData = await fs.readFile(inputFile, "utf-8");
    const jobs = JSON.parse(inputData);

    if (!Array.isArray(jobs)) {
      throw new Error("Input file must contain an array of jobs");
    }

    // Process jobs
    const translatedJobs = await pretranslateJobsToEnglish(jobs);

    // Write output file
    await fs.writeFile(
      outputFile,
      JSON.stringify(translatedJobs, null, 2),
      "utf-8",
    );

    //console.log(
    //  `Successfully wrote ${translatedJobs.length} translated jobs to ${outputFile}`,
    //);
  } catch (error) {
    console.error("Pretranslation failed:", error.message);
    process.exit(1);
  }
}
