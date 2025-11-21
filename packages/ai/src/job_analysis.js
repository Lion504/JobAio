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
//console.log(`Loading .env from: ${path.join(__dirname, "../../../.env")}`);
// Initialize AI clients
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const TOKEN_LIMITS = {
  simple_extraction: 10, // job_type, experience_level, education_level
  language_extraction: 50, // language (can be multiple)
  skills_extraction: 300, // complex JSON
  responsibilities: 400, // array of strings
};
/**
 * A helper function to call the generative model with a prompt.
 * @param {string} prompt The prompt to send to the model.
 * @param {number} max_tokens The maximum number of tokens to generate.
 * @returns {Promise<string>} The generated text.
 */
async function callGemini(prompt, max_tokens) {
  const result = await genAI.models.generateContent({
    model: process.env.MODEL_NAME,
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
example traninee = internship
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
Extract required and advantage languages from this job description.

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
Return only one of: 'entry', 'junior', 'senior', or 'unknown'
for example '0-2 years' = entry, '3-5 years' = junior, '5+ years' = senior
Job Description:
${description.substring(0, 2000)} // Limit input size

Consider:
- Years of experience mentioned
- Keywords like "junior", "senior", "experienced", "expert"
- Complexity of responsibilities
- Leadership requirements

Experience Level:`;

    const level = (await callGemini(prompt, TOKEN_LIMITS.simple_extraction))
      .trim()
      .toLowerCase();

    // Validate response
    if (["entry", "mid", "senior", "unknown"].includes(level)) {
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
  Return only one of: 'high-school', 'bachelor', 'master', 'phd', or 'unknown'

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
      ["high-school", "bachelor", "master", "phd", "unknown"].includes(
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

Return format: {"technical": ["skill1", "skill2"], "certifications": [...], "soft_skills": [...], "domain_specific": [...], "other": [...]}
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
        programming: [],
        soft_skills: [],
        domain_specific: [],
        other: [],
      };
      return { skills: fallbackSkills, raw_response: skillsText };
    }
  } catch (error) {
    console.error("Skills analysis failed:", error);
    return {
      skills: {
        programming: [],
        soft_skills: [],
        domain_specific: [],
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
 * Main analysis function - called by Python wrapper
 */
async function analyzeJob(functionName, description) {
  switch (functionName) {
    case "job_type":
      return await analyzeJobType(description);
    case "language":
      return await analyzeLanguage(description);
    case "experience_level":
      return await analyzeExperienceLevel(description);
    case "education_level":
      return await analyzeEducationLevel(description);
    case "skills":
      return await analyzeSkills(description);
    case "responsibilities":
      return await analyzeResponsibilities(description);
    default:
      throw new Error(`Unknown analysis function: ${functionName}`);
  }
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
      console.error("Analysis failed:", error);
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
