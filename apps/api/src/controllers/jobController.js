import OriginalJob from "../../../../packages/db/src/models/OriginalJob.js";
import {
  findAllJobs,
  findJobsByField,
  searchJobs,
  findJobsByFilters,
} from "../../../../packages/search/src/adapter.js";
import { normalizeScrapedJob } from "../utils/normalizeScrapedJob.js";

// =======================================================
// POST /api/jobs  → insert scraped job
// =======================================================
export const createJobController = async (req, res, next) => {
  try {
    const normalized = normalizeScrapedJob(req.body);

    // Remove job_id if it exists (we want auto-increment)
    delete normalized.job_id;

    // Create the job
    const job = await OriginalJob.create(normalized);

    return res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};

// =======================================================
// GET /api/jobs
// =======================================================
export const getAllJobsController = async (req, res, next) => {
  try {
    const { search, q } = req.query;
    const searchTerm = search || q;

    const jobs = searchTerm
      ? await searchJobs(searchTerm.trim())
      : await findAllJobs();

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// =======================================================
// GET /api/jobs/search?q=developer
// =======================================================
export const searchJobsController = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2)
      return res.status(400).json({ message: "Invalid search query" });

    const jobs = await searchJobs(q.trim());
    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// =======================================================
// GET /api/jobs/filter?category=...&location=...
// =======================================================
export const filterJobsController = async (req, res, next) => {
  try {
    const {
      category,
      experienceLevel,
      languageRequired,
      jobType,
      company,
      location,
      translationLang,
    } = req.query;

    const filters = {};

    if (category) filters.job_category = category;
    if (experienceLevel) filters.experience_level = experienceLevel;
    if (languageRequired) filters.language_required = languageRequired;
    if (jobType) filters.job_type = jobType;
    if (company) filters.company_name = company;
    if (location) filters.location = location;

    if (Object.keys(filters).length === 0 && !translationLang)
      return res.status(400).json({ message: "No filter parameters provided" });

    if (Object.keys(filters).length === 1 && !translationLang) {
      const key = Object.keys(filters)[0];
      const value = filters[key];
      const jobs = await findJobsByField(key, value);
      return res.status(200).json(jobs);
    }

    const jobs = await findJobsByFilters(filters, { translationLang });

    if (!jobs || jobs.length === 0)
      return res
        .status(404)
        .json({ message: "No jobs found with given filters" });

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};
