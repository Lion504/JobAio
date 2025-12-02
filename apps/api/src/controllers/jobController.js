import {
  rankedJobSearch,
  findAllJobs,
  //findJobsByField,
  //searchJobs,
} from "../../../../packages/search/src/adapter";

//GET /api/jobs/search?term=someTerm
const searchJobs = async (req, res, next) => {
  //Get the parameter from the request
  const {
    term,
    location,
    job_type,
    experience_level,
    company,
    industry_category,
    required_language,
    education_level,
  } = req.query;

  //Check if it's a string or if it's empty
  if (!term || typeof term !== "string" || term.trim().length === 0) {
    return res.status(400).json({ message: "Invalid search parameters" });
  }

  try {
    const filters = {
      location,
      job_type,
      experience_level,
      company,
      industry_category,
      required_language,
      education_level,
    };
    const jobs = await rankedJobSearch(term, filters);

    if (!jobs || jobs.length === 0) {
      return res
        .status(404)
        .json({ message: "No jobs found matching the given parameters" });
    }

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

//GET /api/jobs
const getAllJobs = async (req, res, next) => {
  try {
    const { search, q } = req.query;
    const searchTerm = search || q;

    let jobs;
    if (searchTerm) {
      jobs = await rankedJobSearch(searchTerm);
    } else {
      jobs = await findAllJobs();
    }

    return res.status(200).json(jobs);
  } catch (error) {
    next(error);
  }
};

// //GET /api/jobs/title/:jobTitle
// const getJobByTitle = async (req, res, next) => {
//   const { jobTitle } = req.params;

//   if (!jobTitle || typeof jobTitle !== "string" || jobTitle.trim().length < 2) {
//     return res.status(400).json({ message: "Invalid title parameter" });
//   }

//   try {
//     const jobs = await findJobsByField("title", jobTitle);

//     if (!jobs || jobs.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No jobs found with given parameters" });
//     }

//     return res.status(200).json(jobs);
//   } catch (error) {
//     next(error);
//   }
// };

// //GET /api/jobs/company/:jobCompany
// const getJobByCompany = async (req, res, next) => {
//   const { jobCompany } = req.params;

//   if (
//     !jobCompany ||
//     typeof jobCompany !== "string" ||
//     jobCompany.trim().length < 2
//   ) {
//     return res.status(400).json({ message: "Invalid Company name parameter" });
//   }

//   try {
//     const jobs = await findJobsByField("company", jobCompany);

//     if (!jobs || jobs.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No jobs found with given parameters" });
//     }

//     return res.status(200).json(jobs);
//   } catch (error) {
//     next(error);
//   }
// };

// //GET /api/jobs/location/:jobLocation
// const getJobByLocation = async (req, res, next) => {
//   const { jobLocation } = req.params;

//   if (
//     !jobLocation ||
//     typeof jobLocation !== "string" ||
//     jobLocation.trim().length < 2
//   ) {
//     return res.status(400).json({ message: "Invalid location parameter" });
//   }

//   try {
//     const jobs = await findJobsByField("location", jobLocation);

//     if (!jobs || jobs.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No jobs found with given parameters" });
//     }

//     return res.status(200).json(jobs);
//   } catch (error) {
//     next(error);
//   }
// };

export {
  searchJobs,
  getAllJobs,
  //getJobByTitle,
  //getJobByCompany,
  //getJobByLocation,
};
