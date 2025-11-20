const express = require("express");
const {
  getAllJobs,
  getJobByTitle,
  getJobByCompany,
  getJobByLocation,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/", getAllJobs);
router.get("/:jobTitle", getJobByTitle);
router.get("/:jobCompany", getJobByCompany);
router.get("/:jobLocation", getJobByLocation);

module.exports = router;
