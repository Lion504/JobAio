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
 * Categorize a company by its name
 * @param {string} companyName - The company name to categorize
 * @returns {Promise<{category: string, cached: boolean}>}
 */
async function categorizeByCompany(companyName) {
  // Handle empty/missing company name
  if (!companyName || companyName.trim() === "" || companyName === "N/A") {
    return { category: "Other", cached: false };
  }

  const normalizedName = companyName.trim().toLowerCase();

  // Check cache first
  if (companyCache.has(normalizedName)) {
    return { category: companyCache.get(normalizedName), cached: true };
  }

  // by this way we can reduce the number of API calls.
  await categorizeCompaniesBatch([companyName]);

  // Check cache again
  if (companyCache.has(normalizedName)) {
    return { category: companyCache.get(normalizedName), cached: false };
  }

  return { category: "Other", cached: false };
}

/**
 * Batch categorize a list of companies in one API call
 * @param {Array<string>} companies - List of company names
 */
async function categorizeCompaniesBatch(companies) {
  if (companies.length === 0) return;

  console.log(`Batch categorizing ${companies.length} companies...`);

  const prompt = `
  You are an expert industry classifier.
  Classify the following companies into exactly ONE of these categories:
  ${INDUSTRY_CATEGORIES.join(", ")}

  Companies to classify:
  ${JSON.stringify(companies)}

  Instructions:
  1. Analyze each company name.
  2. Assign the most appropriate category from the list above.
  3. If unsure or not found, use "Other".
  4. Return a strictly valid JSON object where keys are the exact company names provided and values are the categories.
  5. Do NOT include markdown formatting (like \`\`\`json), just the raw JSON string.
  `;

  try {
    // Increase token limit for batch response
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 8192, // this can be higher
        temperature: 0.1,
      },
    });

    const text = result.text;
    // Clean up potential markdown code blocks if present
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const mappings = JSON.parse(jsonStr);

    let matchCount = 0;
    // Update cache
    for (const [company, category] of Object.entries(mappings)) {
      const normalizedName = company.trim().toLowerCase();
      
      // Validate category
      const matchedCategory = INDUSTRY_CATEGORIES.find(
        (c) => c.toLowerCase() === category.toLowerCase(),
      );
      
      companyCache.set(normalizedName, matchedCategory || "Other");
      matchCount++;
    }
    console.log(`  ✓ Successfully cached ${matchCount} new companies from batch`);

  } catch (err) {
    console.error("  ✗ Batch categorization failed:", err.message);
    // Fallback: processed individually later if not in cache, or assigned 'Other' by processJob logic
  }
}

/**
 * Batch categorize jobs by company name with parallel processing optimization
 * @param {Array} jobs
 * @param {number} concurrency
 * @returns {Promise<Array>}
 */
export async function categorizeJobs(jobs, concurrency = 10) {
  let cachedCount = 0;
  let apiCallCount = 0;

  console.log(
    `Categorizing ${jobs.length} jobs by company...`,
  );

  // --- Pre-process unknown companies in batches ---
  const uniqueCompanies = [...new Set(jobs.map(j => j.company).filter(c => c && c.trim() !== '' && c !== 'N/A'))];
  
  // Identify which companies are NOT in cache
  const unknownCompanies = uniqueCompanies.filter(c => !companyCache.has(c.trim().toLowerCase()));

  if (unknownCompanies.length > 0) {
    console.log(`Found ${unknownCompanies.length} unique companies not in cache.`);
    
    // Process in batches of 100
    const BATCH_SIZE = 100; // this can be higher
    for (let i = 0; i < unknownCompanies.length; i += BATCH_SIZE) {
      const batch = unknownCompanies.slice(i, i + BATCH_SIZE);
      await categorizeCompaniesBatch(batch);
      
      // Small delay between batches to be nice to API
      if (i + BATCH_SIZE < unknownCompanies.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }
    
    // Save cache immediately after batch learning
    saveCache(companyCache);
  } else {
    console.log("All companies already in cache!");
  }
  // --- END ---

  // Process a single job (now mostly cache hits)
  const processJob = async (job) => {
    try {
      // This will now likely hit the cache because we pre-warmed it
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

  // Process jobs in parallel batches (fast since mostly cache memory lookups)
  const categorizedJobs = await processBatch(
    jobs,
    processJob,
    concurrency, // Can probably increase concurrency now, but 100 is enough
    100, // 100 jobs per batch
    10, // 10ms delay between batches 
  );

  // Save cache to disk after processing
  saveCache(companyCache);

  console.log(
    `Categorization complete: ${apiCallCount} API calls, ${cachedCount} using cache/batch-cache`,
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
