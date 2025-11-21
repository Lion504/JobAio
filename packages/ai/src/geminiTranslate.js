import fetch from "node-fetch";

export const TARGET_LANGUAGES = ["en", "es", "fr", "pt", "de", "ur", "ta", "zh", "fi"];

// NOTE: Hardcoded key used as per your original code. 
const GEMINI_API_KEY = "Api key";

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY not set. Translation will fail.");
}

/**
 * Translate an entire job structure from sourceLang → targetLang using a single JSON output call.
 */
export async function coreTranslateStructured(jobData, targetLang, sourceLang = null, retries = 3) {
  
  // NOTE: jobData contains: { jobtitle, jobdescription, industry, experience }
  const jobJSON = JSON.stringify(jobData);
  
  // Use System Instruction for better, more consistent JSON output
  const systemInstruction = `You are a professional, highly accurate translation API.
  Your task is to translate the provided JSON object from ${sourceLang || "auto-detect"} to ${targetLang}.
  
  RULES:
  1. The output MUST be a valid JSON object with the exact same keys: 'jobtitle', 'jobdescription', 'industry', 'experience'.
  2. Translate the values for ALL four keys accurately.
  3. DO NOT include any text outside the JSON block.`;

  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `Translate this JSON object into ${targetLang}:\n\n${jobJSON}`
        }
      ]
    }
  ];

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
          // *** FINAL FIX APPLIED HERE: systemInstruction wrapped as a Content object ***
          systemInstruction: { role: 'system', parts: [{ text: systemInstruction }] }, 
          generationConfig: {
            responseMimeType: "application/json", 
            responseSchema: { 
                type: "object",
                properties: {
                    jobtitle: { type: "string" },
                    jobdescription: { type: "string" },
                    industry: { type: "string" },
                    experience: { type: "string" }
                },
                required: ["jobtitle", "jobdescription", "industry", "experience"]
            },
            temperature: 0.1, 
          }
        }),
      }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      const errorMsg = data.error?.message || `API call failed with status: ${response.status} ${response.statusText}`;
      if (errorMsg.includes("Quota exceeded") || errorMsg.includes("overloaded")) {
        throw new Error(errorMsg); 
      }
      throw new Error(errorMsg);
    }
    
    const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    if (!replyText) {
      console.warn(`[coreTranslateStructured] Empty reply received for ${targetLang}.`);
      throw new Error("Received empty translation response.");
    }
    
    // Attempt to parse the structured JSON response
    const translatedJob = JSON.parse(replyText);
    
    // Increased delay for sequential requests
    await new Promise(r => setTimeout(r, 6000)); 
    
    return translatedJob;

  } catch (err) {
    // Retry logic
    if ((err.message.includes("429") || err.message.includes("Rate limit") || err.message.includes("Quota exceeded") || err.message.includes("overloaded")) && retries > 0) {
      console.warn(`Rate limit hit or Model overloaded. Retrying in 20s...`);
      await new Promise(r => setTimeout(r, 20000));
      // Recursively call with the job data structure
      return coreTranslateStructured(jobData, targetLang, sourceLang, retries - 1); 
    }
    
    console.error(`[coreTranslateStructured] Final translation failure for ${targetLang}:`, err.message || err);
    throw new Error(`Translation failed: ${err.message || "Unknown error"}`);
  }
}

/**
 * Translate a single job to all target languages sequentially using English as a pivot.
 */
export async function translateJob(job) {
  const translations = [];
  const sourceLang = job.job_original_language || "en";
  const ENGLISH_LANG = "en";

  // Data structure used for translation (contains the fields we want to translate)
  const sourceJobData = {
    jobtitle: job.jobtitle,
    jobdescription: job.jobdescription,
    industry: job.industry,
    experience: job.experience,
  };

  // --- 1. PIVOT STEP: Get the English version of the job text/data ---
  let pivotJobData = { ...sourceJobData }; // Start with the original data
  let pivotWarnings = [];
  
  if (sourceLang !== ENGLISH_LANG) {
    console.log(`[Pivot] Translating job from ${sourceLang} to English...`);
    
    try {
        pivotJobData = await coreTranslateStructured(sourceJobData, ENGLISH_LANG, sourceLang);
    } catch (err) {
        pivotWarnings.push(`Pivot translation to EN failed: ${err.message}`);
        // If pivot fails, pivotJobData remains a copy of sourceJobData (original language)
        console.warn(`[Pivot] Pivot failed, falling back to original source text for subsequent translations.`);
    }

    // Save the English translation result
    translations.push({
        translation_language: ENGLISH_LANG,
        ...pivotJobData, // All fields are now in English (or original if failed)
        original_job: job,
        warnings: pivotWarnings,
    });
  } else {
      // If the source is English, we still need to store the original English data in the results array.
      translations.push({
          translation_language: ENGLISH_LANG,
          ...sourceJobData,
          original_job: job,
          warnings: [],
      });
  }

  // --- 2. FORWARD TRANSLATION STEP: Translate from English pivot (or original source) to all others ---
  
  for (const lang of TARGET_LANGUAGES) {
    // Skip if the target language is the original source language or English (already done). 
    if (lang === sourceLang || lang === ENGLISH_LANG) continue;
    
    // Determine the source data for the forward translation. This is always the 'pivot' data.
    const forwardSourceData = pivotJobData;
    
    // The source language hint is always ENGLISH, even if the pivot failed (as a fallback, 
    // the model may still perform better EN->Target than Source->Target).
    const effectiveSourceLang = ENGLISH_LANG; 

    try {
      const translatedData = await coreTranslateStructured(forwardSourceData, lang, effectiveSourceLang);

      translations.push({
        translation_language: lang,
        ...translatedData, // All four fields are included here
        original_job: job,
        warnings: [],
      });
    } catch (err) {
      // Record translation failure warning
      translations.push({
        translation_language: lang,
        original_job: job,
        ...sourceJobData, // Fallback to original language fields on failure
        warnings: [`Translation failed (via Pivot): ${err.message || err}`],
      });
    }
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