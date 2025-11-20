const express = require("express");
const {
  getAllJobs,
  getJobByTitle,
  getJobByCompany,
  getJobByLocation,
  getSuggestions,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/", getAllJobs);
router.get("/suggestions", getSuggestions);
router.get("/:jobTitle", getJobByTitle);
router.get("/:jobCompany", getJobByCompany);
router.get("/:jobLocation", getJobByLocation);

module.exports = router;
