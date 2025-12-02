// Search adapter/controller for job queries
import Job from "../../db/src/models/jobModel.js";
import { expandQueryWithSynonyms } from "../../ai/src/embeddings.js";

async function rankedJobSearch(terms, filters = {}) {
  // Expand query with semantically similar terms using Gemini
  let searchTerms = terms;
  try {
    const expandedTerms = await expandQueryWithSynonyms(terms);
    searchTerms = expandedTerms.join(" ");
    console.log(
      `🔍 Expanded search "${terms}" to: ${expandedTerms.join(", ")}`,
    );
  } catch (error) {
    console.warn(`Query expansion failed, using original: ${error.message}`);
    searchTerms = terms;
  }

  //Empty object for filter criteria
  const filterCriteria = {};

  //Dynamic filters
  if (filters.location) {
    //Case insensitive
    filterCriteria.location = new RegExp(filters.location, "i");
  }

  if (filters.job_type) {
    //Case insensitive
    filterCriteria.job_type = new RegExp(filters.job_type, "i");
  }

  if (filters.experience_level) {
    //Case insensitive
    filterCriteria.experience_level = new RegExp(filters.experience_level, "i");
  }

  if (filters.company) {
    //Case insensitive
    filterCriteria.company = new RegExp(filters.company, "i");
  }

  if (filters.industry_category) {
    filterCriteria.industry_category = new RegExp(
      filters.industry_category,
      "i",
    );
  }

  if (filters.required_language) {
    filterCriteria["language.required"] = new RegExp(
      filters.required_language,
      "i",
    );
  }

  if (filters.education_level) {
    filterCriteria.education_level = new RegExp(filters.education_level, "i");
  }

  // //Helper function to score array fields
  // const scoreArray = (fieldPath, points) => ({
  //   $cond: [
  //     {
  //       $gt: [
  //         {
  //           $size: {
  //             $filter: {
  //               input: { $ifNull: [fieldPath,[]]}, //To handle missing arrays
  //               as: "item",
  //               cond: { $regexMatch: { input: "$$item", regex: expression }}
  //             }
  //           }
  //         },
  //         0
  //       ]
  //     },
  //     points, //give points for matched items
  //     0 //0 points for not founded items
  //   ]
  // });

  // //Helper function to score string fields
  // const scoreString = (fieldPath, points) => ({
  //   $cond: [
  //     { $regexMatch: { input: fieldPath, regex: expression} },
  //     points,
  //     0
  //   ]
  // });

  const jobs = await Job.aggregate([
    //Filter jobs that have the searched term in one of the descripted fields
    {
      $match: {
        $and: [
          //Check filters
          filterCriteria,
<<<<<<< HEAD
          { $text: { $search: terms } },
=======
          { $text: { $search: term } },
>>>>>>> 508ac2a (fix(search-engine): adapt search engine to new DB structure)
        ],
      },
    },
    //Scoring
    {
      $addFields: {
        score: { $meta: "textScore" },
      },
    },
    //Sort the searched jobs showing first the ones with highest scores and the newest on the DB
    {
      $sort: { score: -1, createdAt: -1 },
    },
  ]);

  return jobs;
}

// async function findJobsByField (field, value) {
//     const expression = new RegExp(value, "i");
//     const query = {[field]: expression}
//     const jobs = await Job.find(query).lean();
//     return jobs;
// }

async function findAllJobs() {
  const jobs = await Job.find().sort({ createdAt: -1 }).lean();
  return jobs;
}

export {
  rankedJobSearch,
  //findJobsByField,
  findAllJobs,
};
