import express from "express";
import {
  createJobController,
  getAllJobsController,
  searchJobsController,
  filterJobsController,
} from "../controllers/jobController.js";

const router = express.Router();

// POST /api/jobs → insert scraped job
router.post("/", createJobController);

// GET /api/jobs
router.get("/", getAllJobsController);

// GET /api/jobs/search
router.get("/search", searchJobsController);

// GET /api/jobs/filter
router.get("/filter", filterJobsController);

export default router;
