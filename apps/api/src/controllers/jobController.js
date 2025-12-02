import OriginalJob from "../../../../packages/db/src/models/OriginalJob.js";
import {
  findAllJobs,
  findJobsByField,
  searchJobs,
  findJobsByFilters,
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

// GET /api/jobs/search
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

// GET /api/jobs/filter
export const filterJobsController = async (req, res, next) => {
  try {
    const {
      category,
      experience_level,
      language_required,
      job_type,
      company,
      location,
      translationLang,
    } = req.query;

    const filters = {};

    if (category) filters.industry_category = category;
    if (experience_level) filters.experience_level = experience_level;

    if (language_required) {
      const langs = language_required.split(",").map((v) => v.trim());
      filters["language.required"] = { $all: langs };
    }

    if (job_type) filters.job_type = job_type;
    if (company) filters.company = company;
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
