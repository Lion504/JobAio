import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// Import OriginalJob model from @jobaio/db
import OriginalJob from "./models/OriginalJob.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Paths
const ROOT_DIR = path.resolve(__dirname, "../../..");
const SCRAPER_LOGS_DIR = path.join(ROOT_DIR, "apps/scraper-py/logs");

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
 * Insert a single job into MongoDB
 */
async function insertJobToMongoDB(job) {
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
      _metadata: job._metadata,
      inserted_at: new Date(),
    },
  };

  const result = await OriginalJob.findOneAndUpdate(filter, update, {
    upsert: true,
    new: true,
  });

  return result;
}

/**
 * Process jobs in batches
 */
async function insertJobsBatch(jobs, batchIndex, totalBatches) {
  console.log(
    `\n[Batch ${batchIndex + 1}/${totalBatches}] Inserting ${jobs.length} jobs...`,
  );

  const results = await Promise.all(
    jobs.map(async (job, idx) => {
      const jobNum = batchIndex * 50 + idx + 1; // Assuming batch size of 50
      console.log(`  Inserting job ${jobNum}: "${job.title?.slice(0, 40)}..."`);

      try {
        const result = await insertJobToMongoDB(job);
        console.log(`  ✓ Job ${jobNum}: Inserted with ID ${result._id}`);
        return { success: true, job };
      } catch (err) {
        console.error(`  ✗ Job ${jobNum}: ${err.message}`);
        return { success: false, job, error: err.message };
      }
    }),
  );

  return results;
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
 * Main insert process for original jobs
 */
export async function insertOriginalJobs() {
  const startTime = Date.now();
  console.log("Starting original job insertion process...\n");

  // Get latest pipeline file
  const pipelineFile = await getLatestPipelineFile();
  console.log(`Reading jobs from: ${pipelineFile}`);

  // Read and parse jobs
  const raw = await fs.readFile(pipelineFile, "utf-8");
  const jobs = JSON.parse(raw);

  if (!Array.isArray(jobs)) {
    throw new Error("Pipeline file must contain an array of jobs");
  }

  console.log(`Loaded ${jobs.length} jobs for insertion`);

  // Connect to MongoDB
  await connectDB();

  // Calculate batches (50 jobs per batch for efficiency)
  const BATCH_SIZE = 50;
  const totalBatches = Math.ceil(jobs.length / BATCH_SIZE);
  console.log(
    `Will process in ${totalBatches} batches of up to ${BATCH_SIZE} jobs each\n`,
  );

  let successCount = 0;
  let errorCount = 0;

  // Process jobs in batches
  for (let batchIdx = 0; batchIdx < totalBatches; batchIdx++) {
    const start = batchIdx * BATCH_SIZE;
    const end = Math.min(start + BATCH_SIZE, jobs.length);
    const batchJobs = jobs.slice(start, end);

    // Process batch
    const results = await insertJobsBatch(batchJobs, batchIdx, totalBatches);

    // Count results
    for (const result of results) {
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
    }
  }

  // Disconnect from MongoDB
  await disconnectDB();

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n========================================`);
  console.log(`Original job insertion complete! (${duration}s)`);
  console.log(`  Success: ${successCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Total: ${jobs.length}`);
  console.log(`========================================\n`);

  return { success: successCount, errors: errorCount, total: jobs.length };
}

// CLI entry point
if (
  process.argv[1] &&
  (process.argv[1].endsWith("insert-original.js") ||
    process.argv[1].endsWith("insert-original"))
) {
  insertOriginalJobs()
    .then((result) => {
      console.log("Insert original jobs finished:", result);
      process.exit(0);
    })
    .catch((err) => {
      console.error("Insert original jobs failed:", err);
      process.exit(1);
    });
}
