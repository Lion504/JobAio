// Search adapter/controller for job queries
import OriginalJob from "../../db/src/models/OriginalJob.js";
import TranslatedJob from "../../db/src/models/TranslatedJob.js";
import { expandSearchQuery } from "../../ai/src/embeddings.js";

/**
 * Ranked job search with optional AI-powered query expansion
 * @param {string} terms - Search terms
 * @param {Object} filters - Filter criteria
 * @param {boolean} useAI - Whether to expand query with Gemini (default: false)
 * @param {number} limit - Maximum number of results (default: 0 = no limit)
 * @returns {Promise<{jobs: Array, expandedSearchTerm: string|null}>} Jobs and expanded search term
 */
export async function rankedJobSearch(
  terms,
  filters = {},
  useAI = false,
  limit = 0,
) {
  // Only expand query with AI when explicitly requested
  let searchTerms = terms;
  let expandedSearchTerm = null;

  if (useAI && terms && terms.trim()) {
    try {
      const { expandedQuery } = await expandSearchQuery(terms);
      searchTerms = expandedQuery;
      expandedSearchTerm = expandedQuery;
    } catch (error) {
      console.warn(`Query expansion failed, using original: ${error.message}`);
      searchTerms = terms;
    }
  }
  const searchTerm = (searchTerms || "").trim();
  const hasSearchTerm = searchTerm.length > 0;

  const filterCriteria = {};

  //Dynamic filters
  if (filters.location) {
    filterCriteria.location = { $regex: filters.location, $options: "i" };
  }

  if (filters.job_type) {
    filterCriteria.job_type = { $regex: filters.job_type, $options: "i" };
  }

  if (filters.experience_level) {
    filterCriteria.experience_level = {
      $regex: filters.experience_level,
      $options: "i",
    };
  }

  if (filters.company) {
    filterCriteria.company = { $regex: filters.company, $options: "i" };
  }

  if (filters.industry_category) {
    filterCriteria.industry_category = {
      $regex: filters.industry_category,
      $options: "i",
    };
  }

  if (filters.required_language) {
    filterCriteria["language.required"] = {
      $regex: filters.required_language,
      $options: "i",
    };
  }

  if (filters.education_level) {
    filterCriteria.education_level = {
      $regex: filters.education_level,
      $options: "i",
    };
  }

  // Pipeline
  const pipeline = [];

  const matchConditions = [filterCriteria];

  if (hasSearchTerm) {
    matchConditions.push({ $text: { $search: searchTerm } });
  }

  // Filtering
  pipeline.push({
    $match: {
      $and: matchConditions,
    },
  });

  // Scoring: only scores if a search term exists
  if (hasSearchTerm) {
    pipeline.push({
      $addFields: {
        score: { $meta: "textScore" },
      },
    });
  }

  // Sorting
  const sortCriteria = hasSearchTerm
    ? { score: -1, createdAt: -1 }
    : { createdAt: -1 };

  pipeline.push({
    $sort: sortCriteria,
  });

  if (limit > 0) {
    pipeline.push({
      $limit: limit,
    });
  }

  const jobs = await OriginalJob.aggregate(pipeline);
  return { jobs, expandedSearchTerm };
}

// All jobs (original)
export async function findAllJobs() {
  const jobs = await OriginalJob.find().sort({ createdAt: -1 }).lean();
  return jobs;
}

/**
 * Quick suggestion search for autocomplete
 * Fast regex search on title, returns minimal fields
 * Searches in TranslatedJob when lang is specified, otherwise in OriginalJob
 * @param {string} query - Search query
 * @param {number} limit - Max results (default: 10)
 * @param {string} lang - Optional language code for translations
 */
export async function quickSuggestionSearch(query, limit = 10, lang = null) {
  if (!query || query.trim().length === 0) {
    return [];
  }

  const searchQuery = query.trim();

  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const words = searchQuery
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map(escapeRegex);

  const regexPattern = words.join("|");
  const titleRegex = new RegExp(regexPattern, "i");

  if (lang && lang !== "en") {
    const translations = await TranslatedJob.find(
      {
        translation_lang: lang,
        title: titleRegex,
      },
      { job_id: 1, title: 1, company: 1, location: 1 },
    )
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return translations.map((t) => ({
      _id: t.job_id,
      title: t.title,
      company: t.company,
      location: t.location,
    }));
  }

  const jobs = await OriginalJob.find(
    { title: titleRegex },
    { _id: 1, title: 1, company: 1, location: 1 },
  )
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return jobs;
}

/**
 * Apply translations to jobs based on language
 * @param {Array} jobs - Array of job objects
 * @param {string} lang - Target language code (e.g., 'fi', 'sv', 'es')
 */
export async function applyTranslations(jobs, lang) {
  if (!lang || lang === "en" || jobs.length === 0) {
    return jobs;
  }

  const jobIds = jobs.map((job) => job._id);

  const translations = await TranslatedJob.find({
    job_id: { $in: jobIds },
    translation_lang: lang,
  }).lean();

  const translationMap = new Map();
  translations.forEach((t) => {
    translationMap.set(t.job_id.toString(), t);
  });

  return jobs.map((job) => {
    const translation = translationMap.get(job._id.toString());
    if (translation) {
      return {
        ...job,
        title: translation.title || job.title,
        company: translation.company || job.company,
        location: translation.location || job.location,
        industry_category:
          translation.industry_category || job.industry_category,
        job_type: translation.job_type?.length
          ? translation.job_type
          : job.job_type,
        language: translation.language || job.language,
        experience_level: translation.experience_level || job.experience_level,
        education_level: translation.education_level?.length
          ? translation.education_level
          : job.education_level,
        skill_type: translation.skill_type || job.skill_type,
        responsibilities: translation.responsibilities?.length
          ? translation.responsibilities
          : job.responsibilities,
        _translationLang: lang,
      };
    }
    return job;
  });
}

/**
 * Get a single job by ID with optional translation
 * @param {string} jobId - MongoDB ObjectId
 * @param {string} lang - Target language code
 */
export async function getJobById(jobId, lang = null) {
  const job = await OriginalJob.findById(jobId).lean();
  if (!job) return null;

  if (!lang || lang === "en") {
    return job;
  }

  const translation = await TranslatedJob.findOne({
    job_id: jobId,
    translation_lang: lang,
  }).lean();

  if (translation) {
    return {
      ...job,
      title: translation.title || job.title,
      company: translation.company || job.company,
      location: translation.location || job.location,
      industry_category: translation.industry_category || job.industry_category,
      job_type: translation.job_type?.length
        ? translation.job_type
        : job.job_type,
      language: translation.language || job.language,
      experience_level: translation.experience_level || job.experience_level,
      education_level: translation.education_level?.length
        ? translation.education_level
        : job.education_level,
      skill_type: translation.skill_type || job.skill_type,
      responsibilities: translation.responsibilities?.length
        ? translation.responsibilities
        : job.responsibilities,
      _translationLang: lang,
    };
  }

  return job;
}
