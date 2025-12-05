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

// Initialize AI clients
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TOKEN_LIMITS = {
  simple_extraction: 10, // job_type, experience_level, education_level
  language_extraction: 50, // language (can be multiple)
  skills_extraction: 400, // complex JSON
  responsibilities: 500, // array of strings
};
/**
 * A helper function to call the generative model with a prompt.
 * @param {string} prompt The prompt to send to the model.
 * @param {number} max_tokens The maximum number of tokens to generate.
 * @returns {Promise<string>} The generated text.
 */
async function callGemini(prompt, max_tokens) {
  const result = await genAI.models.generateContent({
    model: process.env.GEMINI_MODEL_NAME,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      maxOutputTokens: max_tokens,
      temperature: 0.1,
    },
  });
  return result.text;
}

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
 * Analyze job type from job description
 */
async function analyzeJobType(description) {
  try {
    const prompt = `
Analyze this job description and determine the job type.
Return only one of: 'full-time', 'part-time', 'internship', or 'unknown'
example trainee = internship
Job Description:
${description.substring(0, 2000)}

Job Type:`;

    const jobType = (await callGemini(prompt, TOKEN_LIMITS.simple_extraction))
      .trim()
      .toLowerCase();

    // Validate response
    if (["full-time", "part-time", "internship", "unknown"].includes(jobType)) {
      return { job_type: jobType };
    }

    return { job_type: "unknown" };
  } catch (error) {
    console.error("Job type analysis failed:", error);
    return { job_type: "unknown", error: error.message };
  }
}

/**
 * Analyze language from job description
 */
async function analyzeLanguage(description) {
  try {
    const prompt = `
Extract required and advantage HUMAN languages (not programming languages)
from this job description. Only include natural languages like 
English, Finnish, etc.

- "required": Languages that are explicitly mandatory or essential for the role
- "advantage": Languages that would be beneficial but are not strictly required

Consider both explicit requirements and implied languages from job location/description.

Job Description:
${description.substring(0, 2000)}

Return as JSON: {"required": ["language1"], "advantage": ["language2"]}
Languages:`;

    const languagesText = await callGemini(
      prompt,
      TOKEN_LIMITS.language_extraction,
    );

    const cleanedText = cleanJsonResponse(languagesText);
    const languageData = JSON.parse(cleanedText);
    if (
      languageData &&
      typeof languageData === "object" &&
      Array.isArray(languageData.required) &&
      Array.isArray(languageData.advantage)
    ) {
      return { languages: languageData };
    }
  } catch (error) {
    console.error("Language parsing failed:", error);
  }
  return { languages: { required: [], advantage: [] } };
}
/**
 * Analyze experience level from job description
 * Used when rule-based extraction returns 'unknown'
 */
async function analyzeExperienceLevel(description) {
  try {
    const prompt = `
Analyze this job description and determine the experience level required.
Return only one of: 'student', 'entry', 'junior', 'senior', or 'unknown'
for example '0-2 years' = entry, '3-5 years' = junior, '5+ years' = senior
Job Description:
${description.substring(0, 2000)} 

Consider:
- Years of experience mentioned
- Keywords like "student", "junior", "senior", "experienced", "expert"
- student = (intern, trainee, currently study, no experience etc.)
- Complexity of responsibilities
- Leadership requirements

Experience Level:`;

    const level = (await callGemini(prompt, TOKEN_LIMITS.simple_extraction))
      .trim()
      .toLowerCase();

    // Validate response
    if (["student", "entry", "junior", "senior", "unknown"].includes(level)) {
      return { level };
    }

    return { level: "unknown" };
  } catch (error) {
    console.error("Experience level analysis failed:", error);
    return { level: "unknown", error: error.message };
  }
}

/**
 * Analyze education level from job description
 */
async function analyzeEducationLevel(description) {
  try {
    const prompt = `
  Analyze this job description and determine the required education level.
  Return only one of: 'vocational', 'bachelor', 'master', 'phd', or 'unknown'

  Job Description:
  ${description.substring(0, 2000)} // Limit input size

  Education Level:`;

    const educationLevel = (
      await callGemini(prompt, TOKEN_LIMITS.language_extraction)
    )
      .trim()
      .toLowerCase();

    // Validate response
    if (
      ["vocational", "bachelor", "master", "phd", "unknown"].includes(
        educationLevel,
      )
    ) {
      return { education_level: educationLevel };
    }

    return { education_level: "unknown" };
  } catch (error) {
    console.error("Education level analysis failed:", error);
    return { education_level: "unknown", error: error.message };
  }
}

