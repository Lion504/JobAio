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

/**
 * Simple translation function for title and description only
 */
async function translateText(
  text,
  sourceLang = "auto",
  targetLang = "en",
  retries = 3,
) {
  if (!text || text.trim() === "") {
    return text;
  }

  const prompt = `Translate the following text from ${sourceLang}
  to ${targetLang}. Provide only the translated text without
  any additional comments or formatting:

${text}`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let translatedText = response.text?.trim();
    if (!translatedText) {
      console.error(`[translateText] Empty response received`);
      return text;
    }

    // Remove any quotes that might wrap the response
    translatedText = translatedText.replace(/^["']|["']$/g, "");

    return translatedText;
  } catch (err) {
    if (retries > 0) {
      console.error(
        `Translation failed, retrying in 20s... (${retries} retries left)`,
      );
      await new Promise((r) => setTimeout(r, 20000));
      return translateText(text, sourceLang, targetLang, retries - 1);
    }

    console.error(`[translateText] Translation failed:`, err.message);
    return text; // Return original on failure
  }
}

/**
 * Translate a single job's title and description to English
 */
async function translateJob(job) {
  try {
    // Store original title and description
    const originalTitle = job.title;
    const originalDescription = job.description;

    // Translate title and description to English
    const translatedTitle = await translateText(job.title);
    const translatedDescription = await translateText(job.description);

    // Merge back with original non-translated fields
    return {
      ...job,
      title: translatedTitle,
      description: translatedDescription,
      original_title: originalTitle,
      original_description: originalDescription,
      _metadata: {
        ...job._metadata,
        pretranslation: {
          completed_at: new Date().toISOString(),
          source_language: "auto",
          target_language: "en",
        },
      },
    };
  } catch (error) {
    // Return original job with error marker
    return {
      ...job,
      _metadata: {
        ...job._metadata,
        pretranslation: {
          error: error.message,
          failed_at: new Date().toISOString(),
          source_language: "unknown",
        },
      },
    };
  }
}

/**
 * Batch translate multiple jobs to English with concurrent processing and rate limiting
 */
export async function pretranslateJobsToEnglish(jobs) {
  const translatedJobs = [];
  const BATCH_SIZE = 5; // Process 5 jobs concurrently
  const BATCH_DELAY = 1000; // 1 second between batches

  console.log(`Processing ${jobs.length} jobs in batches of ${BATCH_SIZE}...`);

  // Split jobs into batches
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    const batch = jobs.slice(i, i + BATCH_SIZE);
    const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);

    console.log(
      `Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)...`,
    );

    // Process batch concurrently
    const batchPromises = batch.map((job) => translateJob(job));
    const translatedBatch = await Promise.all(batchPromises);

    translatedJobs.push(...translatedBatch);
    console.log(`✅ Batch ${batchNumber}/${totalBatches} completed`);

    // Rate limiting between batches (except for the last batch)
    if (i + BATCH_SIZE < jobs.length) {
      // console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
    }
  }

  console.log(`✅ All ${translatedJobs.length} jobs processed`);
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

    // console.log(`Processing ${jobs.length} jobs...`);

    // Process jobs
    const translatedJobs = await pretranslateJobsToEnglish(jobs);

    // Write output file
    await fs.writeFile(
      outputFile,
      JSON.stringify(translatedJobs, null, 2),
      "utf-8",
    );

    console.log(
      `Successfully wrote ${translatedJobs.length} translated jobs to ${outputFile}`,
    );
  } catch (error) {
    console.error("Pretranslation failed:", error.message);
    process.exit(1);
  }
}
