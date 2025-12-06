import OriginalJob from "../../../../packages/db/src/models/OriginalJob.js";
import {
  findAllJobs,
  rankedJobSearch,
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
export const getAllJobsController = async (req, res, next) => {
  try {
    const {
      search,
      q,
      location,
      job_type,
      experience_level,
      company,
      industry_category,
      required_language,
      education_level,
    } = req.query;

    const searchTerm = search || q;

    const filters = {
      location,
      job_type,
      experience_level,
      company,
      industry_category,
      required_language,
      education_level,
    };

    // Use rankedJobSearch for both search and filtering
    const jobs = await rankedJobSearch(searchTerm || "", filters);

    return res.status(200).json({
      count: jobs.length,
      jobs: jobs,
      source: "mongodb",
      search: searchTerm || null,
    });
  } catch (error) {
    next(error);
  }
};

//GET /api/jobs/search?term=someTerm
export const searchJobsController = async (req, res, next) => {
  //Get the parameter from the request
  const {
    term,
    location,
    job_type,
    experience_level,
    company,
    industry_category,
    required_language,
    education_level,
  } = req.query;

  const searchTerm = (term || "").trim();

  const filters = {
    location,
    job_type,
    experience_level,
    company,
    industry_category,
    required_language,
    education_level,
  };

  // Check if any filter value is non-empty
  const hasFilters = Object.values(filters).some(
    (value) => value && value.length > 0,
  );

  // Validation allows filter-only search
  if (searchTerm.length === 0 && !hasFilters) {
    return res
      .status(400)
      .json({ message: "Provide a search term or at least one filter." });
  }

  try {
    const jobs = await rankedJobSearch(searchTerm, filters);

    if (!jobs || jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found matching the given parameters" });
    }

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
