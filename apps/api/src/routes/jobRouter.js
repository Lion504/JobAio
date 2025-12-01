import express from "express";
import {
  createJobController,
  createJobsBulkController,
  getAllJobsController,
  searchJobsController,
  filterJobsController,
} from "../controllers/jobController.js";

const router = express.Router();

// POST /api/jobs → single job
router.post("/", createJobController);

// POST /api/jobs/bulk → multiple jobs
router.post("/bulk", createJobsBulkController);

// GET /api/jobs
router.get("/", getAllJobsController);

// GET /api/jobs/search
router.get("/search", searchJobsController);

// GET /api/jobs/filter
router.get("/filter", filterJobsController);

export default router;
