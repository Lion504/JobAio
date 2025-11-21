const express = require("express");
const {
  getAllJobs,
  getJobByTitle,
  getJobByCompany,
  getJobByLocation,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/", getAllJobs);
router.get("/title/:jobTitle", getJobByTitle);
router.get("/company/:jobCompany", getJobByCompany);
router.get("/location/:jobLocation", getJobByLocation);

module.exports = router;
