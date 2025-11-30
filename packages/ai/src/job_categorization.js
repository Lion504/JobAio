/**
 * Job Categorization Module
 * Categorizes jobs by industry based on company name using Gemini API
 */

import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs/promises";

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

// In-memory cache for company -> category mapping
const companyCache = new Map();

/**
 * Call Gemini API with minimal prompt for fast categorization
 * @param {string} prompt
 * @param {number} maxTokens
 * @returns {Promise<string>}
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
 * Batch categorize jobs by company name
 * @param {Array} jobs
 * @returns {Promise<Array>}
 */
export async function categorizeJobs(jobs) {
  const categorizedJobs = [];
  let cachedCount = 0;
  let apiCallCount = 0;

  console.log(`Categorizing ${jobs.length} jobs by company...`);

  for (const job of jobs) {
    try {
      const { category, cached } = await categorizeByCompany(job.company);

      if (cached) {
        cachedCount++;
      } else {
        apiCallCount++;
        // Rate limiting - only delay for API calls
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      const categorizedJob = {
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

      categorizedJobs.push(categorizedJob);
    } catch (error) {
      // On error, add job with "Other" category
      categorizedJobs.push({
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
      });
    }
  }

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
}

export { categorizeByCompany, INDUSTRY_CATEGORIES };