/**
 * Extract skills that rule-based methods might miss
 */
async function analyzeSkills(description) {
  try {
    const prompt = `
Extract technical and domain-specific skills from this job description.
Focus on skills that are implied or described in detail.
Return as JSON with categories: technical, certifications, soft_skills, domain_specific, other

Job Description:
${description.substring(0, 2000)}

Return format: {"technical": ["skill1", "skill2"], "domain_specific": [...], "certifications": [...], "soft_skills": [...], "other": [...]}
`;

    const skillsText = await callGemini(prompt, TOKEN_LIMITS.skills_extraction);

    // Try to parse JSON response
    try {
      const cleanedText = cleanJsonResponse(skillsText);
      const skills = JSON.parse(cleanedText);
      return { skills };
    } catch (parseError) {
      // Fallback: extract skills from text response
      const fallbackSkills = {
        technical: [],
        domain_specific: [],
        certifications: [],
        soft_skills: [],
        other: [],
      };
      return { skills: fallbackSkills, raw_response: skillsText };
    }
  } catch (error) {
    console.error("Skills analysis failed:", error);
    return {
      skills: {
        technical: [],
        domain_specific: [],
        certifications: [],
        soft_skills: [],
        other: [],
      },
      error: error.message,
    };
  }
}

/**
 * Extract and summarize job responsibilities
 */
async function analyzeResponsibilities(description) {
  try {
    const prompt = `
Extract and summarize the key job responsibilities from this description.
Focus on the main duties and tasks. Return as a JSON array of strings.

Job Description:
${description.substring(0, 2000)}

Return format: ["responsibility 1", "responsibility 2", ...]
Limit to 10 most important responsibilities.
`;

    const respText = await callGemini(prompt, TOKEN_LIMITS.responsibilities);

    try {
      // Clean markdown code blocks before parsing
      const cleanedText = cleanJsonResponse(respText);
      const responsibilities = JSON.parse(cleanedText);
      if (Array.isArray(responsibilities)) {
        return { responsibilities: responsibilities.slice(0, 10) };
      }
    } catch (parseError) {
      // Fallback: split by newlines or common separators
      const fallbackResp = respText
        .split("\n")
        .filter((line) => line.trim().length > 10)
        .map((line) => line.replace(/^[•\-\d\.\s]+/, "").trim())
        .slice(0, 10);
      return { responsibilities: fallbackResp };
    }

    return { responsibilities: [] };
  } catch (error) {
    console.error("Responsibilities analysis failed:", error);
    return { responsibilities: [], error: error.message };
  }
}

/**
 * Batch analysis functions - process multiple jobs concurrently for one analysis type
 */
async function analyzeJobTypeBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(`  → Analyzing job_type for ${descriptions.length} jobs...`);
  const results = await Promise.all(
    descriptions.map((desc) => analyzeJobType(desc)),
  );
  return results;
}

async function analyzeLanguageBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(`  → Analyzing languages for ${descriptions.length} jobs...`);
  const results = await Promise.all(
    descriptions.map((desc) => analyzeLanguage(desc)),
  );
  return results;
}

async function analyzeExperienceLevelBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(
      `  → Analyzing experience_level for ${descriptions.length} jobs...`,
    );
  const results = await Promise.all(
    descriptions.map((desc) => analyzeExperienceLevel(desc)),
  );
  return results;
}

async function analyzeEducationLevelBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(
      `  → Analyzing education_level for ${descriptions.length} jobs...`,
    );
  const results = await Promise.all(
    descriptions.map((desc) => analyzeEducationLevel(desc)),
  );
  return results;
}

async function analyzeSkillsBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(`  → Analyzing skills for ${descriptions.length} jobs...`);
  const results = await Promise.all(
    descriptions.map((desc) => analyzeSkills(desc)),
  );
  return results;
}

