/**
 * Job Categorization Module
 * Categorizes jobs by industry based on company name using Gemini API
 */

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";
import fs from "fs/promises";
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  unlinkSync,
} from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Predefined industry categories for filtering
const INDUSTRY_CATEGORIES = [
  "IT/Technology",
  "Construction",
  "Healthcare",
  "Education",
  "Finance",
  "Manufacturing",
  "Retail",
  "Automotive",
  "Consulting",
  "Government",
  "Logistics",
  "Hospitality",
  "Media",
  "Energy",
  "Other",
];

// Persistent cache file path - store in OS temp directory
const CACHE_DIR = path.join(os.tmpdir(), "jobaio-cache");
const CACHE_FILE = path.join(CACHE_DIR, "company_cache.json");

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Load company cache from disk
 * @returns {Map} - Company to category mapping
 */
function loadCache() {
  try {
    ensureCacheDir();
    if (existsSync(CACHE_FILE)) {
      const data = JSON.parse(readFileSync(CACHE_FILE, "utf-8"));
      console.log(
        `Loaded ${Object.keys(data).length} cached companies from ${CACHE_FILE}`,
      );
      return new Map(Object.entries(data));
    }
  } catch (e) {
    console.warn("Failed to load cache:", e.message);
  }
  return new Map();
}

/**
 * Save company cache to disk
 * @param {Map} cache
 */
function saveCache(cache) {
  try {
    ensureCacheDir();
    const data = Object.fromEntries(cache);
    writeFileSync(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (e) {
    console.warn("Failed to save cache:", e.message);
  }
}

/**
 * Clear the cache file from disk
 */
export function clearCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      unlinkSync(CACHE_FILE);
      companyCache.clear();
      console.log("Cache cleared successfully");
    }
  } catch (e) {
    console.warn("Failed to clear cache:", e.message);
  }
}

// Load persistent cache on module init
const companyCache = loadCache();

/**
 * Process items in parallel batches with concurrency limit
 * @param {Array} items - Items to process
 * @param {Function} processor - Async function to process each item
 * @param {number} concurrency - Max concurrent operations (default: 10)
 * @param {number} batchDelay - Delay between batches in ms (default: 100)
 * @returns {Promise<Array>} - Processed results
 */
async function processBatch(
  items,
  processor,
  concurrency = 10,
  batchDelay = 100,
) {
  const results = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(processor));
    results.push(...batchResults);

    // Delay between batches to avoid rate limiting
    if (i + concurrency < items.length) {
      await new Promise((r) => setTimeout(r, batchDelay));
    }
  }

  return results;
}

/**
 * Call Gemini API with minimal prompt for fast categorization
 * @param {string} prompt - The prompt to send
 * @param {number} maxTokens - Maximum tokens for response
 * @returns {Promise<string>} - Generated text
 */
async function callGemini(prompt, maxTokens = 20) {
  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature: 0.1,
    },
  });
  return result.text?.trim() || "";
}

/**
 * Categorize a company by its name
 * @param {string} companyName - The company name to categorize
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<{category: string, cached: boolean}>}
 */
async function categorizeByCompany(companyName, retries = 2) {
  // Handle empty/missing company name
  if (!companyName || companyName.trim() === "" || companyName === "N/A") {
    return { category: "Other", cached: false };
  }

  const normalizedName = companyName.trim().toLowerCase();

  // Check cache first
  if (companyCache.has(normalizedName)) {
    return { category: companyCache.get(normalizedName), cached: true };
  }

  try {
    const prompt = `Categorize this company into ONE industry category.
Company: ${companyName}
Categories: ${INDUSTRY_CATEGORIES.join(", ")}
Return only the category name, nothing else.`;

    const response = await callGemini(prompt, 20);

    // Validate response against known categories
    let category = response.trim();

    // Find matching category (case-insensitive)
    const matchedCategory = INDUSTRY_CATEGORIES.find(
      (c) => c.toLowerCase() === category.toLowerCase(),
    );

    category = matchedCategory || "Other";

    // Cache the result
    companyCache.set(normalizedName, category);

    return { category, cached: false };
  } catch (error) {
    if (retries > 0) {
      console.error(
        `Categorization failed for "${companyName}", retrying... (${retries} retries left)`,
      );
      await new Promise((r) => setTimeout(r, 5000));
      return categorizeByCompany(companyName, retries - 1);
    }

    console.error(`Categorization failed for "${companyName}":`, error.message);
    return { category: "Other", cached: false };
  }
}

/**
 * Batch categorize jobs by company name with parallel processing
 * @param {Array} jobs
 * @param {number} concurrency
 * @returns {Promise<Array>}
 */
export async function categorizeJobs(jobs, concurrency = 10) {
  let cachedCount = 0;
  let apiCallCount = 0;

  console.log(
    `Categorizing ${jobs.length} jobs by company (concurrency: ${concurrency})...`,
  );

  // Process a single job
  const processJob = async (job) => {
    try {
      const { category, cached } = await categorizeByCompany(job.company);

      if (cached) {
        cachedCount++;
      } else {
        apiCallCount++;
      }

      return {
        ...job,
        industry_category: category,
        _metadata: {
          ...job._metadata,
          categorization: {
            source: "company_name",
            cached: cached,
            completed_at: new Date().toISOString(),
          },
        },
      };
    } catch (error) {
      // On error, add job with "Other" category
      return {
        ...job,
        industry_category: "Other",
        _metadata: {
          ...job._metadata,
          categorization: {
            source: "company_name",
            error: error.message,
            completed_at: new Date().toISOString(),
          },
        },
      };
    }
  };

  // Process jobs in parallel batches
  const categorizedJobs = await processBatch(
    jobs,
    processJob,
    concurrency,
    100,
  );

  // Save cache to disk after processing
  saveCache(companyCache);

  console.log(
    `Categorization complete: ${apiCallCount} API calls, ${cachedCount} cached`,
  );

  return categorizedJobs;
}

/**
 * Get cache statistics
 * @returns {Object} - Cache stats
 */
export function getCacheStats() {
  return {
    size: companyCache.size,
    entries: Object.fromEntries(companyCache),
  };
}

// CLI interface for subprocess calls from Python
if (process.argv[1]?.endsWith("job_categorization.js")) {
  (async () => {
    const inputFile = process.argv[2];
    const outputFile = process.argv[3];

    if (!inputFile || !outputFile) {
      console.error(
        "Usage: node job_categorization.js <input.json> <output.json>",
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

      console.log(`Processing ${jobs.length} jobs for categorization...`);

      // Process jobs
      const categorizedJobs = await categorizeJobs(jobs);

      // Write output file
      await fs.writeFile(
        outputFile,
        JSON.stringify(categorizedJobs, null, 2),
        "utf-8",
      );

      console.log(
        `Successfully wrote ${categorizedJobs.length} categorized jobs to ${outputFile}`,
      );

      // Print cache stats
      const stats = getCacheStats();
      console.log(`Company cache: ${stats.size} unique companies cached`);
    } catch (error) {
      console.error("Categorization failed:", error.message);
      process.exit(1);
    }
  })();
}

export { categorizeByCompany, INDUSTRY_CATEGORIES };
