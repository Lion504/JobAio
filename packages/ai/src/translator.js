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
const BATCH_SIZE = 5; // Process 5 jobs in parallel per language
const DELAY_BETWEEN_BATCHES = 2000; // 2 seconds between batches
const DELAY_BETWEEN_LANGUAGES = 1000; // 1 second between language translations
const RETRY_DELAY = 20000; // 20 seconds on rate limit
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
 * Clean JSON response from markdown code blocks
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
 * Translate a single field (string or array) with retry logic
 */
async function translateField(fieldData, targetLang, retries = MAX_RETRIES) {
  // Handle empty/null
  if (!fieldData) return fieldData;

  const textToTranslate = Array.isArray(fieldData)
    ? fieldData.join("\n")
    : fieldData;

  if (!textToTranslate || textToTranslate.trim() === "") {
    return fieldData;
  }

  // Source language is English (jobs are pretranslated to English before analysis)
  const sourceLang = "en";

  const prompt = `Translate the following text from ${sourceLang} to ${targetLang}:

${textToTranslate}

Provide only the translated text, no explanations:`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let replyText = response.text?.trim();
    if (!replyText) {
      console.warn(`[translateField] Empty reply for ${targetLang}`);
      return fieldData;
    }

    // Clean response
    replyText = cleanJsonResponse(replyText);
    replyText = replyText.replace(/^"|^'|"$|'$/g, "").trim();

    // Split back into array if input was array
    if (Array.isArray(fieldData)) {
      return replyText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return replyText;
  } catch (err) {
    const isRateLimitError =
      err.message.includes("429") ||
      err.message.includes("Rate limit") ||
      err.message.includes("Quota exceeded") ||
      err.message.includes("overloaded");

    if (isRateLimitError && retries > 0) {
      console.warn(
        `Rate limit hit. Retrying in ${RETRY_DELAY / 1000}s... (${retries} retries left)`,
      );
      await new Promise((r) => setTimeout(r, RETRY_DELAY));
      return translateField(fieldData, targetLang, retries - 1);
    }

    console.error(`[translateField] Translation failed:`, err.message);
    return fieldData; // Return original on failure
  }
}

/**
 * Translate a job to a single target language
 * Returns lean translation object (no description fields)
 */
async function translateJobToLanguage(job, targetLang) {
  const translation = {
    lang: targetLang,
    title: await translateField(job.title, targetLang),
    industry_category: await translateField(job.industry_category, targetLang),
    job_type: await translateField(job.job_type, targetLang),
    language: {
      required: await translateField(job.language?.required, targetLang),
      advantage: await translateField(job.language?.advantage, targetLang),
    },
    experience_level: await translateField(job.experience_level, targetLang),
    education_level: await translateField(job.education_level, targetLang),
    skill_type: {
      technical: await translateField(job.skill_type?.technical, targetLang),
      domain_specific: await translateField(
        job.skill_type?.domain_specific,
        targetLang,
      ),
      certifications: await translateField(
        job.skill_type?.certifications,
        targetLang,
      ),
      soft_skills: await translateField(
        job.skill_type?.soft_skills,
        targetLang,
      ),
      other: await translateField(job.skill_type?.other, targetLang),
    },
    responsibilities: await translateField(job.responsibilities, targetLang),
    translated_at: new Date(),
  };

  return translation;
}

/**
 * Translate a single job to all target languages (sequential for this job)
 */
async function translateJob(job) {
  const translations = [];

  for (const targetLang of TARGET_LANGUAGES) {
    try {
      const translation = await translateJobToLanguage(job, targetLang);
      translations.push(translation);
    } catch (err) {
      console.error(
        `    [${job.title?.slice(0, 30)}] Failed ${targetLang}:`,
        err.message,
      );
    }

    // Small delay between languages for same job
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_LANGUAGES));
  }

  return translations;
}

/**
 * Process a batch of jobs in parallel - collect translation results
 * @param {Array} jobs - Array of jobs to translate
 * @param {number} batchIndex - Current batch number for logging
 * @param {number} totalBatches - Total number of batches
 * @param {Array} allResults - Array to collect all results
 * @param {Object} progress - Progress tracking object
 */
