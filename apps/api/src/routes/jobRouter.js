import express from "express";
import {
  searchJobs,
  getAllJobs,
  //getJobByTitle,
  //getJobByCompany,
  //getJobByLocation,
} from "../controllers/jobController.js";

const router = express.Router();

router.get("/search", searchJobs);
router.get("/", getAllJobs);
// router.get("/title/:jobTitle", getJobByTitle);
// router.get("/company/:jobCompany", getJobByCompany);
// router.get("/location/:jobLocation", getJobByLocation);

export default router;
