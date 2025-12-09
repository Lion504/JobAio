import { GoogleGenAI } from "@google/genai";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";

// Import OriginalJob model directly
import OriginalJob from "../../db/src/models/OriginalJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

//export const TARGET_LANGUAGES = ["es", "fr", "pt", "de", "ur", "ta", "zh"];
export const TARGET_LANGUAGES = ["es", "zh"];

// Batch processing configuration
const BATCH_SIZE = 10; // 10 jobs per API call (Unified mode)
const CONCURRENCY = 5; // 5 batches in parallel
const RETRY_DELAY = 10000;
const MAX_RETRIES = 3;

// Paths
const ROOT_DIR = path.resolve(__dirname, "../../..");
const TRANSLATED_DATA_DIR = path.join(ROOT_DIR, "packages/db/data/translated");

// API Key validation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY not set.");
}

// Initialize Google AI SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Helper to clean JSON response
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Helper to process items in parallel with concurrency limit
 */
async function processInParallel(items, concurrency, taskFn) {
  const results = [];
  const executing = [];
  for (const item of items) {
    const p = taskFn(item).then((res) => {
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
 * Unified Batch Translation: Translates 10 jobs to 1 language in ONE prompt.
 */
async function translateBatchForLanguageUnified(
  jobs,
  targetLang,
  retries = MAX_RETRIES,
) {
  // Minimal input for token efficiency
  const inputForAi = jobs.map((job, idx) => ({
    id: idx,
    title: job.title,
    industry: job.industry_category,
    type: job.job_type,
    exp: job.experience_level,
    edu: job.education_level,
    resp: job.responsibilities,
    skills: job.skill_type,
  }));

  const prompt = `
  You are a professional technical translator.
  Translate the following job data to '${targetLang}'.
  
  Input is a list of jobs. Return a STRICT JSON ARRAY of translated jobs.
  Maintain the exact same structure and keys (id, title, industry, type, exp, edu, resp, skills).
  Do NOT translate technical terms (e.g. "React", "Python").
  
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
    const cleanJson = cleanJsonResponse(responseText);
    const translatedBatch = JSON.parse(cleanJson);

    if (!Array.isArray(translatedBatch)) {
      throw new Error("API response is not an array");
    }

    // Map back to full job objects
    return jobs.map((originalJob, idx) => {
      // Find matching translation by ID or index
      const translation =
        translatedBatch.find((t) => t.id === idx) || translatedBatch[idx];

      if (!translation) return null; // Partial failure

      // Construct standard translation object
      return {
        lang: targetLang,
        translated_at: new Date(),
        title: translation.title,
        industry_category: translation.industry,
        job_type: translation.type,
        experience_level: translation.exp,
        education_level: translation.edu,
        responsibilities: translation.resp,
        skill_type: translation.skills,
      };
    });
  } catch (err) {
    if (retries > 0 && err.message.includes("429")) {
      console.warn(`  ⚠️ Rate limit for ${targetLang}. Retrying...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return translateBatchForLanguageUnified(jobs, targetLang, retries - 1);
    }
    console.error(
      `  ❌ Batch translation to '${targetLang}' failed: ${err.message}`,
    );
    return null;
  }
}

/**
 * Process a batch of jobs: Translate to ALL languages
 */
async function processBatchUnified(batchData) {
  const { jobs } = batchData;
  // Initialize result map
  const jobResults = new Map();
  jobs.forEach((job) => {
    jobResults.set(job._id.toString(), {
      job_id: job._id,
      translations: [],
    });
  });

  // Run translations for each language sequentially
  for (const lang of TARGET_LANGUAGES) {
    const translatedList = await translateBatchForLanguageUnified(jobs, lang);

    if (translatedList) {
      translatedList.forEach((trans, idx) => {
        if (trans) {
          const jobId = jobs[idx]._id.toString();
          const res = jobResults.get(jobId);
          if (res) res.translations.push(trans);
        }
      });
    }
    // Small delay between languages
    await new Promise((r) => setTimeout(r, 500));
  }

  return Array.from(jobResults.values());
}

/**
 * Output all translation results to a single file
 * @param {Array} allResults - All translation results
 * @param {Object} stats - Processing statistics
 */
async function outputAllTranslations(allResults, stats) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `translated_batch_${timestamp}.json`;
  const filepath = path.join(TRANSLATED_DATA_DIR, filename);

  const outputData = {
    processed_at: new Date().toISOString(),
    total_jobs: stats.totalJobs,
    success_count: stats.successCount,
    error_count: stats.errorCount,
    target_languages: TARGET_LANGUAGES,
    translations: allResults, // Array of { job_id, translations[] }
  };

  await fs.writeFile(filepath, JSON.stringify(outputData, null, 2));

  return filepath;
}

/**
 * Main translation pipeline with batch processing
 * Reads untranslated jobs from MongoDB, translates in batches, outputs single file
 */
export async function runTranslation() {
  await mongoose.connect(
    process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio",
  );
  console.log("Connected to MongoDB");
  const startTime = Date.now();
  console.log("Starting translation pipeline (Unified Concurrent Mode)...\n");
  console.log(
    `Configuration: BATCH_SIZE=${BATCH_SIZE}, CONCURRENCY=${CONCURRENCY}, LANGUAGES=${TARGET_LANGUAGES.length}`,
  );

  // Ensure translated data directory exists
  await fs.mkdir(TRANSLATED_DATA_DIR, { recursive: true });

  // Get all jobs from DB for translation
  // Increase limit if needed, 1000 currently
  const jobs = await OriginalJob.find({}).limit(1000);
  console.log(`Loaded ${jobs.length} jobs for translation`);

  if (jobs.length === 0) {
    console.log("No untranslated jobs found. Exiting.");
    return { success: 0, errors: 0, total: 0 };
  }

  // Create Batches
  const batches = [];
  const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);
  for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
    batches.push({
      jobs: jobs.slice(i, i + BATCH_SIZE),
      index: Math.floor(i / BATCH_SIZE) + 1,
      total: totalBatches,
    });
  }

  console.log(
    `Created ${batches.length} batches. Starting parallel execution...`,
  );

  // Progress tracking
  const progress = {
    totalJobs: jobs.length,
    successCount: 0,
    errorCount: 0,
  };

  // EXECUTE IN PARALLEL
  const batchResults = await processInParallel(
    batches,
    CONCURRENCY,
    async (batch) => {
      console.log(
        `▶️ [Batch ${batch.index}/${batch.total}] Starting translation for ${batch.jobs.length} jobs...`,
      );
      try {
        const results = await processBatchUnified(batch);

        // Update stats based on results
        const succ = results.filter((r) => r.translations.length > 0).length;
        progress.successCount += succ;
        progress.errorCount += batch.jobs.length - succ; // Approximate error count (if translations missing)

        console.log(
          `✅ [Batch ${batch.index}/${batch.total}] Completed. (${succ}/${batch.jobs.length} jobs success)`,
        );
        return results;
      } catch (e) {
        console.error(
          `❌ [Batch ${batch.index}/${batch.total}] Failed completely: ${e.message}`,
        );
        progress.errorCount += batch.jobs.length;
        return [];
      }
    },
  );

  // Flatten results
  const allResults = batchResults.flat();

  // Output all results to single file
  const outputFile = await outputAllTranslations(allResults, progress);

  console.log(
    ` Saved ${progress.successCount} translated jobs to: ${outputFile}`,
  );

  return {
    success: progress.successCount,
    errors: progress.errorCount,
    total: jobs.length,
    outputFile: outputFile,
  };
}

// CLI entry point
if (
  process.argv[1] &&
  (process.argv[1].endsWith("translator.js") ||
    process.argv[1].endsWith("translator"))
) {
  runTranslation()
    .then((result) => {
      process.exit(0);
    })
    .catch((err) => {
      console.error("Translation pipeline failed:", err);
      process.exit(1);
    });
}
