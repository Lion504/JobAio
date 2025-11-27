// apps/api/src/controllers/jobController.js  (only logic shown)

import {
  findAllJobs,
  findJobsByField,
  searchJobs,
  findJobsByFilters,
} from "../../../../packages/search/src/adapter.js";

// ======================================================================
// GET /api/jobs
// Returns all jobs, or runs a simple search if ?search= or ?q= is provided
// ======================================================================
export const getAllJobsController = async (req, res, next) => {
  try {
    const { search, q } = req.query;
    const searchTerm = search || q;

    let jobs;

    if (searchTerm) {
      jobs = await searchJobs(searchTerm.trim());
    } else {
      jobs = await findAllJobs();
    }

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// ======================================================================
// GET /api/jobs/search?q=developer
// Pure keyword-based search endpoint
// ======================================================================
export const searchJobsController = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== "string" || q.trim().length < 2) {
      return res.status(400).json({ message: "Invalid search query" });
    }

    const jobs = await searchJobs(q.trim());
    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// ======================================================================
// GET /api/jobs/filter?category=IT&location=Dubai&type=Full-time
// Multi-filter support for:
// category, experienceLevel, languageRequired, jobType, company, location
// + translationLang (for now only triggers translatedModel stub)
// ======================================================================
export const filterJobsController = async (req, res, next) => {
  try {
    const {
      category,
      experienceLevel,
      languageRequired,
      jobType,
      company,
      location,
      translationLang, // optional
    } = req.query;

    // Map query params -> DB field names in OriginalJob
    const filters = {};

    if (category) filters.job_category = category;
    if (experienceLevel) filters.experience_level = experienceLevel;
    if (languageRequired) filters.language_required = languageRequired;
    if (jobType) filters.job_type = jobType;
    if (company) filters.company_name = company;
    if (location) filters.location = location;

    if (Object.keys(filters).length === 0 && !translationLang) {
      return res.status(400).json({ message: "No filter parameters provided" });
    }

    // If only 1 real filter (no translationLang) → single-field optimization
    const realFilterKeys = Object.keys(filters);
    if (realFilterKeys.length === 1 && !translationLang) {
      const field = realFilterKeys[0];
      const value = filters[field];
      const jobs = await findJobsByField(field, value); // regex, optimized
      return res.status(200).json(jobs);
    }

    // Multi-field or translationLang present → use multi-filter adapter
    const jobs = await findJobsByFilters(filters, { translationLang });

    if (!jobs || jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found with given filters" });
    }

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};