async function analyzeResponsibilitiesBatch(descriptions, quiet = false) {
  if (!quiet)
    console.log(
      `  → Analyzing responsibilities for ${descriptions.length} jobs...`,
    );
  const results = await Promise.all(
    descriptions.map((desc) => analyzeResponsibilities(desc)),
  );
  return results;
}

/**
 * Batch analyze multiple jobs - process all analysis types for batches of jobs
 */
async function analyzeJobsBatch(jobs, batchSize = 5, quiet = false) {
  const analyzedJobs = [];
  const totalBatches = Math.ceil(jobs.length / batchSize);

  if (!quiet) {
    console.log(
      `🔄 Batch analyzing ${jobs.length} jobs (${totalBatches} batches of ${batchSize})...`,
    );
  }

  for (let i = 0; i < jobs.length; i += batchSize) {
    const batch = jobs.slice(i, i + batchSize);
    const batchNumber = Math.floor(i / batchSize) + 1;
    const descriptions = batch.map((job) => job.description);

    if (!quiet) {
      console.log(
        `📊 Processing batch ${batchNumber}/${totalBatches} (${batch.length} jobs)...`,
      );
    }

    try {
      // Analyze all types for this batch concurrently (quiet mode for programmatic calls)
      const [
        jobTypes,
        languages,
        experienceLevels,
        educationLevels,
        skills,
        responsibilities,
      ] = await Promise.all([
        analyzeJobTypeBatch(descriptions, quiet),
        analyzeLanguageBatch(descriptions, quiet),
        analyzeExperienceLevelBatch(descriptions, quiet),
        analyzeEducationLevelBatch(descriptions, quiet),
        analyzeSkillsBatch(descriptions, quiet),
        analyzeResponsibilitiesBatch(descriptions, quiet),
      ]);

      // Combine results for each job in the batch
      const batchResults = batch.map((job, idx) => ({
        ...job,
        job_type: jobTypes[idx],
        language: languages[idx],
        experience_level: experienceLevels[idx],
        education_level: educationLevels[idx],
        skill_type: skills[idx],
        responsibilities: responsibilities[idx],
      }));

      analyzedJobs.push(...batchResults);
      if (!quiet) {
        console.log(`✅ Batch ${batchNumber}/${totalBatches} completed`);
      }

      // Rate limiting between batches (except for last batch)
      if (i + batchSize < jobs.length && !quiet) {
        console.log(`⏳ Preparing next batch...`);
      }
      if (i + batchSize < jobs.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`❌ Batch ${batchNumber} failed:`, error.message);
      // On batch failure, add jobs with error markers
      const failedBatch = batch.map((job) => ({
        ...job,
        _error: `Batch analysis failed: ${error.message}`,
      }));
      analyzedJobs.push(...failedBatch);
    }
  }

  if (!quiet) {
    console.log(`✅ All ${analyzedJobs.length} jobs analyzed`);
  }
  return analyzedJobs;
}

/**
 * Main analysis function - only supports batch analysis now
 */
async function analyzeJob(functionName, description) {
  if (functionName !== "batch") {
    throw new Error(`Only batch analysis is supported. Got: ${functionName}`);
  }

  // Parse JSON string to jobs array
  let jobsArray;
  try {
    jobsArray = JSON.parse(description);
  } catch (e) {
    throw new Error(`Invalid JSON for batch analysis: ${e.message}`);
  }

  if (!Array.isArray(jobsArray)) {
    throw new Error("Batch analysis requires array of jobs");
  }

  if (jobsArray.length === 0) {
    return [];
  }

  // Use quiet mode when called programmatically (suppresses progress messages)
  return await analyzeJobsBatch(jobsArray, 5, true);
}

// CLI interface for testing
if (process.argv[1] === __filename) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node job_analysis.js <function> <description>");
    process.exit(1);
  }

  const [functionName, description] = args;

  analyzeJob(functionName, description)
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error("Analysis failed:", error.message);
      // Ensure we always output valid JSON for Python parser
      const errorResult = { error: error.message, function: functionName };
      console.log(JSON.stringify(errorResult, null, 2));
      process.exit(1);
    });
}

export {
  analyzeJob,
  analyzeJobType,
  analyzeLanguage,
  analyzeExperienceLevel,
  analyzeEducationLevel,
  analyzeSkills,
  analyzeResponsibilities,
};
