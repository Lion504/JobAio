/**
 * Query Expansion Module for Semantic Search
 *
 * Uses Gemini to expand user search queries with semantically similar terms
 * to improve job search results and find relevant matches.
 */

import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

// Configuration
const CONFIG = {
  MAX_QUERY_LENGTH: 200,
  MAX_EXPANDED_TERMS: 10,
  CACHE_TTL_MS: 1000 * 60 * 60, // 1 hour
  RATE_LIMIT_DELAY_MS: 100,
  MAX_CACHE_SIZE: 1000,
};

// API Key Validation
if (!process.env.GEMINI_API_KEY) {
  console.warn("⚠️ GEMINI_API_KEY not set - query expansion will be disabled");
}

// Initialize Gemini API
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })
  : null;

// Simple In-Memory Cache
const queryCache = new Map();

function getCachedExpansion(query) {
  const key = query.toLowerCase();
  const cached = queryCache.get(key);
  if (cached && Date.now() - cached.timestamp < CONFIG.CACHE_TTL_MS) {
    return cached.terms;
  }
  if (cached) {
    queryCache.delete(key);
  }
  return null;
}

function setCachedExpansion(query, terms) {
  const key = query.toLowerCase();
  queryCache.set(key, {
    terms,
    timestamp: Date.now(),
  });

  // Limit cache size (remove oldest entries)
  if (queryCache.size > CONFIG.MAX_CACHE_SIZE) {
    const firstKey = queryCache.keys().next().value;
    queryCache.delete(firstKey);
  }
}

/**
 * Clear the query expansion cache
 * @returns {void}
 */
export function clearCache() {
  queryCache.clear();
  console.log("🗑️ Query cache cleared");
}

/**
 * Get cache statistics
 * @returns {{size: number, maxSize: number}}
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    maxSize: CONFIG.MAX_CACHE_SIZE,
  };
}

/**
 * Sanitize query input to prevent injection and limit length
 * @param {string} query - Raw query input
 * @returns {string} Sanitized query
 */
function sanitizeQuery(query) {
  if (typeof query !== "string") return "";

  return query
    .trim()
    .substring(0, CONFIG.MAX_QUERY_LENGTH)
    .replace(/["\\\n\r\t]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expand user search query with semantically similar terms using Gemini
 * @param {string} query - User's search query
 * @returns {Promise<string[]>} Array of expanded search terms including original
 */
export async function expandQueryWithSynonyms(query) {
  // Handle edge cases
  if (!query || (typeof query === "string" && query.trim() === "")) {
    return [query];
  }

  // Sanitize input
  const sanitizedQuery = sanitizeQuery(query);
  if (!sanitizedQuery) {
    return [query];
  }

  // Check cache first
  const cached = getCachedExpansion(sanitizedQuery);
  if (cached) {
    console.log(`📦 Cache hit for query "${sanitizedQuery}"`);
    return cached;
  }

  // Check if API is available
  if (!genAI) {
    console.warn("Query expansion disabled - no API key");
    return [sanitizedQuery];
  }

  try {
    const prompt = `Expand this job search query with 5-10 synonyms for job search.
Keep output in SAME LANGUAGE as input. Return ONLY a JSON array.

Query: "${sanitizedQuery}"

Examples:
"developer" → ["developer", "programmer", "engineer", "coder", "software engineer"]
"kokki" → ["kokki", "keittiömestari", "kokkimestari", "ravintolakokki"]`;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 150,
        temperature: 0.1,
      },
    });

    const responseText = result.text?.trim();
    if (!responseText) {
      console.warn("Empty response from Gemini for query expansion");
      return [sanitizedQuery];
    }

    // Extract JSON array from response
    let expandedTerms;
    try {
      expandedTerms = JSON.parse(responseText);
    } catch (err) {
      console.warn("Failed to parse responseText as JSON array:", err.message);
      const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
      if (jsonMatch) {
        try {
          expandedTerms = JSON.parse(jsonMatch[0]);
        } catch (innerErr) {
          console.warn(
            "Failed to parse matched JSON array from responseText:",
            innerErr.message,
          );
        }
      }
    }

    if (!Array.isArray(expandedTerms) || expandedTerms.length === 0) {
      console.warn("Invalid expansion format received");
      return [sanitizedQuery];
    }

    // Validate and clean terms
    const validTerms = expandedTerms
      .filter((term) => typeof term === "string" && term.trim().length > 0)
      .map((term) => term.trim().toLowerCase())
      .filter((term, index, arr) => arr.indexOf(term) === index)
      .slice(0, CONFIG.MAX_EXPANDED_TERMS);

    // Ensure original query is included
    if (!validTerms.includes(sanitizedQuery.toLowerCase())) {
      validTerms.unshift(sanitizedQuery.toLowerCase());
    }

    // Cache the result
    setCachedExpansion(sanitizedQuery, validTerms);

    console.log(
      `✅ Expanded query "${sanitizedQuery}" to ${validTerms.length} terms`,
    );
    return validTerms;
  } catch (error) {
    console.error("Query expansion failed:", error.message);
    return [sanitizedQuery];
  }
}

/**
 * Expand multiple queries with synonyms (with rate limiting)
 * @param {string[]} queries - Array of search queries
 * @returns {Promise<string[][]>} Array of expanded term arrays
 */
export async function expandQueriesBatch(queries) {
  if (!Array.isArray(queries)) {
    throw new Error("Queries must be an array");
  }

  if (queries.length === 0) {
    return [];
  }

  console.log(`Expanding ${queries.length} queries with synonyms...`);

  const results = [];
  for (let i = 0; i < queries.length; i++) {
    const query = queries[i];
    try {
      // Check if cached
      const sanitized = sanitizeQuery(query);
      const wasCached = getCachedExpansion(sanitized) !== null;

      const expanded = await expandQueryWithSynonyms(query);
      results.push(expanded);

      // Rate limiting between API calls
      if (i < queries.length - 1 && !wasCached) {
        await new Promise((r) => setTimeout(r, CONFIG.RATE_LIMIT_DELAY_MS));
      }
    } catch (error) {
      console.warn(`Failed to expand query "${query}":`, error.message);
      results.push([query]);
    }
  }

  console.log(`✅ Expanded ${results.length} queries`);
  return results;
}

/**
 * Generate search text for job embeddings
 * Combines title, description, and key skills for better semantic matching
 * @param {Object} job - Job object
 * @returns {string} Combined search text
 */
export function generateJobSearchText(job) {
  if (!job || typeof job !== "object") {
    return "";
  }

  const parts = [];

  if (job.title && typeof job.title === "string") {
    parts.push(job.title);
  }

  if (job.description && typeof job.description === "string") {
    parts.push(job.description.substring(0, 2000));
  }

  // Add key skills/technologies
  if (job.skill_type && typeof job.skill_type === "object") {
    const skills = [];
    if (Array.isArray(job.skill_type.technical)) {
      skills.push(...job.skill_type.technical);
    }
    if (Array.isArray(job.skill_type.domain_specific)) {
      skills.push(...job.skill_type.domain_specific);
    }
    if (skills.length > 0) {
      parts.push(skills.slice(0, 10).join(", "));
    }
  }

  // Add company and location for context
  if (job.company && typeof job.company === "string") {
    parts.push(`Company: ${job.company}`);
  }
  if (job.location && typeof job.location === "string") {
    parts.push(`Location: ${job.location}`);
  }

  return parts.join(" | ");
}
