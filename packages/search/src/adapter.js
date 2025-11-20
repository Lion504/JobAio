// Search adapter/controller for job queries
import Job from "../../db/src/models/jobModel";

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
