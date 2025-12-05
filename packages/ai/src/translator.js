import { GoogleGenAI } from "@google/genai";
import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Import OriginalJob model from @jobaio/db (includes AutoIncrement plugin)
import OriginalJob from "../../db/src/models/OriginalJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Target languages (no "en" since pipeline outputs English)
export const TARGET_LANGUAGES = ["es", "fr", "pt", "de", "ur", "ta", "zh"];

// Source language is always English (pipeline output)
const SOURCE_LANG = "en";

// Rate limiting delays
const DELAY_BETWEEN_LANGUAGES = 1000; // 1 second
const DELAY_BETWEEN_JOBS = 2000; // 2 seconds
const RETRY_DELAY = 20000; // 20 seconds on rate limit
const MAX_RETRIES = 3;

// Paths
const ROOT_DIR = path.resolve(__dirname, "../../..");
const SCRAPER_LOGS_DIR = path.join(ROOT_DIR, "apps/scraper-py/logs");

// API Key validation
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY not set.");
}

// Initialize Google AI SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio";

/**
 * Get latest pipeline results file from scraper logs
 */
async function getLatestPipelineFile() {
  try {
    const files = await fs.readdir(SCRAPER_LOGS_DIR);
    const pipelineFiles = files.filter(
      (f) => f.startsWith("pipeline_results_") && f.endsWith(".json"),
    );
    if (pipelineFiles.length > 0) {
      // Sort by timestamp (filename) and take latest
      const latest = pipelineFiles.sort().reverse()[0];
      return path.join(SCRAPER_LOGS_DIR, latest);
    }
  } catch (err) {
    console.warn("Could not read scraper logs directory:", err.message);
  }
  throw new Error("No pipeline_results file found in logs directory");
}

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

  const prompt = `Translate the following text from ${SOURCE_LANG} to ${targetLang}:

${textToTranslate}

Provide only the translated text, no explanations:`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME || "gemini-2.0-flash",
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
  console.log(`  Translating to ${targetLang}...`);

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
 * Translate a job to all target languages
 */
async function translateJob(job) {
  const translations = [];

  console.log(`Translating job: "${job.title}"`);

  for (const targetLang of TARGET_LANGUAGES) {
    try {
      const translation = await translateJobToLanguage(job, targetLang);
      translations.push(translation);
    } catch (err) {
      console.error(`  Failed to translate to ${targetLang}:`, err.message);
      // Skip this language on failure (after retries exhausted in translateField)
    }

    // Rate limiting between languages
    await new Promise((r) => setTimeout(r, DELAY_BETWEEN_LANGUAGES));
  }

  return translations;
}

/**
 * Save job with translations to MongoDB using upsert
 */
async function saveToMongoDB(job, translations) {
  const filter = {
    title: job.title,
    company: job.company,
    location: job.location,
  };

  const update = {
    $set: {
      title: job.title,
      url: job.url,
      company: job.company,
      location: job.location,
      publish_date: job.publish_date,
      description: job.description,
      original_title: job.original_title,
      original_description: job.original_description,
      source: job.source,
      industry_category: job.industry_category,
      job_type: job.job_type,
      language: job.language,
      experience_level: job.experience_level,
      education_level: job.education_level,
      skill_type: job.skill_type,
      responsibilities: job.responsibilities,
      translations: translations,
      _metadata: job._metadata,
    },
  };

  const result = await OriginalJob.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
  });

  return result;
}

/**
 * Connect to MongoDB
 */
async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    return;
  }

  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("MongoDB connected");
}

/**
 * Disconnect from MongoDB
 */
async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    console.log("MongoDB disconnected");
  }
}

/**
 * Main translation pipeline
 * Reads jobs from latest pipeline file, translates, and saves to MongoDB
 */
export async function runTranslation() {
  console.log("Starting translation pipeline...\n");

  // Get latest pipeline file
  const pipelineFile = await getLatestPipelineFile();
  console.log(`Reading jobs from: ${pipelineFile}`);

  // Read and parse jobs
  const raw = await fs.readFile(pipelineFile, "utf-8");
  const jobs = JSON.parse(raw);

  if (!Array.isArray(jobs)) {
    throw new Error("Pipeline file must contain an array of jobs");
  }

  console.log(`Loaded ${jobs.length} jobs for translation\n`);

  // Connect to MongoDB
  await connectDB();

  let successCount = 0;
  let errorCount = 0;

  // Process each job
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    try {
      console.log(`\n[${i + 1}/${jobs.length}] Processing job...`);

      // Translate to all target languages
      const translations = await translateJob(job);

      // Save to MongoDB with upsert
      await saveToMongoDB(job, translations);

      console.log(`  ✓ Saved with ${translations.length} translations`);
      successCount++;
    } catch (err) {
      console.error(`  ✗ Failed: ${err.message}`);
      errorCount++;
      // Continue to next job (don't stop on single failure)
    }

    // Rate limiting between jobs
    if (i < jobs.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY_BETWEEN_JOBS));
    }
  }

  // Disconnect from MongoDB
  await disconnectDB();

  console.log(`\n========================================`);
  console.log(`Translation complete!`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${jobs.length}`);
  console.log(`========================================\n`);

  return { success: successCount, errors: errorCount, total: jobs.length };
}

// Export for external use
export {
  translateJob,
  translateJobToLanguage,
  saveToMongoDB,
  connectDB,
  disconnectDB,
};

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
