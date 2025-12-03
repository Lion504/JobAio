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

// Initialize Gemini API
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

/**
 * Expand user search query with semantically similar terms using Gemini
 * @param {string} query - User's search query
 * @returns {Promise<string[]>} Array of expanded search terms including original
 */
export async function expandQueryWithSynonyms(query) {
  if (!query || query.trim() === "") {
    return [query];
  }

  try {
    const prompt = `
Expand this job search query with semantically similar terms that users
might search for. Return a JSON array of related job titles, skills,
and roles.

Query: "${query.trim()}"

Consider:
- Job titles with similar meanings (developer = programmer = engineer)
- Related roles and positions
- Technical skills and technologies
- Industry-specific terms

Return format: ["original term", "synonym1", "synonym2",
"related term1", ...]
Include 5-10 terms total. Focus on job search relevance.

Example for "developer":
["developer", "programmer", "engineer", "coder", "software engineer",
"fullstack developer"]

Example for "chef":
["chef", "cook", "line cook", "sous chef", "executive chef",
"kitchen manager"]
`;

    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        maxOutputTokens: 2000,
        temperature: 0.1,
      },
    });

    const responseText = result.text?.trim();
    if (!responseText) {
      console.warn("Empty response from Gemini for query expansion");
      return [query];
    }

    // Extract JSON array from response
    let jsonMatch = responseText.match(/\[([\s\S]*?)\]/);
    if (!jsonMatch) {
      // Try to find array in the response
      const lines = responseText.split("\n");
      for (const line of lines) {
        const match = line.match(/\[([\s\S]*?)\]/);
        if (match) {
          jsonMatch = match;
          break;
        }
      }
    }

    if (!jsonMatch) {
      console.warn(
        `Could not parse expansion array from response: ${responseText.substring(0, 200)}`,
      );
      return [query];
    }

    const expandedTerms = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(expandedTerms) || expandedTerms.length === 0) {
      console.warn("Invalid expansion format received");
      return [query];
    }

    // Validate and clean terms
    const validTerms = expandedTerms
      .filter((term) => typeof term === "string" && term.trim().length > 0)
      .map((term) => term.trim().toLowerCase())
      .filter((term, index, arr) => arr.indexOf(term) === index) // Remove duplicates
      .slice(0, 10); // Limit to 10 terms

    // Ensure original query is included
    if (!validTerms.includes(query.toLowerCase())) {
      validTerms.unshift(query.toLowerCase());
    }

    console.log(`✅ Expanded query "${query}" to ${validTerms.length} terms`);
    return validTerms;
  } catch (error) {
    console.error("Query expansion failed:", error.message);
    // Fallback: return original query
    return [query];
  }
}

/**
 * Expand multiple queries with synonyms
 * @param {string[]} queries - Array of search queries
 * @returns {Promise<string[][]>} Array of expanded term arrays
 */
export async function expandQueriesBatch(queries) {
  if (!Array.isArray(queries)) {
    throw new Error("Queries must be an array");
  }

  console.log(`Expanding ${queries.length} queries with synonyms...`);

  const results = [];
  for (const query of queries) {
    try {
      const expanded = await expandQueryWithSynonyms(query);
      results.push(expanded);
    } catch (error) {
      console.warn(`Failed to expand query "${query}":`, error.message);
      results.push([query]); // Fallback to original
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
  const parts = [];

  if (job.title) parts.push(job.title);
  if (job.description) parts.push(job.description.substring(0, 2000)); // Limit description length

  // Add key skills/technologies
  if (job.skill_type) {
    const skills = [];
    if (job.skill_type.technical) skills.push(...job.skill_type.technical);
    if (job.skill_type.domain_specific)
      skills.push(...job.skill_type.domain_specific);
    if (skills.length > 0) parts.push(skills.slice(0, 10).join(", "));
  }

  // Add company and location for context
  if (job.company) parts.push(`Company: ${job.company}`);
  if (job.location) parts.push(`Location: ${job.location}`);

  return parts.join(" | ");
}

// CLI interface for testing
if (process.argv[1]?.endsWith("embeddings.js")) {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("Usage:");
    console.log(
      "  node embeddings.js expand <query>        - Test query expansion",
    );
    console.log(
      "  node embeddings.js batch <queries...>   - Test batch expansion",
    );
    process.exit(1);
  }

  const command = args[0];

  if (command === "expand" && args[1]) {
    const query = args[1];
    console.log(`Expanding query: "${query}"`);

    expandQueryWithSynonyms(query)
      .then((expandedTerms) => {
        console.log(`✅ Expanded to ${expandedTerms.length} terms:`);
        expandedTerms.forEach((term, i) => {
          console.log(`  ${i + 1}. ${term}`);
        });
      })
      .catch((error) => {
        console.error("❌ Expansion failed:", error.message);
        process.exit(1);
      });
  } else if (command === "batch" && args.length > 1) {
    const queries = args.slice(1);
    console.log(`Testing batch expansion for ${queries.length} queries...`);

    expandQueriesBatch(queries)
      .then((results) => {
        console.log(`✅ Expanded ${results.length} queries:`);
        results.forEach((expandedTerms, i) => {
          console.log(
            `  Query ${i + 1} "${queries[i]}": ${expandedTerms.length} terms`,
          );
          console.log(`    ${expandedTerms.join(", ")}`);
        });
      })
      .catch((error) => {
        console.error("❌ Batch expansion failed:", error.message);
        process.exit(1);
      });
  } else {
    console.log("Invalid command or arguments");
    process.exit(1);
  }
}
