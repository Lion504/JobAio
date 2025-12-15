/**
 * Job Description Analysis AI Module
 *
 */
// Load environment variables from project root
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env"), quiet: true });

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

// Initialize AI clients
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
/**
 * Helper to clean JSON response from markdown code blocks
 */
function cleanJsonResponse(text) {
  // Remove markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }
  return cleaned.trim();
}

/**
 * Unified Batch Analysis: Analyzes all fields for multiple jobs in ONE API call.
 */
async function analyzeBatchUnified(jobs, quiet = false) {
  if (!quiet)
    console.log(
      `  → 🧠 AI analyzing batch of ${jobs.length} jobs (Unified Mode)...`,
    );

  // minimal input to save input tokens
  const inputForAi = jobs.map((job, idx) => ({
    id: idx,
    description: job.description?.substring(0, 1500) || "", // Truncate to save tokens, usually sufficient
  }));

  const prompt = `
  Analyze these job descriptions. For EACH job, extract the following structured data.
  Return a STRICT JSON array of objects.

  Fields required per job:
  1. "job_type": One of ['full-time', 'part-time', 'internship', or 'unknown'] 
  example trainee = internship
  2. "language": {"required": ["lang1"], "advantage": ["lang2"]} (Human languages example English, Finnish)
  3. "experience_level": One of ['student', 'entry', 'junior', 'senior', 'lead', 'unknown']
  for example '0-2 years' = entry, '3-5 years' = junior, '5+ years' = senior
  4. "education_level": One of ['vocational', 'bachelor', 'master', 'phd', 'unknown']
  5. "skill_type": {
       "technical": ["valuable tech skill 1", "skill 2"],
       "domain_specific": ["industry knowledge"],
       "certifications": [],
       "soft_skills": [],
       "other": []
     }
  6. "responsibilities": ["responsibility 1", "responsibility 2"] (Max 5 items)

  Rules:
  - Output strict JSON only. No markdown.
  - Detect "student" level if mentions trainee/intern/thesis.
  - "technical" skills: Extract specific technologies (React, Python, AWS), not generic terms.

  Input Jobs:
  ${JSON.stringify(inputForAi)}
  `;

  try {
    const result = await genAI.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    const responseText = result.text;
    const cleanJson = cleanJsonResponse(responseText);
    const analyzedData = JSON.parse(cleanJson);

    if (!Array.isArray(analyzedData)) {
      throw new Error("AI response was not an array");
    }

    // Merge back with original jobs (using index matching)
    return jobs.map((originalJob, idx) => {
      // Find matching analysis
      const analysis =
        analyzedData.find((a) => a.id === idx) || analyzedData[idx];

      if (!analysis) return { ...originalJob, _error: "Analysis missing" };

      return {
        ...originalJob,
        job_type: analysis.job_type,
        language: analysis.language,
        experience_level: analysis.experience_level,
        education_level: analysis.education_level,
        skill_type: analysis.skill_type,
        responsibilities: analysis.responsibilities,
      };
    });
  } catch (error) {
    console.error(`  ❌ Unified Batch Analysis Failed: ${error.message}`);
    // Return originals with error
    return jobs.map((j) => ({ ...j, _error: error.message }));
  }
}

/**
 * Main analysis function - only supports batch analysis now
 */
async function analyzeJob(description) {
  let jobsArray;
  try {
    jobsArray = JSON.parse(description);
  } catch (e) {
    throw new Error(`Invalid JSON for batch analysis: ${e.message}`);
  }
  // Process single batch (caller handles concurrency)
  return await analyzeBatchUnified(jobsArray, true);
}

// CLI interface for testing and subprocess calls
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error(
      "Usage: node job_analysis.js <json_jobs_string_or_dash>",
    );
    process.exit(1);
  }

  const [inputArg] = args;

  // Function to process input and run analysis
  const runCLI = async (inputData) => {
    try {
      const result = await analyzeJob(inputData);
      console.log(JSON.stringify(result, null, 2));
    } catch (error) {
      console.error("Analysis failed:", error.message);
      const errorResult = { error: error.message };
      console.log(JSON.stringify(errorResult, null, 2));
      process.exit(1);
    }
  };

  if (inputArg === "-") {
    let data = "";
    process.stdin.setEncoding("utf8");

    process.stdin.on("data", (chunk) => {
      data += chunk;
    });

    process.stdin.on("end", () => {
      runCLI(data);
    });

    process.stdin.on("error", (err) => {
      console.error("Stdin error:", err);
      process.exit(1);
    });
  } else {
    runCLI(inputArg);
  }
}

export { analyzeJob, analyzeBatchUnified };