async function translateBatch(
  jobs,
  batchIndex,
  totalBatches,
  allResults,
  progress,
) {
  console.log(
    `\n[Batch ${batchIndex + 1}/${totalBatches}] Processing ${jobs.length} jobs...`,
  );

  const results = await Promise.all(
    jobs.map(async (job, idx) => {
      const jobNum = batchIndex * BATCH_SIZE + idx + 1;
      const globalJobNum = batchIndex * BATCH_SIZE + idx + 1;

      // Progress logging every 5 jobs
      if (globalJobNum % 5 === 0 || globalJobNum === progress.totalJobs) {
        const percentage = Math.round(
          (globalJobNum / progress.totalJobs) * 100,
        );
        console.log(
          `  Progress: ${globalJobNum}/${progress.totalJobs} jobs (${percentage}%)`,
        );
      }

      try {
        const translations = await translateJob(job);

        // Collect successful results (lean format with just job_id)
        allResults.push({
          job_id: job._id,
          translations: translations,
        });

        progress.successCount++;
        return { success: true };
      } catch (err) {
        console.error(`  ✗ Job ${jobNum} failed: ${err.message}`);
        progress.errorCount++;
        return { success: false, error: err.message };
      }
    }),
  );

  return results;
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
  console.log(`\n💾 Saved all translations to: ${filepath}`);

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
  console.log("Starting translation pipeline (batch mode)...\n");
  console.log(
    `Configuration: BATCH_SIZE=${BATCH_SIZE}, LANGUAGES=${TARGET_LANGUAGES.length}`,
  );

  // Ensure translated data directory exists
  await fs.mkdir(TRANSLATED_DATA_DIR, { recursive: true });

  // Get all jobs from DB for translation
  const jobs = await OriginalJob.find({}).limit(1000);
  console.log(`Loaded ${jobs.length} jobs for translation`);

  if (jobs.length === 0) {
    console.log("No untranslated jobs found. Exiting.");
    return { success: 0, errors: 0, total: 0 };
  }

  // Calculate batches
  const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);
  console.log(
    `Will process in ${totalBatches} batches of up to ${BATCH_SIZE} jobs each\n`,
  );

  // Progress tracking
  const progress = {
    totalJobs: jobs.length,
    successCount: 0,
    errorCount: 0,
  };

  // Collect all translation results
  const allResults = [];

  // Process jobs in batches
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, jobs.length);
    const batchJobs = jobs.slice(start, end);

    // Process batch (collect results, no file output)
    await translateBatch(
      batchJobs,
      batchIdx,
      totalBatches,
      allResults,
      progress,
    );

    // Rate limiting between batches (except last batch)
    if (batchIdx < totalBatches - 1) {
      console.log(
        `  Waiting ${DELAY_BETWEEN_BATCHES / 1000}s before next batch...`,
      );
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_BATCHES));
    }
  }

  // Output all results to single file
  const outputFile = await outputAllTranslations(allResults, progress);

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Translation complete! (${duration}s)`);
  console.log(`  Success: ${progress.successCount}`);
  console.log(`  Errors: ${progress.errorCount}`);
  console.log(`  Total: ${jobs.length}`);
  console.log(`  Languages per job: ${TARGET_LANGUAGES.length}`);
  console.log(`  Output file: ${outputFile}`);
  console.log(`========================================\n`);

  return {
    success: progress.successCount,
    errors: progress.errorCount,
    total: jobs.length,
    outputFile: outputFile,
  };
}

// Export for external use
export { translateJob, translateJobToLanguage };

// CLI entry point
if (
  process.argv[1] &&
  (process.argv[1].endsWith("translator.js") ||
    process.argv[1].endsWith("translator"))
) {
  runTranslation()
    .then((result) => {
      console.log("Translation pipeline finished:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Translation pipeline failed:", err);
      process.exit(1);
    });
}
