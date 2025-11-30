const express = require("express");
const {
  searchJobs,
  getAllJobs,
  //getJobByTitle,
  //getJobByCompany,
  //getJobByLocation,
} = require("../controllers/jobController");

const router = express.Router();

router.get("/search", searchJobs);
router.get("/", getAllJobs);
// router.get("/title/:jobTitle", getJobByTitle);
// router.get("/company/:jobCompany", getJobByCompany);
// router.get("/location/:jobLocation", getJobByLocation);

module.exports = router;
