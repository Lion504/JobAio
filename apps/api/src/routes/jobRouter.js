// apps/api/src/routes/jobRouter.js
import express from "express";
import {
  getAllJobsController,
  searchJobsController,
  filterJobsController,
} from "../controllers/jobController.js";

const router = express.Router();

// GET /api/jobs
router.get("/", getAllJobsController);

// GET /api/jobs/search?q=...
router.get("/search", searchJobsController);

// GET /api/jobs/filter?category=&experienceLevel=&languageRequired=&jobType=&company=&location=&translationLang=
router.get("/filter", filterJobsController);

export default router;
