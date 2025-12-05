import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const TARGET_LANGUAGES = [
  "es",
  "fr",
  "pt",
  "de",
  "ur",
  "ta",
  "zh",
  "en",
];

// NOTE: Hardcoded key used
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log("Using API key:", GEMINI_API_KEY ? "set" : "not set");

if (!GEMINI_API_KEY) {
  console.warn("Warning: API KEY not set.");
}

// Initialize Google AI SDK
const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

/**
 * Helper to clean JSON response from markdown code blocks and prefatory text
 */
function cleanJsonResponse(text) {
  let cleaned = text.trim();

  // Remove markdown code blocks if present
  if (cleaned.startsWith("```json")) {
    cleaned = cleaned.replace(/^```json\s*/, "").replace(/```\s*$/, "");
  } else if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```\s*/, "").replace(/```\s*$/, "");
  }

  return cleaned.trim();
}

/**
 * Translate a single text/array to target language with retry logic
 */
async function translateField(
  fieldData,
  targetLang,
  sourceLang = null,
  retries = 3,
) {
  const textToTranslate = Array.isArray(fieldData)
    ? fieldData.join("\n")
    : fieldData;

  if (!textToTranslate || textToTranslate.trim() === "") {
    return fieldData; // Return as-is if empty
  }

  const prompt = `Translate the following text from 
  ${sourceLang || "auto-detect"} to ${targetLang}:

${textToTranslate}

Provide only the translated text:`;

  try {
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL_NAME,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });

    let replyText = response.text?.trim();
    if (!replyText) {
      console.warn(`[translateField] Empty reply received for translation`);
      return fieldData; // Return original if translation fails
    }

    // Clean response
    replyText = replyText.replace(/^"|^'|"$|'$/g, ""); // Remove quotes
    replyText = replyText.trim();

    // For arrays, split back into array items
    if (Array.isArray(fieldData)) {
      return replyText
        .split("\n")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }

    return replyText;
  } catch (err) {
    // Retry logic for rate limiting
    if (
      (err.message.includes("429") ||
        err.message.includes("Rate limit") ||
        err.message.includes("Quota exceeded") ||
        err.message.includes("overloaded")) &&
      retries > 0
    ) {
      console.warn(`Rate limit hit. Retrying translateField in 20s...`);
      await new Promise((r) => setTimeout(r, 20000));
      return translateField(fieldData, targetLang, sourceLang, retries - 1);
    }

    console.error(`[translateField] Translation failure:`, err.message || err);
    return fieldData; // Return original on failure
  }
}

/**
 * Translate a rich scraper job to target language
 */
export async function coreTranslateStructured(
  jobData,
  targetLang,
  sourceLang = null,
) {
  try {
    // Translate each field that needs translation
    const translatedTitle = await translateField(
      jobData.title,
      targetLang,
      sourceLang,
    );
    const translatedJobType = await translateField(
      jobData.job_type,
      targetLang,
      sourceLang,
    );
    const translatedRequiredLanguages = await translateField(
      jobData.language?.required || [],
      targetLang,
      sourceLang,
    );
    const translatedAdvantageLanguages = await translateField(
      jobData.language?.advantage || [],
      targetLang,
      sourceLang,
    );
    const translatedExperienceLevel = await translateField(
      jobData.experience_level,
      targetLang,
      sourceLang,
    );
    const translatedEducationLevel = await translateField(
      jobData.education_level,
      targetLang,
      sourceLang,
    );

    // Translate skill type arrays
    const translatedTechnical = await translateField(
      jobData.skill_type?.technical || [],
      targetLang,
      sourceLang,
    );
    const translatedDomainSpecific = await translateField(
      jobData.skill_type?.domain_specific || [],
      targetLang,
      sourceLang,
    );
    const translatedCertifications = await translateField(
      jobData.skill_type?.certifications || [],
      targetLang,
      sourceLang,
    );
    const translatedSoftSkills = await translateField(
      jobData.skill_type?.soft_skills || [],
      targetLang,
      sourceLang,
    );
    const translatedOtherSkills = await translateField(
      jobData.skill_type?.other || [],
      targetLang,
      sourceLang,
    );

    const translatedResponsibilities = await translateField(
      jobData.responsibilities,
      targetLang,
      sourceLang,
    );

    // Increased delay between translations
    await new Promise((r) => setTimeout(r, 2000));

    // Return full structure with translations applied
    return {
      translated_language: targetLang,
      title: translatedTitle,
      url: jobData.url,
      company: jobData.company,
      location: jobData.location,
      publish_date: jobData.publish_date,
      description: jobData.description, // Keep original, don't translate
      source: jobData.source,
      job_type: translatedJobType,
      language: {
        required: translatedRequiredLanguages,
        advantage: translatedAdvantageLanguages,
      },
      experience_level: translatedExperienceLevel,
      education_level: translatedEducationLevel,
      skill_type: {
        technical: translatedTechnical,
        domain_specific: translatedDomainSpecific,
        certifications: translatedCertifications,
        soft_skills: translatedSoftSkills,
        other: translatedOtherSkills,
      },
      responsibilities: translatedResponsibilities,
      _metadata: jobData._metadata,
    };
  } catch (err) {
    console.error(
      `[coreTranslateStructured] Translation failure for ${targetLang}:`,
      err.message,
    );
    throw new Error(`Translation failed: ${err.message || "Unknown error"}`);
  }
}

/**
 * Translate a single job to all target languages individually
 */
export async function translateJob(job) {
  const translations = [];
  const sourceLang = job.source === "jobly.fi" ? "en" : "fi"; // Default language detection

  console.log(`Translating job: "${job.title}" from ${sourceLang}`);

  // Translate to each target language using field-by-field approach
  for (const targetLang of TARGET_LANGUAGES) {
    // Skip if target language is the same as source language
    if (targetLang === sourceLang) continue;

    try {
      console.log(`Translating to ${targetLang}...`);

      const translatedJob = await coreTranslateStructured(
        job,
        targetLang,
        sourceLang,
      );

      translations.push(translatedJob);
    } catch (err) {
      console.error(`Translation failed for ${targetLang}:`, err.message);

      // On failure, add translation with original data and error info
      translations.push({
        translated_language: targetLang,
        ...job, // Keep original data
        translation_error: `Translation failed: ${err.message}`,
      });
    }

    // Rate limiting delay between translations
    await new Promise((r) => setTimeout(r, 1000));
  }

  return { original_job: job, translations };
}

/**
 * Translate multiple jobs sequentially
 */
export async function translateJobs(jobs) {
  const allTranslated = [];
  for (const job of jobs) {
    const t = await translateJob(job);
    allTranslated.push(t);
  }
  return allTranslated;
}
