const { findAllJobs, findJobsByField } = require("../../../packages/search/src/adapter");


//GET /api/jobs
const getAllJobs = async (req, res, next) => {
    try {
      const jobs = await findAllJobs();
      return res.status(200).json(jobs);
    } catch (error) {
      next(error);
    }
  };


//GET /api/jobs/:jobTitle
const getJobByTitle = async (req, res, next) => {
    const {jobTitle} = req.params;

    if(!jobTitle || typeof jobTitle !== "string" || jobTitle.trim().length < 2) {
      return res.status(400).json({message: "Invalid title parameter"});
    }

    try {
      const jobs = await stringFinder ("title", jobTitle);

      if (!jobs || jobs.length === 0) {
        return res.status(404).json({message: "No jobs found with given parameters"});
      }

    return res.status(200).json(jobs);
    } catch (error) {
      next(error);
    }
  };


//GET /api/jobs/:jobCompany
const getJobByCompany = async (req, res, next) => {
    const {jobCompany} = req.params;

    if(!jobCompany || typeof jobCompany !== "string" || jobCompany.trim().length < 2) {
      return res.status(400).json({message: "Invalid Company name parameter"});
    }

    try {
      const jobs = await stringFinder ("company", jobCompany);

      if (!jobs || jobs.length === 0) {
        return res.status(404).json({message: "No jobs found with given parameters"});
      }

    return res.status(200).json(jobs);
    } catch (error) {
      next(error);
    }
  };


//GET /api/jobs/:jobLocation
const getJobByLocation = async (req, res, next) => {
    const {jobLocation} = req.params;

    if(!jobLocation || typeof jobLocation !== "string" || jobLocation.trim().length < 2) {
      return res.status(400).json({message: "Invalid location parameter"});
    }

    try {
      const jobs = await stringFinder ("location", jobLocation);

      if (!jobs || jobs.length === 0) {
        return res.status(404).json({message: "No jobs found with given parameters"});
      }

    return res.status(200).json(jobs);
    } catch (error) {
      next(error);
    }
  };

  module.exports = {
    getAllJobs,
    getJobByTitle,
    getJobByCompany,
    getJobByLocation
  };

