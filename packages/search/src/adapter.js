// Search adapter/controller for job queries
const Job = require("../../db/src/models/jobModel").default;

async function findJobsByField (field, value) {
    const expression = new RegExp(value, "i");
    const query = {[field]: expression}
    const jobs = await Job.find(query).lean();
    return jobs;
}

async function findAllJobs () {
  const jobs = await Job.find().sort({createdAt: -1}).lean();
  return jobs;
}

async function searchJobs(term) {
  const expression = new RegExp(term, "i");
  const query = {
      $or: [
          { title: expression },
          { company: expression },
          { location: expression },
          { description: expression }
      ]
  };
  const jobs = await Job.find(query).sort({createdAt: -1}).lean();
  return jobs;
}

module.exports = {
  findJobsByField,
  findAllJobs,
  searchJobs
};
