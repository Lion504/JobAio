// Search adapter/controller for job queries
//const mongoose = require("mongoose");
const Job = require("../db/src/models/jobModel");

async function findJobsByField (field, value) {
    const expression = new RegExp(value, "i");
    const query = {[field]: expression}
    const jobs = await Job.find(query).lean();
    return jobs;
}

async function findAllJobs () {
  const jobs = await Job.find().sort({createdAt: -1}).lean();
  res.status(200).json(jobs);
}

module.exports = {
  findJobsByField,
  findAllJobs
};
