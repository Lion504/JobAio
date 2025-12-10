import OriginalJob from "../../../../packages/db/src/models/OriginalJob.js";
import {
  rankedJobSearch,
  quickSuggestionSearch,
  applyTranslations,
  getJobById,
} from "../../../../packages/search/src/adapter.js";

function normalizeScrapedJob(raw) {
  return {
    title: raw.title || "",
    url: raw.url || "",
    company: raw.company || "",
    location: raw.location || "",
    publish_date: raw.publish_date || "",
    description: raw.description || "",
    original_title: raw.original_title || "",
    original_description: raw.original_description || "",
    source: raw.source || "",

    industry_category: raw.industry_category || "",
    job_type: raw.job_type || [],
    language: {
      required: raw.language?.required || [],
      advantage: raw.language?.advantage || [],
    },
    experience_level: raw.experience_level || "",
    education_level: raw.education_level || [],
    skill_type: {
      technical: raw.skill_type?.technical || [],
      domain_specific: raw.skill_type?.domain_specific || [],
      certifications: raw.skill_type?.certifications || [],
      soft_skills: raw.skill_type?.soft_skills || [],
      other: raw.skill_type?.other || [],
    },
    responsibilities: raw.responsibilities || [],

    _metadata: raw._metadata || {},
  };
}

// Insert a single job
export const createJobController = async (req, res, next) => {
  try {
    await OriginalJob.init();
    const normalized = normalizeScrapedJob(req.body);
    const createdJob = await OriginalJob.create(normalized);
    return res.status(201).json(createdJob);
  } catch (err) {
    next(err);
  }
};

// Insert multiple jobs safely
export const createJobsBulkController = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body)) {
      return res.status(400).json({ error: "Expected an array of jobs" });
    }

    await OriginalJob.init();

    const insertedDocs = [];
    const errors = [];

    for (let i = 0; i < req.body.length; i++) {
      try {
        const normalized = normalizeScrapedJob(req.body[i]);
        const createdJob = await OriginalJob.create(normalized);
        insertedDocs.push(createdJob);
      } catch (err) {
        errors.push({ index: i, err: err.message });
      }
    }

    const response = {
      message: "Jobs insertion complete",
      insertedCount: insertedDocs.length,
      insertedDocs,
      errors,
    };

    return res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs
// Supports: ?q=searchTerm&filters={"location":"Helsinki"}&lang=fi&ai=true
export const getAllJobsController = async (req, res, next) => {
  try {
    const { q, filters: filtersParam, lang, ai, limit } = req.query;

    const searchTerm = (q || "").trim();

    let filters = {};
    if (filtersParam) {
      try {
        filters = JSON.parse(filtersParam);
      } catch (parseError) {
        console.error("failed to parse filters:", filtersParam, parseError);
        return res.status(400).json({ error: "Invalid filters JSON format" });
      }
    }

    const useAI = ai === "true";
    const limitVal = parseInt(limit) || 0;

    // Use rankedJobSearch for both search and filtering
    const { jobs: rawJobs, expandedSearchTerm } = await rankedJobSearch(
      searchTerm,
      filters,
      useAI,
      limitVal,
    );
    let jobs = rawJobs;
    if (lang) {
      jobs = await applyTranslations(jobs, lang);
    }

    return res.status(200).json({
      count: jobs.length,
      jobs: jobs,
      search:
        useAI && expandedSearchTerm ? expandedSearchTerm : searchTerm || null,
      originalSearch: searchTerm || null,
      filters: filters,
      lang: lang || "en",
      ai: useAI,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/suggestions?q=searchTerm&lang=fi
// Fast autocomplete endpoint - no AI, minimal fields, optional translation
export const getSuggestionsController = async (req, res, next) => {
  try {
    const { q, limit, lang } = req.query;

    const searchTerm = (q || "").trim();

    if (searchTerm.length === 0) {
      return res.status(400).json({ error: "query parameter 'q' is required" });
    }

    const maxLimit = Math.min(parseInt(limit) || 10, 20); // Cap at 20
    const suggestions = await quickSuggestionSearch(searchTerm, maxLimit, lang);

    return res.status(200).json({
      count: suggestions.length,
      suggestions: suggestions,
      lang: lang || "en",
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/jobs/:id?lang=fi
// Get single job by ID with optional translation
export const getJobByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { lang } = req.query;

    const job = await getJobById(id, lang);

    if (!job) {
      return res.status(404).json({ error: "Job not found" });
    }

    return res.status(200).json(job);
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === "CastError") {
      return res.status(400).json({ error: "Invalid job ID format" });
    }
    next(error);
  }
};

// UPDATE /api/jobs/:id
export const updateJobController = async (req, res, next) => {
  try {
    const { id } = req.params;

    const updatedJob = await OriginalJob.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedJob) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.status(200).json(updatedJob);
  } catch (error) {
    next(error);
  }
};
