import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Import models
import OriginalJob from "./models/OriginalJob.js";
import TranslatedJob from "./models/TranslatedJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Paths
const ROOT_DIR = path.resolve(__dirname, "../../..");
const TRANSLATED_DATA_DIR = path.join(ROOT_DIR, "packages/db/data/translated");

// MongoDB connection string
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/jobaio";

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
 * Get all translated job files
 */
async function getTranslatedJobFiles() {
  try {
    const files = await fs.readdir(TRANSLATED_DATA_DIR);
    return files.filter(
      (f) => f.startsWith("translated_") && f.endsWith(".json"),
    );
  } catch (err) {
    console.warn("Could not read translated data directory:", err.message);
    return [];
  }
}

/**
 * Process a single translated job file and insert to MongoDB
 */
async function processTranslatedJobFile(filename) {
  const filepath = path.join(TRANSLATED_DATA_DIR, filename);

  try {
    const raw = await fs.readFile(filepath, "utf-8");
    const batchData = JSON.parse(raw);

    const { translations } = batchData;

    if (!translations || !Array.isArray(translations)) {
      console.warn(`Invalid data in ${filename}, skipping`);
      return false;
    }

    let successCount = 0;
    let errorCount = 0;

    // Process each job's translations
    for (const jobData of translations) {
      const { job_id, translations: jobTranslations } = jobData;

      if (!job_id || !jobTranslations || !Array.isArray(jobTranslations)) {
        console.warn(`Invalid job data in ${filename}, skipping job`);
        errorCount++;
        continue;
      }

      try {
        // Get the original job to extract non-translated fields
        const originalJob = await OriginalJob.findById(job_id);
        if (!originalJob) {
          console.warn(`✗ OriginalJob ${job_id} not found in database`);
          errorCount++;
          continue;
        }

        // Create TranslatedJob documents for each language
        for (const translation of jobTranslations) {
          // This prevents duplicates if the job was processed under a different ID
          const existingTranslation = await TranslatedJob.findOne({
            title: translation.title,
            company: originalJob.company,
            location: originalJob.location,
            translation_lang: translation.lang,
          });

          if (existingTranslation) {
            console.log(
              `  - Skipping duplicate translation (found matching content in TranslatedJob ${existingTranslation._id})`,
            );
            continue;
          }

          const translatedJobData = {
            job_id: job_id,
            translation_lang: translation.lang,

            // Non-translated fields from OriginalJob
            url: originalJob.url,
            company: originalJob.company,
            location: originalJob.location,
            publish_date: originalJob.publish_date,
            source: originalJob.source,

            // Translated fields (matching OriginalJob structure)
            title: translation.title,
            industry_category: translation.industry_category,
            job_type: translation.job_type,
            language: {
              required: translation.language?.required,
              advantage: translation.language?.advantage,
            },
            experience_level: translation.experience_level,
            education_level: translation.education_level,
            skill_type: translation.skill_type,
            responsibilities: translation.responsibilities,
          };

          try {
            // Use upsert to handle duplicates gracefully
            await TranslatedJob.findOneAndUpdate(
              {
                job_id: job_id,
                translation_lang: translation.lang,
              },
              translatedJobData,
              {
                upsert: true,
                new: true,
              },
            );
          } catch (duplicateErr) {
            // Handle duplicate key errors gracefully
            if (duplicateErr.code === 11000) {
              console.log(
                `  - Translation ${job_id}/${translation.lang} already exists, skipping`,
              );
            } else {
              throw duplicateErr;
            }
          }
        }

        console.log(
          `✓ Processed job ${job_id} with ${jobTranslations.length} translations`,
        );
        successCount++;
      } catch (jobErr) {
        console.error(`Error processing job ${job_id}:`, jobErr.message);
        errorCount++;
      }
    }

    console.log(
      `File ${filename}: ${successCount} jobs processed, ${errorCount} errors`,
    );
    return errorCount === 0; // Return true if no errors
  } catch (err) {
    console.error(`Error processing ${filename}:`, err.message);
    return false;
  }
}

/**
 * Main insertion pipeline for translated jobs
 */
export async function runTranslatedInsert() {
  const startTime = Date.now();
  console.log("Starting translated data insertion pipeline...\n");

  // Get all translated job files
  const files = await getTranslatedJobFiles();
  console.log(`Found ${files.length} translated job files`);

  if (files.length === 0) {
    console.log("No translated job files found. Exiting.");
    return { success: 0, errors: 0, total: 0 };
  }

  // Connect to MongoDB
  await connectDB();

  let successCount = 0;
  let errorCount = 0;

  // Process each file
  for (const filename of files) {
    const success = await processTranslatedJobFile(filename);
    if (success) {
      successCount++;
    } else {
      errorCount++;
    }
  }

  // Disconnect from MongoDB
  await disconnectDB();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Translated insertion complete! (${duration}s)`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${files.length}`);
  console.log(`========================================\n`);

  return { success: successCount, errors: errorCount, total: files.length };
}

// Export for external use
export {
  connectDB,
  disconnectDB,
  getTranslatedJobFiles,
  processTranslatedJobFile,
};

// CLI entry point
if (
  process.argv[1] &&
  (process.argv[1].endsWith("insert-translated.js") ||
    process.argv[1].endsWith("insert-translated"))
) {
  runTranslatedInsert()
    .then((result) => {
      console.log("Translated insertion pipeline finished:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Translated insertion pipeline failed:", err);
      process.exit(1);
    });
}
