// packages/search/src/adapter.js

import OriginalJob from "../../db/src/models/OriginalJob.js";
import TranslatedJob from "../../db/src/models/TranslatedJob.js"; // not used yet, but ready

export async function rankedJobSearch(terms, filters = {}) {
  //Case insensitive search term
  //const expression = new RegExp(terms, "i");

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
    filterCriteria.industry_category = new RegExp(filters.industry_category, "i");
  }

  if (filters.required_language) {
    filterCriteria["language.required"] = new RegExp(filters.required_language, "i");
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

  const jobs = await OriginalJob.aggregate([
    //Filter jobs that have the searched term in one of the descripted fields
    {
      $match: {
        $and: [
          //Check filters
          filterCriteria,
          { $text: { $search: terms } },
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

// Single-field search with regex (case-insensitive)
export async function findJobsByField(field, value) {
  const expression = new RegExp(value, "i");
  const query = { [field]: expression };
  const jobs = await OriginalJob.find(query).sort({ createdAt: -1 }).lean();
  return jobs;
}
// // Multi-field search with filters and optional translation
// export async function findJobsByFilters(filters, options = {}) {
//   const { translationLang } = options;

//   if (translationLang) {
//     // Stub for later real implementation
//     console.log(`
//       get the translated job from translatedModel (translation_lang = ${translationLang})
//     `);
//     // e.g. future: await TranslatedJob.find({ translation_lang: translationLang, ... })
//   }

//   const query = {};
//   for (const [field, value] of Object.entries(filters)) {
//     if (!value) continue;
//     query[field] = new RegExp(value, "i");
//   }

//   const jobs = await OriginalJob.find(query).sort({ createdAt: -1 }).lean();
//   return jobs;
// }

// All jobs (original)
export async function findAllJobs() {
  const jobs = await OriginalJob.find().sort({ createdAt: -1 }).lean();
  return jobs;
}
