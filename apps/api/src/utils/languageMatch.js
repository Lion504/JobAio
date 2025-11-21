// apps/api/src/utils/languageMatch.js

/**
 * Given a translated job object and a list of user language codes,
 * return a new job object with:
 *   - isLanguageMatch: boolean
 *   - matchedLanguages: array of matched lang codes
 */
export function flagJobWithLanguageMatch(job, userLanguages = []) {
  const cleanedUserLangs = (userLanguages || [])
    .map((lang) => String(lang).toLowerCase().trim())
    .filter(Boolean);

  if (!cleanedUserLangs.length) {
    return {
      ...job,
      isLanguageMatch: false,
      matchedLanguages: [],
    };
  }

  const jobLanguages = new Set();

  // Original job language, e.g. "en"
  if (job.original_job?.job_original_language) {
    jobLanguages.add(
      String(job.original_job.job_original_language).toLowerCase(),
    );
  }

  // Translation languages, e.g. "fi", "es", "si"
  if (Array.isArray(job.translations)) {
    for (const t of job.translations) {
      if (t?.translation_language) {
        jobLanguages.add(String(t.translation_language).toLowerCase());
      }
    }
  }

  const matchedLanguages = [...jobLanguages].filter((lang) =>
    cleanedUserLangs.includes(lang),
  );

  return {
    ...job,
    isLanguageMatch: matchedLanguages.length > 0,
    matchedLanguages,
  };
}
