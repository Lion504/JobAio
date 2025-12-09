import express from "express";
import {
  createJobController,
  createJobsBulkController,
  getAllJobsController,
  getSuggestionsController,
  getJobByIdController,
  updateJobController,
} from "../controllers/jobController.js";
import { getJobStatsController } from "../controllers/statsController.js";

const router = express.Router();

// POST /api/jobs - create single job
router.post("/", createJobController);

// POST /api/jobs/bulk - create multiple jobs
router.post("/bulk", createJobsBulkController);

// GET /api/jobs - list all jobs with optional search, filters, lang, ai
// Query params: ?q=term&filters={"location":"Helsinki"}&lang=fi&ai=true
router.get("/", getAllJobsController);

// GET /api/jobs/suggestions - fast autocomplete (must be before /:id)
// Query params: ?q=term&limit=10&lang=fi
router.get("/suggestions", getSuggestionsController);

// GET /api/jobs/stats - get job market statistics
router.get("/stats", getJobStatsController);

// GET /api/jobs/:id - get single job by ID with optional translation
// Query params: ?lang=fi
router.get("/:id", getJobByIdController);

// PUT /api/jobs/:id - update job
router.put("/:id", updateJobController);

export default router;
