import fetch from "node-fetch";

export const TARGET_LANGUAGES = ["en", "es", "fr", "pt", "de, fi"];

// hardcoded API key used temporarily
const GEMINI_API_KEY = "Api key";

if (!GEMINI_API_KEY) {
  console.warn("Warning: GEMINI_API_KEY not set. Translation will fail.");
}
//Translate text through Gemini HTTP API
export async function coreTranslate(
  text,
  targetLang,
  sourceLang = null,
  retries = 3,
) {
  if (!text) return text;

  // build user prompt for Gemini request
  const prompt = [
    {
      role: "user",
      parts: [
        {
          text: `You are a professional translator. Translate the following text from ${sourceLang || "auto-detect"} to ${targetLang} accurately while preserving formatting:\n\n${text}`,
        },
      ],
    },
  ];

  try {
    const response = await fetch(
      // request Gemini generateContent endpoint
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: prompt,
          generationConfig: {
            maxOutputTokens: 2048, // avoid truncated output
            temperature: 0.3, // keep translations stable
          },
        }),
      },
    );

    const data = await response.json();

    // catch API errors returned in body
    if (!response.ok || data.error) {
      const errorMsg =
        data.error?.message ||
        `API call failed with status: ${response.status} ${response.statusText}`;

      // retry quota or overload failures
      if (
        errorMsg.includes("Quota exceeded") ||
        errorMsg.includes("overloaded")
      ) {
        throw new Error(errorMsg);
      }

      throw new Error(errorMsg);
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim(); // extract translated text safely
    if (!reply) {
      console.warn(
        `[coreTranslate] Empty reply received for ${targetLang}. Data:`,
        data,
      );
      throw new Error(
        "Received empty translation response or response structure unexpected.",
      );
    }

    await new Promise((r) => setTimeout(r, 5000)); // delay to avoid rate limiting
    return reply;
  } catch (err) {
    // retry on typical rate limit issues
    if (
      (err.message.includes("429") ||
        err.message.includes("Rate limit") ||
        err.message.includes("Quota exceeded") ||
        err.message.includes("overloaded")) &&
      retries > 0
    ) {
      console.warn(
        `Rate limit hit, Quota exceeded, or Model overloaded. Retrying in 20s...`,
      );
      await new Promise((r) => setTimeout(r, 20000));
      return coreTranslate(text, targetLang, sourceLang, retries - 1);
    }

    // failure recorded and rethrown
    console.error(
      `[coreTranslate] Final translation failure for ${targetLang}:`,
      err.message || err,
    );
    throw new Error(`Translation failed: ${err.message || "Unknown error"}`);
  }
}

// Translate one job to all languages
export async function translateJob(job) {
  const translations = [];
  const sourceLang = job.job_original_language || "en";

  for (const lang of TARGET_LANGUAGES) {
    if (lang === sourceLang) continue;

    try {
      const titleTranslated = await coreTranslate(
        job.jobtitle,
        lang,
        sourceLang,
      );
      const descTranslated = await coreTranslate(
        job.jobdescription,
        lang,
        sourceLang,
      );

      // push successful translation results
      translations.push({
        translation_language: lang,
        jobtitle: titleTranslated,
        jobdescription: descTranslated,
        industry: job.industry,
        experience: job.expperience,
        original_job: job,
        warnings: [],
      });
    } catch (err) {
      // push fallback entry with warning
      translations.push({
        translation_language: lang,
        original_job: job,
        jobtitle: job.jobtitle,
        jobdescription: job.jobdescription,
        industry: job.industry,
        experience: job.experience,
        warnings: [`Translation failed: ${err.message || err}`],
      });
    }
  }

  return { original_job: job, translations };
}

// Translate multiple jobs sequentially

export async function translateJobs(jobs) {
  const allTranslated = [];
  for (const job of jobs) {
    const t = await translateJob(job); // translate each job
    allTranslated.push(t);
  }
  return allTranslated;
}
